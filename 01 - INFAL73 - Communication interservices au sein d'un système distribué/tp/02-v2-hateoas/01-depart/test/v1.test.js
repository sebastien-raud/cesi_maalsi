import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildApp } from '../src/app.js';

// Tests de l'API v1 : app.inject() simule une requête HTTP, sans démarrer de serveur
// Chaque test décrit dans son nom la requête envoyée et la réponse attendue

// Une seule application pour tous les tests : les modifications d'un test restent visibles dans les suivants
const app = buildApp();

// Type de contenu attendu pour toute erreur
const PROBLEM = 'application/problem+json; charset=utf-8';

test('GET /v1/parcels liste les colis', async () => {
  const response = await app.inject({ method: 'GET', url: '/v1/parcels' });
  assert.equal(response.statusCode, 200);
  assert.ok(response.json().length >= 10);
});

test('GET /v1/parcels?status=DELIVERED filtre par statut', async () => {
  const response = await app.inject({ method: 'GET', url: '/v1/parcels?status=DELIVERED' });
  assert.equal(response.statusCode, 200);
  const parcels = response.json();
  assert.ok(parcels.length > 0);
  assert.ok(parcels.every((parcel) => parcel.status === 'DELIVERED'));
});

test('GET /v1/parcels?status=LOST : 422', async () => {
  const response = await app.inject({ method: 'GET', url: '/v1/parcels?status=LOST' });
  assert.equal(response.statusCode, 422);
  assert.equal(response.headers['content-type'], PROBLEM);
});

test('GET /v1/parcels/CLB-0003 renvoie le colis', async () => {
  const response = await app.inject({ method: 'GET', url: '/v1/parcels/CLB-0003' });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().recipient, 'Sarah Croche');
});

test('GET /v1/parcels/CLB-9999 : 404 au format problème', async () => {
  const response = await app.inject({ method: 'GET', url: '/v1/parcels/CLB-9999' });
  assert.equal(response.statusCode, 404);
  assert.equal(response.headers['content-type'], PROBLEM);
  assert.equal(response.json().title, 'Colis introuvable');
});

test('POST /v1/parcels : 201 et en-tête Location', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/v1/parcels',
    payload: { merchant: 'Vélo Boutique', recipient: 'Eva Porée', address: { street: '1 rue Neuve', postalCode: '69001', city: 'Lyon' } },
  });
  assert.equal(response.statusCode, 201);
  const parcel = response.json();
  assert.equal(parcel.status, 'READY');
  assert.equal(response.headers.location, `/v1/parcels/${parcel.id}`);
});

test('POST /v1/parcels ignore un id envoyé dans le corps', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/v1/parcels',
    payload: { id: 'CLB-0001', merchant: 'Vélo Boutique', recipient: 'Eva Porée', address: { street: '1 rue Neuve', postalCode: '69001', city: 'Lyon' } },
  });
  assert.equal(response.statusCode, 201);
  assert.notEqual(response.json().id, 'CLB-0001');
});

test('POST /v1/parcels avec un code postal invalide : 422', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/v1/parcels',
    payload: { merchant: 'Vélo Boutique', recipient: 'Eva Porée', address: { street: '1 rue Neuve', postalCode: 'abc', city: 'Lyon' } },
  });
  assert.equal(response.statusCode, 422);
  assert.equal(response.headers['content-type'], PROBLEM);
});

test('POST /v1/parcels avec un JSON mal formé : 400', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/v1/parcels',
    headers: { 'content-type': 'application/json' },
    payload: '{ "merchant": ',
  });
  assert.equal(response.statusCode, 400);
  assert.equal(response.headers['content-type'], PROBLEM);
});

test('PATCH /v1/parcels/CLB-0001/status : READY vers IN_TRANSIT', async () => {
  const response = await app.inject({ method: 'PATCH', url: '/v1/parcels/CLB-0001/status', payload: { status: 'IN_TRANSIT' } });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().status, 'IN_TRANSIT');
});

test('PATCH /v1/parcels/CLB-0005/status : un colis livré ne repart pas (409)', async () => {
  const response = await app.inject({ method: 'PATCH', url: '/v1/parcels/CLB-0005/status', payload: { status: 'IN_TRANSIT' } });
  assert.equal(response.statusCode, 409);
  assert.equal(response.headers['content-type'], PROBLEM);
});

test('route inconnue : 404 au format problème', async () => {
  const response = await app.inject({ method: 'GET', url: '/v1/unknown' });
  assert.equal(response.statusCode, 404);
  assert.equal(response.headers['content-type'], PROBLEM);
});
