# Démo : gRPC en streaming bidirectionnel

## Objectif

Montrer un appel gRPC bidirectionnel de bout en bout : le contrat `.proto`, son chargement dynamique, un serveur et un client qui écrivent chacun dans leur flux, indépendamment l'un de l'autre. Exemple générique : un capteur de température envoie une mesure par seconde à un thermostat, qui renvoie une consigne seulement quand la mesure sort de la plage de confort. Le TP 4 applique le même schéma aux positions des livreurs de Colibri.

## Points clés à faire passer

- le `.proto` est le contrat : service, méthode, messages, numéros de champ ; serveur et client le chargent tous les deux ;
- `stream` des deux côtés de `rpc Regulate (stream Measure) returns (stream Instruction)` : un seul appel ouvre deux flux ;
- les deux flux sont **indépendants** : le thermostat ne répond pas à chaque mesure, il écrit quand il a quelque chose à dire ;
- même API des deux côtés : `call.write(...)` pour envoyer, `call.on('data', ...)` pour recevoir, `call.end()` pour fermer son propre flux ;
- fermeture en deux temps : le capteur ferme son flux d'envoi (`end` côté serveur), puis le serveur ferme le sien (`end` côté client) ;
- les champs `snake_case` du `.proto` deviennent `camelCase` en JavaScript (`sensor_id` devient `sensorId`), à cause de l'option `keepCase: false`.

## Projet

Le projet est dans `projet/` :

```
projet/
  docker-compose.yml        # deux services : thermostat (serveur) et sensor (client)
  package.json              # dépendances @grpc/grpc-js et @grpc/proto-loader
  proto/thermostat.proto    # le contrat
  proto.js                  # chargement du contrat, partagé par serveur et client
  server.js                 # thermostat : lit les mesures, écrit des consignes
  client.js                 # capteur : écrit 10 mesures, lit les consignes
```

## Déroulé détaillé

### 1. Lire le contrat

Ouvrir `proto/thermostat.proto` : le service `Thermostat`, sa méthode `Regulate` avec `stream` des deux côtés, les messages `Measure` et `Instruction`. Rappeler le rôle des numéros de champ (compatibilité quand le contrat évolue).

### 2. Lire `proto.js`, `server.js` puis `client.js`

* `proto.js` : `loadSync` lit le `.proto` au démarrage, sans génération de code ; options `keepCase` et `defaults` ;
* `server.js` : `regulate(call)` est appelée une fois par capteur connecté ; `call.on('data')` reçoit les mesures, `call.write` envoie une consigne seulement hors de la plage 19 à 23 °C ;
* `client.js` : `client.regulate()` ouvre le flux ; `setInterval` écrit une mesure par seconde ; `call.on('data')` affiche les consignes reçues pendant ce temps.

### 3. Lancer

```bash
cd projet
docker compose up
```

Le capteur attend que le thermostat soit prêt (dépendances installées, port ouvert), puis la console mélange les deux services :

```
thermostat-1  | [thermostat] en écoute sur le port 50051
thermostat-1  | [thermostat] capteur connecté
sensor-1      | [capteur] envoi 20.5 °C
thermostat-1  | [thermostat] reçu 20.5 °C de salon
sensor-1      | [capteur] envoi 21.8 °C
thermostat-1  | [thermostat] reçu 21.8 °C de salon
sensor-1      | [capteur] envoi 23.4 °C
thermostat-1  | [thermostat] reçu 23.4 °C de salon
sensor-1      |   [capteur] consigne reçue : REFROIDIR vers 21 °C
...
sensor-1      |   [capteur] consigne reçue : CHAUFFER vers 21 °C
...
sensor-1      | [capteur] plus de mesures, fermeture du flux d'envoi
thermostat-1  | [thermostat] capteur déconnecté, fermeture du flux
sensor-1      | [capteur] flux fermé par le thermostat
sensor-1 exited with code 0
```

Faire remarquer :

* 10 mesures envoyées, 4 consignes reçues seulement (`23.4`, `24.1`, `18.7`, `18.1`) : ce n'est pas du requête / réponse ;
* la consigne arrive pendant que le capteur continue d'envoyer : les deux flux vivent en parallèle sur la même connexion HTTP/2 ;
* les trois dernières lignes : la fermeture en deux temps.

La ligne `npm warn install-scripts ... protobufjs` au démarrage est un avertissement de npm sur les scripts d'installation, sans conséquence ici.

### 4. Arrêter

`Ctrl + C`, puis :

```bash
docker compose down
```

## Piège à éviter

Ne pas confondre streaming bidirectionnel et suite de requêtes / réponses : insister sur les mesures sans consigne. Ne pas entrer dans la génération de code (`protoc`) : le chargement dynamique suffit ici et au TP 4. Rester à un seul capteur : plusieurs clients simultanés sont l'objet du TP 4 (plusieurs livreurs).
