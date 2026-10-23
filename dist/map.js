import {zones} from './world.js';

// Coordinates are percentages of the supplied 480×480 illustration.
// This is an artistic travel map, rather than an official geographical Kanto map.
export const mapSpots=[
  {id:'cave',x:13,y:12,w:25,h:23},
  {id:'route3',x:51,y:9,w:27,h:18},
  {id:'route4',x:89,y:35,w:21,h:24},
  {id:'route2',x:8,y:50,w:16,h:34},
  {id:'route',x:36,y:71,w:28,h:19},
  {id:'forest',x:78,y:88,w:41,h:24}
];

export function mapMarkup(selected,busy=false){
  const active=mapSpots.find(s=>s.id===selected);
  const zone=zones.find(z=>z.id===selected);
  return `<div class="illustrated-map" role="group" aria-label="Carte interactive des destinations de Kanto">
    <img class="exploration-image" src="assets/kanto-exploration.png" alt="Paysage pixel art avec une grotte en haut à gauche, une rivière, des sentiers et une forêt en bas à droite" draggable="false">
    <svg class="map-trails" viewBox="0 0 100 100" aria-hidden="true"><path d="M36 71 L24 68 L22 54 L11 48 M11 48 L10 29 L6 22 L13 12 M13 12 L28 13 L40 11 L51 9 M51 9 L67 15 L76 29 L89 35 M36 71 L52 80 L64 80 L78 88"/></svg>
    <span class="map-water" aria-hidden="true"></span><span class="map-glint g1" aria-hidden="true"></span><span class="map-glint g2" aria-hidden="true"></span>
    ${mapSpots.map(s=>{const z=zones.find(z=>z.id===s.id);return `<button class="map-hotspot ${s.id===selected?'current':''}" data-zone="${s.id}" aria-label="Voyager vers ${z.name}" aria-pressed="${s.id===selected}" ${busy?'disabled':''} style="left:${s.x-s.w/2}%;top:${s.y-s.h/2}%;width:${s.w}%;height:${s.h}%"><span class="map-tooltip">${z.name}</span></button>`;}).join('')}
    ${active?`<span class="map-position" aria-hidden="true" style="left:${active.x}%;top:${active.y}%"><span></span></span>`:''}
    <span class="sr-only">Destination actuelle : ${zone?.name||'Route 1'}. Sélectionnez un lieu sur la carte.</span>
  </div>`;
}
