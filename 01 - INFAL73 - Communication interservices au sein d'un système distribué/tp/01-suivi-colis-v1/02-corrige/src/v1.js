import { findParcel, nextId, parcels } from './data.js';
import { canTransition, PARCEL_STATUSES } from './parcel.js';
import { sendProblem } from './problem.js';

// Schémas JSON : Fastify valide les requêtes avant d'appeler le handler
// Statut valide : une des valeurs de PARCEL_STATUSES
const statusSchema = { enum: PARCEL_STATUSES };

// Corps attendu pour créer un colis
const newParcelSchema = {
  type: 'object',
  required: ['merchant', 'recipient', 'address'],
  properties: {
    merchant: { type: 'string', minLength: 1 },
    recipient: { type: 'string', minLength: 1 },
    address: {
      type: 'object',
      required: ['street', 'postalCode', 'city'],
      properties: {
        street: { type: 'string', minLength: 1 },
        postalCode: { type: 'string', pattern: '^[0-9]{5}$' },
        city: { type: 'string', minLength: 1 },
      },
    },
  },
};

// Corps attendu pour changer le statut : { "status": "IN_TRANSIT" }
const changeStatusSchema = {
  type: 'object',
  required: ['status'],
  properties: { status: statusSchema },
};

// Paramètres d'URL acceptés par la liste : ?status=...
const listQuerySchema = {
  type: 'object',
  properties: { status: statusSchema },
};

// Routes de l'API v1, enregistrées par app.js sous le préfixe /v1
export async function v1(app) {
  // Étape 1 : un colis par son numéro, 404 s'il n'existe pas
  app.get('/parcels/:id', async (request, reply) => {
    const parcel = findParcel(request.params.id);
    if (!parcel) {
      return sendProblem(reply, 404, 'Colis introuvable', `Aucun colis ${request.params.id}`);
    }
    return parcel;
  });

  // Étape 2 : création d'un colis, 201 et adresse du nouveau colis dans l'en-tête Location
  app.post('/parcels', { schema: { body: newParcelSchema } }, async (request, reply) => {
    // Champs repris un par un : un champ en trop dans le corps (id, status...) est ignoré
    const { merchant, recipient, address } = request.body;
    const parcel = { id: nextId(), merchant, recipient, address, status: 'READY', updatedAt: new Date().toISOString() };
    parcels.push(parcel);
    return reply.code(201).header('Location', `/v1/parcels/${parcel.id}`).send(parcel);
  });

  // Étape 3 : changement de statut, 404 si le colis n'existe pas, 409 si la transition est interdite
  app.patch('/parcels/:id/status', { schema: { body: changeStatusSchema } }, async (request, reply) => {
    const parcel = findParcel(request.params.id);
    if (!parcel) {
      return sendProblem(reply, 404, 'Colis introuvable', `Aucun colis ${request.params.id}`);
    }
    const { status } = request.body;
    if (!canTransition(parcel.status, status)) {
      return sendProblem(reply, 409, 'Transition impossible', `Un colis ${parcel.status} ne peut pas passer en ${status}`);
    }
    parcel.status = status;
    parcel.updatedAt = new Date().toISOString();
    return parcel;
  });

  // Étape 4 : liste des colis, filtrée par statut si ?status= est fourni
  app.get('/parcels', { schema: { querystring: listQuerySchema } }, async (request) => {
    const { status } = request.query;
    return status ? parcels.filter((parcel) => parcel.status === status) : parcels;
  });
}
