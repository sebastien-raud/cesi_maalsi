// Pas de RxJS ici : générateur asynchrone et for await, natifs en JavaScript
// sleep(ms) : promesse résolue après ms millisecondes (version promesse de setTimeout)
import { setTimeout as sleep } from 'node:timers/promises';

// Producteur en générateur asynchrone (async function*) : il ne produit une mesure que lorsqu'on la lui demande
async function* sensor() {
  for (let n = 1; n <= 5; n++) {
    console.log(`[capteur] mesure ${n} produite`);
    // yield : livre la mesure puis suspend le générateur, jusqu'à la demande de la mesure suivante
    yield { n, celsius: 20 + n / 2 };
  }
  // Fin de la fonction : le flux est terminé, la boucle for await s'arrête
}

// for await : demande une mesure, attend qu'elle arrive, exécute le corps de boucle, puis demande la suivante
// Le consommateur lent (500 ms par mesure) impose donc son rythme au producteur
for await (const measure of sensor()) {
  await sleep(500);
  console.log(`  [consommateur] mesure ${measure.n} traitée (${measure.celsius.toFixed(1)} °C)`);
}
console.log('Terminé : aucune mesure en attente à aucun moment');
