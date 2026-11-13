import { readFile } from 'node:fs/promises';
import Fastify from 'fastify';

// Citations lues une fois au démarrage
const quotes = JSON.parse(await readFile('citations.json', 'utf8'));
const page = await readFile('public/index.html', 'utf8');

// Intervalle entre deux citations, en millisecondes
const PERIOD = 5000;

const app = Fastify({ logger: true });

// Page web qui affiche le flux
app.get('/', async (request, reply) => {
  reply.type('text/html');
  return page;
});

// Flux SSE : la réponse reste ouverte, une citation est écrite toutes les 5 secondes
app.get('/quotes', (request, reply) => {
  // Après une coupure, le navigateur renvoie l'id du dernier événement reçu
  const lastId = request.headers['last-event-id'];
  let next = lastId === undefined ? 0 : Number(lastId) + 1;
  request.log.info({ lastId }, 'abonné connecté');

  // On prend la main sur la réponse : Fastify n'envoie plus rien lui-même
  reply.hijack();
  reply.raw.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
  });

  // retry : délai de reconnexion du navigateur après une coupure
  reply.raw.write('retry: 2000\n\n');

  // Un événement = des lignes "champ: valeur", terminées par une ligne vide
  const send = () => {
    const quote = quotes[next % quotes.length];
    reply.raw.write(`id: ${next}\ndata: ${JSON.stringify(quote)}\n\n`);
    next++;
  };
  send();
  const timer = setInterval(send, PERIOD);

  // Client parti (onglet fermé) : arrêter l'envoi, sinon le minuteur tourne pour rien
  request.raw.on('close', () => {
    clearInterval(timer);
    request.log.info('abonné déconnecté');
  });
});

// 0.0.0.0 : écoute hors du conteneur, pas seulement en local
await app.listen({ host: '0.0.0.0', port: 3000 });
