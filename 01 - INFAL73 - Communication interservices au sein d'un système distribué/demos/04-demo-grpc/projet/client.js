import grpc from '@grpc/grpc-js';
import { Thermostat } from './proto.js';

// Mesures successives du capteur simulé, une par seconde
const SAMPLES = [20.5, 21.8, 23.4, 24.1, 22.6, 20.2, 18.7, 18.1, 19.6, 21.0];

// Adresse du serveur : thermostat est le nom du service dans docker-compose.yml, résolu par le réseau Docker
// (le serveur écoute sur 0.0.0.0, toutes ses interfaces ; le client doit, lui, nommer la machine à joindre)
const client = new Thermostat('thermostat:50051', grpc.credentials.createInsecure());

// Ouvre le flux bidirectionnel : call sert à écrire les mesures et à lire les consignes
const call = client.regulate();

// 'data' : une consigne reçue, à n'importe quel moment, pendant que le capteur continue d'envoyer
call.on('data', (instruction) => {
  console.log(`  [capteur] consigne reçue : ${instruction.action} vers ${instruction.target} °C`);
});

// 'end' : le thermostat a fermé son flux de réponse, l'échange est terminé
call.on('end', () => console.log('[capteur] flux fermé par le thermostat'));

// 'error' : serveur absent ou connexion coupée
call.on('error', (error) => console.log(`[capteur] erreur : ${error.details}`));

// Une mesure par seconde ; après la dernière, le capteur ferme son flux d'envoi (call.end)
let i = 0;
const timer = setInterval(() => {
  if (i === SAMPLES.length) {
    clearInterval(timer);
    console.log('[capteur] plus de mesures, fermeture du flux d\'envoi');
    call.end();
    return;
  }
  console.log(`[capteur] envoi ${SAMPLES[i].toFixed(1)} °C`);
  call.write({ sensorId: 'salon', celsius: SAMPLES[i] });
  i++;
}, 1000);
