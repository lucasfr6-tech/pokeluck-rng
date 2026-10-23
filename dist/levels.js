import {evolvesFrom} from './pokemon.js';
import {powers} from './world.js';

// Système de niveaux (valeurs PROVISOIRES, à équilibrer avec le créateur).
// - Une espèce de base commence au niveau 5. Une forme évoluée tirée directement commence au niveau
//   auquel sa forme précédente évolue dans les jeux (16, 36…) : la rareté d'une évolution reste donc
//   réelle, car un Pokémon ne peut pas dépasser le niveau du palier de son stade sans tirer l'évolution.
// - Chaque doublon tiré donne 1 point d'expérience à cette espèce ; passer du niveau N à N+1 coûte N points.
// - Le niveau se déduit du nombre d'exemplaires tirés : aucune donnée supplémentaire dans la sauvegarde.
export const START_LEVEL = 5;
export const MAX_LEVEL = 100;
// Niveau d'évolution par pierre, échange ou lien (et espèces sans niveau d'évolution propre) : provisoire.
const DEFAULT_EVOLVE_LEVEL = 36;
// Numéro de l'évolution → niveau auquel la forme précédente évolue (jeux Rouge/Bleu).
const evolveLevels = {2:16,3:32,5:16,6:36,8:16,9:36,11:7,12:10,14:7,15:10,17:18,18:36,20:20,22:20,24:22,28:22,30:16,33:16,42:22,44:21,47:24,49:31,51:26,53:28,55:33,57:28,61:25,64:16,67:28,70:21,73:30,75:25,78:40,80:37,82:30,85:31,87:34,89:38,93:25,97:26,99:28,101:30,105:28,110:35,112:42,117:32,119:33,130:20,139:40,141:40,148:30,149:55};

export const minLevel = id => evolvesFrom[id] ? (evolveLevels[id] ?? DEFAULT_EVOLVE_LEVEL) : START_LEVEL;
// Plafond d'une espèce : un niveau avant l'évolution de la forme suivante (la plus basse en cas d'embranchement).
const nextLevels = {};
for (const to of Object.keys(evolvesFrom)) {
  const from = evolvesFrom[to];
  nextLevels[from] = Math.min(nextLevels[from] ?? Infinity, minLevel(+to));
}
export const maxLevel = id => nextLevels[id] ? nextLevels[id] - 1 : MAX_LEVEL;
export const xpToNext = level => level;

// Niveau, expérience et progression d'une espèce possédée en `count` exemplaires.
export function levelInfo(id, count = 1) {
  const min = minLevel(id), cap = maxLevel(id);
  let xp = Math.max(0, Math.floor(count) - 1), level = min;
  while (level < cap && xp >= xpToNext(level)) { xp -= xpToNext(level); level++; }
  const capped = level >= cap;
  return {level, cap, min, capped, xp: capped ? 0 : xp, need: capped ? 0 : xpToNext(level), evolvesAt: nextLevels[id] ?? null};
}

// Puissance : la valeur de base de l'espèce au niveau de départ, doublée au plafond du stade (provisoire).
export function powerAt(id, level) {
  const min = minLevel(id), cap = maxLevel(id);
  const progress = cap > min ? Math.min(1, Math.max(0, (level - min) / (cap - min))) : 0;
  return Math.round(powers[id - 1] * (1 + progress));
}
