import { concatMap, delay, identity, interval, of, sampleTime, take, tap } from 'rxjs';

// Producteur : 10 mesures par seconde pendant 2 s ; consommateur : 2 mesures par seconde
const PRODUCER_PERIOD = 100; // ms entre deux mesures émises
const CONSUMER_DURATION = 500; // ms pour traiter une mesure
const COUNT = 20; // nombre de mesures émises

// Lance une phase et rend une promesse résolue quand le consommateur a fini
// strategy : opérateur placé entre producteur et consommateur (identity = aucun, sampleTime = perte)
function runPhase(title, strategy) {
  console.log(`\n=== ${title} ===`);
  // Compteurs : émises par le producteur, gardées après la stratégie, traitées par le consommateur
  const stats = { emitted: 0, kept: 0, processed: 0 };
  const start = Date.now();

  // État affiché chaque seconde : ce qui attend en mémoire = gardées - traitées
  const report = () => {
    const seconds = Math.round((Date.now() - start) / 1000);
    console.log(
      `[${seconds} s] émises ${stats.emitted}, perdues ${stats.emitted - stats.kept}, ` +
        `en attente ${stats.kept - stats.processed}, traitées ${stats.processed}`,
    );
  };
  const timer = setInterval(report, 1000);

  // new Promise(...) : promesse renvoyée tout de suite, en attente ; JavaScript fournit resolve,
  // une fonction à appeler quand le travail est fini ; l'appel resolve() tient la promesse,
  // et le await runPhase(...) du bas du fichier peut continuer (sinon les deux phases se mélangeraient)
  return new Promise((resolve) => {
    // Producteur en push : interval émet à son rythme, sans savoir si le consommateur suit
    interval(PRODUCER_PERIOD)
      .pipe(
        // take(n) : 20 mesures puis fin du flux
        take(COUNT),
        // tap(fn) : compte chaque mesure émise, sans la modifier
        tap(() => stats.emitted++),
        // Stratégie de back-pressure : identity laisse tout passer, sampleTime en jette une partie
        strategy,
        // tap(fn) : compte les mesures qui ont franchi la stratégie
        tap(() => stats.kept++),
        // concatMap(fn) : pour chaque mesure, fn renvoie un flux interne (ici of(value) retardé de 500 ms,
        // soit le traitement simulé) ; concatMap attend la fin d'un flux interne avant de lancer le suivant,
        // les mesures arrivées entre-temps s'accumulent en mémoire derrière
        concatMap((value) => of(value).pipe(delay(CONSUMER_DURATION))),
      )
      // subscribe(observer) : démarre le flux ; next = une mesure traitée, complete = tout est traité
      .subscribe({
        next: () => stats.processed++,
        // complete : dernière mesure traitée ; arrêt de l'affichage périodique, état final, fin de la phase
        complete: () => {
          clearInterval(timer);
          report();
          resolve();
        },
      });
  });
}

// await : attend que la promesse de runPhase soit tenue (resolve appelé) avant de passer à la suite
// Phase 1 : identity est l'opérateur neutre (renvoie le flux tel quel), tout est gardé en mémoire
await runPhase('Sans stratégie : mémoire tampon illimitée', identity);

// Phase 2 : sampleTime(500) émet toutes les 500 ms la dernière mesure reçue et perd les autres
await runPhase('Avec sampleTime(500) : perte volontaire', sampleTime(CONSUMER_DURATION));
