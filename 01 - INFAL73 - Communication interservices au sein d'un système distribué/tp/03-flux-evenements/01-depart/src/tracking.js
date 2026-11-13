import { EventEmitter } from 'node:events';
import { parcels } from './data.js';

// Canal des événements de suivi : tout événement de tout colis y passe
// Événement : { parcelId, status, label, at }
export const tracking = new EventEmitter();

// Étapes d'une livraison simulée ; la dernière livre le colis
const STEPS = [
  'Colis chargé sur le vélo cargo',
  'En route vers le quartier',
  'Livreur à 5 minutes',
  'Colis remis au destinataire',
];

// Prochaine étape de chaque colis en cours de livraison
const progress = new Map();

// Fait avancer d'une étape chaque colis en cours de livraison, et publie un événement par colis
export function advance() {
  for (const parcel of parcels.filter((p) => p.status === 'IN_TRANSIT')) {
    const step = progress.get(parcel.id) ?? 0;
    if (step === STEPS.length - 1) {
      parcel.status = 'DELIVERED';
      progress.delete(parcel.id);
    } else {
      progress.set(parcel.id, step + 1);
    }
    parcel.updatedAt = new Date().toISOString();
    tracking.emit('event', { parcelId: parcel.id, status: parcel.status, label: STEPS[step], at: parcel.updatedAt });
  }
}

// Lance la simulation : une étape toutes les intervalMs millisecondes
export function startSimulator(intervalMs) {
  return setInterval(advance, intervalMs);
}
