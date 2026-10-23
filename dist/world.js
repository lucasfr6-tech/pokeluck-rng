import {pool} from './pokemon.js';
const typeRows=['grass poison','grass poison','grass poison','fire','fire','fire flying','water','water','water','bug','bug','bug flying','bug poison','bug poison','bug poison','normal flying','normal flying','normal flying','normal','normal','normal flying','normal flying','poison','poison','electric','electric','ground','ground','poison','poison','poison ground'];
export const types=Object.fromEntries(typeRows.map((s,i)=>[i+1,s.split(' ')]));
export const zones=[
 {id:'route',name:'Route 1',symbol:'⌁',label:'Les premiers pas',bonus:[],desc:'Un chemin tranquille pour commencer ton aventure.',note:'Tirage classique · aucun bonus',color:'route'},
 {id:'forest',name:'Forêt de Jade',symbol:'♧',label:'Au cœur de la forêt',bonus:['grass','bug'],desc:'Sous les feuillages, de nouvelles rencontres t’attendent.',note:'Plante & Insecte · poids ×3',color:'forest'},
 {id:'cave',name:'Mont Sélénite',symbol:'◇',label:'Dans les profondeurs',bonus:['rock','ground'],desc:'Une grotte mystérieuse où chaque rencontre résonne.',note:'Roche & Sol · poids ×3',color:'cave'},
 {id:'power',name:'Centrale',symbol:'ϟ',label:'Une rencontre électrique',bonus:['electric'],desc:'Quelque chose crépite entre les vieux générateurs.',note:'Électrik · poids ×3',color:'power'},
 {id:'route2',name:'Route 2',bonus:['normal','bug'],note:'Normal & Insecte · poids ×3',color:'route'},
 {id:'route3',name:'Route 3',bonus:['normal','flying'],note:'Normal & Vol · poids ×3',color:'route'},
 {id:'route4',name:'Route 4',bonus:['ground','flying'],note:'Sol & Vol · poids ×3',color:'route'}
];
export const itinerary=[{town:'Bourg Palette'},{zone:'route'},{town:'Jadielle'},{zone:'route2'},{zone:'forest'},{town:'Argenta'},{zone:'route3'},{zone:'cave'},{zone:'route4'},{town:'Azuria'}];
// Arrière-plans du cadre 1, un par zone (fichiers dans assets/backgrounds/).
export const backgrounds={route:'beauplains',route2:'wildplains',route3:'skyblueplains',route4:'ravagedfield',forest:'overgrownforest',cave:'echocave',power:'powerplant'};
export const backgroundFor=id=>`assets/backgrounds/${backgrounds[id]||backgrounds.route}.png`;
export const powers=[12,48,180,14,54,210,13,50,195,2,8,35,2,8,38,4,46,125,3,25,5,42,10,52,30,110,12,65,5,30,130];
export function zonePool(id){const zone=zones.find(z=>z.id===id)||zones[0];const entries=pool.map(p=>({...p,power:powers[p.id-1],probability:p.probability*(types[p.id].some(t=>zone.bonus.includes(t))?3:1)}));const total=entries.reduce((s,p)=>s+p.probability,0);return entries.map(p=>({...p,probability:p.probability/total}));}
export function draw(entries,random=Math.random()){let sum=0;for(const p of entries){sum+=p.probability;if(random<sum)return p;}return entries.at(-1);}
// Points de vie de la rencontre : valeur PROVISOIRE (10 × puissance), à définir avec le créateur.
export const maxHp=power=>power*10;
