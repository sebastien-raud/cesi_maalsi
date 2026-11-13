import { incidents } from './incidents.js';

// État de la flotte : dernière position connue de chaque livreur connecté
// courierId -> { latitude, longitude, delayMs } (delayMs : temps écoulé entre l'envoi et le traitement)
export const positions = new Map();

// Étape 5 : durée de traitement d'une position, en millisecondes ; 1500 simule un central lent
const PROCESSING_MS = 0;

// Méthode Track : appelée une fois par livreur qui se connecte, call est le flux dans les deux sens
export function track(call) {
  // Livreur de ce flux, connu à sa première position
  let courierId;

  // Étape 3 : un imprévu pour ce livreur devient une instruction, écrite dans le flux de réponse
  const onIncident = (incident) => {
    if (incident.courierId === courierId) {
      call.write({ text: incident.text, parcelIds: incident.parcelIds });
    }
  };
  incidents.on('incident', onIncident);

  // Étape 1 : chaque position reçue met à jour l'état de la flotte
  call.on('data', (position) => {
    courierId = position.courierId;
    positions.set(courierId, {
      latitude: position.latitude,
      longitude: position.longitude,
      delayMs: Date.now() - position.sentAt,
    });
    // Étape 5 : central lent, la lecture du flux s'arrête le temps du traitement
    if (PROCESSING_MS > 0) {
      call.pause();
      setTimeout(() => call.resume(), PROCESSING_MS);
    }
  });

  // Étape 4 : le livreur quitte l'état de la flotte et n'écoute plus les imprévus
  const leave = () => {
    incidents.off('incident', onIncident);
    positions.delete(courierId);
  };

  // Étape 4 : le livreur a terminé son flux, le central termine le sien
  call.on('end', () => {
    leave();
    call.end();
  });

  // Étape 4 : connexion coupée (livreur parti sans prévenir) : rien à renvoyer
  call.on('cancelled', leave);
}
