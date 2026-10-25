// Tour de combat, défis à règles spéciales et Marché du jour : logique pure (aucun accès au DOM).
import {pool} from './pokemon.js';
import {types,tierOf} from './world.js';
import {seeded} from './events.js';
import {ITEMS} from './shop.js';

const DAY = 86400000;
const names = id => pool[id - 1]?.name || String(id);
export {names as speciesName};

// ---------- Tour de combat ----------
// Une vague = un combat. Pas de soin entre deux vagues : les PV restants passent à la vague suivante, les K.O. restent K.O.
export const TOWER_MILESTONES = {10: 10000, 25: 30000, 50: 80000, 75: 150000, 100: 300000};
export const towerLevel = wave => Math.min(200, Math.round(40 + wave * 2.4));
export const towerBoost = wave => 1 + Math.min(.6, wave * .008);
export function towerFoes(wave) {
  const rand = seeded(wave * 7919 + 13), n = Math.min(6, 1 + Math.floor((wave - 1) / 5));
  const lo = wave < 10 ? 1 : wave < 25 ? 2 : wave < 50 ? 3 : 4, hi = wave < 10 ? 2 : wave < 25 ? 3 : wave < 50 ? 4 : 5;
  const cand = pool.map(p => p.id).filter(id => { const t = tierOf(id); return t >= lo && t <= hi && (t < 5 || wave >= 50); });
  const out = [];
  while (out.length < n && cand.length) out.push(cand.splice(Math.floor(rand() * cand.length), 1)[0]);
  return {team: out.map(id => [id, towerLevel(wave)]), boost: towerBoost(wave)};
}
export const nextMilestone = best => Object.keys(TOWER_MILESTONES).map(Number).find(w => w > best) || null;

// ---------- Défis à règles spéciales ----------
export const CHALLENGES = [
  {id: 'trio', name: 'Trio', rule: 'Seuls les 3 premiers Pokémon de ton équipe combattent.', foes: [149, 143, 130], level: 90, prize: 20000, boost: 1.3, noItems: false},
  {id: 'bare', name: 'Sans objet', rule: 'Aucun objet tenu, aucun soin pendant le combat.', foes: [94, 65, 68, 112], level: 100, prize: 30000, boost: 1.3, noItems: true},
  {id: 'mono', name: 'Un seul type', rule: 'Tu choisis un type : seuls tes Pokémon de ce type combattent (3 minimum).', foes: null, level: 100, prize: 40000, boost: 1.3, noItems: false}
];
export const challengeById = id => CHALLENGES.find(c => c.id === id);
// Équipe d'un défi : renvoie les identifiants alignés sur les règles, ou [] si le joueur ne les remplit pas.
export function challengeTeam(chal, team, owned, level, type) {
  if (chal === 'trio') return team.length >= 3 ? team.slice(0, 3) : [];
  if (chal === 'bare') return team.length ? team.slice(0, 6) : [];
  if (chal === 'mono') {
    if (!type) return [];
    const list = owned.filter(id => types[id]?.includes(type)).sort((a, b) => level(b) - level(a)).slice(0, 6);
    return list.length >= 3 ? list : [];
  }
  return [];
}
// Adversaires du défi « Un seul type » : quatre espèces de rareté ≥ 3, les mêmes pour un type donné.
export function monoFoes(type) {
  const rand = seeded([...type].reduce((n, c) => n * 31 + c.charCodeAt(0), 7)), cand = pool.map(p => p.id).filter(id => tierOf(id) >= 3 && tierOf(id) < 5), out = [];
  while (out.length < 4) out.push(cand.splice(Math.floor(rand() * cand.length), 1)[0]);
  return out;
}

// ---------- Marché du jour ----------
export const RARE_POOL = ['leftovers', 'band', 'kings-rock', 'metal-coat', 'dragon-scale', 'up-grade', 'fire-stone', 'water-stone', 'thunder-stone', 'leaf-stone', 'moon-stone', 'sun-stone', 'incense', 'egg'];
export const dayIndex = (now = Date.now()) => Math.floor(now / DAY);
export const marketEnds = (now = Date.now()) => (dayIndex(now) + 1) * DAY;
const eggIds = () => Object.keys(ITEMS).filter(id => ITEMS[id].kind === 'typeegg');
const tmIds = () => Object.keys(ITEMS).filter(id => ITEMS[id].kind === 'tm' && ITEMS[id].price > 0);
const cut = (id, off) => Math.max(100, Math.round(ITEMS[id].price * (1 - off) / 100) * 100);
// Trois offres limitées (une par catégorie), les mêmes pour tout le monde pendant 24 h.
export function marketOffers(now = Date.now()) {
  const rand = seeded(dayIndex(now) * 5333 + 3), pick = a => a[Math.floor(rand() * a.length)];
  const rare = pick(RARE_POOL), egg = pick(eggIds()), tm = pick(tmIds());
  return [
    {slot: 0, id: rare, kind: 'Objet rare', off: .4, price: cut(rare, .4)},
    {slot: 1, id: egg, kind: 'Œuf de type', off: .35, price: cut(egg, .35)},
    {slot: 2, id: tm, kind: 'CT', off: .5, price: cut(tm, .5)}
  ];
}

// ---------- Compagnon ----------
// Un petit bonus selon le premier type du compagnon. p = puissance, m = pièces, x = XP.
export const COMPANION_BONUS = {
  normal: {m: .02}, fighting: {p: .02}, flying: {x: .02}, poison: {p: .015}, ground: {m: .02}, rock: {m: .02}, bug: {x: .02}, ghost: {p: .02},
  steel: {m: .02}, fire: {p: .02}, water: {x: .02}, grass: {x: .02}, electric: {p: .02}, psychic: {p: .02}, ice: {x: .02}, dragon: {p: .025}, dark: {p: .02}, fairy: {m: .02}
};
export const companionBonus = id => (id && types[id]) ? (COMPANION_BONUS[types[id][0]] || {}) : {};
