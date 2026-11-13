import { on, once } from 'node:events';
import { findParcel } from './data.js';
import { sendProblem } from './problem.js';
import { tracking } from './tracking.js';

// Écrit un événement au format SSE : une ligne « data: <JSON> », puis une ligne vide
// Étape 4, à lire : si le tampon est plein, attend qu'il se vide (back-pressure)
async function send(raw, event) {
  if (!raw.write(`data: ${JSON.stringify(event)}\n\n`)) {
    await once(raw, 'drain');
  }
}

// Route du flux, enregistrée par app.js sous le préfixe /v2
export async function events(app) {
  // Étape 1 : flux des événements d'un colis, en text/event-stream
  app.get('/parcels/:id/events', async (request, reply) => {
    // À remplacer : 501, la route existe mais n'est pas encore écrite
    return sendProblem(reply, 501, 'Pas encore implémenté', 'Étape 1 du TP');
  });
}
