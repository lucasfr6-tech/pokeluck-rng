import {zones, zonePool, tierOf, types, TIER_NAMES, powers} from './world.js';
import {evolvesFrom} from './pokemon.js';
import {ITEMS} from './shop.js';
import {minLevel} from './levels.js';

// Pokédex : paliers d'espèces découvertes, évolutions et zones où l'on trouve chaque espèce.
export const DEX_TOTAL = 151;
// Chaque palier fixe le bonus de chance (raretés) du Pokédex : +5 %, +15 %, +25 %, +50 % (le dernier atteint, pas cumulé). 25 et 151 ajoutent de l'argent.
export const DEX_MILESTONES = [
  {n:25,  luck:.05, money:20000,  label:'Chance +5 % · 20 000 ₽'},
  {n:50,  luck:.15, label:'Chance +15 %'},
  {n:100, luck:.25, label:'Chance +25 %'},
  {n:151, luck:.50, money:500000, label:'Chance +50 % · 500 000 ₽ · titre Maître Pokédex'}
];
// Pokédex chromatique : 151 formes brillantes ; chaque palier multiplie la chance de chromatique (+5 %, +15 %, +25 %, +50 %, le dernier atteint, pas cumulé).
export const SHINY_MILESTONES = [
  {n:5,   mult:.05, label:'Chromatiques +5 %'},
  {n:20,  mult:.15, label:'Chromatiques +15 %'},
  {n:50,  mult:.25, label:'Chromatiques +25 %', money:100000},
  {n:151, mult:.50, label:'Chromatiques +50 % · 1 000 000 ₽ · titre Chasseur brillant', money:1000000}
];
export const sanitizeDex = raw => { const claimed = {}, shinyClaimed = {}; if (raw?.claimed && typeof raw.claimed === 'object') for (const m of DEX_MILESTONES) if (raw.claimed[m.n] === true) claimed[m.n] = true; if (raw?.shinyClaimed && typeof raw.shinyClaimed === 'object') for (const m of SHINY_MILESTONES) if (raw.shinyClaimed[m.n] === true) shinyClaimed[m.n] = true; return {claimed, shinyClaimed}; };
export const shinyDexLuck = dex => SHINY_MILESTONES.reduce((l, m) => dex?.shinyClaimed?.[m.n] ? Math.max(l, m.mult) : l, 0);
export const shinyOwned = shinyCounts => Object.keys(shinyCounts || {}).filter(k => shinyCounts[k] > 0).length;
export const shinyMilestoneState = (dex, owned) => SHINY_MILESTONES.map(m => ({...m, claimed: !!dex?.shinyClaimed?.[m.n], ready: owned >= m.n && !dex?.shinyClaimed?.[m.n]}));
export const dexLuck = dex => DEX_MILESTONES.reduce((l, m) => dex?.claimed?.[m.n] ? Math.max(l, m.luck) : l, 0);
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
  return zones.map(z => ({id:z.id, name:z.name, min:z.min, p:zonePool(z.id,0,false).find(e => e.id === id)?.probability || 0})).filter(z => z.p > 0).sort((a, b) => b.p - a.p);
}
export const dexInfo = id => ({types:types[id], tier:tierOf(id), tierName:TIER_NAMES[tierOf(id)], power:powers[id - 1]});
