import {zones, zonePool, tierOf, types, TIER_NAMES, powers} from './world.js';
import {evolvesFrom} from './pokemon.js';
import {ITEMS} from './shop.js';
import {minLevel} from './levels.js';

// Pokédex : paliers d'espèces découvertes, évolutions et zones où l'on trouve chaque espèce.
export const DEX_TOTAL = 151;
export const DEX_MILESTONES = [
  {n:25,  kind:'money',  money:20000,  label:'20 000 ₽'},
  {n:50,  kind:'slot',   label:'+1 place d’objet tenu par Pokémon'},
  {n:100, kind:'chroma', label:'Charme Chroma · chromatiques ×4'},
  {n:151, kind:'money',  money:500000, label:'500 000 ₽ · titre Maître Pokédex'}
];
export const sanitizeDex = raw => { const claimed = {}; if (raw?.claimed && typeof raw.claimed === 'object') for (const m of DEX_MILESTONES) if (raw.claimed[m.n] === true) claimed[m.n] = true; return {claimed}; };
export const dexSlotBonus = dex => dex?.claimed?.[50] ? 1 : 0;
export const dexMaster = (dex, discovered) => !!dex?.claimed?.[151] && discovered >= DEX_TOTAL;
export const milestoneState = (dex, discovered) => DEX_MILESTONES.map(m => ({...m, claimed: !!dex?.claimed?.[m.n], ready: discovered >= m.n && !dex?.claimed?.[m.n]}));
export const nextEvolutions = id => Object.keys(evolvesFrom).map(Number).filter(to => evolvesFrom[to] === id);
export function evolutionHow(from, to) {
  const stone = Object.values(ITEMS).find(i => i.kind === 'stone' && i.evolves?.[from] === to);
  return stone ? stone.name : `Niv. ${minLevel(to)}`;
}
export function lineOf(id) { // de la forme de base à toutes ses évolutions, par étapes
  let root = id; while (evolvesFrom[root]) root = evolvesFrom[root];
  const stages = [[root]]; let cur = [root];
  for (;;) { const next = cur.flatMap(nextEvolutions); if (!next.length) break; stages.push(next); cur = next; }
  return stages;
}
export function zonesOf(id) {
  return zones.map(z => ({id:z.id, name:z.name, min:z.min, p:zonePool(z.id).find(e => e.id === id)?.probability || 0})).filter(z => z.p > 0).sort((a, b) => b.p - a.p);
}
export const dexInfo = id => ({types:types[id], tier:tierOf(id), tierName:TIER_NAMES[tierOf(id)], power:powers[id - 1]});
