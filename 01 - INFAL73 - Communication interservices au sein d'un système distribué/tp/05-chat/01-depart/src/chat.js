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
}

// Appelée par le serveur à chaque nouvelle connexion ; request est la requête HTTP d'ouverture
export function onConnection(socket, request) {
  // Colis et rôle lus dans l'URL, ws://.../chat?parcel=CLB-0003&role=client
  const url = new URL(request.url, 'http://localhost');
  const parcelId = url.searchParams.get('parcel');
  const role = url.searchParams.get('role');

  // Étape 1 : paramètres invalides, connexion refusée avec le code 1008

  // Étape 1 : la connexion rejoint la conversation du colis, accueil et annonce aux autres

  // Étape 2 : un message reçu (événement 'message') est relayé aux autres participants du colis

  // Étape 3 : déconnexion (événement 'close'), la connexion quitte la conversation
}
