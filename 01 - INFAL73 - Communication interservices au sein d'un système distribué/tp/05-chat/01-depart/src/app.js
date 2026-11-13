import { once } from 'node:events';
import { WebSocketServer } from 'ws';
import { onConnection } from './chat.js';

// Démarre le serveur WebSocket sur un port (0 : un port libre, pour les tests) ; renvoie le serveur une fois prêt
export async function startChat(port) {
  // path : seules les connexions ouvertes sur /chat sont acceptées
  const wss = new WebSocketServer({ port, path: '/chat' });
  wss.on('connection', (socket, request) => {
    // Trame invalide envoyée par un client : sans cet écouteur, l'erreur arrêterait tout le serveur ;
    // la connexion est fermée par ws, et l'événement close suit
    socket.on('error', (error) => console.log(`Connexion fermée sur erreur : ${error.message}`));
    onConnection(socket, request);
  });
  await once(wss, 'listening');
  return wss;
}
