import assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';
import { test } from 'node:test';
import { buildApp } from '../src/app.js';
import { advance, tracking } from '../src/tracking.js';

// Tests du flux SSE : le simulateur n'est pas lancé, chaque test fait avancer les colis avec advance()

// Une seule application pour tous les tests : les modifications d'un test restent visibles dans les suivants
const app = buildApp();

// Événements contenus dans un corps text/event-stream (lignes « data: ... » séparées par une ligne vide)
function parseEvents(body) {
  return body
    .split('\n\n')
    .filter((block) => block.startsWith('data: '))
    .map((block) => JSON.parse(block.slice('data: '.length)));
}

// Attend que le flux soit abonné aux événements de suivi (ou désabonné : count = 0), une seconde au plus
async function waitListeners(count) {
  for (let i = 0; i < 200; i += 1) {
    if (tracking.listenerCount('event') === count) {
      return;
    }
    await sleep(5);
  }
  assert.fail(`${tracking.listenerCount('event')} abonné(s) aux événements, ${count} attendu(s)`);
}

test('GET /v2/parcels/CLB-9999/events : 404 au format problème', async () => {
  const response = await app.inject({ method: 'GET', url: '/v2/parcels/CLB-9999/events' });
  assert.equal(response.statusCode, 404);
  assert.equal(response.headers['content-type'], 'application/problem+json; charset=utf-8');
});

test('colis déjà livré : un seul événement (état actuel), puis fin du flux', async () => {
  const response = await app.inject({ method: 'GET', url: '/v2/parcels/CLB-0005/events' });
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['content-type'], 'text/event-stream');
  const events = parseEvents(response.body);
  assert.equal(events.length, 1);
  assert.equal(events[0].status, 'DELIVERED');
});

// timeout : un flux qui ne se termine pas fait échouer le test au lieu de le bloquer
test('colis en cours : état actuel, puis les étapes de ce colis seulement, jusqu\'à la livraison', { timeout: 3000 }, async () => {
  const pending = app.inject({ method: 'GET', url: '/v2/parcels/CLB-0003/events' });
  await waitListeners(1);
  for (let i = 0; i < 4; i += 1) {
    advance();
  }
  const events = parseEvents((await pending).body);
  assert.equal(events.length, 5);
  assert.ok(events.every((event) => event.parcelId === 'CLB-0003'));
  assert.equal(events.at(-1).status, 'DELIVERED');
});

test('fin du flux : plus aucun abonné aux événements', async () => {
  assert.equal(tracking.listenerCount('event'), 0);
});

test('client déconnecté : le flux se désabonne', { timeout: 3000 }, async () => {
  const address = await app.listen({ port: 0 });
  const controller = new AbortController();
  try {
    const response = await fetch(`${address}/v2/parcels/CLB-0001/events`, { signal: controller.signal });
    assert.equal(response.status, 200);
    await waitListeners(1);
    controller.abort();
    await waitListeners(0);
  } finally {
    controller.abort();
    await app.close();
  }
});
