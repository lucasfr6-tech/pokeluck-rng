// Défis : un type imposé qui change toutes les 6 heures, trois paliers (Bronze, Argent, Or) contre des équipes préparées de niveau 50.
// Tout est calculé de façon déterministe à partir de l'heure : tous les joueurs voient le même défi au même moment.
// L'heure vient pour l'instant de l'horloge de l'appareil ; une vérification serveur viendra la remplacer (voir game.js, defiNow).
import {sameLine} from './pokemon.js';
import {types, powers, tierOf} from './world.js';
import {effectiveness} from './battle.js';

export const SLOT_MS = 6 * 3600 * 1000;
export const EPOCH = Date.UTC(2026, 0, 1);
export const DEFI_LEVELS = [25, 50, 100]; // niveau des adversaires par palier ; tes Pokémon gardent leur niveau
export const DEFI_LEVEL = 50;
export const TIER_IDS = ['bronze', 'argent', 'or'];
export const TIER_NAMES = ['Bronze', 'Argent', 'Or'];
export const TIER_LABEL = ['Facile', 'Moyen', 'Difficile'];
const TIER_BASE = [3000, 9000, 24000];
const TIER_QUANTILE = [.4, .68, .92];

// Pas de légendaires ni de fabuleux, ni côté joueur ni côté adversaires.
export const defiEligible = id => tierOf(id) !== 5;
const all = Array.from({length: 151}, (_, i) => i + 1).filter(defiEligible);
// Types jouables : au moins 3 espèces autorisées portent ce type.
export const DEFI_TYPES = [...new Set(Object.values(types).flat())].sort().filter(t => all.filter(id => types[id].includes(t)).length >= 3);

const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
function baseOrder(cycle) { const r = rng(hash('cycle' + cycle)), a = [...DEFI_TYPES]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const cache = new Map();
// Ordre des types pour un cycle complet : jamais le même type deux fois de suite, y compris à la jonction de deux cycles.
export function cycleOrder(cycle) {
  if (cache.has(cycle)) return cache.get(cycle);
  const a = baseOrder(cycle);
  if (cycle > 0 && a[0] === baseOrder(cycle - 1).at(-1)) [a[0], a[1]] = [a[1], a[0]];
  cache.set(cycle, a); return a;
}
export const slotOf = now => Math.floor((now - EPOCH) / SLOT_MS);
export const typeAtSlot = slot => cycleOrder(Math.floor(slot / DEFI_TYPES.length))[((slot % DEFI_TYPES.length) + DEFI_TYPES.length) % DEFI_TYPES.length];
export const slotEnd = slot => EPOCH + (slot + 1) * SLOT_MS;
export const currentDefi = now => { const slot = slotOf(now); return {slot, type: typeAtSlot(slot), next: typeAtSlot(slot + 1), endsAt: slotEnd(slot)}; };

// Un Pokémon « contre » le type du défi s'il possède un type très efficace contre lui.
export const counters = (id, type) => types[id].some(t => effectiveness(t, [type]) > 1);

// Équipes adverses : fixes pour un (type, palier), de puissance comparable à l'intérieur d'un palier, jamais contre le type du défi.
const foesCache = new Map();
export function foesFor(type, tier) {
  const key = type + tier; if (foesCache.has(key)) return foesCache.get(key);
  const pool = all.filter(id => !counters(id, type) && !types[id].includes(type)).sort((a, b) => powers[a - 1] - powers[b - 1] || a - b);
  const center = Math.round(TIER_QUANTILE[tier] * (pool.length - 1)), span = 7, start = Math.max(0, Math.min(pool.length - 1 - span * 2, center - span));
  const window = pool.slice(start, start + span * 2 + 1), r = rng(hash(type + '|' + tier)), picked = [];
  for (let guard = 0; picked.length < 3 && guard < 200; guard++) {
    const id = window[Math.floor(r() * window.length)];
    if (picked.some(p => sameLine(p, id) || (picked.length < 2 && types[p][0] === types[id][0]))) continue;
    picked.push(id);
  }
  for (const id of window) if (picked.length < 3 && !picked.some(p => sameLine(p, id))) picked.push(id);
  foesCache.set(key, picked); return picked;
}
export const teamPowerOf = ids => ids.reduce((s, id) => s + powers[id - 1], 0);

export const defiReward = (tier, badges) => Math.round(TIER_BASE[tier] * (1 + .4 * Math.max(0, badges)) / 100) * 100;

// Équipe de défi : jusqu'à 3 Pokémon possédés qui portent le type demandé (double type accepté).
export const canPick = (id, type, counts) => !!counts[id] && defiEligible(id) && types[id]?.includes(type);
export const pickable = (type, counts) => all.filter(id => canPick(id, type, counts));
export const emptyDefis = () => ({picks: {}, slot: -1, claimed: {}});
export function sanitizeDefis(raw) {
  const o = emptyDefis(); if (!raw || typeof raw !== 'object') return o;
  if (raw.picks && typeof raw.picks === 'object') for (const t of DEFI_TYPES) { const l = raw.picks[t]; if (Array.isArray(l)) o.picks[t] = [...new Set(l.filter(n => Number.isInteger(n) && n >= 1 && n <= 251 && types[n]?.includes(t) && defiEligible(n)))].slice(0, 3); }
  if (Number.isInteger(raw.slot)) o.slot = raw.slot;
  if (raw.claimed && typeof raw.claimed === 'object') for (const t of TIER_IDS) if (raw.claimed[t] === true) o.claimed[t] = true;
  return o;
}
export const teamOf = (d, type, counts) => (d.picks[type] || []).filter(id => canPick(id, type, counts)).slice(0, 3);
export const isClaimed = (d, slot, tier) => d.slot === slot && d.claimed[TIER_IDS[tier]] === true;
export function claim(d, slot, tier) {
  if (d.slot !== slot) { d.slot = slot; d.claimed = {}; }
  if (d.claimed[TIER_IDS[tier]]) return false;
  d.claimed[TIER_IDS[tier]] = true; return true;
}
export function togglePick(d, type, id, counts) {
  const cur = teamOf(d, type, counts), i = cur.indexOf(id);
  if (i >= 0) cur.splice(i, 1); else if (canPick(id, type, counts) && cur.length < 3) cur.push(id); else return false;
  d.picks[type] = cur; return true;
}
