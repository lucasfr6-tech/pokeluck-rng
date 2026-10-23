import {zones, zonePool, tierOf} from './world.js';

// Événements déterministes selon l'horloge : aucun état à sauvegarder, tout le monde voit le même.
// - « Chance doublée » : chaque heure, une zone tirée au hasard double la chance de Pokémon rares (×2) pendant 1 h.
// - « Pokémon brillant du jour » : chaque jour (heure locale), une espèce d'une zone a une chance chromatique ×25.
export const HOUR = 3600000;
export const LUCK_MULT = 2;
export const DAILY_SHINY_MULT = 25;
export const seeded = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };

export function luckEvent(now = Date.now()) {
  const slot = Math.floor(now / HOUR), rand = seeded(slot * 2654435761), zone = zones[Math.floor(rand() * zones.length)];
  return {kind:'luck', zone:zone.id, mult:LUCK_MULT, startsAt:slot * HOUR, endsAt:(slot + 1) * HOUR};
}
export const dayKey = (now = Date.now()) => { const d = new Date(now); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
export function dailyShiny(now = Date.now()) {
  const key = dayKey(now), rand = seeded(key * 40503), zone = zones[Math.floor(rand() * zones.length)];
  const list = zonePool(zone.id).filter(p => tierOf(p.id) <= 4), total = list.reduce((s, p) => s + p.probability, 0);
  let r = rand() * total, pick = list.at(-1);
  for (const p of list) { r -= p.probability; if (r < 0) { pick = p; break; } }
  const d = new Date(now), end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
  return {kind:'shiny', id:pick.id, name:pick.name, zone:zone.id, mult:DAILY_SHINY_MULT, endsAt:end};
}
// Chance de raretés effective : le bonus d'objet est combiné à l'événement (×2 sur les parts rares).
export const luckBonus = (itemBonus, zoneId, now = Date.now()) => { const e = luckEvent(now); return e.zone === zoneId ? (1 + itemBonus) * e.mult - 1 : itemBonus; };
// Multiplicateur de chance chromatique pour une espèce tirée.
export const shinyMult = (id, now = Date.now()) => dailyShiny(now).id === id ? DAILY_SHINY_MULT : 1;
export const fmtCountdown = ms => { const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60, p = n => String(n).padStart(2, '0'); return h ? `${h}:${p(m)}:${p(x)}` : `${p(m)}:${p(x)}`; };
