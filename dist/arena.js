// Arènes de Kanto : 8 champions, 2 zones avant chacun. Équipes réelles des jeux (Rouge Feu / Vert Feuille), niveaux mis à l'échelle
// pour que le dernier champion soit niveau 100. Pure donnée + règles d'accès, sans DOM.
import {zones, tierOf} from './world.js';

// Ordre du parcours (serpentin) : deux zones, puis l'arène.
export const ZONE_ORDER = ['route', 'route2', 'forest', 'route3', 'cave', 'route4', 'bridge', 'rocktunnel', 'tower', 'safari', 'power', 'seafoam', 'mansion', 'ceruleancave', 'victory', 'league'];
// Tous les Pokémon d'un dresseur ont le niveau affiché sur la carte (le niveau « ace »).
const scale = (real, ace) => real.map(([id]) => [id, ace]);
const SPRITE_URL = n => `https://play.pokemonshowdown.com/sprites/trainers/${n}.png`;
const def = (n, o) => ({n, ...o, team: scale(o.real, o.ace), sprite: SPRITE_URL(o.trainer), badgeSprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges/${n}.png`});
export const ARENAS = [
  def(1, {id:'argenta', city:'Argenta', leader:'Pierre', title:'Champion d’arène d’Argenta', type:'roche', badgeName:'Badge Roche', trainer:'brock', ace:16, need:12, tm:'ct-rockslide', real:[[74, 12], [95, 14]], quote:'Ma défense est aussi solide que le roc !'}),
  def(2, {id:'azuria', city:'Azuria', leader:'Ondine', title:'Championne d’arène d’Azuria', type:'eau', badgeName:'Badge Cascade', trainer:'misty', ace:28, need:24, tm:'ct-bubblebeam', real:[[120, 18], [121, 21]], quote:'Mon style est offensif, mais jamais sans élégance !'}),
  def(3, {id:'carmin', city:'Carmin sur Mer', leader:'Major Bob', title:'Champion d’arène de Carmin sur Mer', type:'électrik', badgeName:'Badge Foudre', trainer:'ltsurge', ace:40, need:36, tm:'ct-thunder', real:[[100, 21], [25, 18], [26, 24]], quote:'Sur le champ de bataille, seuls les plus électrisants survivent !'}),
  def(4, {id:'celadopole', city:'Céladopole', leader:'Érika', title:'Championne d’arène de Céladopole', type:'plante', badgeName:'Badge Prisme', trainer:'erika', ace:52, need:48, tm:'ct-megadrain', real:[[71, 29], [114, 24], [45, 29]], quote:'Oh… je somnolais. Mais je suis prête à me battre.'}),
  def(5, {id:'parmanie', city:'Parmanie', leader:'Koga', title:'Champion d’arène de Parmanie', type:'poison', badgeName:'Badge Âme', trainer:'koga', ace:64, need:60, tm:'ct-toxic', real:[[109, 37], [109, 37], [89, 39], [110, 43]], quote:'Les ninjas frappent là où on ne les attend pas !'}),
  def(6, {id:'safrania', city:'Safrania', leader:'Morgane', title:'Championne d’arène de Safrania', type:'psy', badgeName:'Badge Marais', trainer:'sabrina', ace:76, need:72, tm:'ct-psychic', real:[[64, 38], [122, 37], [49, 38], [65, 43]], quote:'J’avais prévu ta venue. Mon pouvoir psychique est infaillible.'}),
  def(7, {id:'cramoisile', city:'Cramois’Île', leader:'Auguste', title:'Champion d’arène de Cramois’Île', type:'feu', badgeName:'Badge Volcan', trainer:'blaine', ace:88, need:84, tm:'ct-fireblast', real:[[58, 42], [77, 40], [78, 42], [59, 47]], quote:'Prépare-toi à te brûler les ailes !'}),
  def(8, {id:'jadielle', city:'Jadielle', leader:'Giovanni', title:'Maître de l’arène de Jadielle', type:'sol', badgeName:'Badge Terre', trainer:'giovanni', ace:100, need:96, tm:'ct-earthquake', real:[[111, 45], [51, 42], [31, 44], [34, 45], [112, 50]], quote:'Ceci est ma dernière arène. Et ta dernière chance.'})
];
// Plafond de niveau de tes Pokémon selon les badges (dans l'ordre) : 0 badge → 20 (avant Pierre), 1 → 30 (avant Ondine), etc.
export const LEVEL_CAPS = [20, 30, 42, 54, 66, 78, 90, 100, 100];
export function badgeCount(badges) { let n = 0; while (n < ARENAS.length && badges?.[ARENAS[n].id]) n++; return n; }
export const levelCap = badges => LEVEL_CAPS[badgeCount(badges)];
export const arenaById = id => ARENAS.find(a => a.id === id);
export const arenaIds = ARENAS.map(a => a.id);
// Récompenses : prime en Pokédollars la première fois (puis 10 % en revanche), plus la CT du champion.
// Prime : 5 000 ₽ × n° de l'arène (Pierre 5 000, Ondine 10 000 … Giovanni 40 000) ; revanche = 10 %.
export const arenaPrize = (arena, first) => Math.round(5000 * arena.n * (first ? 1 : .1));
// Zone d'après l'arène k (1..8) : il faut le badge k pour y entrer.
export const zoneGate = id => Math.floor(ZONE_ORDER.indexOf(id) / 2);
export function zoneAccess(id, leadLevel, badges) {
  const z = zones.find(x => x.id === id); if (!z) return {ok:false, reason:'unknown'};
  const gate = zoneGate(id);
  if (gate > 0 && !badges?.[ARENAS[gate - 1].id]) return {ok:false, reason:'badge', arena:ARENAS[gate - 1]};
  if ((leadLevel || 0) < z.min) return {ok:false, reason:'level', need:z.min};
  return {ok:true};
}
export function arenaAccess(arena, leadLevel, badges) {
  if (arena.n > 1 && !badges?.[ARENAS[arena.n - 2].id]) return {ok:false, reason:'badge', arena:ARENAS[arena.n - 2]};
  const prev = zoneAccess(ZONE_ORDER[arena.n * 2 - 1], leadLevel, badges);
  if (!prev.ok) return prev;
  if ((leadLevel || 0) < arena.need) return {ok:false, reason:'level', need:arena.need};
  return {ok:true};
}
export const sanitizeBadges = raw => { const out = {}; if (raw && typeof raw === 'object' && !Array.isArray(raw)) for (const id of arenaIds) if (raw[id] === true) out[id] = true; return out; };
// Parcours affiché sur la carte : zones et arènes dans l'ordre ; les boutiques s'insèrent après leur zone (`after`).
export function buildPath(shops = []) {
  const path = [];
  ZONE_ORDER.forEach((id, i) => {
    path.push({kind:'zone', id, n:i + 1});
    for (const s of shops) if (s.after === id) path.push({kind:'shop', id:s.id});
    if (i % 2 === 1) path.push({kind:'arena', id:ARENAS[(i - 1) / 2].id});
  });
  for (const m of ELITE) path.push({kind:'elite', id:m.id, n:24 + m.n});
  return path;
}

// Conseil des 4 (Plateau Indigo) puis le champion Blue : cinq combats d'affilée après Giovanni. Battre Blue donne le titre de Maître de la Ligue. Condition : les 8 badges et un Pokémon légendaire dans la collection.
const eliteDef = (n, o) => ({n, ...o, elite:true, city:'Plateau Indigo', team:scale(o.real, o.ace), sprite:SPRITE_URL(o.trainer), alts:(o.alts||[]).map(SPRITE_URL), badgeSprite:null, badgeName:'Victoire sur ' + o.leader});
export const ELITE = [
  eliteDef(1, {id:'olga', leader:'Olga', title:'Olga, du Conseil des 4', type:'glace', trainer:'lorelei-gen3', alts:['lorelei-gen1','lorelei-gen1rb','lorelei'], ace:97, real:[[87, 54], [91, 53], [80, 54], [124, 56], [131, 56]], quote:'Rien n’échappe au froid de ma glace !'}),
  eliteDef(2, {id:'aldo', leader:'Aldo', title:'Aldo, du Conseil des 4', type:'combat', trainer:'bruno', ace:98, real:[[95, 53], [107, 55], [106, 55], [95, 56], [68, 58]], quote:'Ma force et ma volonté sont sans limites !'}),
  eliteDef(3, {id:'agatha', leader:'Agatha', title:'Agatha, du Conseil des 4', type:'spectre', trainer:'agatha-gen3', alts:['agatha-gen1','agatha-gen1rb'], ace:99, real:[[94, 56], [42, 56], [93, 55], [24, 58], [94, 60]], quote:'Les jeunes d’aujourd’hui ne savent plus se battre !'}),
  eliteDef(4, {id:'peter', leader:'Peter', title:'Peter, du Conseil des 4', type:'dragon', trainer:'lance', ace:100, real:[[130, 58], [148, 56], [148, 56], [142, 60], [149, 62]], quote:'Je suis le maître des dragons. Montre-moi ta valeur !'}),
  eliteDef(5, {id:'blue', leader:'Blue', title:'Blue, Champion de la Ligue', type:'varié', champion:true, trainer:'blue-gen1champion', alts:['blue-gen3champion','blue-gen1rbchampion','blue'], ace:100, real:[[18, 100], [65, 100], [112, 100], [59, 100], [103, 100], [9, 100]], quote:'Je suis le Champion ! Montre-moi que tu mérites ce titre !'})
];
export const eliteById = id => ELITE.find(m => m.id === id);
export const elitePrize = (m, first) => Math.round(5000 * (8 + m.n) * (m.champion ? 2 : 1) * (first ? 1 : .1));
export const sanitizeElite = raw => { const out = {}; if (raw && typeof raw === 'object' && !Array.isArray(raw)) for (const m of ELITE) if (raw[m.id] === true) out[m.id] = true; return out; };
export const eliteCleared = done => ELITE.every(m => done?.[m.id]);
export const hasLegendary = ids => (ids || []).some(id => tierOf(+id) === 5);
export function eliteAccess(badges, ownedIds) {
  if (badgeCount(badges) < ARENAS.length) return {ok:false, reason:'allbadges'};
  if (!hasLegendary(ownedIds)) return {ok:false, reason:'legend'};
  return {ok:true};
}
