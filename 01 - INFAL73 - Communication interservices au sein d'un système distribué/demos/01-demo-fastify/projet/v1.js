// Données en mémoire, perdues à l'arrêt du serveur
const notes = [
  { id: 1, title: 'Acheter du café' },
  { id: 2, title: 'Préparer la démo' },
];

// Corps attendu pour créer une note : { "title": "..." }
const newNoteSchema = {
  type: 'object',
  required: ['title'],
  properties: {
    title: { type: 'string', minLength: 1 },
  },
};

// Routes de l'API v1, enregistrées par server.js sous le préfixe /v1
export async function v1(app) {
  // Liste : le handler async renvoie une valeur, Fastify la sérialise en JSON (200)
  app.get('/notes', async () => {
    return notes;
  });

  // Une note : 404 si l'identifiant est inconnu
  app.get('/notes/:id', async (request, reply) => {
    const note = notes.find((n) => n.id === Number(request.params.id));
    if (!note) {
      reply.code(404);
      return { error: `Note ${request.params.id} introuvable` };
    }
    return note;
  });

  // Création : le schéma est vérifié avant le handler (400 sinon), puis 201 et Location
  app.post('/notes', { schema: { body: newNoteSchema } }, async (request, reply) => {
    const note = { id: notes.length + 1, title: request.body.title };
    notes.push(note);
    reply.code(201).header('Location', `/v1/notes/${note.id}`);
    return note;
  });
}
