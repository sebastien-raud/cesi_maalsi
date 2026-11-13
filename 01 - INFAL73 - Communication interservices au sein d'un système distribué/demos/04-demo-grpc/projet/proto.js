import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

// Chargement dynamique du contrat au démarrage, sans génération de code
// keepCase: false : les champs passent en camelCase (sensor_id devient sensorId côté JavaScript)
// defaults: true : un champ absent du message reçu prend sa valeur par défaut (0, '') au lieu d'undefined
const definition = protoLoader.loadSync(new URL('proto/thermostat.proto', import.meta.url).pathname, {
  keepCase: false,
  defaults: true,
});

// Service Thermostat du package demo : Thermostat.service pour le serveur, new Thermostat(...) pour le client
export const { Thermostat } = grpc.loadPackageDefinition(definition).demo;
