// Colis : { id, merchant, recipient, address: { street, postalCode, city }, status, updatedAt }

// Statuts d'un colis (ADDRESS_PENDING arrive au TP 6, avec le géocodage)
export const PARCEL_STATUSES = ['READY', 'IN_TRANSIT', 'DELIVERED'];

// Transitions autorisées : un colis livré ne repart pas
const TRANSITIONS = {
  READY: ['IN_TRANSIT'],
  IN_TRANSIT: ['DELIVERED'],
  DELIVERED: [],
};

// Indique si un colis peut passer du statut from au statut to
export function canTransition(from, to) {
  return TRANSITIONS[from].includes(to);
}
