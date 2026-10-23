import {pool} from './pokemon.js';
const typeRows=['grass poison','grass poison','grass poison','fire','fire','fire flying','water','water','water','bug','bug','bug flying','bug poison','bug poison','bug poison','normal flying','normal flying','normal flying','normal','normal','normal flying','normal flying','poison','poison','electric','electric','ground','ground','poison','poison','poison ground'];
export const types=Object.fromEntries(typeRows.map((s,i)=>[i+1,s.split(' ')]));
export const zones=[
 {id:'route',name:'Route 1',symbol:'⌁',label:'Les premiers pas',bonus:[],desc:'Un chemin tranquille pour commencer ton aventure.',note:'Tirage classique · aucun bonus',color:'route'},
 {id:'forest',name:'Forêt de Jade',symbol:'♧',label:'Au cœur de la forêt',bonus:['grass','bug'],desc:'Sous les feuillages, de nouvelles rencontres t’attendent.',note:'Plante & Insecte · poids ×3',color:'forest'},
 {id:'cave',name:'Mont Sélénite',symbol:'◇',label:'Dans les profondeurs',bonus:['rock','ground'],desc:'Une grotte mystérieuse où chaque rencontre résonne.',note:'Roche & Sol · poids ×3',color:'cave'},
 {id:'power',name:'Centrale',symbol:'ϟ',label:'Une rencontre électrique',bonus:['electric'],desc:'Quelque chose crépite entre les vieux générateurs.',note:'Électrik · poids ×3',color:'power'}
];
export const powers=[12,48,180,14,54,210,13,50,195,2,8,35,2,8,38,4,46,125,3,25,5,42,10,52,30,110,12,65,5,30,130];
export function zonePool(id){const zone=zones.find(z=>z.id===id)||zones[0];const entries=pool.map(p=>({...p,power:powers[p.id-1],probability:p.probability*(types[p.id].some(t=>zone.bonus.includes(t))?3:1)}));const total=entries.reduce((s,p)=>s+p.probability,0);return entries.map(p=>({...p,probability:p.probability/total}));}
export function draw(entries,random=Math.random()){let sum=0;for(const p of entries){sum+=p.probability;if(random<sum)return p;}return entries.at(-1);}
