import {effortYield} from './training.js';
// Données de combat issues de PokéAPI : stats de base, attaques apprises par niveau (jeux Rouge/Bleu,
// sinon Jaune) et détail des attaques (nom français, puissance, précision, type, catégorie).
// Tout est mis en cache dans localStorage ; sans réseau, des valeurs par défaut prennent le relais.
import {DEFAULT_BASE} from './battle.js';

const API = 'https://pokeapi.co/api/v2/';
const GROUPS = ['red-blue', 'yellow'];
const STAT = {hp:'hp', attack:'atk', defense:'def', 'special-attack':'spa', 'special-defense':'spd', speed:'spe'};
const spCache = new Map(), mvCache = new Map();

const store = {
  get(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
async function getJson(url, ms = 8000) {
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), ms);
  try { const r = await fetch(url, {signal:ctl.signal}); if (!r.ok) throw new Error(r.status); return await r.json(); }
  finally { clearTimeout(timer); }
}
const dedupe = (map, key, make) => { if (!map.has(key)) map.set(key, make().catch(e => { map.delete(key); throw e; })); return map.get(key); };

export const FALLBACK_MOVE = {name:'tackle', fr:'Charge', power:40, acc:100, type:'normal', cls:'physical'};
const fallbackSpecies = () => ({stats:{...DEFAULT_BASE}, learnset:[['tackle', 1]], fallback:true});

export function parseSpecies(json) {
  const stats = {...DEFAULT_BASE},evYield=effortYield(json.id);
  for (const s of json.stats || []) if (STAT[s.stat.name]) {stats[STAT[s.stat.name]] = s.base_stat;if(Number.isInteger(s.effort))evYield[STAT[s.stat.name]]=Math.max(0,Math.min(3,s.effort));}
  let learnset = [];
  for (const group of GROUPS) {
    const list = [];
    for (const m of json.moves || []) for (const d of m.version_group_details || [])
      if (d.version_group.name === group && d.move_learn_method.name === 'level-up') list.push([m.move.name, d.level_learned_at || 1]);
    if (list.length) { learnset = list; break; }
  }
  learnset.sort((a, b) => a[1] - b[1]);
  return {stats, evYield, learnset: learnset.length ? learnset : [['tackle', 1]]};
}

export function getSpecies(id) {
  return dedupe(spCache, id, async () => {
    const cached = store.get('pokeluck-sp-v2-' + id);
    if (cached) return cached;
    try { const sp = parseSpecies(await getJson(`${API}pokemon/${id}/`)); store.set('pokeluck-sp-v1-' + id, sp); return sp; }
    catch { return fallbackSpecies(); }
  });
}

export function parseMove(json) {
  const fr = json.names?.find(n => n.language.name === 'fr')?.name || json.name;
  return {name:json.name, fr, power:json.power ?? null, acc:json.accuracy ?? null, type:json.type?.name || 'normal', cls:json.damage_class?.name || 'status'};
}
export function getMove(name) {
  return dedupe(mvCache, name, async () => {
    const cached = store.get('pokeluck-mv-v1-' + name);
    if (cached) return cached;
    try { const mv = parseMove(await getJson(`${API}move/${name}/`)); store.set('pokeluck-mv-v1-' + name, mv); return mv; }
    catch { return name === 'tackle' ? FALLBACK_MOVE : {name, fr:name.replace(/-/g, ' '), power:null, acc:null, type:'normal', cls:'status', fallback:true}; }
  });
}
export const getMoves = names => Promise.all(names.map(getMove));
