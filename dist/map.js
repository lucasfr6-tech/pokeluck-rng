import {zones} from './world.js';

// Coordonnées en pourcentage de l'illustration 480×480 (centre du rond, x et y).
// Carte artistique de voyage, pas une carte géographique officielle de Kanto.
export const mapSpots=[
  {id:'cave',x:13,y:14},
  {id:'route3',x:51,y:9},
  {id:'route4',x:89,y:33},
  {id:'route2',x:12,y:56},
  {id:'route',x:36,y:73},
  {id:'forest',x:76,y:88},
  {id:'power',x:77,y:65}
];

export function mapMarkup(selected,busy=false){
  const zone=zones.find(z=>z.id===selected);
  return `<div class="illustrated-map" role="group" aria-label="Carte interactive des destinations de Kanto">
    <img class="exploration-image" src="assets/kanto-exploration.png" alt="Paysage pixel art avec une grotte en haut à gauche, une rivière, des sentiers et une forêt en bas à droite" draggable="false">
    <svg class="map-trails" viewBox="0 0 100 100" aria-hidden="true"><path d="M36 73 L24 68 L22 54 L11 48 M11 48 L10 29 L6 22 L13 12 M13 12 L28 13 L40 11 L51 9 M51 9 L67 15 L76 29 L89 35 M36 73 L52 80 L64 80 L78 88"/></svg>
    <span class="map-water" aria-hidden="true"></span><span class="map-glint g1" aria-hidden="true"></span><span class="map-glint g2" aria-hidden="true"></span>
    ${mapSpots.map(s=>{const z=zones.find(z=>z.id===s.id);const current=s.id===selected;const side=s.x>72?' edge-r':s.x<28?' edge-l':'';const pos=s.y<18?' below':'';return `<button class="map-spot${current?' current':''}${side}${pos}" data-zone="${s.id}" aria-label="Voyager vers ${z.name}" aria-pressed="${current}" ${busy?'disabled':''} style="left:${s.x}%;top:${s.y}%"><span class="map-spot-dot" aria-hidden="true"></span><span class="map-tooltip">${z.name}</span></button>`;}).join('')}
    <span class="sr-only">Destination actuelle : ${zone?.name||'Route 1'}. Sélectionnez un rond lumineux sur la carte pour voyager.</span>
  </div>`;
}
