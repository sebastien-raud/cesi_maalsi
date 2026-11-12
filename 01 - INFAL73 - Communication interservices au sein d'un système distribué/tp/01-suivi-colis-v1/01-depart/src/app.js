import Fastify from 'fastify';
import { sendProblem } from './problem.js';
import { v1 } from './v1.js';

// Crée l'application sans la démarrer : server.js la lance, les tests l'interrogent directement
export function buildApp(logger = false) {
  const app = Fastify({ logger });

  // Routes de l'API v1, toutes préfixées par /v1
  app.register(v1, { prefix: '/v1' });

  // Étape 5 : gestionnaire d'erreurs centralisé (app.setErrorHandler) et route inconnue (app.setNotFoundHandler)

  return app;
}
