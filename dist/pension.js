// Pension Pokémon : deux Pokémon déposés produisent un œuf qui éclot après N victoires. IV hérités, chromatique plus probable.
import {STAT_KEYS, normalizeTraining} from './training.js';
import {evolvesFrom} from './pokemon.js';

export const EGG_NEED = 60;          // victoires nécessaires à l'éclosion
export const MUTATION = .2;          // chance qu'un IV hérité soit retiré au hasard
export const SHINY_BASE = 8;         // multiplicateur de chance de chromatique d'un œuf de pension
export const SHINY_PER_PARENT = 2;   // ×2 de plus par parent possédant une forme chromatique
const validId = n => Number.isInteger(n) && n >= 1 && n <= 151;
export const blankDaycare = () => ({a: null, b: null, egg: null});
export function sanitizeDaycare(raw) {
  const o = blankDaycare(); if (!raw || typeof raw !== 'object') return o;
  if (validId(raw.a)) o.a = raw.a; if (validId(raw.b) && raw.b !== o.a) o.b = raw.b;
  const e = raw.egg;
  if (o.a && o.b && e && Number.isFinite(e.start) && e.start >= 0 && Number.isInteger(e.need) && e.need > 0 && e.need <= 1000) o.egg = {start: e.start, need: e.need};
  return o;
}
export const baseForm = id => { let r = id; while (evolvesFrom[r]) r = evolvesFrom[r]; return r; };
// Dépôt dans la première case libre ; un œuf démarre dès que les deux cases sont remplies.
export function deposit(dc, id, wins) {
  if (!validId(id) || dc.a === id || dc.b === id) return false;
  if (!dc.a) dc.a = id; else if (!dc.b) dc.b = id; else return false;
  if (dc.a && dc.b && !dc.egg) dc.egg = {start: wins, need: EGG_NEED};
  return true;
}
export function withdraw(dc, id) { if (dc.a === id) dc.a = null; else if (dc.b === id) dc.b = null; else return false; dc.egg = null; return true; }
export const eggProgress = (dc, wins) => dc.egg ? Math.max(0, Math.min(dc.egg.need, wins - dc.egg.start)) : 0;
export const eggReady = (dc, wins) => !!dc.egg && eggProgress(dc, wins) >= dc.egg.need;
export const hatchSpecies = (dc, rand = Math.random) => baseForm(rand() < .5 ? dc.a : dc.b);
// Chaque IV vient de l'un des deux parents ; avec une chance MUTATION il est retiré au hasard.
export function inheritIVs(ta, tb, rand = Math.random) {
  const ivs = {};
  for (const k of STAT_KEYS) { const src = rand() < .5 ? ta : tb; ivs[k] = rand() < MUTATION ? Math.floor(rand() * 32) : (src?.ivs?.[k] ?? Math.floor(rand() * 32)); }
  return normalizeTraining({ivs});
}
export const shinyMultiplier = (dc, shinyCounts) => SHINY_BASE * Math.pow(SHINY_PER_PARENT, [dc.a, dc.b].filter(id => (shinyCounts?.[id] || 0) > 0).length);
