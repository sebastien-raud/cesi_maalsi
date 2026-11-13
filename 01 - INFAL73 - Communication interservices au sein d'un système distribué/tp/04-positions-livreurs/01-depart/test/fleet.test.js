import assert from 'node:assert/strict';
import { once } from 'node:events';
import { after, test } from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';
import grpc from '@grpc/grpc-js';
import { buildServer, listen } from '../src/app.js';
import { positions } from '../src/fleet.js';
import { incidents } from '../src/incidents.js';
import { Tracking } from '../src/proto.js';

// Tests du central : un vrai serveur gRPC sur un port libre, un vrai client ; pas d'imprévus automatiques,
// chaque test déclenche les siens avec incidents.emit()

const server = buildServer();
const port = await listen(server, '127.0.0.1:0');
const client = new Tracking(`127.0.0.1:${port}`, grpc.credentials.createInsecure());

// Arrêt du serveur et du client à la fin des tests
after(() => {
  client.close();
  server.forceShutdown();
});

// Attend qu'une condition devienne vraie, une seconde au plus
async function waitFor(condition, message) {
  for (let i = 0; i < 200; i += 1) {
    if (condition()) {
      return;
    }
    await sleep(5);
  }
  assert.fail(message);
}

// Position d'exemple d'un livreur
function position(courierId) {
  return { courierId, latitude: 45.764, longitude: 4.8357, sentAt: Date.now() };
}

test('une position reçue met à jour l\'état de la flotte', async () => {
  const call = client.track();
  call.on('error', () => {});
  call.write(position('lina'));
  await waitFor(() => positions.has('lina'), 'lina absente de l\'état de la flotte');
  assert.equal(positions.get('lina').latitude, 45.764);
  call.cancel();
});

// timeout : une instruction jamais envoyée fait échouer le test au lieu de le bloquer
test('un imprévu pour ce livreur lui arrive en instruction', { timeout: 3000 }, async () => {
  const call = client.track();
  call.on('error', () => {});
  call.write(position('hugo'));
  await waitFor(() => positions.has('hugo'), 'hugo absent de l\'état de la flotte');
  const received = once(call, 'data');
  incidents.emit('incident', { courierId: 'hugo', text: 'Route fermée', parcelIds: ['CLB-0003', 'CLB-0008'] });
  const [instruction] = await received;
  assert.equal(instruction.text, 'Route fermée');
  assert.deepEqual(instruction.parcelIds, ['CLB-0003', 'CLB-0008']);
  call.cancel();
});

test('un imprévu pour un autre livreur ne lui arrive pas', async () => {
  const call = client.track();
  call.on('error', () => {});
  const received = [];
  call.on('data', (instruction) => received.push(instruction));
  call.write(position('zoe'));
  await waitFor(() => positions.has('zoe'), 'zoe absente de l\'état de la flotte');
  incidents.emit('incident', { courierId: 'someone-else', text: 'Pas pour Zoé', parcelIds: [] });
  await sleep(100);
  assert.equal(received.length, 0);
  call.cancel();
});

test('le livreur ferme son flux : le central ferme le sien et l\'oublie', { timeout: 3000 }, async () => {
  const call = client.track();
  call.on('data', () => {});
  call.write(position('lina'));
  await waitFor(() => positions.has('lina'), 'lina absente de l\'état de la flotte');
  const ended = once(call, 'end');
  call.end();
  await ended;
  await waitFor(() => !positions.has('lina'), 'lina toujours dans l\'état de la flotte');
});

test('connexion coupée : le livreur est oublié, plus aucun abonné aux imprévus', async () => {
  const call = client.track();
  call.on('error', () => {});
  call.write(position('hugo'));
  await waitFor(() => positions.has('hugo'), 'hugo absent de l\'état de la flotte');
  call.cancel();
  await waitFor(() => !positions.has('hugo'), 'hugo toujours dans l\'état de la flotte');
  await waitFor(() => incidents.listenerCount('incident') === 0, 'des abonnés aux imprévus restent en mémoire');
});
