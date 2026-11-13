// Envoie une erreur au format unique de l'API, repris de la RFC 9457 (Problem Details for HTTP APIs) :
// { type, title, status, detail }, avec le code HTTP et le type de contenu adaptés
export function sendProblem(reply, status, title, detail) {
  return reply.code(status).type('application/problem+json').send({ type: 'about:blank', title, status, detail });
}
