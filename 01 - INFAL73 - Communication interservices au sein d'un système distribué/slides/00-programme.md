---
title: Programme du module
---

# INFAL73 · Communication interservices

Choisir et mettre en œuvre le bon modèle de communication entre services

<!-- Fil rouge : Colibri, livraison de colis (présentation 01-colibri). Tout tourne dans Docker Compose. -->

---

## Programme

- **Différencier** les modèles de communication : synchrone bloquant, synchrone non bloquant, asynchrone
- **Évaluer** leurs forces et faiblesses : couplage, performance, fiabilité, interopérabilité, sécurité
- **Mettre en œuvre** REST, flux réactifs, gRPC, WebSocket, messagerie
- **Choisir** et justifier un modèle pour un besoin donné
- Fil rouge : **Colibri**, livraison de colis à vélo cargo

---

## Jour 1

- Modèles de communication interservices
- REST : HTTP, modèle de Richardson, REST vs SOAP
- API REST avec Fastify, puis HATEOAS et versions d'API
- Introduction à la programmation réactive

---

## Jour 2

- Flux réactif non bloquant (SSE)
- gRPC : HTTP/2, Protobuf, streaming bidirectionnel
- SSE, WebSocket et webhook

---

## Jour 3

- Systèmes de messagerie, RabbitMQ
- Queue, acquittement, dead-letter queue, request-reply
- Publish/subscribe, Kafka
- Garanties de livraison, retour sur les choix
