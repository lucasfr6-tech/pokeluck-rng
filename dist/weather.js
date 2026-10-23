import {zones} from './world.js';

// Météo par zone : fixe, visible dans la zone et en combat. Elle ne s'applique pas aux arènes ni au Conseil des 4.
// Soleil : Feu ×1,5, Eau ×0,5. Pluie : Eau ×1,5, Feu ×0,5. Grêle : −1/16 des PV max à chaque tour, sauf type Glace.
export const WEATHER = {
  clear: {id:'clear', name:'Temps dégagé', icon:'⛅', hint:'Aucun effet sur les attaques.'},
  sun:   {id:'sun',   name:'Grand soleil', icon:'☀️', hint:'Attaques Feu ×1,5 · attaques Eau ×0,5.'},
  rain:  {id:'rain',  name:'Pluie',        icon:'🌧️', hint:'Attaques Eau ×1,5 · attaques Feu ×0,5.'},
  hail:  {id:'hail',  name:'Grêle',        icon:'❄️', hint:'Chaque tour : −1/16 des PV, sauf pour les types Glace.'}
};
export const ZONE_WEATHER = {route:'sun', route2:'sun', forest:'rain', route3:'clear', cave:'hail', route4:'clear', bridge:'rain', rocktunnel:'clear', tower:'clear', safari:'sun', power:'clear', seafoam:'hail', mansion:'sun', ceruleancave:'rain', victory:'clear', league:'hail'};
export const weatherOf = zoneId => WEATHER[ZONE_WEATHER[zoneId]] || WEATHER.clear;
export function weatherMult(weather, moveType) {
  if (weather === 'sun') return moveType === 'fire' ? 1.5 : moveType === 'water' ? .5 : 1;
  if (weather === 'rain') return moveType === 'water' ? 1.5 : moveType === 'fire' ? .5 : 1;
  return 1;
}
export const hailHits = f => !f.types.includes('ice');
export const weatherZones = () => zones.map(z => z.id);
