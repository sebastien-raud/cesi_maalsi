# Démo : SSE, un flux de citations

## Objectif

Montrer, au début du TP 3, ce qu'est un flux SSE (*Server-Sent Events*) : une requête HTTP dont la réponse ne se termine pas, dans laquelle le serveur écrit un événement quand il le veut. Exemple générique : un serveur Fastify qui pousse une citation d'informatique toutes les 5 secondes, une page web qui les affiche avec `EventSource`.

## Points clés à faire passer

- le client ouvre une requête `GET` ordinaire ; le serveur répond `200` avec `content-type: text/event-stream` et ne ferme jamais la réponse ;
- le format est du texte : un événement = des lignes `champ: valeur` (`id`, `data`), terminées par une ligne vide ;
- un seul sens : le serveur pousse, le client ne peut rien envoyer sur cette connexion (il faudrait une autre requête) ;
- `reply.hijack()` : Fastify laisse la main, on écrit soi-même dans `reply.raw` (même geste qu'au TP 3) ;
- côté navigateur, `EventSource` se reconnecte seul après une coupure, au bout du délai `retry`, et renvoie l'en-tête `Last-Event-ID` : le serveur reprend au bon endroit ;
- client parti : arrêter l'envoi (`close` sur la requête), sinon le minuteur tourne pour rien ;
- la back-pressure (`drain`) et l'arrêt par `AbortController` ne sont pas montrés ici : ils sont des étapes du TP 3.

## Projet

Le projet est dans `projet/` :

```
projet/
  docker-compose.yml   # un service Node 26, port 3000
  package.json         # dépendance fastify
  server.js            # page web sur /, flux SSE sur /quotes
  citations.json       # 14 citations, envoyées dans l'ordre puis en boucle
  public/index.html    # page qui affiche le flux avec EventSource
```

## Déroulé détaillé

### 1. Lancer le serveur

```bash
cd projet
docker compose up
```

→ Après le `npm install`, la console affiche :

```
{"level":30,...,"msg":"Server listening at http://127.0.0.1:3000"}
```

### 2. Lire `server.js`

* la route `/quotes` : `reply.hijack()`, `writeHead` avec `text/event-stream`, puis `write` à chaque citation ;
* le format d'un événement : `id: N`, `data: {...}` (JSON sur une seule ligne), ligne vide ;
* `retry: 2000` : délai de reconnexion demandé au navigateur ;
* `Last-Event-ID` lu au début, `clearInterval` sur `close` à la fin.

### 3. Voir le flux brut avec `curl`

Dans un autre terminal :

```bash
curl -N -i http://localhost:3000/quotes
```

→ Les en-têtes, puis un événement toutes les 5 secondes, sans fin :

```
HTTP/1.1 200 OK
content-type: text/event-stream
cache-control: no-cache
Connection: keep-alive
Transfer-Encoding: chunked

retry: 2000

id: 0
data: {"categorie":"Informatique et logique","auteur":"Alan Jay Perlis","citation":"En informatique, passer de l’évident à l’utile est une définition vivante du mot \"frustration\"."}

id: 1
data: {"categorie":"Informatique et logique","auteur":"Alan Jay Perlis",...}
```

`-N` désactive le tampon de `curl` : sans lui, les événements arrivent par paquets. `Ctrl + C` : la console du serveur affiche `abonné déconnecté`.

### 4. Ouvrir la page

Ouvrir `http://localhost:3000` dans le navigateur :

→ « connecté », une nouvelle citation toutes les 5 secondes, l'historique se remplit (`0 · Alan Jay Perlis`, `1 · Alan Jay Perlis`, …).

Dans les outils de développement, onglet Réseau, requête `quotes` : type `eventsource`, la requête reste en attente ; l'onglet « EventStream » liste les événements reçus avec leur `id`.

### 5. Couper le serveur

Dans un autre terminal :

```bash
docker compose restart
```

→ La page affiche « coupure, reconnexion… », puis « connecté » dès que le serveur répond, et l'historique reprend **à l'événement suivant**, sans trou ni doublon. Dans la console du serveur :

```
{"level":30,...,"lastId":"5","msg":"abonné connecté"}
```

Message : la reconnexion est gratuite côté client ; c'est au serveur d'exploiter `Last-Event-ID` pour reprendre au bon endroit.

### 6. Arrêter

`Ctrl + C`, puis :

```bash
docker compose down
```

## Piège à éviter

Ne pas laisser croire que SSE permet au client de répondre : pour un échange dans les deux sens (chat), c'est WebSocket (démo 05, TP 5). Le port `3000` est aussi celui des TP : arrêter la démo avant de lancer le TP 3.
