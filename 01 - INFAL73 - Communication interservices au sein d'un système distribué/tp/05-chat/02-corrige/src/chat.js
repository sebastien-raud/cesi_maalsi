// Conversations : numéro de colis -> ensemble des connexions ouvertes sur ce colis
export const rooms = new Map();

// Participants possibles, et leur nom dans les messages du système
const ROLES = {
  client: 'Le client',
  courier: 'Le livreur',
};

// Longueur maximale d'un message
const MAX_LENGTH = 500;

// Envoie un message (objet) à une connexion, si elle est encore ouverte
function send(socket, message) {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

// Étape 1 : envoie un message à toutes les connexions du colis, sauf à son auteur
function broadcast(room, author, message) {
  for (const socket of room) {
    if (socket !== author) {
      send(socket, message);
    }
  }
}

// Appelée par le serveur à chaque nouvelle connexion ; request est la requête HTTP d'ouverture
export function onConnection(socket, request) {
  // Étape 1 : colis et rôle lus dans l'URL, ws://.../chat?parcel=CLB-0003&role=client
  const url = new URL(request.url, 'http://localhost');
  const parcelId = url.searchParams.get('parcel');
  const role = url.searchParams.get('role');
  // Object.hasOwn : ROLES['constructor'], hérité de Object, ne doit pas passer pour un rôle
  if (!parcelId || !Object.hasOwn(ROLES, role)) {
    // 1008 : connexion refusée car elle ne respecte pas les règles du service
    socket.close(1008, 'Paramètres parcel et role attendus');
    return;
  }

  // Étape 1 : la connexion rejoint la conversation du colis
  if (!rooms.has(parcelId)) {
    rooms.set(parcelId, new Set());
  }
  const room = rooms.get(parcelId);
  room.add(socket);
  send(socket, { from: 'system', text: `Conversation du colis ${parcelId}` });
  broadcast(room, socket, { from: 'system', text: `${ROLES[role]} a rejoint la conversation` });

  // Étape 2 : un message reçu est relayé aux autres participants du colis
  socket.on('message', (data) => {
    let text;
    try {
      text = JSON.parse(data).text;
    } catch {
      // JSON mal formé : traité plus bas comme un message invalide
    }
    if (typeof text !== 'string' || text.trim() === '' || text.length > MAX_LENGTH) {
      send(socket, { from: 'system', text: 'Message invalide' });
      return;
    }
    broadcast(room, socket, { from: role, text, at: new Date().toISOString() });
  });

  // Étape 3 : déconnexion, la connexion quitte la conversation ; une conversation vide disparaît
  socket.on('close', () => {
    room.delete(socket);
    if (room.size === 0) {
      rooms.delete(parcelId);
    } else {
      broadcast(room, socket, { from: 'system', text: `${ROLES[role]} a quitté la conversation` });
    }
  });
}
