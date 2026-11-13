import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import WebSocket from 'ws';
import { startChat } from '../src/app.js';
import { rooms } from '../src/chat.js';

let wss;
let base;

// Un serveur de chat sur un port libre pour toute la série de tests
before(async () => {
  wss = await startChat(0);
  base = `ws://localhost:${wss.address().port}/chat`;
});

// Fin des tests : connexions restées ouvertes coupées (test en échec), puis arrêt du serveur
after(() => {
  for (const socket of wss.clients) {
    socket.terminate();
  }
  wss.close();
});

// Ouvre une connexion ; les messages reçus sont rangés dans une file lue par next()
async function connect(query) {
  const socket = new WebSocket(`${base}?${query}`);
  const inbox = [];
  const waiting = [];
  socket.on('message', (data) => {
    const message = JSON.parse(data);
    if (waiting.length > 0) {
      waiting.shift()(message);
    } else {
      inbox.push(message);
    }
  });
  // Prochain message reçu, au plus tard au bout d'une seconde
  socket.next = () => {
    if (inbox.length > 0) {
      return Promise.resolve(inbox.shift());
    }
    return new Promise((resolve, reject) => {
      waiting.push(resolve);
      setTimeout(() => reject(new Error('Aucun message reçu')), 1000);
    });
  };
  await once(socket, 'open');
  // Le premier message est l'accueil « Conversation du colis … »
  await socket.next();
  return socket;
}

// Ferme une connexion et attend la fin de la fermeture
async function disconnect(socket) {
  socket.close();
  await once(socket, 'close');
}

test('connexion sans rôle valide : fermée avec le code 1008', async () => {
  const socket = new WebSocket(`${base}?parcel=CLB-0001&role=boss`);
  const [code] = await once(socket, 'close');
  assert.equal(code, 1008);
});

test('arrivée : les autres participants sont prévenus', async () => {
  const client = await connect('parcel=CLB-0001&role=client');
  const courier = await connect('parcel=CLB-0001&role=courier');
  assert.deepEqual(await client.next(), { from: 'system', text: 'Le livreur a rejoint la conversation' });
  await disconnect(courier);
  await disconnect(client);
});

test('message : relayé aux autres participants avec rôle et heure', async () => {
  const client = await connect('parcel=CLB-0002&role=client');
  const courier = await connect('parcel=CLB-0002&role=courier');
  await client.next();
  courier.send(JSON.stringify({ text: 'Je suis en bas' }));
  const message = await client.next();
  assert.equal(message.from, 'courier');
  assert.equal(message.text, 'Je suis en bas');
  assert.ok(!Number.isNaN(Date.parse(message.at)));
  await disconnect(courier);
  await disconnect(client);
});

test('message : pas transmis aux participants d\'un autre colis', async () => {
  const other = await connect('parcel=CLB-0003&role=client');
  const client = await connect('parcel=CLB-0004&role=client');
  const courier = await connect('parcel=CLB-0004&role=courier');
  await client.next();
  courier.send(JSON.stringify({ text: 'Bonjour' }));
  await client.next();
  await assert.rejects(other.next(), /Aucun message reçu/);
  await disconnect(courier);
  await disconnect(client);
  await disconnect(other);
});

test('message invalide : l\'expéditeur est prévenu', async () => {
  const client = await connect('parcel=CLB-0005&role=client');
  client.send('pas du JSON');
  assert.deepEqual(await client.next(), { from: 'system', text: 'Message invalide' });
  await disconnect(client);
});

test('départ : les autres sont prévenus, la conversation vide disparaît', async () => {
  const client = await connect('parcel=CLB-0006&role=client');
  const courier = await connect('parcel=CLB-0006&role=courier');
  await client.next();
  await disconnect(courier);
  assert.deepEqual(await client.next(), { from: 'system', text: 'Le livreur a quitté la conversation' });
  await disconnect(client);
  // Laisse au serveur le temps de traiter la fermeture
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.equal(rooms.has('CLB-0006'), false);
});
