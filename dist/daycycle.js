// Cycle jour / crépuscule / nuit / matin selon l'heure locale du joueur.
// Chaque période favorise certains types de Pokémon sauvages (×3 pour le type vedette, ×2 pour les autres)
// et teinte la carte. Le bonus se cumule avec le bonus de type de la zone.
export const PERIODS = {
  morning:{id:'morning', name:'Matin', from:6, to:11, stone:'dawn-stone', text:'Le matin, les Pokémon Vol sont ×3 plus fréquents, Plante et Insecte ×2.', types:{flying:3, grass:2, bug:2}},
  day:{id:'day', name:'Jour', from:11, to:18, stone:'sun-stone', text:'Le jour, les Pokémon Feu sont ×3 plus fréquents, Électrik et Sol ×2.', types:{fire:3, electric:2, ground:2}},
  dusk:{id:'dusk', name:'Crépuscule', from:18, to:21, stone:'dusk-stone', text:'Au crépuscule, les Pokémon Psy sont ×3 plus fréquents, Dragon et Roche ×2.', types:{psychic:3, dragon:2, rock:2}},
  night:{id:'night', name:'Nuit', from:21, to:6, stone:'moon-stone', text:'La nuit, les Pokémon Spectre sont ×3 plus fréquents, Poison et Glace ×2.', types:{ghost:3, poison:2, ice:2}}
};
export const PERIOD_ORDER = ['morning', 'day', 'dusk', 'night'];
export function periodAt(date = new Date()) {
  const h = date.getHours();
  if (h >= 6 && h < 11) return PERIODS.morning;
  if (h >= 11 && h < 18) return PERIODS.day;
  if (h >= 18 && h < 21) return PERIODS.dusk;
  return PERIODS.night;
}
// Période réelle, ou forcée par ?tod=night|dusk|morning|day dans l'adresse (pour tester).
export function currentPeriod(date = new Date(), search = (typeof location !== 'undefined' ? location.search : '')) {
  const forced = /[?&]tod=(morning|day|dusk|night)/.exec(search || '')?.[1];
  return forced ? PERIODS[forced] : periodAt(date);
}
// Multiplicateur de fréquence d'un Pokémon (selon ses types) pour une période.
export const timeMult = (types, period) => period ? Math.max(1, ...(types || []).map(t => period.types[t] || 1)) : 1;
