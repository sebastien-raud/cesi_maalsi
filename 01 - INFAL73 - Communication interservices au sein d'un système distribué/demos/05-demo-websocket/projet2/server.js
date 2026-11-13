import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

// Deux pages : / (avec RxJS) et /index2.html (même comportement, sans RxJS)
const pages = {
  '/': await readFile('public/index.html', 'utf8'),
  '/index2.html': await readFile('public/index2.html', 'utf8'),
};
// RxJS tourne dans le navigateur : le serveur sert sa version « bundle » depuis node_modules
const rxjs = await readFile('node_modules/rxjs/dist/bundles/rxjs.umd.min.js', 'utf8');

// Serveur HTTP ordinaire : il sert la page du chat et la bibliothèque RxJS
const server = createServer((request, response) => {
  if (request.url === '/rxjs.js') {
    response.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' });
    response.end(rxjs);
    return;
  }
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end(pages[request.url] ?? pages['/']);
});

// Serveur WebSocket greffé sur le même port : il accepte les demandes de montée en protocole
const wss = new WebSocketServer({ server });

// Une connexion par onglet ; elle reste ouverte tant que l'onglet est ouvert
wss.on('connection', (socket) => {
  console.log(`connexion ouverte, ${wss.clients.size} connecté(s)`);

  // Message reçu (« typing » ou « message ») : relayé tel quel à toutes les connexions ouvertes
  socket.on('message', (data) => {
    console.log(`reçu : ${data}`);
    for (const client of wss.clients) {
      if (client.readyState === client.OPEN) {
        client.send(data.toString());
      }
    }
  });

  // Onglet fermé : ws retire la connexion de wss.clients
  socket.on('close', () => {
    console.log(`connexion fermée, ${wss.clients.size} connecté(s)`);
  });
});

server.listen(3000, () => console.log('Chat sur http://localhost:3000'));
