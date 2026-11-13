// Faux serveur du marchand Vélo Boutique : reçoit les webhooks de Colibri (bonus du TP)
import { createServer } from 'node:http';
import { createHmac, timingSafeEqual } from 'node:crypto';

// Secret partagé entre Colibri et le marchand, convenu à l'inscription du webhook
const SECRET = process.env.WEBHOOK_SECRET ?? 'velo-boutique-secret';

// Identifiants des événements déjà traités : un même événement renvoyé n'est traité qu'une fois
const seen = new Set();

// Vérifie que la signature reçue est bien le HMAC du corps avec le secret partagé
function isSigned(body, signature) {
  const expected = 'sha256=' + createHmac('sha256', SECRET).update(body).digest('hex');
  return typeof signature === 'string'
    && signature.length === expected.length
    && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

const server = createServer(async (request, response) => {
  // Seule l'URL déclarée à Colibri est acceptée
  if (request.method !== 'POST' || request.url !== '/webhooks/colibri') {
    response.writeHead(404).end();
    return;
  }

  // Lecture du corps brut : la signature porte sur les octets reçus, pas sur un JSON réécrit
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks);

  // Requête non signée ou mal signée : refusée
  if (!isSigned(body, request.headers['x-colibri-signature'])) {
    console.log('[Vélo Boutique] signature invalide, requête refusée');
    response.writeHead(401).end();
    return;
  }

  // Événement déjà reçu (nouvelle tentative de Colibri) : accusé de réception sans le retraiter
  const event = JSON.parse(body);
  if (seen.has(event.id)) {
    console.log(`[Vélo Boutique] événement ${event.id} déjà reçu, ignoré`);
  } else {
    seen.add(event.id);
    console.log(`[Vélo Boutique] ${event.type} pour le colis ${event.parcelId} : ${event.text}`);
  }
  response.writeHead(204).end();
});

server.listen(4100, () => {
  console.log('Vélo Boutique attend les webhooks sur http://localhost:4100/webhooks/colibri');
});
