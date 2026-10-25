// Arènes de Kanto : 8 champions, 2 zones avant chacun. Équipes réelles des jeux (Rouge Feu / Vert Feuille), niveaux mis à l'échelle
// pour que le dernier champion soit niveau 100. Pure donnée + règles d'accès, sans DOM.
import {zones, findZone, tierOf, setActiveRegion} from './world.js';

// Ordre du parcours (serpentin) : deux zones, puis l'arène.
export const KANTO_ZONE_ORDER = ['route', 'route2', 'forest', 'route3', 'cave', 'route4', 'bridge', 'rocktunnel', 'tower', 'safari', 'power', 'seafoam', 'mansion', 'ceruleancave', 'victory', 'league'];
// Tous les Pokémon d'un dresseur ont le niveau affiché sur la carte (le niveau « ace »).
const scale = (real, ace) => real.map(([id]) => [id, ace]);
const SPRITE_URL = n => `https://play.pokemonshowdown.com/sprites/trainers/${n}.png`;
const def = (n, o) => ({n, ...o, team: scale(o.real, o.ace), sprite: SPRITE_URL(o.trainer), badgeSprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges/${n}.png`});
export const KANTO_ARENAS = [
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
export const LEVEL_CAPS = [20, 30, 42, 54, 66, 78, 90, 100, 100];  // Kanto (Johto : JOHTO_LEVEL_CAPS)
const countIn = (list, badges) => { let n = 0; while (n < list.length && badges?.[list[n].id]) n++; return n; };
// Badges de la région active (affichage 0 / 8) ; le plafond de niveau, lui, tient compte des deux régions.
export function badgeCount(badges) { return countIn(ARENAS, badges); }
export const kantoBadgeCount = badges => countIn(KANTO_ARENAS, badges);
export const johtoBadgeCount = badges => countIn(JOHTO_ARENAS, badges);
// Plafond de niveau : 20 → 100 avec les 8 badges de Kanto, puis 100 → 200 avec les 8 badges de Johto.
export const levelCap = badges => { const k = kantoBadgeCount(badges); return k < KANTO_ARENAS.length ? LEVEL_CAPS[k] : JOHTO_LEVEL_CAPS[johtoBadgeCount(badges)]; };
export const arenaById = id => ARENAS.find(a => a.id === id) || KANTO_ARENAS.find(a => a.id === id) || JOHTO_ARENAS.find(a => a.id === id);
// Récompenses : prime en Pokédollars la première fois (puis 10 % en revanche), plus la CT du champion.
// Prime : 5 000 ₽ × n° de l'arène (Pierre 5 000, Ondine 10 000 … Giovanni 40 000) ; revanche = 10 %.
export const arenaPrize = (arena, first) => Math.round(5000 * arena.n * (first ? 1 : .1));
// Zone d'après l'arène k (1..8) : il faut le badge k pour y entrer.
export const zoneGate = id => Math.floor(ZONE_ORDER.indexOf(id) / 2);
export function zoneAccess(id, leadLevel, badges) {
  const z = findZone(id); if (!z) return {ok:false, reason:'unknown'};
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
export const sanitizeBadges = raw => { const out = {}; if (raw && typeof raw === 'object' && !Array.isArray(raw)) for (const x of [...KANTO_ARENAS, ...JOHTO_ARENAS]) if (raw[x.id] === true) out[x.id] = true; return out; };
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
export const KANTO_ELITE = [
  eliteDef(1, {id:'olga', leader:'Olga', title:'Olga, du Conseil des 4', type:'glace', trainer:'lorelei-gen3', alts:['lorelei-gen1','lorelei-gen1rb','lorelei'], ace:97, real:[[87, 54], [91, 53], [80, 54], [124, 56], [131, 56]], quote:'Rien n’échappe au froid de ma glace !'}),
  eliteDef(2, {id:'aldo', leader:'Aldo', title:'Aldo, du Conseil des 4', type:'combat', trainer:'bruno', ace:98, real:[[95, 53], [107, 55], [106, 55], [95, 56], [68, 58]], quote:'Ma force et ma volonté sont sans limites !'}),
  eliteDef(3, {id:'agatha', leader:'Agatha', title:'Agatha, du Conseil des 4', type:'spectre', trainer:'agatha-gen3', alts:['agatha-gen1','agatha-gen1rb'], ace:99, real:[[94, 56], [42, 56], [93, 55], [24, 58], [94, 60]], quote:'Les jeunes d’aujourd’hui ne savent plus se battre !'}),
  eliteDef(4, {id:'peter', leader:'Peter', title:'Peter, du Conseil des 4', type:'dragon', trainer:'lance', ace:100, real:[[130, 58], [148, 56], [148, 56], [142, 60], [149, 62]], quote:'Je suis le maître des dragons. Montre-moi ta valeur !'}),
  eliteDef(5, {id:'blue', leader:'Blue', title:'Blue, Champion de la Ligue', type:'varié', champion:true, trainer:'blue-gen1champion', alts:['blue-gen3champion','blue-gen1rbchampion','blue'], ace:100, real:[[18, 100], [65, 100], [112, 100], [59, 100], [103, 100], [9, 100]], quote:'Je suis le Champion ! Montre-moi que tu mérites ce titre !'})
];
export const eliteById = id => ELITE.find(m => m.id === id) || KANTO_ELITE.find(m => m.id === id) || JOHTO_ELITE.find(m => m.id === id);
export const elitePrize = (m, first) => Math.round(1000 * (8 + m.n) * (m.champion ? 2 : 1) * (first ? 1 : .1));
export const sanitizeElite = raw => { const out = {}; if (raw && typeof raw === 'object' && !Array.isArray(raw)) for (const m of [...KANTO_ELITE, ...JOHTO_ELITE]) if (raw[m.id] === true) out[m.id] = true; return out; };
export const eliteCleared = done => ELITE.every(m => done?.[m.id]);
export const kantoEliteCleared = done => KANTO_ELITE.every(m => done?.[m.id]);
export const johtoEliteCleared = done => JOHTO_ELITE.every(m => done?.[m.id]);
export const hasLegendary = ids => (ids || []).some(id => tierOf(+id) === 5);
export function eliteAccess(badges, ownedIds) {
  if (badgeCount(badges) < ARENAS.length) return {ok:false, reason:'allbadges'};
  if (!hasLegendary(ownedIds)) return {ok:false, reason:'legend'};
  return {ok:true};
}

// ---- Johto : 8 champions (équipes des jeux Or / Argent / Cristal), niveaux PROVISOIRES de 112 à 200 (équilibrage à faire).
// Le plafond de niveau part de 100 (fin de Kanto) et monte jusqu'à 200 avec les badges de Johto. Pas de CT pour l'instant (tm:null).
export const JOHTO_ZONE_ORDER = ['route29', 'route31', 'tourchetiflor', 'ruinesalpha', 'puitsramoloss', 'boischenes', 'parcnaturel', 'tourcendree', 'tourferraille', 'chenal40', 'pharoliville', 'montcreuset', 'routeglace', 'laccolere', 'antredragon', 'montargente'];
const jbadge = n => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges/${n + 8}.png`;
const jdef = (n, o) => ({...def(n, o), region:'johto', tm:null, badgeSprite:jbadge(n)});
export const JOHTO_ARENAS = [
  jdef(1, {id:'mauville', city:'Mauville', leader:'Albert', title:'Champion d’arène de Mauville', type:'vol', badgeName:'Badge Zéphyr', trainer:'falkner', ace:112, need:108, real:[[16, 7], [17, 9]], quote:'Les oiseaux me guident ! Montre-moi ta valeur dans les airs !'}),
  jdef(2, {id:'rosalia', city:'Rosalia', leader:'Hector', title:'Champion d’arène de Rosalia', type:'insecte', badgeName:'Badge Essaim', trainer:'bugsy', ace:125, need:120, real:[[11, 14], [14, 14], [123, 16]], quote:'Mes recherches sur les insectes sont mon plus grand trésor !'}),
  jdef(3, {id:'doublonville', city:'Doublonville', leader:'Blanche', title:'Championne d’arène de Doublonville', type:'normal', badgeName:'Badge Plaine', trainer:'whitney', ace:137, need:132, real:[[35, 18], [241, 20]], quote:'Allez, ne me fais pas pleurer ! Je vais te montrer ce que je vaux !'}),
  jdef(4, {id:'ecorcia', city:'Écorcia', leader:'Mortimer', title:'Champion d’arène d’Écorcia', type:'spectre', badgeName:'Badge Brume', trainer:'morty', ace:150, need:144, real:[[92, 21], [93, 21], [93, 23], [94, 25]], quote:'Je vois un avenir où je gagne… Prépare-toi, dresseur !'}),
  jdef(5, {id:'irisia', city:'Irisia', leader:'Chuck', title:'Champion d’arène d’Irisia', type:'combat', badgeName:'Badge Tempête', trainer:'chuck', ace:162, need:156, real:[[57, 27], [62, 30]], quote:'Wahahah ! Tu veux défier mon poing d’acier ?'}),
  jdef(6, {id:'oliville', city:'Oliville', leader:'Jasmine', title:'Championne d’arène d’Oliville', type:'acier', badgeName:'Badge Minéral', trainer:'jasmine', ace:175, need:168, real:[[81, 30], [81, 30], [208, 35]], quote:'… Je ferai de mon mieux. Mon Pokémon Acier est très solide.'}),
  jdef(7, {id:'acajou', city:'Acajou', leader:'Frédo', title:'Champion d’arène d’Acajou', type:'glace', badgeName:'Badge Glacier', trainer:'pryce', ace:187, need:180, real:[[86, 27], [87, 29], [221, 31]], quote:'J’ai vu bien des hivers. L’expérience bat toujours la jeunesse !'}),
  jdef(8, {id:'ebenelle', city:'Ébènelle', leader:'Sandra', title:'Championne d’arène d’Ébènelle', type:'dragon', badgeName:'Badge Élévation', trainer:'clair', ace:200, need:192, real:[[148, 37], [148, 37], [148, 37], [230, 40]], quote:'Je suis la meilleure des dresseurs de dragons. Tu ne me battras pas !'})
];
export const JOHTO_LEVEL_CAPS = [100, 112, 125, 137, 150, 162, 175, 187, 200];
// Ligue de Johto : Clément, Koga, Aldo, Marion, puis le champion Peter (Conseil des 4 d'Or / Argent).
const jeliteDef = (n, o) => ({...eliteDef(n, o), region:'johto', city:'Ligue Pokémon', badgeName:'Victoire sur ' + o.leader});
export const JOHTO_ELITE = [
  jeliteDef(1, {id:'clement', leader:'Clément', title:'Clément, du Conseil des 4', type:'psy', trainer:'will', ace:192, real:[[178, 40], [124, 41], [103, 41], [80, 41], [178, 42]], quote:'J’ai étudié le pouvoir psychique. Tu ne peux pas me surprendre !'}),
  jeliteDef(2, {id:'kogaj', leader:'Koga', title:'Koga, du Conseil des 4', type:'poison', trainer:'koga', ace:194, real:[[168, 40], [205, 43], [89, 42], [49, 41], [169, 44]], quote:'Les ninjas frappent là où on ne les attend pas !'}),
  jeliteDef(3, {id:'aldoj', leader:'Aldo', title:'Aldo, du Conseil des 4', type:'combat', trainer:'bruno', ace:196, real:[[237, 42], [106, 42], [107, 42], [95, 43], [68, 46]], quote:'Ma force et ma volonté sont sans limites !'}),
  jeliteDef(4, {id:'marion', leader:'Marion', title:'Marion, du Conseil des 4', type:'ténèbres', trainer:'karen', ace:198, real:[[197, 42], [45, 42], [94, 45], [198, 44], [229, 47]], quote:'Les Pokémon des ténèbres sont les plus fidèles. Tu vas voir !'}),
  jeliteDef(5, {id:'peterj', leader:'Peter', title:'Peter, Champion de la Ligue de Johto', type:'dragon', champion:true, trainer:'lance', ace:200, real:[[130, 44], [148, 47], [148, 47], [142, 46], [149, 50]], quote:'Je suis le maître des dragons. Montre-moi que tu mérites le titre !'})
];

// ---- Région active : ZONE_ORDER, ARENAS et ELITE sont des tableaux « vivants » remplacés sur place (les modules qui les importent voient la région courante).
export const ZONE_ORDER = [...KANTO_ZONE_ORDER], ARENAS = [...KANTO_ARENAS], ELITE = [...KANTO_ELITE];
let region = 'kanto';
export const getRegion = () => region;
export function setRegion(r) {
  region = r === 'johto' ? 'johto' : 'kanto';
  const j = region === 'johto';
  ZONE_ORDER.splice(0, ZONE_ORDER.length, ...(j ? JOHTO_ZONE_ORDER : KANTO_ZONE_ORDER));
  ARENAS.splice(0, ARENAS.length, ...(j ? JOHTO_ARENAS : KANTO_ARENAS));
  ELITE.splice(0, ELITE.length, ...(j ? JOHTO_ELITE : KANTO_ELITE));
  setActiveRegion(region);
}
