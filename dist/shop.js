// Boutiques posées sur la carte, objets achetables et effets actifs.
import {zones} from './world.js';
import {fmtMoney} from './money.js';
const SPRITE = n => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${n}.png`;
export const CLERK_SPRITE = 'https://play.pokemonshowdown.com/sprites/trainers/clerk.png';
// Prix PROVISOIRES, calés sur le temps de farm visé (Super Ball ≈ 15 min, Multi-XP ≈ 45 min, Hyper Ball ≈ 1 h, Pièce Rune ≈ 3 h).
export const ITEMS = {
  poke:   {id:'poke',   kind:'ball',    name:'Poké Ball',     price:0,       sprite:SPRITE('poke-ball'),   bonus:0,    effect:'Tirage normal · aucun bonus de rareté', desc:'La Poké Ball de départ. Aucun bonus.'},
  super:  {id:'super',  kind:'ball',    name:'Super Ball',    price:7500,    sprite:SPRITE('great-ball'),  bonus:.25,  effect:'Raretés +25 %', desc:'Équipée sur la Pokéball du milieu, elle augmente de 25 % la part des Pokémon rares à chaque tirage.'},
  hyper:  {id:'hyper',  kind:'ball',    name:'Hyper Ball',    price:90000,   sprite:SPRITE('ultra-ball'),  bonus:.60,  effect:'Raretés +60 %', desc:'Équipée sur la Pokéball du milieu, elle augmente de 60 % la part des Pokémon rares à chaque tirage.'},
  safari: {id:'safari', kind:'ball',    name:'Safari Ball',   price:300000,  sprite:SPRITE('safari-ball'), bonus:.75,  effect:'Raretés +75 %', desc:'Équipée sur la Pokéball du milieu, elle augmente de 75 % la part des Pokémon rares à chaque tirage. La meilleure Ball en vente.'},
  xp:     {id:'xp',     kind:'passive', name:'Multi-XP',      price:75000,   sprite:SPRITE('exp-share'),   effect:'XP ×1,5 · toute l’équipe partage l’XP', desc:'Actif dès l’achat : tes combats rapportent 50 % d’XP en plus, et les Pokémon de l’équipe qui n’ont pas combattu gagnent la moitié de l’XP.'},
  rune:   {id:'rune',   kind:'passive', name:'Pièce Rune',    price:900000,  sprite:SPRITE('amulet-coin'), effect:'Pokédollars ×2 sur les combats', desc:'Actif dès l’achat : chaque victoire rapporte deux fois plus de Pokédollars.'},
  potion: {id:'potion', kind:'heal', stack:true, heal:20, name:'Potion', price:3000, sprite:SPRITE('potion'), effect:'Rend 20 PV · utilisable en combat', desc:'Comme dans les jeux : rend 20 PV à un Pokémon. Se range dans le sac et s’utilise en combat (le Pokémon sauvage joue son tour).'},
  'super-potion': {id:'super-potion', kind:'heal', stack:true, heal:50, name:'Super Potion', price:8000, sprite:SPRITE('super-potion'), effect:'Rend 50 PV · utilisable en combat', desc:'Comme dans les jeux : rend 50 PV à un Pokémon. Se range dans le sac et s’utilise en combat (le Pokémon sauvage joue son tour).'},
  'antidote': {id:'antidote', kind:'heal', stack:true, heal:0, cures:['psn','tox'], name:'Antidote', price:1000, sprite:SPRITE('antidote'), effect:'Guérit le poison · utilisable en combat', desc:'Comme dans les jeux : guérit le poison. Se range dans le sac et s’utilise en combat (le Pokémon sauvage joue son tour).'},
  'paralyze-heal': {id:'paralyze-heal', kind:'heal', stack:true, heal:0, cures:['par'], name:'Anti-Para', price:2000, sprite:SPRITE('paralyze-heal'), effect:'Guérit la paralysie · utilisable en combat', desc:'Comme dans les jeux : guérit la paralysie. Se range dans le sac et s’utilise en combat (le Pokémon sauvage joue son tour).'},
  'awakening': {id:'awakening', kind:'heal', stack:true, heal:0, cures:['slp'], name:'Réveil', price:2500, sprite:SPRITE('awakening'), effect:'Réveille un Pokémon endormi · utilisable en combat', desc:'Comme dans les jeux : réveille un pokémon endormi. Se range dans le sac et s’utilise en combat (le Pokémon sauvage joue son tour).'},
  'burn-heal': {id:'burn-heal', kind:'heal', stack:true, heal:0, cures:['brn'], name:'Anti-Brûle', price:2500, sprite:SPRITE('burn-heal'), effect:'Guérit la brûlure · utilisable en combat', desc:'Comme dans les jeux : guérit la brûlure. Se range dans le sac et s’utilise en combat (le Pokémon sauvage joue son tour).'},
  'full-heal': {id:'full-heal', kind:'heal', stack:true, heal:0, cures:'all', name:'Total Soin', price:6000, sprite:SPRITE('full-heal'), effect:'Guérit tous les statuts (et la confusion) · utilisable en combat', desc:'Comme dans les jeux : guérit tous les statuts (et la confusion). Se range dans le sac et s’utilise en combat (le Pokémon sauvage joue son tour).'},
  'ct-rockslide': {id:'ct-rockslide', kind:'tm', stack:true, move:'rock-slide', name:'CT48 · Éboulement', price:0, reward:true, sprite:SPRITE('tm-rock'), effect:'Roche · Puissance 75 · Précision 90', desc:'Récompense d’arène. Apprend l’attaque à un Pokémon compatible. Consommable : disparaît après usage.'},
  'ct-bubblebeam': {id:'ct-bubblebeam', kind:'tm', stack:true, move:'bubble-beam', name:'CT11 · Bulles d’O', price:0, reward:true, sprite:SPRITE('tm-water'), effect:'Eau · Puissance 65 · Précision 100', desc:'Récompense d’arène. Apprend l’attaque à un Pokémon compatible. Consommable : disparaît après usage.'},
  'ct-megadrain': {id:'ct-megadrain', kind:'tm', stack:true, move:'mega-drain', name:'CT21 · Méga-Sangsue', price:0, reward:true, sprite:SPRITE('tm-grass'), effect:'Plante · Puissance 40 · absorbe la moitié des dégâts', desc:'Récompense d’arène. Apprend l’attaque à un Pokémon compatible. Consommable : disparaît après usage.'},
  'ct-toxic': {id:'ct-toxic', kind:'tm', stack:true, move:'toxic', name:'CT06 · Toxik', price:0, reward:true, sprite:SPRITE('tm-poison'), effect:'Poison · Statut · Précision 90 · poison grave', desc:'Récompense d’arène. Apprend l’attaque à un Pokémon compatible. Consommable : disparaît après usage.'},
  'ct-psychic': {id:'ct-psychic', kind:'tm', stack:true, move:'psychic', name:'CT29 · Psyko', price:0, reward:true, sprite:SPRITE('tm-psychic'), effect:'Psy · Puissance 90 · Précision 100', desc:'Récompense d’arène. Apprend l’attaque à un Pokémon compatible. Consommable : disparaît après usage.'},
  'ct-fireblast': {id:'ct-fireblast', kind:'tm', stack:true, move:'fire-blast', name:'CT38 · Déflagration', price:0, reward:true, sprite:SPRITE('tm-fire'), effect:'Feu · Puissance 110 · Précision 85', desc:'Récompense d’arène. Apprend l’attaque à un Pokémon compatible. Consommable : disparaît après usage.'},
  'ct-earthquake': {id:'ct-earthquake', kind:'tm', stack:true, move:'earthquake', name:'CT26 · Séisme', price:0, reward:true, sprite:SPRITE('tm-ground'), effect:'Sol · Puissance 100 · Précision 100', desc:'Récompense d’arène. Apprend l’attaque à un Pokémon compatible. Consommable : disparaît après usage.'},
  'hyper-potion': {id:'hyper-potion', kind:'heal', stack:true, heal:120, name:'Hyper Potion', price:20000, sprite:SPRITE('hyper-potion'), effect:'Rend 120 PV · utilisable en combat', desc:'Comme dans les jeux : rend 120 PV à un Pokémon. Se range dans le sac et s’utilise en combat (le Pokémon adverse joue son tour).'},
  'max-potion': {id:'max-potion', kind:'heal', stack:true, heal:9999, name:'Potion Max', price:45000, sprite:SPRITE('max-potion'), effect:'Rend tous les PV · utilisable en combat', desc:'Comme dans les jeux : rend tous les PV à un Pokémon. Se range dans le sac et s’utilise en combat (le Pokémon adverse joue son tour).'},
  'ice-heal': {id:'ice-heal', kind:'heal', stack:true, heal:0, cures:['frz'], name:'Anti-Gel', price:2500, sprite:SPRITE('ice-heal'), effect:'Dégèle un Pokémon · utilisable en combat', desc:'Comme dans les jeux : dégèle un Pokémon gelé. Se range dans le sac et s’utilise en combat (le Pokémon adverse joue son tour).'},
  leftovers: {id:'leftovers', kind:'held', stack:true, name:'Restes', price:80000, sprite:SPRITE('leftovers'), effect:'Rend 1/16 des PV max à chaque tour', desc:'Comme dans les jeux : le porteur récupère un peu de PV à la fin de chaque tour de combat. Objet tenu, un seul par Pokémon.'},
  'ct-blizzard': {id:'ct-blizzard', kind:'tm', stack:true, move:'blizzard', name:'CT14 · Blizzard', price:90000, sprite:SPRITE('tm-ice'), effect:'Glace · Puissance 110 · Précision 70', desc:'Apprend Blizzard à un Pokémon compatible. Consommable : disparaît après usage.'},
  'ct-doubleedge': {id:'ct-doubleedge', kind:'tm', stack:true, move:'double-edge', name:'CT10 · Damoclès', price:75000, sprite:SPRITE('tm-normal'), effect:'Normal · Puissance 120 · Précision 100 · contrecoup', desc:'Apprend Damoclès à un Pokémon compatible. Consommable : disparaît après usage.'},
  'fire-stone': {id:'fire-stone', kind:'stone', stack:true, evolves:{37:38,58:59,133:136}, name:'Pierre Feu', price:60000, sprite:SPRITE('fire-stone'), effect:'Fait évoluer Goupix, Caninos, Évoli', desc:'Comme dans les jeux : fait évoluer certains Pokémon (Goupix, Caninos, Évoli). S’utilise depuis le profil du Pokémon, puis disparaît.'},
  'water-stone': {id:'water-stone', kind:'stone', stack:true, evolves:{61:62,90:91,120:121,133:134}, name:'Pierre Eau', price:60000, sprite:SPRITE('water-stone'), effect:'Fait évoluer Têtarte, Kokiyas, Stari, Évoli', desc:'Comme dans les jeux : fait évoluer certains Pokémon (Têtarte, Kokiyas, Stari, Évoli). S’utilise depuis le profil du Pokémon, puis disparaît.'},
  'thunder-stone': {id:'thunder-stone', kind:'stone', stack:true, evolves:{25:26,133:135}, name:'Pierre Foudre', price:70000, sprite:SPRITE('thunder-stone'), effect:'Fait évoluer Pikachu, Évoli', desc:'Comme dans les jeux : fait évoluer Pikachu ou Évoli. S’utilise depuis le profil du Pokémon, puis disparaît.'},
  'leaf-stone': {id:'leaf-stone', kind:'stone', stack:true, evolves:{44:45,70:71,102:103}, name:'Pierre Plante', price:70000, sprite:SPRITE('leaf-stone'), effect:'Fait évoluer Ortide, Boustiflor, Noeunoeuf', desc:'Comme dans les jeux : fait évoluer certains Pokémon (Ortide, Boustiflor, Noeunoeuf). S’utilise depuis le profil du Pokémon, puis disparaît.'},
  'moon-stone': {id:'moon-stone', kind:'stone', stack:true, evolves:{30:31,33:34,35:36,39:40}, name:'Pierre Lune', price:80000, sprite:SPRITE('moon-stone'), effect:'Fait évoluer Nidorina, Nidorino, Mélofée, Rondoudou', desc:'Comme dans les jeux : fait évoluer certains Pokémon (Nidorina, Nidorino, Mélofée, Rondoudou). S’utilise depuis le profil du Pokémon, puis disparaît.'},
  'ct-water': {id:'ct-water', kind:'tm', stack:true, move:'water-gun', name:'CT12 · Pistolet à O', price:3000,  sprite:SPRITE('tm-water'),    effect:'Eau · Puissance 40 · Précision 100', desc:'Apprend Pistolet à O à un Pokémon compatible. Consommable : disparaît après usage.'},
  'ct-swift': {id:'ct-swift', kind:'tm', stack:true, move:'swift',     name:'CT39 · Météores',     price:4500,  sprite:SPRITE('tm-normal'),   effect:'Normal · Puissance 60 · Précision 100', desc:'Apprend Météores à un Pokémon compatible. Consommable : disparaît après usage.'},
  'ct-ice': {id:'ct-ice', kind:'tm', stack:true, move:'ice-beam', name:'CT13 · Laser Glace', price:60000, sprite:SPRITE('tm-ice'), effect:'Glace · Puissance 90 · Précision 100', desc:'Apprend Laser Glace à un Pokémon compatible. Consommable : disparaît après usage.'},
  oran:   {id:'oran',   kind:'held', stack:true, name:'Baie Oran', price:2000, sprite:SPRITE('oran-berry'), effect:'Rend 10 PV à 50 % de PV ou moins · usage unique', desc:'Comme dans les jeux : quand les PV du porteur tombent à la moitié ou moins, il mange la baie et récupère 10 PV. La baie est alors consommée. Très utile en début d’aventure.'},
  'ct-thunder': {id:'ct-thunder', kind:'tm', stack:true, move:'thunderbolt', name:'CT24 · Tonnerre', price:60000, sprite:SPRITE('tm-electric'), effect:'Électrik · Puissance 90 · Précision 100', desc:'Apprend Tonnerre à un Pokémon compatible. Consommable : disparaît après usage.'},
  band:   {id:'band',   kind:'held', stack:true, name:'Ceinture Force', price:20000, sprite:SPRITE('focus-sash'), effect:'Survit à un coup fatal avec 1 PV (si PV pleins) · usage unique', desc:'Comme dans les jeux : si le porteur a tous ses PV et reçoit une attaque qui devrait le mettre K.O., il tient avec 1 PV. La ceinture est alors consommée.'},
  auto:   {id:'auto',   kind:'passive', name:'Mode Auto',  price:30000,  sprite:SPRITE('vs-seeker'), effect:'Combats automatiques (bouton AUTO)', desc:'Débloque le bouton AUTO sous la zone : une fois activé, les rencontres se lancent seules et ton Pokémon choisit l’attaque la plus efficace contre l’adversaire. Tu l’actives ou le coupes quand tu veux.'},
  egg:    {id:'egg',    kind:'held', stack:true, name:'Œuf Chance', price:12000, sprite:SPRITE('lucky-egg'), xp:1.5, effect:'XP gagnée +50 % pour le porteur', desc:'Comme dans les jeux : le Pokémon qui le porte gagne 50 % d’XP en plus après chaque combat. Parfait pour faire monter ton Pokémon préféré au début de l’aventure.'},
  incense:{id:'incense',kind:'incense',stack:true,name:'Encens Chance',price:25000,sprite:SPRITE('luck-incense'),effect:'Pendant 5 min : raretés +50 %',desc:'À allumer depuis le sac : pendant 5 minutes, les raretés supérieures sortent plus souvent, comme avec une Hyper Ball presque aussi puissante. Se cumule avec ta Ball et ta série de victoires. Un seul encens à la fois.'},
  chroma: {id:'chroma', kind:'passive', name:'Charme Chroma', price:3000000, sprite:SPRITE('shiny-charm'), effect:'Chromatiques ×4 : 1 sur 1 024', desc:'Actif dès l’achat : la chance de rencontrer un chromatique est multipliée par 4, de 1 sur 4 096 à 1 sur 1 024.'}
};
export const XP_MULTIPLIER = 1.5, MONEY_MULTIPLIER = 2, CHARM_DENOMINATOR = 1024, KILLS_TO_UNLOCK = 3;
// La Pièce Rune est vendue à la Boutique du Plateau ; le Charme Chroma n'est pas en vente pour l'instant (prévu dans la 2e région).
// `after` : zone à explorer ; `at` : position (en % de la carte) du logo, entre `after` et la zone suivante.
export const SHOPS = [
  {id:'jade',  name:'Boutique de la Forêt',   after:'forest', before:'route3', at:{x:35,y:23}, stock:['super','xp','egg','auto','potion','antidote','paralyze-heal','ct-water','ct-swift'], hello:'Bienvenue ! Une Super Ball et un Multi-XP, et ton aventure file plus vite.'},
  {id:'sud',   name:'Boutique de la Centrale', after:'route4', before:'power',  at:{x:63,y:78}, stock:['hyper','super-potion','burn-heal','full-heal','ct-thunder','ct-ice','oran','band','water-stone'], hello:'Bienvenue ! Ici, on équipe les dresseurs qui voient loin.'},
  {id:'ouest', name:'Boutique des Îles Écume', after:'seafoam', before:'mansion', beforeLabel:'l’arène de Morgane', at:{x:50,y:50}, stock:['hyper-potion','max-potion','ice-heal','leftovers','ct-blizzard','ct-doubleedge','fire-stone'], hello:'Bienvenue ! Avant l’arène de Morgane, mieux vaut être bien équipé.'},
  {id:'indigo', name:'Boutique du Plateau', after:'victory', before:'league', beforeLabel:'l’arène de Giovanni', at:{x:74,y:68}, stock:['safari','rune','awakening','moon-stone','incense','leaf-stone'], hello:'Bienvenue ! Dernière boutique avant Giovanni : la Pièce Rune double tes gains, et les pierres font évoluer tes Pokémon.'}
];
export const shopById = id => SHOPS.find(s => s.id === id) || SHOPS[0];
export const zoneName = id => zones.find(z => z.id === id)?.name || id;
// Évolutions par pierre : renvoie [{stone, to}] pour une espèce.
export const stoneTargets = id => Object.values(ITEMS).filter(i => i.kind === 'stone' && i.evolves[id]).map(i => ({stone:i.id, to:i.evolves[id]}));
export const defaultInv = () => ({owned:{}, ball:'poke', stock:{}, held:{}, incenseUntil:0});
export const INCENSE_MS = 5 * 60 * 1000, INCENSE_BONUS = .5;
export const incenseLeft = (inv, now = Date.now()) => Math.max(0, (inv.incenseUntil || 0) - now);
export const incenseBonus = (inv, now = Date.now()) => incenseLeft(inv, now) > 0 ? INCENSE_BONUS : 0;
export function lightIncense(state, now = Date.now()) {
  const inv = state.inv; if (stockOf(inv, 'incense') < 1 || incenseLeft(inv, now) > 0) return false;
  inv.stock.incense -= 1; if (inv.stock.incense <= 0) delete inv.stock.incense; inv.incenseUntil = now + INCENSE_MS; return true;
}
// Pokémon qui possèdent une méga-évolution (Gen. 1) : ils portent deux objets, les autres un seul.
export const MEGA_SPECIES = [3, 6, 9, 15, 18, 65, 80, 94, 115, 127, 130, 142, 150];
// Un seul emplacement pour les objets classiques (Ceinture Force, Baie, etc.) : jamais deux.
let bonusSlots = 0;
export const setBonusSlots = n => { bonusSlots = Math.max(0, Math.min(3, n | 0)); };
export const slotsFor = id => 1 + bonusSlots;
// Les Pokémon capables de Méga-évolution / Dynamax ont en plus un emplacement RÉSERVÉ à la Méga-Gemme / au Dynamax (à venir) : aucun autre objet n'y entre.
export const hasReservedSlot = id => MEGA_SPECIES.includes(id);
export const isStack = id => ITEMS[id]?.stack === true;
export function sanitizeInv(raw) {
  const inv = defaultInv();
  if (raw && typeof raw === 'object') {
    if (Number.isFinite(raw.incenseUntil) && raw.incenseUntil > 0) inv.incenseUntil = raw.incenseUntil;
    for (const id of Object.keys(ITEMS)) if (id !== 'poke' && raw.owned?.[id] === true) inv.owned[id] = true;
    if (ITEMS[raw.ball]?.kind === 'ball' && (raw.ball === 'poke' || inv.owned[raw.ball])) inv.ball = raw.ball;
    if (raw.stock && typeof raw.stock === 'object') for (const id of Object.keys(ITEMS)) if (isStack(id) && Number.isSafeInteger(raw.stock[id]) && raw.stock[id] > 0) inv.stock[id] = Math.min(raw.stock[id], 9999);
    if (raw.held && typeof raw.held === 'object') {
      const used = {};
      for (const [pid, list] of Object.entries(raw.held)) {
        const n = +pid; if (!Number.isInteger(n) || n < 1 || n > 151 || !Array.isArray(list)) continue;
        const keep = [];
        for (const id of list) if (ITEMS[id]?.kind === 'held' && !keep.includes(id) && keep.length < slotsFor(n) && (used[id] || 0) < (inv.stock[id] || 0)) {keep.push(id); used[id] = (used[id] || 0) + 1;}
        if (keep.length) inv.held[n] = keep;
      }
    }
  }
  return inv;
}
export function sanitizeKills(raw) {
  const out = {};
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) for (const z of zones) if (Number.isSafeInteger(raw[z.id]) && raw[z.id] > 0) out[z.id] = raw[z.id];
  return out;
}
export const owns = (inv, id) => id === 'poke' || inv.owned[id] === true;
export const rarityBonus = inv => ITEMS[inv.ball]?.bonus || 0;
export const xpMultiplier = inv => inv.owned.xp ? XP_MULTIPLIER : 1;
export const moneyMultiplier = inv => inv.owned.rune ? MONEY_MULTIPLIER : 1;
export const shinyDenominator = inv => inv.owned.chroma ? CHARM_DENOMINATOR : 4096;
export const shopKills = (kills, shop) => Math.min(KILLS_TO_UNLOCK, kills[shop.after] || 0);
export const shopOpen = (kills, shop) => shopKills(kills, shop) >= KILLS_TO_UNLOCK;
export function buyItem(state, id) {
  const item = ITEMS[id];
  if (!item || id === 'poke') return {ok:false, reason:'unknown'};
  if (!isStack(id) && owns(state.inv, id)) return {ok:false, reason:'owned'};
  if (state.money < item.price) return {ok:false, reason:'money', missing:item.price - state.money};
  state.money -= item.price;
  if (isStack(id)) {state.inv.stock[id] = Math.min(9999, (state.inv.stock[id] || 0) + 1); return {ok:true};}
  state.inv.owned[id] = true;
  if (item.kind === 'ball' && item.bonus > ITEMS[state.inv.ball].bonus) state.inv.ball = id;
  return {ok:true};
}
export function equipBall(state, id) {
  if (ITEMS[id]?.kind !== 'ball' || !owns(state.inv, id)) return false;
  state.inv.ball = id; return true;
}
// Objets tenus et CT : exemplaires possédés, portés ou libres, effets et consommation.
export const stockOf = (inv, id) => inv.stock[id] || 0;
export const heldList = (inv, pid) => inv.held[pid] || [];
export const heldCount = (inv, id) => Object.values(inv.held).reduce((n, l) => n + l.filter(x => x === id).length, 0);
export const freeCopies = (inv, id) => stockOf(inv, id) - heldCount(inv, id);
export function equipHeld(state, pid, id) {
  const inv = state.inv, list = heldList(inv, pid);
  if (ITEMS[id]?.kind !== 'held' || list.includes(id) || list.length >= slotsFor(pid) || freeCopies(inv, id) < 1) return false;
  inv.held[pid] = [...list, id]; return true;
}
export function unequipHeld(state, pid, id) {
  const list = heldList(state.inv, pid); if (!list.includes(id)) return false;
  const next = list.filter(x => x !== id); if (next.length) state.inv.held[pid] = next; else delete state.inv.held[pid]; return true;
}
export function useTm(state, id) {
  if (ITEMS[id]?.kind !== 'tm' || stockOf(state.inv, id) < 1) return false;
  state.inv.stock[id] -= 1; if (state.inv.stock[id] <= 0) delete state.inv.stock[id]; return true;
}
export const healList = inv => Object.values(ITEMS).filter(i => i.kind === 'heal' && stockOf(inv, i.id) > 0).map(i => ({id:i.id, name:i.name, sprite:i.sprite, heal:i.heal, cures:i.cures || null, qty:stockOf(inv, i.id)}));
export function useHeal(state, id) {
  if (ITEMS[id]?.kind !== 'heal' || stockOf(state.inv, id) < 1) return false;
  state.inv.stock[id] -= 1; if (state.inv.stock[id] <= 0) delete state.inv.stock[id]; return true;
}
// Consomme un objet tenu (ex. Ceinture Force après avoir sauvé son porteur) : il quitte le Pokémon et le sac.
export function consumeHeld(state, pid, id) {
  if (!unequipHeld(state, pid, id)) return false;
  const n = (state.inv.stock[id] || 0) - 1; if (n > 0) state.inv.stock[id] = n; else delete state.inv.stock[id]; return true;
}
// XP gagnée par un Pokémon : Multi-XP (global) × Œuf Chance (porteur).
export const xpMultiplierFor = (inv, pid) => xpMultiplier(inv) * heldList(inv, pid).reduce((m, id) => m * (ITEMS[id]?.xp || 1), 1);
export const hasHeld = (inv, pid, id) => heldList(inv, pid).includes(id);
export const statMultipliers = (inv, pid) => heldList(inv, pid).reduce((m, id) => {for (const [k, v] of Object.entries(ITEMS[id]?.mult || {})) m[k] = (m[k] || 1) * v; return m;}, {});
export const powerMultiplier = (inv, pid) => heldList(inv, pid).reduce((m, id) => m * (ITEMS[id]?.power || 1), 1);
export const activeItems = inv => Object.values(ITEMS).filter(i => i.kind === 'passive' && inv.owned[i.id]);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const icon = (item, size = 64) => `<img class="shop-icon" src="${item.sprite}" alt="" width="${size}" height="${size}" style="width:${size}px;height:${size}px">`;

export function mountShop(container, {getState, shopId, onChange}) {
  const shop = shopById(shopId);
  let selected = shop.stock[0], message = '';
  container.innerHTML = '<div class="shop"></div>';
  const root = container.querySelector('.shop');
  function render() {
    const state = getState(), open = shopOpen(state.kills, shop), item = ITEMS[selected], own = !isStack(selected) && owns(state.inv, selected), afford = state.money >= item.price;
    const say = !open ? `Désolé, la boutique n’ouvre pas encore. Bats ${KILLS_TO_UNLOCK} Pokémon de la zone « ${zoneName(shop.after)} » : ${shopKills(state.kills, shop)} / ${KILLS_TO_UNLOCK}.` : message || shop.hello;
    root.innerHTML = `<aside class="shop-clerk"><img class="clerk-sprite" src="${CLERK_SPRITE}" alt="Vendeur du Pokémart" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'clerk-fallback',textContent:'🧑‍💼'}))"><p class="clerk-bubble" role="status">« ${esc(say)} »</p></aside>
    <section class="shop-main"><header class="shop-top"><span class="shop-label">${esc(shop.name)} · entre ${esc(zoneName(shop.after))} et ${esc(shop.beforeLabel || zoneName(shop.before))}</span><span class="shop-money" aria-label="Pokédollars"><span class="shop-coin" aria-hidden="true">₽</span>${esc(fmtMoney(state.money))}</span></header>
    ${open ? '' : `<div class="shop-locked"><b>🔒 Fermée</b> · ${shopKills(state.kills, shop)} / ${KILLS_TO_UNLOCK} Pokémon vaincus en ${esc(zoneName(shop.after))}<span class="shop-lockbar"><i style="width:${shopKills(state.kills, shop) / KILLS_TO_UNLOCK * 100}%"></i></span></div>`}
    <div class="shop-shelf ${open ? '' : 'closed'}">${shop.stock.map(id => {const it = ITEMS[id], qty = isStack(id) ? stockOf(state.inv, id) : 0, has = isStack(id) ? false : owns(state.inv, id), ok = state.money >= it.price; return `<button type="button" class="shop-item${id === selected ? ' sel' : ''}${has ? ' own' : ''}" data-item="${id}" aria-pressed="${id === selected}" ${open ? '' : 'disabled'}><span class="shop-art">${icon(it, 96)}</span><span class="shop-tag"><b>${esc(it.name)}</b><span class="${has ? 'own' : ok ? '' : 'poor'}">${has ? '✓ Possédé' : fmtMoney(it.price)}</span>${qty ? `<small class="shop-qty">Dans ton sac : ×${qty}</small>` : ''}</span></button>`;}).join('')}</div>    <footer class="shop-buy"><div class="shop-desc"><b>${esc(item.name)}</b> · ${esc(item.desc)}<small>${esc(item.effect)}</small></div>${own ? '<span class="shop-owned">✓ Déjà acquis</span>' : `<button type="button" class="shop-buy-btn" data-buy ${open && afford ? '' : 'disabled'}>${!open ? 'Fermée' : afford ? 'Acheter · ' + fmtMoney(item.price) : 'Manque ' + fmtMoney(item.price - state.money)}</button>`}</footer></section>`;
  }
  root.onclick = e => {
    const pick = e.target.closest('[data-item]');
    if (pick) {selected = pick.dataset.item; message = ''; render(); return;}
    if (e.target.closest('[data-buy]')) {
      const state = getState(), r = buyItem(state, selected);
      if (r.ok) {const st = (state.stats = state.stats || {}); st.purchases = (st.purchases || 0) + 1; message = `Merci ! ${ITEMS[selected].name} : ${ITEMS[selected].kind === 'ball' ? 'équipée sur ta Pokéball.' : ITEMS[selected].kind === 'tm' ? 'ajoutée à ton sac. À utiliser depuis le profil d’un Pokémon.' : ITEMS[selected].kind === 'heal' ? 'ajoutée à ton sac. À utiliser en combat avec « Objets ».' : ITEMS[selected].kind === 'held' ? 'ajoutée à ton sac. À faire porter depuis le profil d’un Pokémon.' : ITEMS[selected].kind === 'stone' ? 'ajoutée à ton sac. À utiliser depuis le profil du Pokémon à faire évoluer.' : 'déjà actif !'}`; onChange(selected);}
      else message = r.reason === 'money' ? `Il te manque ${fmtMoney(r.missing)}.` : 'Tu l’as déjà.';
      render();
    }
  };
  render();
  return {refresh: render};
}

const stackList = inv => {
  const rows = Object.values(ITEMS).filter(i => i.stack && stockOf(inv, i.id) > 0).map(i => {
    const holders = i.kind === 'held' ? Object.entries(inv.held).filter(([, l]) => l.includes(i.id)).length : 0;
    return `<div class="bag-item stack">${icon(i, 64)}<span><b>${esc(i.name)}</b><small>${esc(i.effect)}${holders ? ' · porté ×' + holders : ''}</small></span><em class="qty">×${stockOf(inv, i.id)}</em>${i.kind === 'incense' ? (incenseLeft(inv) > 0 ? `<em class="inc-on">ALLUMÉ · ${Math.ceil(incenseLeft(inv) / 60000)} min</em>` : '<button type="button" class="inc-go" data-incense>Allumer</button>') : ''}</div>`;
  });
  return rows.length ? rows.join('') : '<p class="bag-empty">Ton sac est vide. Les boutiques vendent des potions, des CT et des objets à faire porter à tes Pokémon.</p>';
};
// ---- Sac : rail de catégories, grille d'objets triable et fiche de l'objet (maquette B) ----
const BAG_CATS = [
  {id:'balls',  name:'Balls',    color:'#f87171', icon:'poke-ball',  list: inv => Object.values(ITEMS).filter(i => i.kind === 'ball' && owns(inv, i.id))},
  {id:'soins',  name:'Soins',    color:'#4ade80', icon:'potion',     list: inv => Object.values(ITEMS).filter(i => i.kind === 'heal' && stockOf(inv, i.id) > 0)},
  {id:'ct',     name:'CT',       color:'#60a5fa', icon:'tm-normal',  list: inv => Object.values(ITEMS).filter(i => i.kind === 'tm' && stockOf(inv, i.id) > 0)},
  {id:'porter', name:'À porter', color:'#fbbf24', icon:'focus-sash', list: inv => Object.values(ITEMS).filter(i => i.kind === 'held' && stockOf(inv, i.id) > 0)},
  {id:'pierres',name:'Pierres',  color:'#a78bfa', icon:'moon-stone', list: inv => Object.values(ITEMS).filter(i => i.kind === 'stone' && stockOf(inv, i.id) > 0)},
  {id:'spe',    name:'Spécial',  color:'#38bdf8', icon:'luck-incense', list: inv => Object.values(ITEMS).filter(i => (i.kind === 'incense' && stockOf(inv, i.id) > 0) || (i.kind === 'passive' && inv.owned[i.id]))}
];
const TYPE_COLORS = {Normal:'#a8a878', Feu:'#f08030', Eau:'#6890f0', Plante:'#78c850', 'Électrik':'#f8d030', Glace:'#98d8d8', Combat:'#c03028', Poison:'#a040a0', Sol:'#e0c068', Vol:'#a890f0', Psy:'#f85888', Insecte:'#a8b820', Roche:'#b8a038', Spectre:'#705898', Dragon:'#7038f8'};
const SORTS = [['recent', 'Récent'], ['name', 'Nom A→Z'], ['qty', 'Quantité'], ['type', 'Type'], ['power', 'Puissance']];
const itemType = i => i.kind === 'tm' ? (i.effect.split(' · ')[0] || '') : '';
const itemPower = i => i.kind === 'tm' ? (+(/Puissance (\d+)/.exec(i.effect)?.[1]) || 0) : 0;
const itemQty = (inv, i) => i.kind === 'ball' || i.kind === 'passive' ? 0 : stockOf(inv, i.id);
const tint = (hex, k) => { const n = parseInt(hex.slice(1), 16); return '#' + [16, 8, 0].map(sh => Math.round(((n >> sh) & 255) * k).toString(16).padStart(2, '0')).join(''); };
export function mountItems(container, {getState, onChange, team = () => []}) {
  container.innerHTML = '<div class="bg"></div>';
  const root = container.querySelector('.bg');
  let cat = 'balls', sort = 'recent', query = '', typeF = '', sel = null, timer = 0;
  const colorOf = (i, c) => i.kind === 'tm' ? (TYPE_COLORS[itemType(i)] || c.color) : c.color;
  function activeStrip(inv) {
    const out = [], ball = ITEMS[inv.ball];
    if (incenseLeft(inv) > 0) out.push({it: ITEMS.incense, c:'#38bdf8', sub: `${ITEMS.incense.effect.replace('Pendant 5 min : ', '')} · ${Math.floor(incenseLeft(inv) / 60000)}:${String(Math.floor(incenseLeft(inv) / 1000) % 60).padStart(2, '0')}`});
    for (const p of activeItems(inv)) out.push({it: p, c:'#fbbf24', sub: p.effect});
    if (ball && ball.bonus) out.push({it: ball, c:'#f87171', sub: ball.effect + ' · équipée'});
    return out.map(a => `<div class="bg-act" style="--c:${a.c};--d:${tint(a.c, .35)}">${icon(a.it, 40)}<div><b>${esc(a.it.name)}</b><small>${esc(a.sub)}</small></div></div>`).join('');
  }
  function card(i, c, inv) {
    const col = colorOf(i, c), q = itemQty(inv, i), held = i.kind === 'held' ? heldCount(inv, i.id) : 0;
    const tag = i.kind === 'ball' ? (inv.ball === i.id ? 'ÉQUIPÉE' : 'Équiper') : i.kind === 'held' ? `PORTÉ ×${held}` : i.kind === 'tm' ? itemType(i).toUpperCase() : i.kind === 'passive' ? 'ACTIF' : i.kind === 'incense' ? (incenseLeft(inv) > 0 ? 'ALLUMÉ' : 'À ALLUMER') : '';
    return `<button type="button" class="bg-card${sel === i.id ? ' on' : ''}" data-sel="${i.id}" style="--c:${col};--d:${tint(col, .38)}">${q ? `<span class="bg-qty">×${q}</span>` : ''}${icon(i, 58)}<b>${esc(i.kind === 'tm' ? i.name.split(' · ')[1] || i.name : i.name)}</b><small>${esc(i.kind === 'tm' ? i.name.split(' · ')[0] + ' · ' + i.effect.split(' · ').slice(1).join(' · ') : i.effect)}</small>${tag ? `<span class="bg-tag">${esc(tag)}</span>` : ''}</button>`;
  }
  function detail(i, c, st) {
    if (!i) return '<div class="bg-detail empty"><p>Choisis un objet pour voir sa fiche.</p></div>';
    const inv = st.inv, col = colorOf(i, c), q = itemQty(inv, i), mates = team(), nHeld = i.kind === 'held' ? heldCount(inv, i.id) : 0;
    let extra = '';
    if (i.kind === 'held') {
      extra = `<div class="bg-nums"><div><small>POSSÉDÉS</small><b>${q}</b></div><div><small>PORTÉS</small><b>${nHeld}</b></div><div><small>LIBRES</small><b>${q - nHeld}</b></div></div><h4>Donner à un Pokémon</h4><div class="bg-mates">${mates.map(m => { const has = heldList(inv, m.id).includes(i.id), can = has || (freeCopies(inv, i.id) > 0 && heldList(inv, m.id).length < slotsFor(m.id)); return `<button type="button" class="bg-mate${has ? ' on' : ''}" data-give="${m.id}" ${can ? '' : 'disabled'} title="${has ? 'Retirer' : 'Donner'}"><img src="${esc(m.sprite)}" alt="" onerror="this.onerror=null;this.src='${esc(m.fallback || m.sprite)}'"><b>${esc(m.name)}</b><small>${has ? 'Porte ceci · retirer' : can ? 'Donner' : heldList(inv, m.id).length >= slotsFor(m.id) ? 'Plein' : 'Aucun libre'}</small></button>`; }).join('') || '<p class="bag-empty">Aucun Pokémon dans ton équipe.</p>'}</div>`;
    } else if (i.kind === 'ball') {
      extra = `<button type="button" class="bg-go" data-ball="${i.id}" ${inv.ball === i.id ? 'disabled' : ''}>${inv.ball === i.id ? 'Équipée sur la Pokéball' : 'Équiper cette Ball'}</button>`;
    } else if (i.kind === 'incense') {
      extra = `<div class="bg-nums"><div><small>POSSÉDÉS</small><b>${q}</b></div><div><small>DURÉE</small><b>${Math.round(INCENSE_MS / 60000)} min</b></div></div>` + (incenseLeft(inv) > 0 ? `<p class="bg-note">Allumé : encore ${Math.ceil(incenseLeft(inv) / 60000)} min.</p>` : `<button type="button" class="bg-go" data-incense>Allumer l’encens</button>`);
    } else if (i.kind === 'tm') {
      extra = `<div class="bg-nums"><div><small>EXEMPLAIRES</small><b>${q}</b></div><div><small>TYPE</small><b>${esc(itemType(i))}</b></div><div><small>PUISSANCE</small><b>${itemPower(i) || '—'}</b></div></div><p class="bg-note">S’utilise depuis la fiche d’un Pokémon compatible.</p>`;
    } else if (i.kind === 'stone') {
      extra = `<div class="bg-nums"><div><small>EXEMPLAIRES</small><b>${q}</b></div></div><p class="bg-note">S’utilise depuis la fiche d’un Pokémon qui peut évoluer.</p>`;
    } else if (i.kind === 'heal') {
      extra = `<div class="bg-nums"><div><small>EXEMPLAIRES</small><b>${q}</b></div></div><p class="bg-note">S’utilise pendant un combat.</p>`;
    }
    return `<div class="bg-detail" style="--c:${col};--d:${tint(col, .35)}"><small class="bg-lab">OBJET SÉLECTIONNÉ</small><div class="bg-head">${icon(i, 96)}<div><h3>${esc(i.name)}</h3><span class="bg-tag">${esc(c.name.toUpperCase())}</span></div></div><p class="bg-desc">${esc(i.desc || i.effect)}</p>${extra}</div>`;
  }
  function render() {
    const st = getState(), inv = st.inv, c = BAG_CATS.find(x => x.id === cat);
    let list = c.list(inv).filter(i => (!typeF || itemType(i) === typeF) && (!query || i.name.toLowerCase().includes(query)));
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    else if (sort === 'qty') list.sort((a, b) => itemQty(inv, b) - itemQty(inv, a));
    else if (sort === 'type') list.sort((a, b) => itemType(a).localeCompare(itemType(b), 'fr') || a.name.localeCompare(b.name, 'fr'));
    else if (sort === 'power') list.sort((a, b) => itemPower(b) - itemPower(a));
    if (!sel || !list.some(i => i.id === sel)) sel = list[0]?.id || null;
    const types = cat === 'ct' ? [...new Set(c.list(inv).map(itemType))].sort((a, b) => a.localeCompare(b, 'fr')) : [];
    const keep = root.querySelector('[data-search]'), focused = document.activeElement === keep;
    root.innerHTML = `<div class="bg-top"><div><small class="bg-lab">TON SAC</small><h2>Sac</h2></div><div class="bg-acts">${activeStrip(inv)}</div></div>
    <div class="bg-body"><nav class="bg-rail">${BAG_CATS.map(x => `<button type="button" class="bg-cat${x.id === cat ? ' on' : ''}" data-cat="${x.id}" style="--c:${x.color};--d:${tint(x.color, .35)}">${icon({sprite: SPRITE(x.icon)}, 44)}<b>${x.name}</b><span>${x.list(inv).length}</span></button>`).join('')}</nav>
    <div class="bg-mid"><div class="bg-tools"><input type="search" class="bg-search" data-search placeholder="Rechercher…" value="${esc(query)}"><div class="bg-chips">${SORTS.filter(([k]) => (k !== 'power' && k !== 'type') || cat === 'ct').map(([k, n]) => `<button type="button" class="bg-chip${sort === k ? ' on' : ''}" data-sort="${k}">${n}</button>`).join('')}</div></div>
    ${types.length > 1 ? `<div class="bg-chips"><button type="button" class="bg-chip${typeF ? '' : ' on'}" data-type="">Tous</button>${types.map(t => `<button type="button" class="bg-chip${typeF === t ? ' on' : ''}" data-type="${esc(t)}" style="--c:${TYPE_COLORS[t] || '#fff'}">${esc(t)}</button>`).join('')}</div>` : ''}
    <div class="bg-grid">${list.map(i => card(i, c, inv)).join('') || '<p class="bag-empty">Rien ici pour l’instant. Les boutiques de la carte vendent de quoi remplir ce compartiment.</p>'}</div></div>
    ${detail(list.find(i => i.id === sel), c, st)}</div>`;
    if (focused) { const el = root.querySelector('[data-search]'); el.focus(); el.setSelectionRange(query.length, query.length); }
  }
  root.onclick = e => {
    const st = getState(), t = e.target;
    const k = t.closest('[data-cat]'); if (k) { cat = k.dataset.cat; sel = null; typeF = ''; if (!['power', 'type'].includes(sort) || cat === 'ct') {} else sort = 'recent'; return render(); }
    const so = t.closest('[data-sort]'); if (so) { sort = so.dataset.sort; return render(); }
    const ty = t.closest('[data-type]'); if (ty) { typeF = ty.dataset.type; return render(); }
    const cd = t.closest('[data-sel]'); if (cd) { sel = cd.dataset.sel; return render(); }
    const bl = t.closest('[data-ball]'); if (bl && equipBall(st, bl.dataset.ball)) { onChange(); return render(); }
    if (t.closest('[data-incense]') && lightIncense(st)) { onChange(); return render(); }
    const gv = t.closest('[data-give]'); if (gv && sel) { const pid = +gv.dataset.give; if (heldList(st.inv, pid).includes(sel) ? unequipHeld(st, pid, sel) : equipHeld(st, pid, sel)) { onChange(); render(); } }
  };
  root.oninput = e => { if (e.target.matches('[data-search]')) { query = e.target.value.trim().toLowerCase(); render(); } };
  render();
  clearInterval(timer); timer = setInterval(() => { if (!root.isConnected) clearInterval(timer); else if (incenseLeft(getState().inv) > 0 && !document.hidden) render(); }, 5000);
  return {refresh: render};
}
