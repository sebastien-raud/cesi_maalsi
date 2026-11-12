import { buildApp } from './app.js';

// Journaux activés : chaque requête s'affiche dans docker compose logs
const app = buildApp(true);

// 0.0.0.0 : écouter sur toutes les interfaces, pour être joignable hors du conteneur
await app.listen({ host: '0.0.0.0', port: 3000 });
