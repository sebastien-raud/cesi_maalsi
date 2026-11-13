import { bufferCount, filter, interval, map, take, tap } from 'rxjs';

// Valeurs du capteur simulé ; -99 et 99 sont des erreurs de lecture
const SAMPLES = [19.5, 20.1, 20.4, -99, 21.0, 21.3, 21.9, 99, 22.4, 22.8, 23.1];

// Le $ final est une convention RxJS (notation finlandaise) : la variable contient un flux
// (observable), pas une valeur ; averages$ émettra des moyennes dans le temps
const averages$ = interval(500).pipe(
  // interval(500) : émet 0, 1, 2... toutes les 500 ms, sans fin
  // pipe(...) : enchaîne les opérateurs, chacun reçoit le flux du précédent et en renvoie un nouveau
  // take(n) : garde les n premières valeurs puis termine le flux (sinon interval ne s'arrête jamais)
  take(SAMPLES.length),
  // map(fn) : transforme chaque valeur ; ici le numéro i devient une mesure { n, celsius }
  map((i) => ({ n: i + 1, celsius: SAMPLES[i] })),
  // tap(fn) : regarde passer chaque valeur sans la modifier (affichage, journal)
  tap((m) => console.log(`[capteur] mesure ${m.n} : ${m.celsius.toFixed(1)} °C`)),
  // filter(fn) : ne laisse passer que les valeurs pour lesquelles fn renvoie true
  filter((m) => m.celsius > -50 && m.celsius < 60),
  // bufferCount(3) : accumule 3 valeurs puis les émet ensemble, sous forme de tableau
  bufferCount(3),
  // map(fn) : le tableau de 3 mesures devient leur moyenne
  map((group) => group.reduce((sum, m) => sum + m.celsius, 0) / group.length),
);

// Flux paresseux : la déclaration ci-dessus n'a rien lancé, interval ne démarre qu'à l'abonnement
console.log('Flux déclaré, abonnement dans 2 s...');

setTimeout(() => {
  // subscribe(observer) : démarre le flux ; next reçoit chaque valeur, complete est appelé à la fin
  averages$.subscribe({
    next: (avg) => console.log(`  [moyenne] ${avg.toFixed(1)} °C sur 3 mesures`),
    complete: () => console.log('Flux terminé'),
  });
}, 2000);
