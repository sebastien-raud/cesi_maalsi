// Libellé et pictogramme de chaque statut : le statut ne repose jamais sur la seule couleur
// (ADDRESS_PENDING à partir du TP 6)
export const STATUS = {
  ADDRESS_PENDING: { label: 'Adresse à vérifier', icon: '📍' },
  READY: { label: 'Prêt au départ', icon: '📦' },
  IN_TRANSIT: { label: 'En cours de livraison', icon: '🚲' },
  DELIVERED: { label: 'Livré', icon: '✅' },
};

// Date ISO de l'API affichée en français : « 2 nov. 2026, 09:30 »
export function formatDate(iso) {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

// Heure seule, à la seconde, pour les événements en direct : « 09:30:12 »
export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('fr-FR');
}
