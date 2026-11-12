import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

// Adresse du service colis vue depuis le conteneur des clients (nom du service Docker Compose)
const parcels = process.env.PARCELS_URL ?? 'http://localhost:3000';

// Adresse du service de chat (TP 5), même principe
const chat = process.env.CHAT_URL ?? 'http://localhost:4000';

// Configuration du serveur de développement Vite
export default defineConfig({
  plugins: [svelte()],
  // Chat activé seulement si le TP lance un service de chat (CHAT_URL défini, TP 5) : sinon, aucune tentative de connexion
  define: {
    'import.meta.env.CHAT_ENABLED': JSON.stringify(Boolean(process.env.CHAT_URL)),
  },
  server: {
    // Écoute sur toutes les interfaces : joignable hors du conteneur
    host: true,
    port: 5173,
    // Le navigateur appelle /v1/... sur le même serveur que la page : pas de requête vers une autre origine, donc pas de CORS
    proxy: {
      '/v1': parcels,
      '/v2': parcels,
      // ws : le proxy transmet aussi la montée en protocole WebSocket
      '/chat': { target: chat, ws: true },
    },
  },
});
