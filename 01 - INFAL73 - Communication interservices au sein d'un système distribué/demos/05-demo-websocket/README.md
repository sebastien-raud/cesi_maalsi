# Démo : WebSocket, un chat minimal

## Objectif

Montrer, avant le TP 5, ce qu'est une connexion WebSocket : une requête HTTP qui demande à changer de protocole, puis une connexion qui reste ouverte et dans laquelle les deux côtés écrivent quand ils veulent. Exemple générique : un chat à une seule salle, la même page ouverte dans deux onglets, avec la bibliothèque `ws` (celle du TP 5).

## Points clés à faire passer

- l'ouverture est une requête HTTP avec `Upgrade: websocket` ; le serveur répond `101 Switching Protocols`, puis la connexion ne parle plus HTTP ;
- full-duplex : le navigateur envoie (`socket.send`) et reçoit (`onmessage`) sur la même connexion, sans nouvelle requête ;
- le serveur WebSocket se greffe sur le serveur HTTP qui sert la page : un seul port ;
- stateful : le serveur garde la liste des connexions ouvertes (`wss.clients`) ; diffuser un message, c'est parcourir cette liste ;
- pas de reconnexion automatique, contrairement à `EventSource` (démo 03) : c'est au client de la gérer ;
- non montré ici, ce sont les étapes du TP 5 : salles par colis, validation des messages, refus d'une connexion (`1008`), annonces d'arrivée et de départ ;
- variante (`projet2/`) : RxJS côté navigateur pour l'indicateur « alice écrit… », une autre mise en application des flux réactifs, couplée au WebSocket.

## Projet

Le projet est dans `projet/` :

```
projet/
  docker-compose.yml   # un service Node 26, port 3000
  package.json         # dépendance ws
  server.js            # serveur HTTP (page) et serveur WebSocket sur le même port
  public/index.html    # page du chat : pseudo, liste des messages, formulaire d'envoi
```

La variante est dans `projet2/` (même structure) : `package.json` ajoute `rxjs`, `server.js` sert en plus `/rxjs.js`, `public/index.html` ajoute l'indicateur de frappe avec RxJS, `public/index2.html` le même comportement sans RxJS (pour comparer).

## Déroulé détaillé

### 1. Lancer le serveur

```bash
cd projet
docker compose up
```

→ Après le `npm install`, la console affiche :

```
Chat sur http://localhost:3000
```

### 2. Lire `server.js` puis `index.html`

* `server.js` : `createServer` sert la page, `new WebSocketServer({ server })` partage son port ; sur `connection`, deux écouteurs : `message` (relais à tous les clients ouverts) et `close` ;
* le serveur ne lit pas le contenu des messages : il relaie le texte reçu tel quel ;
* `index.html` : `new WebSocket(...)`, `onopen`, `onmessage`, `onclose`, et `socket.send` dans le formulaire.

### 3. Ouvrir deux onglets

Ouvrir `http://localhost:3000` dans deux onglets, côte à côte, avec deux pseudos (`alice`, `bob`) :

→ Les deux onglets affichent « connecté en tant que … » ; la console du serveur affiche :

```
connexion ouverte, 1 connecté(s)
connexion ouverte, 2 connecté(s)
```

Envoyer un message dans chaque onglet :

→ Le message apparaît **dans les deux onglets**, auteur compris (le serveur renvoie à tout le monde) ; la console affiche :

```
reçu : {"name":"alice","text":"bonjour"}
reçu : {"name":"bob","text":"salut"}
```

### 4. Regarder la connexion dans le navigateur

Outils de développement, onglet Réseau, filtre « WS », recharger un onglet :

* la requête d'ouverture : statut `101 Switching Protocols`, en-têtes `Upgrade: websocket` et `Sec-WebSocket-Accept` ;
* l'onglet « Messages » : trames envoyées et reçues, dans les deux sens, sur la même connexion.

### 5. Fermer un onglet, puis couper le serveur

Fermer l'onglet de `bob` :

→ La console affiche `connexion fermée, 1 connecté(s)` : le serveur tient le compte des connexions (communication stateful).

Puis, dans un autre terminal :

```bash
docker compose restart
```

→ L'onglet restant affiche « déconnecté » et **reste déconnecté** une fois le serveur relancé : il faut recharger la page. Comparer avec la démo SSE, où `EventSource` se reconnectait seul.

### 6. Arrêter

`Ctrl + C`, puis :

```bash
docker compose down
```

### 7. Variante : « alice écrit… » avec RxJS (`projet2/`)

```bash
cd ../projet2
docker compose up
```

→ Même console que l'étape 1 : `Chat sur http://localhost:3000`.

Lire `public/index.html` :

* deux types de messages sur la même connexion : `{"type":"typing","name":…}` et `{"type":"message","name":…,"text":…}` ; le serveur ne change pas, il relaie toujours sans lire ;
* émetteur : `fromEvent(input, 'input')` puis `throttleTime(1000)` : une frappe par lettre, mais au plus un `typing` par seconde sur le réseau ;
* récepteur : `fromEvent(socket, 'message')` fait de la socket un Observable ;
* `groupBy` sur le pseudo : un flux par utilisateur, chacun avec son propre délai ;
* `switchMap` + `timer(2000)` : chaque `typing` annule le délai en cours et en relance un ; sans frappe pendant 2 s, l'indicateur s'éteint ; un `message` l'éteint tout de suite ;
* `scan` : tient l'ensemble des pseudos qui écrivent, affiché sous la liste.

Ouvrir trois onglets (`alice`, `bob`, `carol`), taper dans `alice` sans envoyer :

→ `bob` et `carol` affichent « alice écrit… » ; `alice` n'affiche rien pour elle-même.

Taper aussi dans `carol` :

→ `bob` affiche « alice, carol écrivent… ».

Arrêter de taper :

→ L'indicateur disparaît environ 2 s après la dernière frappe. Envoyer un message l'efface immédiatement.

La console montre le débit limité par `throttleTime` :

```
reçu : {"type":"typing","name":"alice"}
reçu : {"type":"typing","name":"alice"}
reçu : {"type":"message","name":"alice","text":"bonjour"}
```

Comparer avec la même page **sans RxJS**, `http://localhost:3000/index2.html` (un onglet de chaque version fonctionne ensemble : même protocole) :

| Besoin | `index2.html` (sans RxJS) | `index.html` (RxJS) |
| --- | --- | --- |
| Au plus 1 `typing` par seconde | variable `lastSent` et `Date.now()` | `throttleTime(1000)` |
| Un délai par utilisateur | `Map` pseudo → id de minuteur | `groupBy` |
| Relancer le délai à chaque frappe | `clearTimeout` puis `setTimeout` | `switchMap` + `timer` |
| Pseudos qui écrivent | `Map` modifiée à la main, puis `renderTyping()` | `scan` |

* sur ce cas simple, les deux versions ont une longueur proche : RxJS ne fait pas gagner de lignes, il remplace l'état et les minuteurs écrits à la main par un pipeline qui se lit de haut en bas ;
* l'intérêt apparaît quand le besoin change : ajouter un anti-rebond, ignorer des utilisateurs, regrouper deux sources d'événements. Avec RxJS, c'est un opérateur de plus ; à la main, il faut revoir la logique des minuteurs et de l'état.

Arrêter avec `Ctrl + C`, puis `docker compose down`.

## Piège à éviter

Ne pas ajouter les salles, la validation ou les annonces : c'est exactement le travail du TP 5. La démo reste à une salle et dure 10 minutes. Le port `3000` est aussi celui des TP : arrêter la démo avant de lancer le TP 5.
