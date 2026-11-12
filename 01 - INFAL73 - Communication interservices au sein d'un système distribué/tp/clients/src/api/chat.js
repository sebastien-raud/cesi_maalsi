// Chat d'un colis entre client et livreur (TP 5), en WebSocket
// Message reçu : { from: 'client' | 'courier' | 'system', text, at? }

// Vrai si le TP lance un service de chat (voir vite.config.js) ; sinon les écrans n'affichent pas le chat
export const chatEnabled = import.meta.env.CHAT_ENABLED;

// Ouvre la conversation d'un colis ; onMessage reçoit chaque message, onStatus l'état de la connexion
// ('connecting', 'open' ou 'closed') ; renvoie send(texte) et close()
export function openChat(parcelId, role, onMessage, onStatus) {
  // Même hôte que la page (ws:// ou wss://) : le proxy Vite transmet /chat au service de chat
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const query = new URLSearchParams({ parcel: parcelId, role });
  const socket = new WebSocket(`${protocol}//${location.host}/chat?${query}`);
  onStatus('connecting');

  // Ouverture et fermeture de la connexion ; pas de reconnexion automatique, contrairement à EventSource
  socket.onopen = () => onStatus('open');
  socket.onclose = () => onStatus('closed');

  // Chaque message reçu est un objet JSON
  socket.onmessage = (message) => onMessage(JSON.parse(message.data));

  return {
    send: (text) => socket.send(JSON.stringify({ text })),
    close: () => socket.close(),
  };
}
