# 🔗 Colibri : le projet des TP

![Node.js](https://img.shields.io/badge/Node.js-26-5FA04E?logo=nodedotjs&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Fastify](https://img.shields.io/badge/Fastify-5-000000?logo=fastify&logoColor=white)
![Svelte](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

Colibri livre des colis à vélo cargo. Son application a grandi trop vite : pendant trois jours, vous la découpez en services qui communiquent, en choisissant à chaque fois le bon modèle de communication.

# 📑 Sommaire

- 🔗 Le client [↗](#client)
- 🎯 Le cahier des charges [↗](#cahier)
- 🔄 Comment on travaille [↗](#fonctionnement)
- ✅ Prérequis [↗](#prerequis)

---

<a id="client"></a>
# 🔗 Le client

**Colibri** est une start-up lyonnaise de livraison du dernier kilomètre : elle récupère les colis de marchands en ligne et les livre aux particuliers, avec une flotte de livreurs à vélo cargo.

| Qui | Rôle | Ce qu'elle ou il attend de vous |
| --- | --- | --- |
| **Mona Bilité** | directrice technique | un système découpé en services, où chaque échange est justifié |
| **Rémi Fasol** | responsable des livreurs | suivre sa flotte en direct et prévenir ses livreurs sans les appeler |
| **Anne Onyme** | support client | moins d'appels du type « où est mon colis ? » |
| **Théo Courant** | gérant de Vélo Boutique, marchand partenaire | être prévenu quand ses colis partent, connaître le prix avant de vendre |

Ils vous écriront au début de chaque TP.

---

<a id="cahier"></a>
# 🎯 Le cahier des charges

| # | Besoin (user story) | TP |
| --- | --- | --- |
| 1 | En tant que **support client**, je veux qu'un client retrouve son colis par son numéro, afin de ne plus répondre au téléphone à cette question | TP1 |
| 2 | En tant que **directrice technique**, je veux que l'application mobile sache quelles actions proposer sans coder les règles métier, et que l'ancienne version continue de fonctionner | TP2 |
| 3 | En tant que **client**, je veux voir les étapes de mon colis arriver en direct, sans recharger la page | TP3 |
| 4 | En tant que **responsable des livreurs**, je veux suivre les positions de la flotte et renvoyer une tournée recalculée | TP4 |
| 5 | En tant que **client**, je veux écrire au livreur (code d'accès, lieu de dépôt), et qu'il me réponde | TP5 |
| 6 | En tant que **directrice technique**, je veux que la création d'un colis n'attende pas le géocodage de l'adresse | TP6 |
| 7 | En tant que **marchand**, je veux connaître le prix d'une livraison avant de valider une commande | TP7 |
| 8 | En tant que **directrice technique**, je veux que la facturation, les notifications et les statistiques réagissent à chaque livraison, sans que le service colis les connaisse | TP8 |

Contraintes :

- tout tourne dans Docker : aucune installation de Node.js sur votre machine ;
- les écrans web (client, livreur, central, marchand) sont fournis : vous écrivez la partie communication côté serveur, pas l'interface ;
- les données sont en mémoire : elles repartent de zéro à chaque redémarrage d'un service.

---

<a id="fonctionnement"></a>
# 🔄 Comment on travaille

- Un TP = un service ou un échange de Colibri, dans un dossier `NN-nom/` :
  - `README.md` : l'énoncé (le mail du jour, le travail demandé, les pièges à éviter) ;
  - `01-depart/` : le code de départ, complet et autonome ; un TP non terminé ne bloque pas le suivant ;
  - `02-corrige/` : une solution possible, à ouvrir **après** avoir essayé.
- Chaque TP se lance avec `docker compose up` depuis son dossier `01-depart/` ; lancer un TP arrête les conteneurs du précédent.
- Les écrans web sont dans `clients/`, partagés par tous les TP : [http://localhost:5173](http://localhost:5173).
- Le système entier, à partir des corrigés, se lance depuis [`systeme-complet/`](systeme-complet/).
- Des tests automatiques sont fournis : `docker compose exec parcels npm test` indique ce qui fonctionne déjà. Vous n'avez pas à en écrire.
- Dans les énoncés, des aides se déplient au besoin, du plus léger au plus détaillé : 💡 un indice, puis 🆘 la solution de l'étape. Cherchez d'abord, dépliez ensuite.

---

<a id="prerequis"></a>
# ✅ Prérequis

- Docker et Docker Compose fonctionnels (`docker compose version`) ;
- VS Code ;
- [Bruno](https://www.usebruno.com/), en application ou en extension VS Code, pour tester les API (ou l'extension REST Client) ;
- un navigateur récent (Firefox, Chrome ou Edge).
