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

  // Étape 1 : chaque position reçue (événement 'data') met à jour l'état de la flotte

  // Étape 3 : un imprévu pour ce livreur (événement 'incident' de incidents) devient une instruction

  // Étape 4 : fin du flux, normale ('end') ou connexion coupée ('cancelled')
}
