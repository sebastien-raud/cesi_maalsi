import { on, once } from 'node:events';
import { findParcel } from './data.js';
import { sendProblem } from './problem.js';
import { tracking } from './tracking.js';

// Étape 4 : écrit un événement au format SSE ; si le tampon est plein, attend qu'il se vide (back-pressure)
async function send(raw, event) {
  if (!raw.write(`data: ${JSON.stringify(event)}\n\n`)) {
    await once(raw, 'drain');
  }
}

// Route du flux, enregistrée par app.js sous le préfixe /v2
export async function events(app) {
  // Étape 1 : flux des événements d'un colis, en text/event-stream
  app.get('/parcels/:id/events', async (request, reply) => {
    const parcel = findParcel(request.params.id);
    if (!parcel) {
      return sendProblem(reply, 404, 'Colis introuvable', `Aucun colis ${request.params.id}`);
    }

    // Fastify n'envoie plus rien : la réponse est écrite à la main, morceau par morceau
    reply.hijack();
    reply.raw.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });

    // Premier événement : l'état actuel ; un colis déjà livré n'a plus rien à suivre
    await send(reply.raw, { parcelId: parcel.id, status: parcel.status, label: 'État actuel', at: parcel.updatedAt });
    if (parcel.status !== 'DELIVERED') {
      // Étape 3 : client déconnecté, l'attente des événements s'arrête
      const controller = new AbortController();
      reply.raw.on('close', () => controller.abort());
      try {
        // Étape 2 : chaque événement du colis est envoyé, l'un après l'autre
        for await (const [event] of on(tracking, 'event', { signal: controller.signal })) {
          if (event.parcelId !== parcel.id) {
            continue;
          }
          await send(reply.raw, event);
          // Étape 3 : colis livré, le flux se termine
          if (event.status === 'DELIVERED') {
            break;
          }
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          throw error;
        }
      }
    }
    reply.raw.end();
  });
}
