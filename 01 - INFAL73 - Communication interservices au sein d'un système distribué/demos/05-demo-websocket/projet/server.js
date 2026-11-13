import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

const page = await readFile('public/index.html', 'utf8');

// Serveur HTTP ordinaire : il sert la page du chat
const server = createServer((request, response) => {
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end(page);
});

// Serveur WebSocket greffé sur le même port : il accepte les demandes de montée en protocole
const wss = new WebSocketServer({ server });

// Une connexion par onglet ; elle reste ouverte tant que l'onglet est ouvert
wss.on('connection', (socket) => {
  console.log(`connexion ouverte, ${wss.clients.size} connecté(s)`);

  // Message reçu : relayé tel quel à toutes les connexions ouvertes, auteur compris
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
