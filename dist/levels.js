import {evolvesFrom} from './pokemon.js';
import {powers,zones} from './world.js';

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
// `ceiling` : plafond global fixé par les badges d'arène (voir arena.js) ; l'expérience reste en réserve et se débloque au badge suivant.
export function levelInfo(id, count = 1, bonus = 0, ceiling = MAX_LEVEL) {
  const min = minLevel(id), stageCap = maxLevel(id), cap = Math.min(stageCap, ceiling);
  let xp = Math.max(0, Math.floor(count) - 1) + Math.max(0, Math.floor(bonus)), level = min;
  while (level < cap && xp >= xpToNext(level)) { xp -= xpToNext(level); level++; }
  level = Math.min(level, cap);
  const capped = level >= cap;
  return {level, cap, min, capped, limited: capped && cap < stageCap, xp: capped ? 0 : xp, need: capped ? 0 : xpToNext(level), evolvesAt: nextLevels[id] ?? null};
}

// Puissance : valeur de référence de l'espèce (niveau 5) multipliée par (niveau / 5)^3,7.
// Dracaufeu niv. 36 ≈ 10 millions, niv. 100 ≈ 440 millions ; Mewtwo niv. 100 ≈ 1,5 milliard (provisoire).
export const LEVEL_POWER_EXP = 3.7;
export function powerAt(id, level) {
  return Math.round(powers[id - 1] * (Math.max(1, level) / START_LEVEL) ** LEVEL_POWER_EXP);
}

// Niveau d'un Pokémon sauvage : celui de ton Pokémon de tête ±2 (jamais moins de 1 ni plus de 100), dans toutes les zones.
export const WILD_SPREAD = 2;
export function wildLevelNear(ownLevel, rand = Math.random) {
  const base = Math.max(1, Math.min(100, Math.floor(ownLevel) || START_LEVEL));
  return Math.max(1, Math.min(100, base - WILD_SPREAD + Math.floor(rand() * (2 * WILD_SPREAD + 1))));
}
// Niveau sauvage par zone : niveau d'entrée de la zone (Route 2 → 8, Route 3 → 22…) jusqu'à +2, sans jamais dépasser le niveau d'entrée de la zone suivante − 1.
export function wildLevelZone(zoneId, rand = Math.random) {
  const i = Math.max(0, zones.findIndex(z => z.id === zoneId)), lo = zones[i].min, hi = Math.min(100, zones[i + 1] ? zones[i + 1].min - 1 : 100);
  return Math.min(hi, lo + Math.floor(rand() * (WILD_SPREAD + 1)));
}
// (Ancien tirage par zone, conservé pour référence.) Niveau d'un Pokémon sauvage : toujours tiré dans la fourchette de la zone (de la Route 1 au niveau 100 à la Centrale).
// Ni le plafond du stade d'évolution ni le niveau minimum de l'espèce ne le modifient : la difficulté dépend de la zone.
export function wildLevel(zoneId, id, rand = Math.random) {
  const [lo, hi] = (zones.find(z => z.id === zoneId) || zones[0]).levels;
  return lo + Math.floor(rand() * (hi - lo + 1));
}
