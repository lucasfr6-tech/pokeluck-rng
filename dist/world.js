import {pool,ancestors,sameLine,baseTotals} from './pokemon.js';
import {timeMult} from './daycycle.js';
const typeRows=['grass poison','grass poison','grass poison','fire','fire','fire flying','water','water','water','bug','bug','bug flying','bug poison','bug poison','bug poison','normal flying','normal flying','normal flying','normal','normal','normal flying','normal flying','poison','poison','electric','electric','ground','ground','poison','poison','poison ground',
 'poison','poison','poison ground','normal','normal','fire','fire','normal','normal','poison flying','poison flying','grass poison','grass poison','grass poison','bug grass','bug grass','bug poison','bug poison','ground','ground','normal','normal','water','water','fighting','fighting','fire','fire','water','water','water fighting','psychic','psychic','psychic','fighting','fighting','fighting','grass poison','grass poison','grass poison','water poison','water poison','rock ground','rock ground','rock ground','fire','fire','water psychic','water psychic','electric','electric','normal flying','normal flying','normal flying','water','water ice','poison','poison','water','water ice','ghost poison','ghost poison','ghost poison','rock ground','psychic','psychic','water','water','electric','electric','grass psychic','grass psychic','ground','ground','fighting','fighting','normal','poison','poison','ground rock','ground rock','normal','grass','normal','water','water','water','water','water','water psychic','psychic','bug flying','ice psychic','electric','fire','bug','normal','water','water flying','water ice','normal','normal','water','electric','fire','normal','rock water','rock water','rock water','rock water','rock flying','normal','ice flying','electric flying','fire flying','dragon','dragon','dragon flying','psychic','psychic','grass','grass','grass','fire','fire','fire','water','water','water','normal','normal','normal flying','normal flying','bug flying','bug flying','bug poison','bug poison','poison flying','water electric','water electric','electric','fairy','normal fairy','fairy','fairy flying','psychic flying','psychic flying','electric','electric','electric','grass','water fairy','water fairy','rock','water','grass flying','grass flying','grass flying','normal','grass','grass','bug flying','water ground','water ground','psychic','dark','dark flying','water psychic','ghost','psychic','psychic','normal psychic','bug','bug steel','normal','ground flying','steel ground','fairy','fairy','water poison','bug steel','bug rock','bug fighting','dark ice','normal','normal','fire','fire rock','ice ground','ice ground','water rock','water','water','ice flying','water flying','steel flying','dark fire','dark fire','water dragon','ground','ground','normal','normal','normal','fighting','fighting','ice psychic','electric','fire','normal','normal','electric','fire','water','rock ground','rock ground','rock dark','psychic flying','fire flying','psychic grass'];
if(typeRows.length!==pool.length)throw new Error('Types et espèces désynchronisés');
// Région d'origine d'une espèce : 1–151 Kanto, 152–251 Johto. Une zone ne propose que les espèces de sa région.
export const KANTO_COUNT=151,TOTAL_SPECIES=251;
export const speciesRegion=id=>id<=KANTO_COUNT?'kanto':'johto';
export const types=Object.fromEntries(typeRows.map((s,i)=>[i+1,s.split(' ')]));
// 16 zones sur un parcours en serpentin (voir arena.js : 2 zones, puis une arène). `min` = niveau minimal du Pokémon de tête pour y entrer ;
// les sauvages ont le niveau de la zone (niveau d’entrée jusqu’à +2, plafonné avant la zone suivante) — voir wildLevelZone.
export const zones=[
 {id:'route',min:1,shares:[1],levels:[3,7],name:'Route 1',symbol:'⌁',label:'Les premiers pas',bonus:[],desc:'Un chemin tranquille pour commencer ton aventure.',note:'Tirage classique · aucun bonus',color:'route'},
 {id:'route2',min:8,shares:[.75,.25],levels:[7,15],name:'Route 2',bonus:['normal','bug'],note:'Normal & Insecte · poids ×3',color:'route'},
 {id:'forest',min:16,shares:[.55,.30,.15],levels:[14,26],name:'Forêt de Jade',symbol:'♧',label:'Au cœur de la forêt',bonus:['grass','bug'],desc:'Sous les feuillages, de nouvelles rencontres t’attendent.',note:'Plante & Insecte · poids ×3',color:'forest'},
 {id:'route3',min:22,shares:[.40,.35,.25],levels:[24,38],name:'Route 3',bonus:['normal','flying'],note:'Normal & Vol · poids ×3',color:'route'},
 {id:'cave',min:28,shares:[.34,.30,.24,.12],levels:[36,54],name:'Mont Sélénite',symbol:'◇',label:'Dans les profondeurs',bonus:['rock','ground'],desc:'Une grotte mystérieuse où chaque rencontre résonne.',note:'Roche & Sol · poids ×3',color:'cave'},
 {id:'route4',min:34,shares:[.28,.28,.26,.18],levels:[52,75],name:'Route 4',bonus:['ground','flying'],note:'Sol & Vol · poids ×3',color:'route'},
 {id:'bridge',min:40,shares:[.26,.27,.26,.21],levels:[40,45],name:'Pont Pépite',bonus:['water','bug'],note:'Eau & Insecte · poids ×3',color:'route'},
 {id:'rocktunnel',min:46,shares:[.24,.26,.26,.24],levels:[46,51],name:'Tunnel Roche',bonus:['rock','fighting'],note:'Roche & Combat · poids ×3',color:'cave'},
 {id:'tower',min:52,shares:[.22,.25,.26,.27],levels:[52,57],name:'Tour Pokémon',bonus:['ghost','poison'],note:'Spectre & Poison · poids ×3',color:'cave'},
 {id:'safari',min:58,shares:[.20,.24,.26,.30],levels:[58,63],name:'Parc Safari',bonus:['grass','normal'],note:'Plante & Normal · poids ×3',color:'forest'},
 {id:'power',min:64,shares:[.22,.26,.26,.254,.006],levels:[64,69],name:'Centrale',symbol:'ϟ',label:'Une rencontre électrique',bonus:['electric'],desc:'Quelque chose crépite entre les vieux générateurs.',note:'Électrik · poids ×3',color:'power'},
 {id:'seafoam',min:70,shares:[.20,.25,.26,.28,.01],levels:[70,75],name:'Îles Écume',bonus:['ice','water'],note:'Glace & Eau · poids ×3',color:'cave'},
 {id:'mansion',min:76,shares:[.17,.23,.26,.31,.03],levels:[76,81],name:'Manoir Pokémon',bonus:['fire','psychic'],note:'Feu & Psy · poids ×3',color:'cave'},
 {id:'ceruleancave',min:82,shares:[.14,.21,.26,.35,.04],levels:[82,87],name:'Grotte Azurée',bonus:['psychic','water'],note:'Psy & Eau · poids ×3',color:'cave'},
 {id:'victory',min:88,shares:[.12,.19,.26,.38,.05],levels:[88,93],name:'Route Victoire',bonus:['fighting','dragon'],note:'Combat & Dragon · poids ×3',color:'route'},
 {id:'league',min:94,shares:[.10,.18,.24,.40,.08],levels:[94,100],name:'Plateau Indigo',bonus:['dragon','psychic'],note:'Dragon & Psy · poids ×3',color:'route'}
];
zones.forEach(z=>{z.tier=z.shares.length;});
export const itinerary=[{town:'Bourg Palette'},{zone:'route'},{town:'Jadielle'},{zone:'route2'},{zone:'forest'},{town:'Argenta'},{zone:'route3'},{zone:'cave'},{zone:'route4'},{town:'Azuria'}];
// Arrière-plans du cadre 1, un par zone (fichiers dans assets/backgrounds/).
export const backgrounds={route:'beauplains',route2:'wildplains',route3:'skyblueplains',route4:'ravagedfield',forest:'overgrownforest',cave:'echocave',power:'powerplant',bridge:'skyblueplains',rocktunnel:'echocave',tower:'echocave',safari:'wildplains',seafoam:'echocave',mansion:'ravagedfield',ceruleancave:'echocave',victory:'ravagedfield',league:'skyblueplains'};
export const backgroundFor=id=>`assets/backgrounds/${backgrounds[id]||backgrounds.route}.png`;
// Puissance de référence (au niveau 5) : ≈ 375 × (total des stats de base / 300)^5. Elle grandit ensuite avec le niveau (voir levels.js).
// Valeurs PROVISOIRES : Bulbizarre démarre vers 500, une équipe de six légendaires niveau 100 plafonne vers 50 millions.
export const powers=baseTotals.map(total=>Math.max(1,Math.round(375*(total/300)**5)));
if(powers.length!==pool.length)throw new Error('Puissances et espèces désynchronisées');
// Paliers de rareté (PROVISOIRES), selon les statistiques de base totales : 1 Communs (≤ 320), 2 Peu communs (≤ 420),
// 3 Rares (≤ 485), 4 Épiques (au-delà), 5 Légendaires (liste fixe).
export const TIER_NAMES=['','Communs','Peu communs','Rares','Épiques','Légendaires'];
const LEGENDARY=[144,145,146,150,151,243,244,245,249,250,251];
export const tierOf=id=>LEGENDARY.includes(id)?5:(t=>t<=320?1:t<=420?2:t<=485?3:4)(baseTotals[id-1]);
// Chaque zone répartit ses tirages entre les paliers (`shares`, du palier 1 au palier 5, total 100 %) :
// la Route 1 ne donne que des Communs, puis chaque zone laisse une place plus grande aux paliers suivants.
// Dans un palier, les espèces se départagent selon leurs poids de base, avec le bonus de type ×3 de la zone.
// `rarityBonus` (Super Ball, Hyper Ball…) multiplie la part de chaque palier au-dessus des Communs, puis le total est ramené à 100 %.
export function adjustedShares(shares,rarityBonus=0){if(!rarityBonus||shares.length<2)return shares;const raw=shares.map((s,i)=>i===0?s:s*(1+rarityBonus)),total=raw.reduce((a,b)=>a+b,0);return raw.map(s=>s/total);}
let periodSource=()=>null;export const setPeriodSource=fn=>{periodSource=typeof fn==='function'?fn:()=>null;};
export function zonePool(id,rarityBonus=0,period=undefined){const per=period===undefined?periodSource():period||null;const zone0=zones.find(z=>z.id===id)||zones[0],zone={...zone0,shares:adjustedShares(zone0.shares,rarityBonus)};
 const entries=pool.filter(p=>speciesRegion(p.id)===(zone.region||'kanto')&&zone.shares[tierOf(p.id)-1]>0).map(p=>({...p,power:powers[p.id-1],tier:tierOf(p.id),probability:p.probability*(types[p.id].some(t=>zone.bonus.includes(t))?3:1)*timeMult(types[p.id],per)}));
 const sums={};for(const p of entries)sums[p.tier]=(sums[p.tier]||0)+p.probability;
 // Légendaires : plus l'espèce est forte, plus elle est rare (Mewtwo bien plus rare qu'un oiseau), et le palier entier est réduit. La chance (balls, Pokédex, encens…) agit toujours dessus.
 const legW=p=>p.tier===5?Math.pow((baseTotals[p.id-1]||580)/580,-LEGENDARY_STRENGTH_EXP)*(p.id===151?.55:p.id<=146?1.3:1):1;
 for(const p of entries)if(p.tier===5)p.probability*=legW(p);
 sums[5]=entries.filter(p=>p.tier===5).reduce((n,p)=>n+p.probability,0);
 let all=entries.map(p=>({...p,probability:zone.shares[p.tier-1]*p.probability/sums[p.tier]*(p.tier===5?LEGENDARY_SCALE:1)}));
 {const leg=all.filter(p=>p.tier===5).reduce((n,p)=>n+p.probability,0),rest=1-leg,others=all.filter(p=>p.tier!==5).reduce((n,p)=>n+p.probability,0);if(others>0)all=all.map(p=>p.tier===5?p:{...p,probability:p.probability*rest/others});}
 return all;}
export const LEGENDARY_MAX_ODDS=200,LEGENDARY_SCALE=.28,LEGENDARY_STRENGTH_EXP=-1;
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
