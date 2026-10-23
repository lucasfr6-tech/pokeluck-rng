import {pool,ancestors,sameLine,baseTotals} from './pokemon.js';
const typeRows=['grass poison','grass poison','grass poison','fire','fire','fire flying','water','water','water','bug','bug','bug flying','bug poison','bug poison','bug poison','normal flying','normal flying','normal flying','normal','normal','normal flying','normal flying','poison','poison','electric','electric','ground','ground','poison','poison','poison ground',
 'poison','poison','poison ground','normal','normal','fire','fire','normal','normal','poison flying','poison flying','grass poison','grass poison','grass poison','bug grass','bug grass','bug poison','bug poison','ground','ground','normal','normal','water','water','fighting','fighting','fire','fire','water','water','water fighting','psychic','psychic','psychic','fighting','fighting','fighting','grass poison','grass poison','grass poison','water poison','water poison','rock ground','rock ground','rock ground','fire','fire','water psychic','water psychic','electric','electric','normal flying','normal flying','normal flying','water','water ice','poison','poison','water','water ice','ghost poison','ghost poison','ghost poison','rock ground','psychic','psychic','water','water','electric','electric','grass psychic','grass psychic','ground','ground','fighting','fighting','normal','poison','poison','ground rock','ground rock','normal','grass','normal','water','water','water','water','water','water psychic','psychic','bug flying','ice psychic','electric','fire','bug','normal','water','water flying','water ice','normal','normal','water','electric','fire','normal','rock water','rock water','rock water','rock water','rock flying','normal','ice flying','electric flying','fire flying','dragon','dragon','dragon flying','psychic','psychic'];
if(typeRows.length!==pool.length)throw new Error('Types et espèces désynchronisés');
export const types=Object.fromEntries(typeRows.map((s,i)=>[i+1,s.split(' ')]));
export const zones=[
 {id:'route',shares:[1],levels:[3,7],name:'Route 1',symbol:'⌁',label:'Les premiers pas',bonus:[],desc:'Un chemin tranquille pour commencer ton aventure.',note:'Tirage classique · aucun bonus',color:'route'},
 {id:'forest',shares:[.55,.30,.15],levels:[14,26],name:'Forêt de Jade',symbol:'♧',label:'Au cœur de la forêt',bonus:['grass','bug'],desc:'Sous les feuillages, de nouvelles rencontres t’attendent.',note:'Plante & Insecte · poids ×3',color:'forest'},
 {id:'cave',shares:[.34,.30,.24,.12],levels:[36,54],name:'Mont Sélénite',symbol:'◇',label:'Dans les profondeurs',bonus:['rock','ground'],desc:'Une grotte mystérieuse où chaque rencontre résonne.',note:'Roche & Sol · poids ×3',color:'cave'},
 {id:'power',shares:[.22,.26,.26,.254,.006],levels:[72,100],name:'Centrale',symbol:'ϟ',label:'Une rencontre électrique',bonus:['electric'],desc:'Quelque chose crépite entre les vieux générateurs.',note:'Électrik · poids ×3',color:'power'},
 {id:'route2',shares:[.75,.25],levels:[7,15],name:'Route 2',bonus:['normal','bug'],note:'Normal & Insecte · poids ×3',color:'route'},
 {id:'route3',shares:[.40,.35,.25],levels:[24,38],name:'Route 3',bonus:['normal','flying'],note:'Normal & Vol · poids ×3',color:'route'},
 {id:'route4',shares:[.28,.28,.26,.18],levels:[52,75],name:'Route 4',bonus:['ground','flying'],note:'Sol & Vol · poids ×3',color:'route'}
];
zones.forEach(z=>{z.tier=z.shares.length;});
export const itinerary=[{town:'Bourg Palette'},{zone:'route'},{town:'Jadielle'},{zone:'route2'},{zone:'forest'},{town:'Argenta'},{zone:'route3'},{zone:'cave'},{zone:'route4'},{town:'Azuria'}];
// Arrière-plans du cadre 1, un par zone (fichiers dans assets/backgrounds/).
export const backgrounds={route:'beauplains',route2:'wildplains',route3:'skyblueplains',route4:'ravagedfield',forest:'overgrownforest',cave:'echocave',power:'powerplant'};
export const backgroundFor=id=>`assets/backgrounds/${backgrounds[id]||backgrounds.route}.png`;
// Puissance de référence (au niveau 5) : ≈ 375 × (total des stats de base / 300)^5. Elle grandit ensuite avec le niveau (voir levels.js).
// Valeurs PROVISOIRES : Bulbizarre démarre vers 500, une équipe de légendaires niveau 100 se compte en milliards.
export const powers=baseTotals.map(total=>Math.max(1,Math.round(375*(total/300)**5)));
if(powers.length!==pool.length)throw new Error('Puissances et espèces désynchronisées');
// Paliers de rareté (PROVISOIRES), selon les statistiques de base totales : 1 Communs (≤ 320), 2 Peu communs (≤ 420),
// 3 Rares (≤ 485), 4 Épiques (au-delà), 5 Légendaires (liste fixe).
export const TIER_NAMES=['','Communs','Peu communs','Rares','Épiques','Légendaires'];
const LEGENDARY=[144,145,146,150,151];
export const tierOf=id=>LEGENDARY.includes(id)?5:(t=>t<=320?1:t<=420?2:t<=485?3:4)(baseTotals[id-1]);
// Chaque zone répartit ses tirages entre les paliers (`shares`, du palier 1 au palier 5, total 100 %) :
// la Route 1 ne donne que des Communs, puis chaque zone laisse une place plus grande aux paliers suivants.
// Dans un palier, les espèces se départagent selon leurs poids de base, avec le bonus de type ×3 de la zone.
// `rarityBonus` (Super Ball, Hyper Ball…) multiplie la part de chaque palier au-dessus des Communs, puis le total est ramené à 100 %.
export function adjustedShares(shares,rarityBonus=0){if(!rarityBonus||shares.length<2)return shares;const raw=shares.map((s,i)=>i===0?s:s*(1+rarityBonus)),total=raw.reduce((a,b)=>a+b,0);return raw.map(s=>s/total);}
export function zonePool(id,rarityBonus=0){const zone0=zones.find(z=>z.id===id)||zones[0],zone={...zone0,shares:adjustedShares(zone0.shares,rarityBonus)};
 const entries=pool.filter(p=>zone.shares[tierOf(p.id)-1]>0).map(p=>({...p,power:powers[p.id-1],tier:tierOf(p.id),probability:p.probability*(types[p.id].some(t=>zone.bonus.includes(t))?3:1)}));
 const sums={};for(const p of entries)sums[p.tier]=(sums[p.tier]||0)+p.probability;
 return entries.map(p=>({...p,probability:zone.shares[p.tier-1]*p.probability/sums[p.tier]}));}
export function draw(entries,random=Math.random()){let sum=0;for(const p of entries){sum+=p.probability;if(random<sum)return p;}return entries.at(-1);}
// Points de vie de la rencontre : valeur PROVISOIRE (10 × puissance), à définir avec le créateur.
export const maxHp=power=>power*10;

// Équipe : une seule forme par lignée. Une évolution prend la place de sa forme précédente.
export function dedupeLines(team){return team.filter(m=>!team.some(o=>o!==m&&ancestors(o).includes(m)));}
// Équipe après la première capture d'une espèce : remplace sa forme précédente, ignore une forme plus ancienne,
// sinon l'ajoute s'il reste de la place.
export function teamAfterCapture(team,id){
  if(team.includes(id)||team.some(m=>ancestors(m).includes(id)))return team;
  const at=team.findIndex(m=>ancestors(id).includes(m));
  if(at>=0){const next=[...team];next[at]=id;return next;}
  return team.length<6?[...team,id]:team;
}
// Équipement manuel : remplace sur place une forme de la même lignée, sinon ajoute s'il reste de la place.
export function teamAfterEquip(team,id){
  if(team.includes(id))return team;
  const at=team.findIndex(m=>sameLine(m,id));
  if(at>=0){const next=[...team];next[at]=id;return next;}
  return team.length<6?[...team,id]:team;
}

// Dépôt manuel dans une case : échange deux équipiers ou remplace la cible.
// La collection conserve le Pokémon retiré ; une seule forme par lignée reste équipée.
export function teamAfterDrop(team,id,index){
 if(!Number.isInteger(index)||index<0||index>5)return [...team];
 const next=[...team],from=next.indexOf(id),to=Math.min(index,next.length);
 if(from>=0){if(to===next.length)return next;[next[from],next[to]]=[next[to],next[from]];return next;}
 if(to<next.length)next[to]=id;else if(next.length<6)next.push(id);
 return next.filter(member=>member===id||!sameLine(member,id));
}
