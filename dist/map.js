import {zones} from './world.js';

// Coordonnées en pourcentage de l'illustration 480×480 (centre du rond, x et y).
// Carte artistique de voyage, pas une carte géographique officielle de Kanto.
// Les ronds forment une boucle dans le sens des aiguilles d'une montre, de la Route 1 (bas gauche) à la Centrale (bas droite).
export const mapSpots=[
  {id:'route',x:36,y:73},
  {id:'route2',x:12,y:56},
  {id:'forest',x:13,y:14},
  {id:'route3',x:51,y:9},
  {id:'cave',x:89,y:33},
  {id:'route4',x:77,y:65},
  {id:'power',x:76,y:88}
];

// Ordre du parcours : les zones classées par niveau (de la Route 1 à la Centrale).
export const routeOrder=[...zones].sort((a,b)=>a.levels[0]-b.levels[0]).map(z=>z.id);
const spotOf=id=>mapSpots.find(s=>s.id===id);
// Trait semi-transparent reliant les zones dans l'ordre, avec une flèche au milieu de chaque étape :
// les étapes déjà franchies (jusqu'à la zone actuelle) sont pleines, les suivantes en pointillés.
function routeSvg(selected){
  const cur=routeOrder.indexOf(selected);let out='';
  for(let i=0;i<routeOrder.length-1;i++){
    const a=spotOf(routeOrder[i]),b=spotOf(routeOrder[i+1]),dx=b.x-a.x,dy=b.y-a.y,k=0.14;
    const cx=(a.x+b.x)/2-dy*k,cy=(a.y+b.y)/2+dx*k;
    const mx=.25*a.x+.5*cx+.25*b.x,my=.25*a.y+.5*cy+.25*b.y;
    const ang=Math.atan2((b.y-a.y),(b.x-a.x))*180/Math.PI;
    // tangente au milieu de la courbe quadratique : dérivée en t=.5 = (b - a)
    out+=`<g class="route-step${i<cur?' done':''}"><path class="under" d="M${a.x} ${a.y} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x} ${b.y}"/><path class="line" d="M${a.x} ${a.y} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x} ${b.y}"/><path class="arrow" transform="translate(${mx.toFixed(1)} ${my.toFixed(1)}) rotate(${ang.toFixed(0)})" d="M-1.8 -1.6 L1.6 0 L-1.8 1.6 Z"/></g>`;
  }
  return `<svg class="map-route" viewBox="0 0 100 100" aria-hidden="true">${out}</svg>`;
}

const SHOP_ICON='<svg viewBox="0 0 40 40" aria-hidden="true"><path class="sh-roof" d="M4 16 L8 6 H32 L36 16 Z"/><path class="sh-stripe" d="M12 6 L11 16 M20 6 V16 M28 6 L29 16"/><rect class="sh-wall" x="6" y="16" width="28" height="18"/><rect class="sh-door" x="16" y="22" width="8" height="12"/><rect class="sh-win" x="8" y="20" width="6" height="6"/><rect class="sh-win" x="26" y="20" width="6" height="6"/></svg>';
export function mapMarkup(selected,busy=false,shops=[]){
  const zone=zones.find(z=>z.id===selected);
  return `<div class="illustrated-map" role="group" aria-label="Carte interactive des destinations de Kanto">
    <img class="exploration-image" src="assets/kanto-exploration.png" alt="Paysage pixel art avec une grotte en haut à gauche, une rivière, des sentiers et une forêt en bas à droite" draggable="false">
    ${routeSvg(selected)}
    <span class="map-water" aria-hidden="true"></span><span class="map-glint g1" aria-hidden="true"></span><span class="map-glint g2" aria-hidden="true"></span>
    ${mapSpots.map(s=>{const z=zones.find(z=>z.id===s.id);const current=s.id===selected;const side=s.x>72?' edge-r':s.x<28?' edge-l':'';const pos=s.y<18?' below':'';return `<button class="map-spot${current?' current':''}${side}${pos}" data-zone="${s.id}" aria-label="Voyager vers ${z.name}" aria-pressed="${current}" ${busy?'disabled':''} style="left:${s.x}%;top:${s.y}%"><span class="map-spot-dot" aria-hidden="true"></span><span class="map-num" aria-hidden="true">${routeOrder.indexOf(s.id)+1}</span><span class="map-tooltip">${routeOrder.indexOf(s.id)+1} · ${z.name}</span></button>`;}).join('')}
    ${shops.map(s=>`<button class="map-shop${s.open?' open':' closed'}" data-shop="${s.id}" style="left:${s.x}%;top:${s.y}%" aria-label="${s.name}${s.open?'':' (fermée : '+s.kills+' / '+s.need+' Pokémon vaincus)'}"><span class="map-shop-art">${SHOP_ICON}</span>${s.open?'':`<span class="map-shop-lock" aria-hidden="true">${s.kills}/${s.need}</span>`}<span class="map-tooltip">${s.name}${s.open?'':' · '+s.kills+' / '+s.need}</span></button>`).join('')}
    <span class="sr-only">Destination actuelle : ${zone?.name||'Route 1'}. Sélectionnez un rond lumineux sur la carte pour voyager.</span>
  </div>`;
}
