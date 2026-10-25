// Œufs de type : achetés en boutique, ils éclosent après TYPE_EGG_NEED victoires et donnent un Pokémon
// aléatoire du type choisi (parmi toute la région), avec de meilleures chances de rareté que dans la nature.
import {pool} from './pokemon.js';
import {types, tierOf, adjustedShares, speciesRegion} from './world.js';
export const TYPE_EGG_NEED = 50, TYPE_EGG_SLOTS = 3;
// Part de chaque palier (Commun … Légendaire) dans un œuf : nettement plus généreuse que les tirages sauvages.
export const EGG_SHARES = [.22, .30, .28, .16, .04];
export const TYPE_FR = {grass:'Plante', fire:'Feu', water:'Eau', electric:'Électrik', normal:'Normal', bug:'Insecte', poison:'Poison', ground:'Sol', flying:'Vol', fighting:'Combat', psychic:'Psy', rock:'Roche', ice:'Glace', ghost:'Spectre', dragon:'Dragon'};
export const TYPE_COL = {grass:'#78c850', fire:'#f08030', water:'#6890f0', electric:'#f8d030', normal:'#a8a878', bug:'#a8b820', poison:'#a040a0', ground:'#e0c068', flying:'#a890f0', fighting:'#c03028', psychic:'#f85888', rock:'#b8a038', ice:'#98d8d8', ghost:'#705898', dragon:'#7038f8'};
export const EGG_TYPES = Object.keys(TYPE_FR);
export const eggPrice = t => t === 'psychic' ? 70000 : ['dragon', 'ghost', 'ice'].includes(t) ? 90000 : 40000;
// Chance fixe de chaque légendaire dans certains œufs (Œuf Psy : Mewtwo et Mew à 5 % chacun) ; le reste du tirage se partage le reste.
export const LEGENDARY_EGG_EACH = {psychic: .05};
export const eggPool = (type, regions = ['kanto']) => pool.filter(p => regions.includes(speciesRegion(p.id)) && types[p.id].includes(type)).map(p => p.id);
// Probabilité de chaque espèce : le palier est tiré d'après EGG_SHARES (+ bonus de Ball), restreint aux paliers présents.
export function eggOdds(type, rarityBonus = 0, regions = ['kanto']) {
  const ids = eggPool(type, regions), by = {};
  for (const id of ids) (by[tierOf(id)] = by[tierOf(id)] || []).push(id);
  const sh = adjustedShares(EGG_SHARES, rarityBonus), tiers = Object.keys(by).map(Number), sum = tiers.reduce((n, t) => n + sh[t - 1], 0) || 1;
  const odds = ids.map(id => ({id, tier: tierOf(id), probability: sh[tierOf(id) - 1] / sum / by[tierOf(id)].length}));
  const fixed = regions.includes('kanto') ? LEGENDARY_EGG_EACH[type] : undefined, leg = odds.filter(o => o.tier === 5), rest = odds.filter(o => o.tier !== 5);
  if (!fixed || !leg.length || !rest.length) return odds;
  for (const o of leg) o.probability = fixed;
  const restSum = rest.reduce((n, o) => n + o.probability, 0), k = (1 - fixed * leg.length) / restSum; for (const o of rest) o.probability *= k;
  return odds;
}
export function hatchPick(type, rarityBonus = 0, regions = ['kanto'], rand = Math.random) {
  const odds = eggOdds(type, rarityBonus, regions); let r = rand();
  for (const o of odds) { if (r < o.probability) return o.id; r -= o.probability; }
  return odds.at(-1)?.id;
}
export const sanitizeTypeEggs = raw => Array.isArray(raw) ? raw.filter(e => e && TYPE_FR[e.type] && Number.isFinite(e.start) && e.start >= 0).slice(0, TYPE_EGG_SLOTS).map(e => e.region === 'johto' ? {type: e.type, start: e.start, region: 'johto'} : {type: e.type, start: e.start}) : [];
export const eggRegions = e => [e?.region === 'johto' ? 'johto' : 'kanto'];
export const typeEggProgress = (e, wins) => Math.max(0, Math.min(TYPE_EGG_NEED, wins - e.start));
export const typeEggReady = (e, wins) => typeEggProgress(e, wins) >= TYPE_EGG_NEED;
export function addTypeEgg(state, type, wins, region = 'kanto') {
  state.typeEggs = sanitizeTypeEggs(state.typeEggs);
  if (state.typeEggs.length >= TYPE_EGG_SLOTS) return false;
  state.typeEggs.push(region === 'johto' ? {type, start: wins, region} : {type, start: wins}); return true;
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
export function typeEggsHtml(state, wins) {
  const list = sanitizeTypeEggs(state.typeEggs);
  const cards = Array.from({length: TYPE_EGG_SLOTS}, (_, i) => {
    const e = list[i];
    if (!e) return `<div class="te-card empty"><span class="te-slot">Emplacement ${i + 1}</span><small>Libre · achète un Œuf de type en boutique</small></div>`;
    const p = typeEggProgress(e, wins), ready = p >= TYPE_EGG_NEED, c = TYPE_COL[e.type];
    return `<div class="te-card${ready ? ' ready' : ''}" data-te-odds="${i}" role="button" tabindex="0" title="Voir les Pokémon possibles" style="--c:${c}"><span class="te-egg" aria-hidden="true"><img src="assets/egg.png" alt=""><i></i></span><b>Œuf ${esc(TYPE_FR[e.type])}${e.region === 'johto' ? ' de Johto' : ''}</b><div class="te-bar" role="progressbar" aria-valuenow="${p}" aria-valuemax="${TYPE_EGG_NEED}"><i style="width:${p / TYPE_EGG_NEED * 100}%"></i></div><small>${ready ? 'Prêt à éclore !' : `${p} / ${TYPE_EGG_NEED} victoires`}</small>${ready ? `<button type="button" class="pg-button te-hatch" data-te-hatch="${i}">Faire éclore !</button>` : ''}</div>`;
  }).join('');
  return `<section class="te-box" aria-label="Œufs de type"><div class="te-head"><h3>Œufs de type</h3><span>${TYPE_EGG_NEED} victoires pour éclore · Pokémon du type choisi, rareté meilleure que dans la nature</span></div><div class="te-grid">${cards}</div></section>`;
}
