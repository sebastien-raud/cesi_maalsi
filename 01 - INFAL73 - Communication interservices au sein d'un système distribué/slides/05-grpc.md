---
title: gRPC
---

# gRPC

Appeler un service distant comme une fonction

---

## L'idée du RPC

<img class="schema h-80" src="./pubic/grpc-stub.svg" alt="Le code client appelle un stub, qui passe par le réseau en HTTP/2 et Protobuf jusqu'au serveur gRPC et à l'implémentation">

RPC : Remote Procedure Call, **appel de procédure distante**

<!-- Le réseau est caché derrière une fonction : pratique, mais les sophismes du distribué (jour 1) restent vrais. Un appel distant peut échouer, être lent, ou arriver deux fois. -->

---

## Historique du RPC

<img class="schema h-130" src="./pubic/grpc-historique.svg" alt="Frise de 1976 à 2015 : RFC 707, thèse de Nelson, Xerox PARC, Sun RPC, CORBA, Java RMI, XML-RPC, Stubby, gRPC">

<!--
Une idée presque aussi ancienne que les réseaux : appeler du code distant comme du code local.

- 1976 : sur ARPANET, James White propose d'appeler des procédures à distance plutôt que d'envoyer des commandes textuelles.
- 1981 et 1984 : Nelson nomme et définit le RPC ; avec Birrell, premier RPC complet chez Xerox PARC.
- 1988 : Sun RPC (RFC 1057), toujours utilisé par NFS.
- 1991 à 1998 : la vague des objets distants (CORBA, Java RMI), puis le RPC en XML sur HTTP (XML-RPC, SOAP).
- 2001 : Stubby, le RPC interne de Google ; Protocol Buffers devient open source en 2008, Thrift (Facebook) en 2007.
- 2015 : gRPC, la version ouverte de Stubby ; 1.0 en 2016, rejoint la CNCF (la fondation de Kubernetes) en 2017.

Le « g » ne veut pas dire Google : chaque version lui donne un sens différent (good, green, glorious...).
-->

---

## RPC ou REST

<div class="text-[30px]">

| Critère | REST | gRPC |
| --- | --- | --- |
| Modèle | ressources et verbes | procédures à appeler |
| Contrat | facultatif (OpenAPI) | obligatoire (`.proto`) |
| Format | texte (JSON) | binaire (Protobuf) |
| Transport | HTTP/1.1 ou HTTP/2 | HTTP/2 |
| Échanges | requête, réponse | requête, réponse et flux |
| Navigateur | natif | passerelle nécessaire |

</div>

---

## Ce qu'apporte HTTP/2

<img class="schema h-120" src="./pubic/grpc-http2.svg" alt="En HTTP/1.1, une requête à la fois par connexion ; en HTTP/2, les trames de plusieurs flux s'entrelacent sur une seule connexion">

**Multiplexage**, trames binaires, en-têtes compressés (HPACK)

<!-- Trame pleine : requête ; trame vide : réponse. Un flux HTTP/2 peut rester ouvert longtemps dans les deux sens : c'est la base du streaming gRPC. -->

---

## Le contrat : un fichier `.proto`

```protobuf {all|4-6|8-11}
syntax = "proto3";
package meteo;

service Weather {
  rpc GetForecast (CityRequest) returns (Forecast);
}

message Forecast {
  string city = 1;
  double celsius = 2;
}
```

Un même contrat pour des services écrits dans **des langages différents**

<!-- Le .proto est soit compilé (protoc génère du code), soit chargé au démarrage (proto-loader en Node.js, sans génération). -->

---

## Le même message, deux formats

<img class="schema h-80" src="./pubic/grpc-protobuf.svg" alt="Le message JSON fait 33 octets ; le même en Protobuf fait 13 octets, chaque champ repéré par son numéro">

Les **noms** de champs ne voyagent pas, seulement leurs **numéros**

<!-- 0a : champ 1, de type longueur variable ; 11 : champ 2, de type 64 bits. Plus compact et plus rapide à lire, mais illisible sans le .proto. -->

---

## Faire évoluer le contrat

- **Ajouter** un champ avec un nouveau numéro : sans risque
- Un ancien client **ignore** les champs qu'il ne connaît pas
- Un champ absent prend sa **valeur par défaut** (`0`, `""`)
- Ne **jamais** changer ni réutiliser un numéro : `reserved 3;`

<!-- La compatibilité vient des numéros, pas des noms : on peut renommer un champ sans casser les échanges, pas le renuméroter. -->

---

## Quatre modes d'appel

<img class="schema h-120" src="./pubic/grpc-modes.svg" alt="Unary : une requête, une réponse. Server streaming : une requête, plusieurs réponses. Client streaming : plusieurs requêtes, une réponse. Bidirectionnel : deux flux indépendants">

---

## Les quatre modes dans le `.proto`

```protobuf
service Weather {
  rpc GetForecast (CityRequest) returns (Forecast);
  rpc WatchAlerts (CityRequest) returns (stream Alert);
  rpc UploadMeasures (stream Measure) returns (Summary);
  rpc Regulate (stream Measure) returns (stream Instruction);
}
```

Le mot-clé **`stream`** suffit

<!-- Unary : une prévision. Server streaming : les alertes d'une ville. Client streaming : un lot de mesures, un bilan. Bidirectionnel : des mesures, des consignes en retour. -->

---

## Côté serveur

```js {all|1-7|9-11}
function getForecast(call, callback) {
  const celsius = forecasts[call.request.city];
  if (celsius === undefined) {
    return callback({ code: grpc.status.NOT_FOUND, details: 'ville inconnue' });
  }
  callback(null, { city: call.request.city, celsius });
}

const server = new grpc.Server();
server.addService(Weather.service, { getForecast });
server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {});
```

<!-- `Weather` vient du .proto chargé avec @grpc/proto-loader. `createInsecure` : sans TLS, pour le développement seulement. -->

---

## Côté client

```js
const weather = new Weather('localhost:50051', grpc.credentials.createInsecure());

weather.getForecast({ city: 'Lyon' }, { deadline: Date.now() + 1000 }, (error, forecast) => {
  if (error) return console.error(grpc.status[error.code], error.details);
  console.log(`${forecast.city} : ${forecast.celsius} °C`);
});
```

**Deadline** : passé 1 s, erreur `DEADLINE_EXCEEDED`

---

## Les flux en Node.js

<div class="text-[30px]">

| Mode | Côté serveur |
| --- | --- |
| Server streaming | `call.request`, puis `call.write()` et `call.end()` |
| Client streaming | `call.on('data')`, puis `callback()` sur `end` |
| Bidirectionnel | `call.on('data')` et `call.write()`, `call.end()` sur `end` |

</div>

Côté client, le même objet : un flux qu'on **lit** et où l'on **écrit**

<!-- Fin de flux : `end` pour une fermeture normale, `cancelled` côté serveur quand le client coupe. Les deux flux d'un appel bidirectionnel se ferment chacun de leur côté. -->

---

## Codes d'état

<div class="text-[30px]">

| Code | Sens | Équivalent HTTP |
| --- | --- | --- |
| `OK` | succès | `200` |
| `INVALID_ARGUMENT` | requête invalide | `400` |
| `NOT_FOUND` | ressource absente | `404` |
| `DEADLINE_EXCEEDED` | délai dépassé | `504` |
| `UNAVAILABLE` | service injoignable, à réessayer | `503` |

</div>

<!-- La réponse HTTP/2 est toujours un 200 : le code gRPC voyage dans l'en-tête de fin `grpc-status`. -->

---

## gRPC et le navigateur

- Le navigateur ne contrôle pas assez **les trames HTTP/2**
- **gRPC-Web** : un proxy (Envoy) traduit entre les deux
- Pas de streaming client ni bidirectionnel
- En pratique : gRPC **entre services**, REST ou SSE vers le navigateur

<!-- Autre option : Connect (Buf), compatible gRPC et utilisable en HTTP simple depuis le navigateur. -->

---

## Forces et limites

<div class="grid grid-cols-2 gap-10">
<div>

**Forces**

- rapide et compact
- contrat fort, clients générés
- streaming dans les deux sens
- deadlines, codes d'erreur

</div>
<div>

**Limites**

- illisible sans outil
- navigateur via passerelle
- couplage au contrat
- débogage plus difficile

</div>
</div>

<!-- Outils : grpcurl en ligne de commande, Bruno ou Postman en interface. -->

---

## À retenir

- Un **contrat** `.proto` d'abord, le code ensuite
- **Protobuf** : binaire, champs repérés par leur numéro
- **HTTP/2** : une connexion, des flux multiplexés
- **Quatre modes**, du simple appel au flux bidirectionnel
- Pour les échanges **entre services**, pas pour le navigateur

---

## Des questions ?

---

## Sources

- [gRPC, concepts](https://grpc.io/docs/what-is-grpc/core-concepts/) · [gRPC pour Node.js](https://grpc.io/docs/languages/node/) · [Codes d'état gRPC](https://grpc.io/docs/guides/status-codes/)
- [Protocol Buffers](https://protobuf.dev/overview/) · [Encodage](https://protobuf.dev/programming-guides/encoding/)
- [HTTP/2 (MDN)](https://developer.mozilla.org/fr/docs/Glossary/HTTP_2) · [gRPC-Web](https://github.com/grpc/grpc-web)
- Birrell et Nelson, *Implementing Remote Procedure Calls*, ACM, 1984
