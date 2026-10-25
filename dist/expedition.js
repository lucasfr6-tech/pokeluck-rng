// Expéditions : trois Pokémon explorent une zone pendant un temps réel ; les types de l'équipe orientent le butin.
// Toute l'état est dans la sauvegarde (heure de départ et de fin absolues) : les expéditions continuent hors ligne.
import {types} from './world.js';

export const MAX_RUNS = 3;
export const TEAM_SIZE = 3;
export const MIN = 60 * 1000;
// Puissance minimale de l'équipe (somme des trois Pokémon), durée, argent de base, nombre de tirages de butin, chances par rareté du butin (%).
export const DIFFS = [
  {id:'e', name:'Balade',           tier:0, min:500_000,   ms:30 * MIN,  money:7_500,  rolls:2, odds:[60, 30, 9, 1, 0]},
  {id:'m', name:'Expédition',       tier:1, min:5_000_000, ms:120 * MIN, money:37_500, rolls:3, odds:[25, 40, 25, 9, 1]},
  {id:'h', name:'Grande traversée', tier:2, min:50_000_000,ms:240 * MIN, money:200_000, rolls:4, odds:[5, 20, 40, 27, 8]}
];
export const RARITY = ['Commun', 'Peu commun', 'Rare', 'Épique', 'Jackpot'];
// `bg` : décor du jeu ; `aff` : les deux types qui favorisent le butin de leur type.
export const EZONES = [
  {id:'riv', name:'Rivière Azur',     bg:'skyblueplains',   aff:['water', 'grass'],      tc:'#4a9be6', text:'Eaux calmes et berges herbeuses.'},
  {id:'gro', name:'Grotte Écho',      bg:'echocave',        aff:['rock', 'ground'],      tc:'#c9a85c', text:'Galeries sombres pleines de minerais.'},
  {id:'cen', name:'Centrale Volt',    bg:'powerplant',      aff:['electric', 'fire'],    tc:'#f5cf3a', text:'Une vieille centrale qui crépite encore.'},
  {id:'for', name:'Forêt Jade',       bg:'overgrownforest', aff:['bug', 'grass'],        tc:'#5fc25f', text:'Sous-bois épais, pleins de surprises.'},
  {id:'pla', name:'Plaine Sauvage',   bg:'wildplains',      aff:['normal', 'fighting'],  tc:'#d7a26a', text:'De grands espaces où l’on se dépense.'},
  {id:'ter', name:'Terres dévastées', bg:'ravagedfield',    aff:['poison', 'ghost'],     tc:'#a06ad6', text:'Un sol brûlé où traînent des choses étranges.'}
];
export const zoneById = id => EZONES.find(z => z.id === id) || EZONES[0];
export const diffById = id => DIFFS.find(d => d.id === id) || DIFFS[0];
// Butin : [objet, type, rareté 0-3]. Le type sert aux affinités ; "normal" n'a jamais de bonus.
export const LOOT = [
  ['potion','normal',0],['antidote','poison',0],['paralyze-heal','electric',0],['oran','normal',0],['ct-water','water',0],['ct-swift','normal',0],
  ['super-potion','normal',1],['burn-heal','fire',1],['awakening','psychic',1],['ice-heal','ice',1],['egg','normal',1],['band','fighting',1],
  ['fire-stone','fire',2],['water-stone','water',2],['thunder-stone','electric',2],['leaf-stone','grass',2],['moon-stone','psychic',2],['ct-thunder','electric',2],['ct-ice','ice',2],
  ['ct-rockslide','rock',2],['ct-earthquake','ground',2],['ct-megadrain','grass',2],['ct-bubblebeam','water',2],['ct-fireblast','fire',2],['ct-psychic','psychic',2],['ct-toxic','poison',2],
  ['hyper-potion','normal',3],['max-potion','normal',3],['leftovers','normal',3],['ct-blizzard','ice',3],['ct-doubleedge','normal',3],['incense','normal',3]
];
export const AFF_WEIGHT = 4, AFF_MONEY = .2;
// Affinité d'un Pokémon avec la zone : un de ses types est l'un des deux types de la zone.
export const isAff = (id, zone) => (types[id] || []).some(t => zone.aff.includes(t));
export const affinity = (team, zone) => team.filter(id => isAff(id, zone)).length;
export const teamPower = (team, powerOf) => team.reduce((n, id) => n + (powerOf(id) || 0), 0);
export const lootChance = aff => 25 + aff * 25;       // % de butin d'un type de la zone (affichage)
export const canStart = (team, zone, diff, powerOf) => team.length === TEAM_SIZE && new Set(team).size === TEAM_SIZE && teamPower(team, powerOf) >= diff.min;
export const emptyExped = () => ({sel:{zone:'riv', dif:'m', team:[]}, runs:[], nextId:1});
export function sanitizeExped(raw, counts = {}) {
  const o = emptyExped(); if (!raw || typeof raw !== 'object') return o;
  const ok = id => Number.isInteger(id) && id >= 1 && id <= 251;
  const sel = raw.sel || {};
  if (EZONES.some(z => z.id === sel.zone)) o.sel.zone = sel.zone;
  if (DIFFS.some(d => d.id === sel.dif)) o.sel.dif = sel.dif;
  const used = new Set();
  const runs = Array.isArray(raw.runs) ? raw.runs : [];
  for (const r of runs.slice(0, MAX_RUNS)) {
    if (!r || !EZONES.some(z => z.id === r.zone) || !DIFFS.some(d => d.id === r.dif)) continue;
    const team = Array.isArray(r.team) ? [...new Set(r.team.filter(ok))].slice(0, TEAM_SIZE) : [];
    if (team.length !== TEAM_SIZE || team.some(id => used.has(id)) || !Number.isFinite(r.start) || !Number.isFinite(r.end) || r.end < r.start) continue;
    team.forEach(id => used.add(id)); o.runs.push({id:Number.isInteger(r.id) ? r.id : o.runs.length + 1, zone:r.zone, dif:r.dif, team, start:r.start, end:r.end});
  }
  o.nextId = Math.max(1, ...o.runs.map(r => r.id + 1), Number.isInteger(raw.nextId) ? raw.nextId : 1);
  o.sel.team = Array.isArray(sel.team) ? [...new Set(sel.team.filter(id => ok(id) && counts[id] && !used.has(id)))].slice(0, TEAM_SIZE) : [];
  return o;
}
export const away = ex => new Set(ex.runs.flatMap(r => r.team));
export const progress = (run, now = Date.now()) => Math.max(0, Math.min(1, (now - run.start) / Math.max(1, run.end - run.start)));
export const runDone = (run, now = Date.now()) => now >= run.end;
export function toggle(ex, id, counts) {
  if (!counts[id] || away(ex).has(id)) return false;
  const t = ex.sel.team, i = t.indexOf(id);
  if (i >= 0) { t.splice(i, 1); return true; }
  if (t.length >= TEAM_SIZE) return false;
  t.push(id); return true;
}
export function start(ex, powerOf, now = Date.now()) {
  const zone = zoneById(ex.sel.zone), diff = diffById(ex.sel.dif), team = [...ex.sel.team];
  if (ex.runs.length >= MAX_RUNS || !canStart(team, zone, diff, powerOf) || team.some(id => away(ex).has(id))) return false;
  ex.runs.push({id:ex.nextId++, zone:zone.id, dif:diff.id, team, start:now, end:now + diff.ms}); ex.sel.team = []; return true;
}
const pickWeighted = (list, rand) => { const t = list.reduce((n, x) => n + x.w, 0); let r = rand() * t; for (const x of list) { r -= x.w; if (r < 0) return x; } return list[list.length - 1]; };
// Tire le butin : [{id, qty}] + argent + jackpot. `rand` et `moneyMult` injectables pour les tests.
export function rollReward(run, rand = Math.random, moneyMult = 1) {
  const zone = zoneById(run.zone), diff = diffById(run.dif), aff = affinity(run.team, zone);
  const items = {}; let jackpot = false;
  for (let i = 0; i < diff.rolls; i++) {
    let r = rand() * 100, tier = 0;
    for (let k = 0; k < 5; k++) { r -= diff.odds[k]; if (r < 0) { tier = k; break; } tier = k; }
    if (tier === 4) { jackpot = true; tier = 3; }
    const pool = LOOT.filter(l => l[2] === tier).map(l => ({id:l[0], w:1 + (zone.aff.includes(l[1]) ? AFF_WEIGHT * aff : 0)}));
    const it = pickWeighted(pool, rand); items[it.id] = (items[it.id] || 0) + 1;
  }
  const money = Math.round(diff.money * (1 + AFF_MONEY * aff) * (jackpot ? 3 : 1) * (0.9 + rand() * .2) * moneyMult);
  return {items:Object.entries(items).map(([id, qty]) => ({id, qty})), money, jackpot, aff};
}
export function claim(ex, runId, now = Date.now()) {
  const i = ex.runs.findIndex(r => r.id === runId); if (i < 0 || !runDone(ex.runs[i], now)) return null;
  return ex.runs.splice(i, 1)[0];
}
export const fmtLeft = ms => { const m = Math.max(0, Math.ceil(ms / MIN)); return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}` : `${m} min`; };
