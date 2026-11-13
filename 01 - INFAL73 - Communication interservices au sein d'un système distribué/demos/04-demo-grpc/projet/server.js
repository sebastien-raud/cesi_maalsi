import grpc from '@grpc/grpc-js';
import { Thermostat } from './proto.js';

// Plage de confort : en dehors, le thermostat envoie une consigne
const MIN = 19;
const MAX = 23;
const TARGET = 21;

// Implémentation de Regulate : appelée une fois par capteur qui ouvre le flux
// call est un flux dans les deux sens : on lit les mesures (call.on), on écrit des consignes (call.write)
function regulate(call) {
  console.log('[thermostat] capteur connecté');

  // 'data' : une mesure reçue ; le thermostat répond seulement si elle sort de la plage,
  // il n'y a donc pas une réponse par message comme en requête / réponse
  call.on('data', (measure) => {
    console.log(`[thermostat] reçu ${measure.celsius.toFixed(1)} °C de ${measure.sensorId}`);
    if (measure.celsius < MIN) {
      call.write({ action: 'CHAUFFER', target: TARGET });
    } else if (measure.celsius > MAX) {
      call.write({ action: 'REFROIDIR', target: TARGET });
    }
  });

  // 'end' : le capteur a fermé son flux d'envoi ; le thermostat ferme le sien à son tour
  call.on('end', () => {
    console.log('[thermostat] capteur déconnecté, fermeture du flux');
    call.end();
  });
}

// Serveur gRPC : on associe l'implémentation au service décrit dans le .proto
const server = new grpc.Server();
server.addService(Thermostat.service, { regulate });

// 0.0.0.0:50051 : écoute hors du conteneur ; createInsecure : sans TLS, réservé au développement
server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), (error) => {
  if (error) throw error;
  console.log('[thermostat] en écoute sur le port 50051');
});
