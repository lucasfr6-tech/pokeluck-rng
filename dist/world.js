import {pool,ancestors,sameLine} from './pokemon.js';
const typeRows=['grass poison','grass poison','grass poison','fire','fire','fire flying','water','water','water','bug','bug','bug flying','bug poison','bug poison','bug poison','normal flying','normal flying','normal flying','normal','normal','normal flying','normal flying','poison','poison','electric','electric','ground','ground','poison','poison','poison ground',
 'poison','poison','poison ground','normal','normal','fire','fire','normal','normal','poison flying','poison flying','grass poison','grass poison','grass poison','bug grass','bug grass','bug poison','bug poison','ground','ground','normal','normal','water','water','fighting','fighting','fire','fire','water','water','water fighting','psychic','psychic','psychic','fighting','fighting','fighting','grass poison','grass poison','grass poison','water poison','water poison','rock ground','rock ground','rock ground','fire','fire','water psychic','water psychic','electric','electric','normal flying','normal flying','normal flying','water','water ice','poison','poison','water','water ice','ghost poison','ghost poison','ghost poison','rock ground','psychic','psychic','water','water','electric','electric','grass psychic','grass psychic','ground','ground','fighting','fighting','normal','poison','poison','ground rock','ground rock','normal','grass','normal','water','water','water','water','water','water psychic','psychic','bug flying','ice psychic','electric','fire','bug','normal','water','water flying','water ice','normal','normal','water','electric','fire','normal','rock water','rock water','rock water','rock water','rock flying','normal','ice flying','electric flying','fire flying','dragon','dragon','dragon flying','psychic','psychic'];
if(typeRows.length!==pool.length)throw new Error('Types et espèces désynchronisés');
export const types=Object.fromEntries(typeRows.map((s,i)=>[i+1,s.split(' ')]));
export const zones=[
 {id:'route',levels:[3,7],name:'Route 1',symbol:'⌁',label:'Les premiers pas',bonus:[],desc:'Un chemin tranquille pour commencer ton aventure.',note:'Tirage classique · aucun bonus',color:'route'},
 {id:'forest',levels:[14,26],name:'Forêt de Jade',symbol:'♧',label:'Au cœur de la forêt',bonus:['grass','bug'],desc:'Sous les feuillages, de nouvelles rencontres t’attendent.',note:'Plante & Insecte · poids ×3',color:'forest'},
 {id:'cave',levels:[36,54],name:'Mont Sélénite',symbol:'◇',label:'Dans les profondeurs',bonus:['rock','ground'],desc:'Une grotte mystérieuse où chaque rencontre résonne.',note:'Roche & Sol · poids ×3',color:'cave'},
 {id:'power',levels:[72,100],name:'Centrale',symbol:'ϟ',label:'Une rencontre électrique',bonus:['electric'],desc:'Quelque chose crépite entre les vieux générateurs.',note:'Électrik · poids ×3',color:'power'},
 {id:'route2',levels:[7,15],name:'Route 2',bonus:['normal','bug'],note:'Normal & Insecte · poids ×3',color:'route'},
 {id:'route3',levels:[24,38],name:'Route 3',bonus:['normal','flying'],note:'Normal & Vol · poids ×3',color:'route'},
 {id:'route4',levels:[52,75],name:'Route 4',bonus:['ground','flying'],note:'Sol & Vol · poids ×3',color:'route'}
];
export const itinerary=[{town:'Bourg Palette'},{zone:'route'},{town:'Jadielle'},{zone:'route2'},{zone:'forest'},{town:'Argenta'},{zone:'route3'},{zone:'cave'},{zone:'route4'},{town:'Azuria'}];
// Arrière-plans du cadre 1, un par zone (fichiers dans assets/backgrounds/).
export const backgrounds={route:'beauplains',route2:'wildplains',route3:'skyblueplains',route4:'ravagedfield',forest:'overgrownforest',cave:'echocave',power:'powerplant'};
export const backgroundFor=id=>`assets/backgrounds/${backgrounds[id]||backgrounds.route}.png`;
export const powers=[12,48,180,14,54,210,13,50,195,2,8,35,2,8,38,4,46,125,3,25,5,42,10,52,30,110,12,65,5,30,130,
 // Espèces 32 à 151 : puissance PROVISOIRE déduite des statistiques de base (≈ 12 × (total/300)^5).
 ...([273,365,505,323,483,299,505,270,435,245,455,320,395,490,285,405,305,450,265,425,290,440,320,500,305,455,350,555,300,385,510,310,400,500,305,405,505,300,390,490,335,515,300,390,495,410,500,315,490,325,465,377,310,470,325,475,325,500,305,525,310,405,500,385,328,483,325,475,330,490,325,530,320,425,455,455,385,340,490,345,485,450,435,490,295,440,320,450,340,520,460,500,455,490,495,500,490,200,540,535,288,325,525,525,525,395,355,495,355,495,515,540,580,580,580,300,420,600,680,600]).map(total=>Math.max(1,Math.round(12*(total/300)**5)))];
if(powers.length!==pool.length)throw new Error('Puissances et espèces désynchronisées');
export function zonePool(id){const zone=zones.find(z=>z.id===id)||zones[0];const entries=pool.map(p=>({...p,power:powers[p.id-1],probability:p.probability*(types[p.id].some(t=>zone.bonus.includes(t))?3:1)}));const total=entries.reduce((s,p)=>s+p.probability,0);return entries.map(p=>({...p,probability:p.probability/total}));}
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
