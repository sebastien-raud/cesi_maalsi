import grpc from '@grpc/grpc-js';
import { track } from './fleet.js';
import { Tracking } from './proto.js';

// Crée le serveur gRPC sans le démarrer : server.js l'écoute sur le port 50051, les tests sur un port libre
export function buildServer() {
  const server = new grpc.Server();
  // Une fonction par méthode du service, sous le nom de la méthode du .proto
  server.addService(Tracking.service, { track });
  return server;
}

// Démarre le serveur sur une adresse ; renvoie le port réellement ouvert (utile avec le port 0)
export function listen(server, address) {
  return new Promise((resolve, reject) => {
    server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (error, port) => {
      if (error) {
        reject(error);
      } else {
        resolve(port);
      }
    });
  });
}
