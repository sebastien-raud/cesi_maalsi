# Démo : Fastify et une API REST simple

## Objectif

Montrer, avant le TP 1, les gestes Fastify dont le TP a besoin : regrouper les routes d'une version dans un plugin préfixé `/v1`, déclarer une route, renvoyer une valeur depuis un handler `async`, choisir le code et les en-têtes de la réponse, valider le corps par un schéma JSON. Exemple générique : une API de notes en mémoire, sans lien avec Colibri. Même découpage que le TP 1 (`v1.js` enregistré avec `app.register(v1, { prefix: '/v1' })`).

## Points clés à faire passer

- les routes d'une version vivent dans une fonction `v1(app)` (un plugin) ; `app.register(v1, { prefix: '/v1' })` préfixe toutes ses URL : la v2 du TP 2 s'ajoutera à côté sans toucher la v1 ;
- un handler `async` renvoie une valeur : Fastify la sérialise en JSON, code `200` par défaut ;
- `reply.code(...)` et `reply.header(...)` règlent la réponse, la valeur renvoyée reste le corps ;
- le schéma JSON de la route est vérifié **avant** le handler : un corps invalide n'atteint jamais le code métier (`400` renvoyé par Fastify) ;
- le logger trace chaque requête et sa réponse : la communication reste visible ;
- le gestionnaire d'erreurs centralisé et le `422` ne sont pas montrés ici : ils sont une étape du TP 1.

## Projet

Le projet est dans `projet/` :

```
projet/
  docker-compose.yml   # un service Node 26, port 3000
  package.json         # dépendance fastify
  server.js            # crée l'application, enregistre la v1 sous /v1, écoute le port 3000
  v1.js                # données, schéma et routes de l'API v1
  notes.http           # requêtes à lancer avec l'extension REST Client de VS Code
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

`node --watch` relance le serveur à chaque enregistrement d'un fichier.

### 2. Lire `server.js` puis `v1.js`

* `server.js` : création de l'application avec `logger: true`, `app.register(v1, { prefix: '/v1' })`, `app.listen` ; insister sur `host: '0.0.0.0'`, nécessaire dans un conteneur ;
* `v1.js` : tableau `notes`, schéma `newNoteSchema`, puis la fonction `v1(app)` et ses trois routes, écrites sans préfixe (`/notes`) : c'est `register` qui ajoute `/v1`.

### 3. Lancer les requêtes de `notes.http`

Ouvrir `notes.http` dans VS Code et cliquer sur « Send Request » au-dessus de chaque requête :

| Requête | Résultat |
| --- | --- |
| 1. `GET /v1/notes` | `200`, les deux notes |
| 2. `GET /v1/notes/1` | `200`, `{"id":1,"title":"Acheter du café"}` |
| 3. `GET /v1/notes/99` | `404`, `{"error":"Note 99 introuvable"}` |
| 4. `POST /v1/notes` | `201`, en-tête `location: /v1/notes/3`, la note créée |
| 5. `POST /v1/notes` sans `title` | `400`, `"message":"body must have required property 'title'"` |
| 6. `GET /notes` (sans préfixe) | `404`, `"message":"Route GET:/notes not found"` |

À chaque requête, montrer dans la console les deux lignes du logger (`incoming request`, puis `request completed` avec `statusCode`).

Pour la requête 5, souligner que le handler n'a pas été appelé : le schéma a bloqué la requête. Le format de cette erreur est celui de Fastify ; au TP 1, un gestionnaire d'erreurs le remplace par le format commun `application/problem+json` et le code `422`.

Pour la requête 6, distinguer les deux `404` : la requête 3 vient du handler (note inconnue), la requête 6 de Fastify (aucune route ne correspond, le préfixe manque). Au TP 1, `app.setNotFoundHandler` donne aux deux le même format.

### 4. Montrer le piège du `return` oublié

Dans `v1.js`, route `GET /notes/:id`, retirer le `return` de la dernière ligne (`note;` au lieu de `return note;`), enregistrer, relancer la requête 2 :

→ `200` avec un **corps vide**, sans aucune erreur dans la console.

Remettre le `return`. Message : dans un handler `async`, c'est la valeur renvoyée qui fait la réponse ; ne pas mélanger avec `reply.send(...)` (si les deux sont utilisés, la console affiche l'avertissement `Reply was already sent, did you forget to "return reply"`).

### 5. Arrêter

`Ctrl + C`, puis :

```bash
docker compose down
```

## Piège à éviter

Ne pas construire ici le gestionnaire d'erreurs ni les statuts de colis : la démo reste générique et courte (10 minutes), le TP 1 applique les mêmes gestes au fil rouge. Le port `3000` est aussi celui des TP : arrêter la démo avant de lancer le TP 1.
