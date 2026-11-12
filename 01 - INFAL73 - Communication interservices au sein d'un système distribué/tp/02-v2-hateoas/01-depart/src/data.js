// Données d'exemple, en mémoire : elles repartent de zéro à chaque redémarrage du serveur
export const parcels = [
  { id: 'CLB-0001', merchant: 'Librairie du Rhône', recipient: 'Alain Térieur', address: { street: '12 rue de la République', postalCode: '69002', city: 'Lyon' }, status: 'READY', updatedAt: '2026-11-02T08:05:00.000Z' },
  { id: 'CLB-0002', merchant: 'Vélo Boutique', recipient: 'Alex Térieur', address: { street: '3 place Bellecour', postalCode: '69002', city: 'Lyon' }, status: 'READY', updatedAt: '2026-11-02T08:12:00.000Z' },
  { id: 'CLB-0003', merchant: 'Thé et Compagnie', recipient: 'Sarah Croche', address: { street: '45 cours Lafayette', postalCode: '69003', city: 'Lyon' }, status: 'IN_TRANSIT', updatedAt: '2026-11-02T09:30:00.000Z' },
  { id: 'CLB-0004', merchant: 'Atelier Céramique', recipient: 'Jean Bon', address: { street: '8 quai Saint-Antoine', postalCode: '69002', city: 'Lyon' }, status: 'IN_TRANSIT', updatedAt: '2026-11-02T09:41:00.000Z' },
  { id: 'CLB-0005', merchant: 'Librairie du Rhône', recipient: 'Lara Tatouille', address: { street: '27 rue Mercière', postalCode: '69002', city: 'Lyon' }, status: 'DELIVERED', updatedAt: '2026-11-01T16:20:00.000Z' },
  { id: 'CLB-0006', merchant: 'Vélo Boutique', recipient: 'Mehdi Cament', address: { street: '101 avenue Jean Jaurès', postalCode: '69007', city: 'Lyon' }, status: 'READY', updatedAt: '2026-11-02T10:02:00.000Z' },
  { id: 'CLB-0007', merchant: 'Thé et Compagnie', recipient: 'Anna Lyse', address: { street: '6 montée de la Grande Côte', postalCode: '69001', city: 'Lyon' }, status: 'DELIVERED', updatedAt: '2026-11-01T17:45:00.000Z' },
  { id: 'CLB-0008', merchant: 'Atelier Céramique', recipient: 'Paul Hochon', address: { street: '19 rue Garibaldi', postalCode: '69006', city: 'Lyon' }, status: 'IN_TRANSIT', updatedAt: '2026-11-02T10:15:00.000Z' },
  { id: 'CLB-0009', merchant: 'Librairie du Rhône', recipient: 'Justin Ptipeu', address: { street: '2 rue du Plat', postalCode: '69002', city: 'Lyon' }, status: 'READY', updatedAt: '2026-11-02T10:31:00.000Z' },
  { id: 'CLB-0010', merchant: 'Vélo Boutique', recipient: 'Marc Assin', address: { street: '54 boulevard des Belges', postalCode: '69006', city: 'Lyon' }, status: 'DELIVERED', updatedAt: '2026-11-01T11:10:00.000Z' },
];

// Cherche un colis par son numéro ; undefined s'il n'existe pas
export function findParcel(id) {
  return parcels.find((parcel) => parcel.id === id);
}

// Dernier numéro attribué
let counter = parcels.length;

// Numéro du prochain colis créé : CLB-0011, CLB-0012...
export function nextId() {
  counter += 1;
  return `CLB-${String(counter).padStart(4, '0')}`;
}
