# Démo : flux réactifs et back-pressure

## Objectif

Rendre concrètes les trois notions de la séquence : un flux paresseux transformé par des opérateurs (RxJS), le problème d'un consommateur plus lent que le producteur en modèle push, puis le modèle pull d'un générateur asynchrone, où le consommateur impose son rythme. Exemple générique : des mesures de température, sans lien avec Colibri. Le TP 3 reprend le modèle pull (`for await`) pour le flux SSE des événements d'un colis.

## Points clés à faire passer

- un observable est **déclaré** puis **abonné** : sans `subscribe`, aucune mesure n'est lue ;
- les opérateurs s'enchaînent dans `pipe` et décrivent la transformation, pas les étapes de calcul (déclaratif) ;
- en **push**, le producteur impose son rythme : si le consommateur est plus lent, les valeurs s'accumulent en mémoire, ou il faut accepter d'en perdre (`sampleTime`, `throttleTime`) ;
- en **pull**, le consommateur demande la valeur suivante quand il est prêt : rien ne s'accumule ; c'est le modèle des streams Node.js et de `for await` ;
- le pull suppose que le producteur sache attendre : un vrai capteur qui mesure sans cesse devra, lui, garder ou jeter les valeurs (le problème se déplace, il ne disparaît pas).

## Projet

Le projet est dans `projet/` :

```
projet/
  docker-compose.yml        # un conteneur Node 26 pour lancer les scripts
  package.json              # dépendance rxjs
  01-operateurs.js          # flux paresseux, map, filter, bufferCount
  02-consommateur-lent.js   # producteur 10/s, consommateur 2/s, sans puis avec sampleTime
  03-pull.js                # générateur asynchrone et for await
```

## Déroulé détaillé

### 1. Installer les dépendances (une fois, avant le cours)

```bash
cd projet
docker compose run --rm node npm install
```

→ `added 2 packages`.

### 2. Opérateurs sur un flux (`01-operateurs.js`)

Montrer le code : `interval(500)` produit un nombre toutes les 500 ms, `map` le transforme en mesure, `filter` écarte les erreurs de lecture (`-99`, `99`), `bufferCount(3)` regroupe par trois, le dernier `map` calcule la moyenne. `tap` sert seulement à afficher ce qui passe.

```bash
docker compose run --rm node node 01-operateurs.js
```

→ La console affiche d'abord `Flux déclaré, abonnement dans 2 s...`, puis **rien pendant 2 s** (flux paresseux), puis :

```
[capteur] mesure 1 : 19.5 °C
[capteur] mesure 2 : 20.1 °C
[capteur] mesure 3 : 20.4 °C
  [moyenne] 20.0 °C sur 3 mesures
[capteur] mesure 4 : -99.0 °C
[capteur] mesure 5 : 21.0 °C
...
  [moyenne] 22.8 °C sur 3 mesures
Flux terminé
```

Faire remarquer que les mesures `-99` et `99` sont lues mais n'entrent dans aucune moyenne.

### 3. Consommateur lent (`02-consommateur-lent.js`)

Montrer les constantes : le producteur émet 20 mesures, une toutes les 100 ms ; le consommateur met 500 ms par mesure (`concatMap` en traite une à la fois).

```bash
docker compose run --rm node node 02-consommateur-lent.js
```

→ Phase 1, sans stratégie :

```
[1 s] émises 9, perdues 0, en attente 8, traitées 1
[2 s] émises 19, perdues 0, en attente 16, traitées 3
[3 s] émises 20, perdues 0, en attente 15, traitées 5
...
[10 s] émises 20, perdues 0, en attente 0, traitées 20
```

Le producteur a fini en 2 s, le consommateur en 10 s ; jusqu'à 16 mesures attendent en mémoire. Question au groupe : et si le producteur ne s'arrête jamais ?

→ Phase 2, avec `sampleTime(500)` :

```
[1 s] émises 9, perdues 8, en attente 1, traitées 0
[2 s] émises 19, perdues 16, en attente 1, traitées 2
[3 s] émises 20, perdues 16, en attente 0, traitées 4
```

Plus rien ne s'accumule, mais 16 mesures sur 20 sont perdues : acceptable pour une température affichée, pas pour des commandes.

### 4. Modèle pull (`03-pull.js`)

Montrer le générateur `async function* sensor()` et la boucle `for await` : `yield` suspend le générateur jusqu'à ce que la boucle demande la valeur suivante.

```bash
docker compose run --rm node node 03-pull.js
```

→ Les lignes alternent, le capteur attend le consommateur :

```
[capteur] mesure 1 produite
  [consommateur] mesure 1 traitée (20.5 °C)
[capteur] mesure 2 produite
  [consommateur] mesure 2 traitée (21.0 °C)
...
Terminé : aucune mesure en attente à aucun moment
```

Faire le lien avec le TP 3 : le flux SSE des événements d'un colis est lu avec `for await`, sur `on()` de `node:events`, un itérable asynchrone fourni par Node ; pas de générateur à écrire, mais le même modèle pull.

### 5. Ranger

```bash
docker compose down
```

## Piège à éviter

Ne pas présenter le pull comme la solution miracle : il suppose un producteur capable d'attendre (lecture d'un fichier, d'une base, d'une file). Pour une source qui émet d'elle-même (capteur, clics, positions des livreurs), il faut toujours choisir entre mémoire tampon et perte ; le pull ne fait que placer ce choix chez le producteur. Rester à trois scripts courts : la démo dure environ 10 minutes dans une séquence de 30.
