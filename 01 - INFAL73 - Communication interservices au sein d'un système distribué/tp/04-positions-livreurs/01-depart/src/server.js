import { buildServer, listen } from './app.js';
import { positions } from './fleet.js';
import { startIncidents } from './incidents.js';

// Serveur gRPC du central, sans chiffrement (réseau local de Docker Compose)
const server = buildServer();
await listen(server, '0.0.0.0:50051');
console.log('Central à l\'écoute sur le port 50051');

// Un imprévu toutes les 8 secondes, pour un livreur connecté
startIncidents(() => [...positions.keys()], 8000);

// État de la flotte affiché toutes les 5 secondes
setInterval(() => {
  const rows = [...positions].map(([courierId, p]) => ({
    livreur: courierId,
    latitude: p.latitude.toFixed(5),
    longitude: p.longitude.toFixed(5),
    'retard (ms)': p.delayMs,
  }));
  console.log(`\nÉtat de la flotte (${rows.length} livreur(s) connecté(s))`);
  if (rows.length > 0) {
    console.table(rows);
  }
}, 5000);
