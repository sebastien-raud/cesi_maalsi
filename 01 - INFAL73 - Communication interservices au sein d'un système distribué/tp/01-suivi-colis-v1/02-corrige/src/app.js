import Fastify from 'fastify';
import { sendProblem } from './problem.js';
import { v1 } from './v1.js';

// Crée l'application sans la démarrer : server.js la lance, les tests l'interrogent directement
export function buildApp(logger = false) {
  const app = Fastify({ logger });

  // Routes de l'API v1, toutes préfixées par /v1
  app.register(v1, { prefix: '/v1' });

  // Gestionnaire d'erreurs centralisé : toute erreur repart au même format
  app.setErrorHandler((error, request, reply) => {
    if (error.validation) {
      return sendProblem(reply, 422, 'Données invalides', error.message);
    }
    if (error.statusCode && error.statusCode < 500) {
      return sendProblem(reply, error.statusCode, 'Requête invalide', error.message);
    }
    request.log.error(error);
    return sendProblem(reply, 500, 'Erreur interne du serveur');
  });

  // Route inconnue : 404 au même format
  app.setNotFoundHandler((request, reply) => {
    return sendProblem(reply, 404, 'Ressource introuvable', `${request.method} ${request.url}`);
  });

  return app;
}
