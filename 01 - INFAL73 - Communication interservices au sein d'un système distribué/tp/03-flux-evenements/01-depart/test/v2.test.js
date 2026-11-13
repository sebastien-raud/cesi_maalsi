import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildApp } from '../src/app.js';

// Tests de l'API v2 : app.inject() simule une requête HTTP, sans démarrer de serveur
// Chaque test décrit dans son nom la requête envoyée et la réponse attendue

// Une seule application pour tous les tests : les modifications d'un test restent visibles dans les suivants
const app = buildApp();

// Type de contenu attendu pour toute erreur
const PROBLEM = 'application/problem+json; charset=utf-8';

// Noms des liens d'un colis, triés, pour comparer sans dépendre de l'ordre
function rels(parcel) {
  return Object.keys(parcel._links).sort();
}

test('GET /v2/parcels/CLB-0003 renvoie le colis avec son lien self', async () => {
  const response = await app.inject({ method: 'GET', url: '/v2/parcels/CLB-0003' });
  assert.equal(response.statusCode, 200);
  const parcel = response.json();
  assert.equal(parcel.recipient, 'Sarah Croche');
  assert.deepEqual(parcel._links.self, { href: '/v2/parcels/CLB-0003' });
});

test('GET /v2/parcels/CLB-9999 : 404 au format problème', async () => {
  const response = await app.inject({ method: 'GET', url: '/v2/parcels/CLB-9999' });
  assert.equal(response.statusCode, 404);
  assert.equal(response.headers['content-type'], PROBLEM);
});

test('colis IN_TRANSIT : liens deliver, reschedule et relay-point', async () => {
  const parcel = (await app.inject({ method: 'GET', url: '/v2/parcels/CLB-0003' })).json();
  assert.deepEqual(rels(parcel), ['deliver', 'relay-point', 'reschedule', 'self']);
  assert.deepEqual(parcel._links.deliver, { href: '/v2/parcels/CLB-0003/deliver', method: 'POST' });
});

test('colis DELIVERED : seulement le lien self', async () => {
  const parcel = (await app.inject({ method: 'GET', url: '/v2/parcels/CLB-0005' })).json();
  assert.deepEqual(rels(parcel), ['self']);
});

test('POST /v2/parcels/CLB-0002/start : le colis part, ses liens changent', async () => {
  const response = await app.inject({ method: 'POST', url: '/v2/parcels/CLB-0002/start' });
  assert.equal(response.statusCode, 200);
  const parcel = response.json();
  assert.equal(parcel.status, 'IN_TRANSIT');
  assert.deepEqual(rels(parcel), ['deliver', 'relay-point', 'reschedule', 'self']);
});

test('POST /v2/parcels/CLB-0004/relay-point : option de livraison enregistrée', async () => {
  const response = await app.inject({ method: 'POST', url: '/v2/parcels/CLB-0004/relay-point' });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().deliveryOption, 'RELAY_POINT');
});

test('POST /v2/parcels/CLB-0007/reschedule sur un colis livré : 409', async () => {
  const response = await app.inject({ method: 'POST', url: '/v2/parcels/CLB-0007/reschedule' });
  assert.equal(response.statusCode, 409);
  assert.equal(response.headers['content-type'], PROBLEM);
});

test('POST /v2/parcels/CLB-0004/fly, action inconnue : 404', async () => {
  const response = await app.inject({ method: 'POST', url: '/v2/parcels/CLB-0004/fly' });
  assert.equal(response.statusCode, 404);
  assert.equal(response.headers['content-type'], PROBLEM);
});

test('GET /v2/parcels : collection HAL, colis dans _embedded', async () => {
  const response = await app.inject({ method: 'GET', url: '/v2/parcels' });
  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.deepEqual(body._links.self, { href: '/v2/parcels' });
  assert.ok(body._embedded.parcels.length >= 10);
  assert.ok(body._embedded.parcels.every((parcel) => parcel._links.self));
});

test('la v1 est inchangée : pas de _links', async () => {
  const response = await app.inject({ method: 'GET', url: '/v1/parcels/CLB-0003' });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json()._links, undefined);
});
