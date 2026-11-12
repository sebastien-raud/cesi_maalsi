import { findParcel, parcels } from './data.js';
import { sendProblem } from './problem.js';

// Actions proposées selon le statut : c'est la seule règle métier, le client ne la connaît pas
const ACTIONS_BY_STATUS = {
  READY: ['start', 'reschedule', 'relay-point'],
  IN_TRANSIT: ['deliver', 'reschedule', 'relay-point'],
  DELIVERED: [],
};

// Effet de chaque action sur le colis
const EFFECTS = {
  start: (parcel) => { parcel.status = 'IN_TRANSIT'; },
  deliver: (parcel) => { parcel.status = 'DELIVERED'; },
  reschedule: (parcel) => { parcel.deliveryOption = 'RESCHEDULED'; },
  'relay-point': (parcel) => { parcel.deliveryOption = 'RELAY_POINT'; },
};

// Étapes 1 et 2 : le colis au format HAL, avec le lien self et un lien par action possible
function toHal(parcel) {
  return { ...parcel };
}

// Routes de l'API v2, enregistrées par app.js sous le préfixe /v2
export async function v2(app) {
  // Un colis par son numéro, au format HAL
  app.get('/parcels/:id', async (request, reply) => {
    const parcel = findParcel(request.params.id);
    if (!parcel) {
      return sendProblem(reply, 404, 'Colis introuvable', `Aucun colis ${request.params.id}`);
    }
    return toHal(parcel);
  });

  // Étape 3 : exécution d'une action, refusée (409) si le statut ne la propose pas
  app.post('/parcels/:id/:action', async (request, reply) => {
    // À remplacer : 501, la route existe mais n'est pas encore écrite
    return sendProblem(reply, 501, 'Pas encore implémenté', 'Étape 3 du TP');
  });

  // Étape 4 : la collection, les colis rangés dans _embedded
  app.get('/parcels', async (request, reply) => {
    // À remplacer : 501, la route existe mais n'est pas encore écrite
    return sendProblem(reply, 501, 'Pas encore implémenté', 'Étape 4 du TP');
  });
}
