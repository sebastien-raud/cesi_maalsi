import Fastify from 'fastify';
import { v1 } from './v1.js';

// Logger activé : chaque requête et sa réponse apparaissent dans la console
const app = Fastify({ logger: true });

// Routes de l'API v1, toutes préfixées par /v1
app.register(v1, { prefix: '/v1' });

// 0.0.0.0 : écoute hors du conteneur, pas seulement en local
await app.listen({ host: '0.0.0.0', port: 3000 });
