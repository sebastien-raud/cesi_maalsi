// Flux des événements d'un colis (TP 3), en Server-Sent Events
// Événement reçu : { parcelId, status, label, at }

// Ouvre le flux d'un colis : onEvent est appelée à chaque événement ; renvoie la fonction qui ferme le flux
export function watchParcel(id, onEvent) {
  // EventSource garde la connexion ouverte et se reconnecte seul si elle est coupée
  const source = new EventSource(`/v2/parcels/${encodeURIComponent(id)}/events`);

  // Chaque bloc « data: ... » envoyé par le serveur déclenche onmessage
  source.onmessage = (message) => {
    const event = JSON.parse(message.data);
    onEvent(event);
    // Colis livré : le serveur termine le flux ; sans close(), EventSource se reconnecterait
    if (event.status === 'DELIVERED') {
      source.close();
    }
  };

  return () => source.close();
}
