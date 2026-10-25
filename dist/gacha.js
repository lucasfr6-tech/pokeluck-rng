// Invocations : des bannières qui tournent avec l'horloge, payées en Pokédollars. Tout est déterministe à partir de l'heure.
import {tierOf} from './world.js';

export const EPOCH = Date.UTC(2026, 0, 1);
const HOUR = 3600 * 1000;
export const RARITY = ['Commun', 'Peu commun', 'Rare', 'Épique', 'Légendaire'];
export const RCOLOR = ['#8aa0b3', '#5fbf7a', '#38bdf8', '#b46cf0', '#f0b429'];
// `comp` : nombre de Pokémon tirés au sort par rareté (commun → légendaire) ; `rates` : chances d'un tirage (%).
export const BANNERS = [
  {id:'kanto', name:'Kanto', period:2 * HOUR, periodLabel:'2 h', lo:1, hi:151, one:50_000, ten:500_000, comp:[5, 4, 3, 2, 1], rates:[54.5, 30, 12, 3.2, .3], cls:'', a:'#e5534b', b:'#2a5dbd', ball:'hyper',
   text:'Quinze Pokémon de Kanto, renouvelés toutes les 2 heures. Un seul légendaire à la une.'},
  {id:'johto', name:'Johto', johto:true, period:2 * HOUR, periodLabel:'2 h', lo:152, hi:251, one:100_000, ten:1_000_000, comp:[5, 4, 3, 2, 1], rates:[54.5, 30, 12, 3.2, .3], cls:'', a:'#e0b341', b:'#3a6fb0', ball:'hyper',
   text:'Quinze Pokémon de Johto, renouvelés toutes les 2 heures. Un seul légendaire à la une.'},
  {id:'spec', name:'Spéciale', period:72 * HOUR, periodLabel:'3 jours', lo:1, hi:151, hiJ:251, one:150_000, ten:1_500_000, comp:[3, 5, 4, 5, 3], rates:[50, 30, 14, 5, 1], cls:'sp2', a:'#b46cf0', b:'#4a2a8c', ball:'master',
   text:'Vingt Pokémon différents dont trois légendaires, renouvelés tous les 3 jours. Une fois Johto débloqué, les Pokémon de la 2e génération rejoignent cette bannière (les autres générations suivront).'}
];
export const bannerById = id => BANNERS.find(b => b.id === id) || BANNERS[0];
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
export const slotOf = (b, now) => Math.floor((now - EPOCH) / b.period);
export const endsAt = (b, now) => EPOCH + (slotOf(b, now) + 1) * b.period;
const range = (lo, hi) => Array.from({length: hi - lo + 1}, (_, i) => lo + i);
const salt = id => [...id].reduce((n, c) => n * 31 + c.charCodeAt(0), 7);
// Pokémon de la bannière pour une rotation : [[communs], [peu communs], [rares], [épiques], [légendaires]].
export function poolOf(b, now, johto = false) {
  const ALL = range(b.lo || 1, johto && b.hiJ ? b.hiJ : (b.hi || 151));
  const rand = mulberry(slotOf(b, now) * 2654435761 + salt(b.id)), out = [];
  for (let t = 1; t <= 5; t++) {
    const src = ALL.filter(id => tierOf(id) === t), n = b.comp[t - 1], pick = [];
    while (pick.length < Math.min(n, src.length)) { const i = Math.floor(rand() * src.length); pick.push(src.splice(i, 1)[0]); }
    out.push(pick.sort((x, y) => x - y));
  }
  return out;
}
export const featured = pool => ({head:pool[4][0], side:[...pool[3].slice(0, 2)]});
// Un tirage : rareté selon les chances, puis un Pokémon au hasard de cette rareté dans la bannière.
export function pullOne(b, pool, rand = Math.random, minTier = 0) {
  const rates = b.rates.map((r, i) => i < minTier ? 0 : r), total = rates.reduce((n, r) => n + r, 0);
  let x = rand() * total, t = 0;
  for (let i = 0; i < 5; i++) { x -= rates[i]; if (x < 0) { t = i; break; } t = i; }
  const list = pool[t]; return {tier:t + 1, id:list[Math.floor(rand() * list.length)]};
}
// ×10 : au moins un Pokémon Rare ou mieux (le dernier tirage est relevé si besoin).
export function pullTen(b, pool, rand = Math.random) {
  const out = Array.from({length: 10}, () => pullOne(b, pool, rand));
  if (!out.some(o => o.tier >= 3)) out[9] = pullOne(b, pool, rand, 2);
  return out;
}
export const fmtLeft = ms => { const m = Math.max(0, Math.ceil(ms / 60000)); return m >= 1440 ? `${Math.floor(m / 1440)} j ${String(Math.floor(m % 1440 / 60)).padStart(2, '0')} h` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`; };
