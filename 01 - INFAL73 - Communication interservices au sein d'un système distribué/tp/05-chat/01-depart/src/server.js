import { startChat } from './app.js';

// Serveur de chat, joignable sur ws://localhost:4000/chat
await startChat(4000);
console.log('Chat à l\'écoute sur ws://localhost:4000/chat');
