// Consommation de l'API REST du service colis (TP 1 et TP 2)
// Les URL sont relatives : le serveur Vite relaie /v1 et /v2 vers le service colis (voir vite.config.js)

// Colis renvoyé par l'API : { id, merchant, recipient, address: { street, postalCode, city }, status, updatedAt }
// En v2, il porte aussi _links : { nom: { href, method } }, les actions proposées par le serveur (HAL)

// Erreur levée par les fonctions de ce module : message = titre, plus le code HTTP et le détail
export class ApiError extends Error {
  constructor(title, status, detail) {
    super(title);
    this.status = status;
    this.detail = detail;
  }
}

// Appel HTTP commun : renvoie le JSON reçu, ou lève une ApiError (réseau, code d'erreur)
async function request(url, init) {
  let response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new ApiError('Service colis injoignable', 0);
  }
  if (!response.ok) {
    const type = response.headers.get('content-type') ?? '';
    // Erreur au format problème (RFC 9457) ; à défaut (format par défaut de Fastify), le champ message
    if (type.includes('json')) {
      const body = await response.json();
      throw new ApiError(body.title ?? body.message ?? 'Erreur', response.status, body.detail);
    }
    // Panne sans corps exploitable : service arrêté, relais en échec
    throw new ApiError('Service colis indisponible', response.status);
  }
  return response.json();
}

// Un colis par son numéro, en v1 ou en v2 (version : 'v1' ou 'v2')
export function getParcel(version, id) {
  return request(`/${version}/parcels/${encodeURIComponent(id)}`);
}

// Liste des colis, filtrée par statut si besoin
export function listParcels(status) {
  const query = status ? `?status=${status}` : '';
  return request(`/v1/parcels${query}`);
}

// Changement de statut d'un colis (v1)
export function changeStatus(id, status) {
  return request(`/v1/parcels/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

// Devis de livraison (TP 7) : { postalCode, weightKg, express } -> { ..., price, currency }
export function getQuote(quote) {
  return request('/v1/quotes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quote),
  });
}

// v2 : le client suit le lien fourni par le serveur, sans construire l'URL lui-même
export function followLink(link) {
  return request(link.href, { method: link.method ?? 'GET' });
}
