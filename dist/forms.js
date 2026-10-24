// Formes spéciales : Méga-évolutions (Méga-Gemme) et Dynamax (Bracelet Dynamax), achetées avec les Bonbons de l'espèce.
// Les statistiques et types sont ceux des vrais jeux ; les sprites sont les formes de PokéAPI (identifiants de formes 10033+).
import {baseTotals} from './pokemon.js';

export const FORM_MIN_LEVEL = 70;
export const CANDY_PER_DUPLICATE = 1, CANDY_PER_SHINY_DUPLICATE = 5;
const st = (hp, atk, def, spa, spd, spe) => ({hp, atk, def, spa, spd, spe});
const M = (species, key, fid, name, item, itemSprite, stats, types, cost = 150) => ({species, key, fid, kind:'mega', name, item, itemSprite, stats, types, cost, minLevel:FORM_MIN_LEVEL});
const D = (species, fid, name) => ({species, key:'dyna', fid, kind:'dyna', name:'Dynamax ' + name, item:'Bracelet Dynamax', itemSprite:'dynamax-band', stats:null, types:null, cost:200, minLevel:FORM_MIN_LEVEL});
export const FORMS = [
  M(3, 'mega', 10033, 'Méga-Florizarre', 'Florizarrite', 'venusaurite', st(80, 100, 123, 122, 120, 80), ['grass', 'poison']),
  M(6, 'megax', 10034, 'Méga-Dracaufeu X', 'Dracaufite X', 'charizardite-x', st(78, 130, 111, 130, 85, 100), ['fire', 'dragon']),
  M(6, 'megay', 10035, 'Méga-Dracaufeu Y', 'Dracaufite Y', 'charizardite-y', st(78, 104, 78, 159, 115, 100), ['fire', 'flying']),
  M(9, 'mega', 10036, 'Méga-Tortank', 'Tortankite', 'blastoisinite', st(79, 103, 120, 135, 115, 78), ['water']),
  M(15, 'mega', 10090, 'Méga-Dardargnan', 'Dardargnite', 'beedrillite', st(65, 150, 40, 15, 80, 145), ['bug', 'poison'], 120),
  M(18, 'mega', 10073, 'Méga-Roucarnage', 'Roucarnagite', 'pidgeotite', st(83, 80, 80, 135, 80, 121), ['normal', 'flying'], 120),
  M(65, 'mega', 10037, 'Méga-Alakazam', 'Alakazamite', 'alakazite', st(55, 50, 65, 175, 105, 150), ['psychic']),
  M(80, 'mega', 10071, 'Méga-Flagadoss', 'Flagadossite', 'slowbronite', st(95, 75, 180, 130, 80, 30), ['water', 'psychic'], 120),
  M(94, 'mega', 10038, 'Méga-Ectoplasma', 'Ectoplasmite', 'gengarite', st(60, 65, 80, 170, 95, 130), ['ghost', 'poison']),
  M(115, 'mega', 10039, 'Méga-Kangourex', 'Kangourexite', 'kangaskhanite', st(105, 125, 100, 60, 100, 100), ['normal'], 120),
  M(127, 'mega', 10040, 'Méga-Scarabrute', 'Scarabrutite', 'pinsirite', st(65, 155, 120, 65, 90, 105), ['bug', 'flying'], 120),
  M(130, 'mega', 10041, 'Méga-Léviator', 'Léviatorite', 'gyaradosite', st(95, 155, 109, 70, 130, 81), ['water', 'dark']),
  M(142, 'mega', 10042, 'Méga-Ptéra', 'Ptéranite', 'aerodactylite', st(80, 135, 85, 70, 95, 150), ['rock', 'flying']),
  M(150, 'megax', 10043, 'Méga-Mewtwo X', 'Mewtwoïte X', 'mewtwonite-x', st(106, 190, 100, 154, 100, 130), ['psychic', 'fighting'], 300),
  M(150, 'megay', 10044, 'Méga-Mewtwo Y', 'Mewtwoïte Y', 'mewtwonite-y', st(106, 150, 70, 194, 120, 140), ['psychic'], 300),
  D(3, 10195, 'Florizarre'), D(6, 10196, 'Dracaufeu'), D(9, 10197, 'Tortank'), D(12, 10198, 'Papilusion'), D(25, 10199, 'Pikachu'), D(52, 10200, 'Miaouss'),
  D(68, 10201, 'Mackogneur'), D(94, 10202, 'Ectoplasma'), D(99, 10203, 'Krabboss'), D(131, 10204, 'Lokhlass'), D(133, 10205, 'Évoli'), D(143, 10206, 'Ronflex')
];
export const formsOf = species => FORMS.filter(f => f.species === species);
export const formSpecies = [...new Set(FORMS.map(f => f.species))];
export const findForm = (species, key) => FORMS.find(f => f.species === species && f.key === key) || null;
export const formTotal = f => f.stats ? Object.values(f.stats).reduce((a, b) => a + b, 0) : 0;
// Puissance : une Méga-évolution applique le rapport des totaux de stats à la puissance 2,5 (adoucie par rapport à la formule des puissances) ; le Dynamax donne un bonus fixe.
export const DYNAMAX_POWER = 1.25, MEGA_POWER_EXP = 2.5;
export const formPowerMult = (species, key) => { const f = findForm(species, key); if (!f) return 1; return f.kind === 'dyna' ? DYNAMAX_POWER : (formTotal(f) / (baseTotals[species - 1] || formTotal(f))) ** MEGA_POWER_EXP; };
export const blankForms = () => ({owned:{}, active:{}});
const keyOf = (species, key) => species + ':' + key;
export const ownsForm = (forms, species, key) => !!forms.owned[keyOf(species, key)];
export const activeKey = (forms, species) => { const k = forms.active[species]; return k && ownsForm(forms, species, k) && findForm(species, k) ? k : null; };
export const activeForm = (forms, species) => { const k = activeKey(forms, species); return k ? findForm(species, k) : null; };
export function sanitizeForms(raw, counts = {}) {
  const o = blankForms(); if (!raw || typeof raw !== 'object') return o;
  for (const f of FORMS) if (raw.owned?.[keyOf(f.species, f.key)] === true && counts[f.species]) o.owned[keyOf(f.species, f.key)] = true;
  for (const f of FORMS) if (raw.active?.[f.species] === f.key && o.owned[keyOf(f.species, f.key)]) o.active[f.species] = f.key;
  return o;
}
export const sanitizeCandy = (raw, counts = {}) => { const o = {}; if (raw && typeof raw === 'object') for (const [id, n] of Object.entries(raw)) if (Number.isInteger(+id) && +id >= 1 && +id <= 151 && Number.isSafeInteger(n) && n > 0) o[id] = Math.min(n, 999999); return o; };
export const candyOf = (candy, species) => candy[species] || 0;
export const addCandy = (candy, species, n) => { if (!(n > 0)) return 0; candy[species] = Math.min(999999, (candy[species] || 0) + Math.floor(n)); return Math.floor(n); };
// Achat : le Pokémon doit avoir le niveau requis, et assez de Bonbons de son espèce.
export function canBuy(state, species, key, level) {
  const f = findForm(species, key); if (!f) return {ok:false, reason:'unknown'};
  if (!state.counts[species]) return {ok:false, reason:'missing'};
  if (ownsForm(state.forms, species, key)) return {ok:false, reason:'owned'};
  if (level < f.minLevel) return {ok:false, reason:'level', need:f.minLevel};
  if (candyOf(state.candy, species) < f.cost) return {ok:false, reason:'candy', missing:f.cost - candyOf(state.candy, species)};
  return {ok:true};
}
export function buyForm(state, species, key, level) {
  const c = canBuy(state, species, key, level); if (!c.ok) return c;
  const f = findForm(species, key); state.candy[species] -= f.cost; if (state.candy[species] <= 0) delete state.candy[species];
  state.forms.owned[keyOf(species, key)] = true; return c;
}
export function equipForm(state, species, key) {
  if (key === null) { delete state.forms.active[species]; return true; }
  if (!ownsForm(state.forms, species, key) || !findForm(species, key)) return false;
  state.forms.active[species] = key; return true;
}
