import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

// Chargement dynamique du contrat, sans génération de code
// Les champs passent en camelCase (courier_id devient courierId), les int64 en nombres JavaScript
const definition = protoLoader.loadSync(new URL('../proto/tracking.proto', import.meta.url).pathname, {
  keepCase: false,
  longs: Number,
  defaults: true,
});

// Le service Tracking du package colibri, côté serveur (Tracking.service) et côté client (new Tracking(...))
export const { Tracking } = grpc.loadPackageDefinition(definition).colibri;
