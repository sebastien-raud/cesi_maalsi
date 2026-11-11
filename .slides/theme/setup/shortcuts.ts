// Raccourcis Début / Fin (première et dernière slide), repris d'eloc.
// Écart : touches en chaînes (résolues par Slidev) au lieu de @vueuse/core et @vueuse/math,
// introuvables depuis ce dossier sans node_modules ; la condition « hors vue d'ensemble » est abandonnée.
import type { NavOperations, ShortcutOptions } from '@slidev/types'

export default (nav: NavOperations, base: ShortcutOptions[]): ShortcutOptions[] => [
  ...base,
  { name: 'goHome', key: 'home', fn: nav.goFirst },
  { name: 'goEnd', key: 'end', fn: nav.goLast },
]
