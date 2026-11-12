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
  // Étape 1 : un colis par son numéro (GET /v1/parcels/:id)

  // Étape 2 : créer un colis (POST /v1/parcels), avec newParcelSchema

  // Étape 3 : changer le statut d'un colis (PATCH /v1/parcels/:id/status), avec changeStatusSchema

  // Exemple fourni : liste de tous les colis
  // Étape 4 : la modifier pour filtrer par statut (GET /v1/parcels?status=IN_TRANSIT), avec listQuerySchema
  app.get('/parcels', async () => {
    return parcels;
  });
}
