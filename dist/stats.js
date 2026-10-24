// Statistiques de jeu et historique des chromatiques. Données pures, sans DOM.
export const LOG_MAX = 300;
export const blankPlay = () => ({time: 0, zones: {}, streak: 0, best: 0, lastShiny: 0});
const nat = n => Number.isSafeInteger(n) && n >= 0 ? n : 0;
export function sanitizePlay(raw, zoneIds = []) {
  const o = blankPlay(); if (!raw || typeof raw !== 'object') return o;
  o.time = nat(raw.time); o.streak = nat(raw.streak); o.best = Math.max(nat(raw.best), o.streak); o.lastShiny = nat(raw.lastShiny);
  if (raw.zones && typeof raw.zones === 'object') for (const z of zoneIds) if (nat(raw.zones[z]) > 0) o.zones[z] = raw.zones[z];
  return o;
}
export const recordDraw = (p, zone) => { p.zones[zone] = (p.zones[zone] || 0) + 1; };
export const recordWin = p => { p.streak++; if (p.streak > p.best) p.best = p.streak; };
export const recordLoss = p => { p.streak = 0; };
export const addTime = (p, s) => { p.time = nat(p.time + Math.max(0, Math.floor(s))); };
export function favoriteZone(p) { let best = null; for (const [id, n] of Object.entries(p.zones || {})) if (!best || n > best.n) best = {id, n}; return best; }
export function topZones(p, k = 5) { return Object.entries(p.zones || {}).map(([id, n]) => ({id, n})).sort((a, b) => b.n - a.n).slice(0, k); }
export function fmtDuration(sec) {
  const s = nat(sec), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
  return d ? `${d} j ${h} h ${m} min` : h ? `${h} h ${String(m).padStart(2, '0')} min` : m ? `${m} min ${String(s % 60).padStart(2, '0')} s` : `${s} s`;
}
export function sanitizeShinyLog(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter(e => e && Number.isInteger(e.id) && e.id >= 1 && e.id <= 251 && Number.isFinite(e.at) && e.at > 0 && nat(e.n) >= 0).map(e => ({id: e.id, at: Math.floor(e.at), n: nat(e.n)})).slice(0, LOG_MAX);
}
// Ajoute un chromatique (le plus récent en premier). `totalDraws` = tirages totaux à cet instant ; n = tirages depuis le précédent chromatique.
export function logShiny(log, play, id, at, totalDraws) {
  const n = Math.max(1, totalDraws - nat(play.lastShiny)); play.lastShiny = totalDraws;
  log.unshift({id, at, n}); if (log.length > LOG_MAX) log.length = LOG_MAX; return n;
}
export const shinyAverage = (log) => log.length ? Math.round(log.reduce((s, e) => s + e.n, 0) / log.length) : 0;
