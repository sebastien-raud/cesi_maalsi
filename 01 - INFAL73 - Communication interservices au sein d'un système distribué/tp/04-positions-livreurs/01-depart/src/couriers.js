import grpc from '@grpc/grpc-js';
import { Tracking } from './proto.js';

// Simulateur de livreurs : chacun ouvre un flux Track vers le central, envoie sa position chaque seconde
// et affiche les instructions reçues

// Adresse du central (nom du service Docker Compose)
const address = process.env.FLEET_ADDRESS ?? 'localhost:50051';
const client = new Tracking(address, grpc.credentials.createInsecure());

// Tournée de chaque livreur : quelques points dans Lyon, parcourus en boucle
const ROUTES = {
  lina: [[45.7640, 4.8357], [45.7626, 4.8366], [45.7609, 4.8381], [45.7578, 4.8320], [45.7597, 4.8302]],
  hugo: [[45.7676, 4.8344], [45.7698, 4.8325], [45.7712, 4.8291], [45.7689, 4.8270], [45.7667, 4.8302]],
  zoe: [[45.7485, 4.8467], [45.7502, 4.8501], [45.7531, 4.8524], [45.7550, 4.8489], [45.7521, 4.8452]],
};

// Hugo termine sa tournée au bout de 30 secondes : il ferme son flux normalement
const ROUND_MS = { hugo: 30000 };

// Démarre un livreur ; en cas de coupure, il se reconnecte 3 secondes plus tard
function startCourier(courierId) {
  const route = ROUTES[courierId];
  let step = 0;
  // Vrai après une coupure : la fin du flux qui suit n'est pas une fermeture par le central
  let lost = false;
  const call = client.track();
  console.log(`[${courierId}] connecté au central`);

  // Instructions du central, reçues pendant que le livreur continue d'envoyer ses positions
  call.on('data', (instruction) => {
    console.log(`[${courierId}] instruction : ${instruction.text} (tournée : ${instruction.parcelIds.join(', ')})`);
  });

  // Une position par seconde
  const timer = setInterval(() => {
    const [latitude, longitude] = route[step % route.length];
    step += 1;
    call.write({ courierId, latitude, longitude, sentAt: Date.now() });
  }, 1000);

  // Fin de tournée : le livreur ferme son flux d'envoi, le central doit fermer le sien
  if (ROUND_MS[courierId]) {
    setTimeout(() => {
      clearInterval(timer);
      console.log(`[${courierId}] fin de tournée, fermeture du flux`);
      call.end();
    }, ROUND_MS[courierId]);
  }

  // Le central a fermé son flux de réponse
  call.on('end', () => {
    clearInterval(timer);
    if (!lost) {
      console.log(`[${courierId}] le central a fermé le flux`);
    }
  });

  // Connexion perdue (central arrêté ou redémarré)
  call.on('error', (error) => {
    lost = true;
    clearInterval(timer);
    console.log(`[${courierId}] connexion perdue (${error.details}), nouvelle tentative dans 3 s`);
    setTimeout(() => startCourier(courierId), 3000);
  });
}

for (const courierId of Object.keys(ROUTES)) {
  startCourier(courierId);
}
