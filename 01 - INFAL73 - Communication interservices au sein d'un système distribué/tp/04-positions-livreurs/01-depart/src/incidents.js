import { EventEmitter } from 'node:events';

// Imprévus de la journée, chacun pour un livreur : { courierId, text, parcelIds }
export const incidents = new EventEmitter();

// Imprévus possibles, tirés au hasard
const SCENARIOS = [
  { text: 'Colis ajouté à votre tournée, tournée recalculée', parcelIds: ['CLB-0012', 'CLB-0003', 'CLB-0008'] },
  { text: 'Rue de la République fermée, passez par la rue Édouard Herriot', parcelIds: ['CLB-0003', 'CLB-0008'] },
  { text: 'Destinataire absent, colis à déposer en point relais', parcelIds: ['CLB-0008', 'CLB-0003'] },
];

// Tire un imprévu toutes les intervalMs millisecondes, pour un des livreurs connectés (courierIds() les donne)
export function startIncidents(courierIds, intervalMs) {
  return setInterval(() => {
    const ids = courierIds();
    if (ids.length === 0) {
      return;
    }
    const courierId = ids[Math.floor(Math.random() * ids.length)];
    const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    incidents.emit('incident', { courierId, ...scenario });
  }, intervalMs);
}
