import {evolvesFrom} from './pokemon.js';
import {powers,allZones as zones} from './world.js';

// Système de niveaux (valeurs PROVISOIRES, à équilibrer avec le créateur).
// - Une espèce de base commence au niveau 5. Une forme évoluée tirée directement commence au niveau
//   auquel sa forme précédente évolue dans les jeux (16, 36…) : la rareté d'une évolution reste donc
//   réelle, car un Pokémon ne peut pas dépasser le niveau du palier de son stade sans tirer l'évolution.
// - Chaque doublon tiré donne 1 point d'expérience à cette espèce ; passer du niveau N à N+1 coûte N points.
// - Le niveau se déduit du nombre d'exemplaires tirés : aucune donnée supplémentaire dans la sauvegarde.
export const START_LEVEL = 5;
export const MAX_LEVEL = 200;   // 100 à Kanto ; le plafond monte jusqu'à 200 avec les badges de Johto (voir arena.js)
// Niveau d'évolution par pierre, échange ou lien (et espèces sans niveau d'évolution propre) : provisoire.
const DEFAULT_EVOLVE_LEVEL = 36;
// Numéro de l'évolution → niveau auquel la forme précédente évolue (jeux Rouge/Bleu).
const evolveLevels = {2:16,3:32,5:16,6:36,8:16,9:36,11:7,12:10,14:7,15:10,17:18,18:36,20:20,22:20,24:22,28:22,30:16,33:16,42:22,44:21,47:24,49:31,51:26,53:28,55:33,57:28,61:25,64:16,67:28,70:21,73:30,75:25,78:40,80:37,82:30,85:31,87:34,89:38,93:25,97:26,99:28,101:30,105:28,110:35,112:42,117:32,119:33,130:20,139:40,141:40,148:30,149:55,153:16,154:32,156:14,157:36,159:18,160:30,162:15,164:20,166:18,168:22,171:27,178:25,180:15,181:30,184:18,188:18,189:27,195:20,205:31,210:23,217:30,219:38,221:33,224:25,229:24,232:25,237:20,247:30,248:55};

export const minLevel = id => evolvesFrom[id] ? (evolveLevels[id] ?? DEFAULT_EVOLVE_LEVEL) : START_LEVEL;
// Plafond d'une espèce : un niveau avant l'évolution de la forme suivante (la plus basse en cas d'embranchement).
const nextLevels = {};
for (const to of Object.keys(evolvesFrom)) {
  const from = evolvesFrom[to];
  if (+to > 151 && from <= 151) continue; // évolutions de Johto d'une espèce de Kanto : ne plafonnent pas la forme de Kanto
  nextLevels[from] = Math.min(nextLevels[from] ?? Infinity, minLevel(+to));
}
export const maxLevel = id => nextLevels[id] ? nextLevels[id] - 1 : MAX_LEVEL;
// Coût du niveau suivant (relevé : 4× plus long au départ, environ 10× au niveau 70). Ancien barème : `level`.
export const xpToNext = level => Math.round(level * (3 + level / 10));
const xpToNextOld = level => level;

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

// Migration de l'ancien barème : conserve le niveau (et la progression) actuel avec le nouveau coût par niveau.
export function migrateXp(id, count = 1, bonus = 0, ceiling = MAX_LEVEL) {
  const min = minLevel(id), cap = Math.min(maxLevel(id), ceiling), have = Math.max(0, Math.floor(count) - 1);
  let xp = have + Math.max(0, Math.floor(bonus)), level = min;
  while (level < cap && xp >= xpToNextOld(level)) { xp -= xpToNextOld(level); level++; }
  let total = 0; for (let l = min; l < level; l++) total += xpToNext(l);
  const prog = level < cap ? Math.round(xp / xpToNextOld(level) * xpToNext(level)) : 0;
  return Math.max(0, total + prog - have);
}
// XP encore utile avant d'atteindre le plafond (stade d'évolution ou arènes) : au-delà, l'expérience ne s'accumule plus.
export function xpRoom(id, count = 1, bonus = 0, ceiling = MAX_LEVEL) {
  const cap = Math.min(maxLevel(id), ceiling); let need = 0;
  for (let l = minLevel(id); l < cap; l++) need += xpToNext(l);
  return Math.max(0, need - (Math.max(0, Math.floor(count) - 1) + Math.max(0, Math.floor(bonus))));
}
// Part de l'XP bonus qui reste valable au plafond donné.
export const xpBonusMax = (id, count = 1, ceiling = MAX_LEVEL) => xpRoom(id, count, 0, ceiling);

// Puissance : valeur de référence de l'espèce (niveau 5) multipliée par (niveau / 5)^2,15.
// Une équipe de six Pokémon niv. 100 (légendaires compris) ≈ 50 M au maximum ; Mewtwo niv. 100 ≈ 14 M (provisoire).
export const LEVEL_POWER_EXP = 2.15;
export function powerAt(id, level) {
  return Math.round(powers[id - 1] * (Math.max(1, level) / START_LEVEL) ** LEVEL_POWER_EXP);
}

// Niveau d'un Pokémon sauvage : celui de ton Pokémon de tête ±2 (jamais moins de 1 ni plus de 100), dans toutes les zones.
export const WILD_SPREAD = 2;
export function wildLevelNear(ownLevel, rand = Math.random) {
  const base = Math.max(1, Math.min(MAX_LEVEL, Math.floor(ownLevel) || START_LEVEL));
  return Math.max(1, Math.min(MAX_LEVEL, base - WILD_SPREAD + Math.floor(rand() * (2 * WILD_SPREAD + 1))));
}
// Niveau sauvage par zone : niveau d'entrée de la zone (Route 2 → 8, Route 3 → 22…) jusqu'à +2, sans jamais dépasser le niveau d'entrée de la zone suivante − 1.
export function wildLevelZone(zoneId, rand = Math.random) {
  const z = zones.find(x => x.id === zoneId);
  if (z?.region === 'johto') { const [lo, hi] = z.levels; return lo + Math.floor(rand() * (hi - lo + 1)); }
  const i = Math.max(0, zones.findIndex(z => z.id === zoneId)), lo = zones[i].min, hi = Math.min(MAX_LEVEL, zones[i + 1] && !zones[i + 1].region ? zones[i + 1].min - 1 : 100);
  return Math.min(hi, lo + Math.floor(rand() * (WILD_SPREAD + 1)));
}
// (Ancien tirage par zone, conservé pour référence.) Niveau d'un Pokémon sauvage : toujours tiré dans la fourchette de la zone (de la Route 1 au niveau 100 à la Centrale).
// Ni le plafond du stade d'évolution ni le niveau minimum de l'espèce ne le modifient : la difficulté dépend de la zone.
export function wildLevel(zoneId, id, rand = Math.random) {
  const [lo, hi] = (zones.find(z => z.id === zoneId) || zones[0]).levels;
  return lo + Math.floor(rand() * (hi - lo + 1));
}
