import {STAT_KEYS,normalizeEVs} from './training.js';
// Moteur de combat (fonctions pures, sans réseau ni DOM). Règles PROVISOIRES, inspirées des jeux :
// - stats = formule avec IV/EV modernes, nature neutre, à partir des stats de base de PokéAPI ;
// - dégâts = formule officielle (STAB ×1,5, efficacité des types, aléa 85–100 %), sans coups critiques ;
// - le plus rapide attaque en premier ; le Pokémon sauvage riposte avec une de ses attaques utilisables ;
// - les attaques de statut ou à effet spécial (sans puissance) sont affichées mais pas encore utilisables ;
// - les PV de l'équipe sont pleins au début de chaque combat ; XP = voir xpReward.

export const TYPE_FR = {normal:'Normal',fire:'Feu',water:'Eau',electric:'Électrik',grass:'Plante',ice:'Glace',fighting:'Combat',poison:'Poison',ground:'Sol',flying:'Vol',psychic:'Psy',bug:'Insecte',rock:'Roche',ghost:'Spectre',dragon:'Dragon',dark:'Ténèbres',steel:'Acier',fairy:'Fée'};

// Attaquant → défenseur : seuls les multiplicateurs différents de 1 sont listés.
const CHART = {
  normal:{rock:.5,ghost:0,steel:.5},
  fire:{fire:.5,water:.5,grass:2,ice:2,bug:2,rock:.5,dragon:.5,steel:2},
  water:{fire:2,water:.5,grass:.5,ground:2,rock:2,dragon:.5},
  electric:{water:2,electric:.5,grass:.5,ground:0,flying:2,dragon:.5},
  grass:{fire:.5,water:2,grass:.5,poison:.5,ground:2,flying:.5,bug:.5,rock:2,dragon:.5,steel:.5},
  ice:{fire:.5,water:.5,grass:2,ice:.5,ground:2,flying:2,dragon:2,steel:.5},
  fighting:{normal:2,ice:2,poison:.5,flying:.5,psychic:.5,bug:.5,rock:2,ghost:0,dark:2,steel:2,fairy:.5},
  poison:{grass:2,poison:.5,ground:.5,rock:.5,ghost:.5,steel:0,fairy:2},
  ground:{fire:2,electric:2,grass:.5,poison:2,flying:0,bug:.5,rock:2,steel:2},
  flying:{electric:.5,grass:2,fighting:2,bug:2,rock:.5,steel:.5},
  psychic:{fighting:2,poison:2,psychic:.5,dark:0,steel:.5},
  bug:{fire:.5,grass:2,fighting:.5,poison:.5,flying:.5,psychic:2,ghost:.5,dark:2,steel:.5,fairy:.5},
  rock:{fire:2,ice:2,fighting:.5,ground:.5,flying:2,bug:2,steel:.5},
  ghost:{normal:0,psychic:2,ghost:2,dark:.5},
  dragon:{dragon:2,steel:.5,fairy:0},
  dark:{fighting:.5,psychic:2,ghost:2,dark:.5,fairy:.5},
  steel:{fire:.5,water:.5,electric:.5,ice:2,rock:2,steel:.5,fairy:2},
  fairy:{fire:.5,fighting:2,poison:.5,dragon:2,dark:2,steel:.5}
};
export const effectiveness = (moveType, defenderTypes) => defenderTypes.reduce((m,t) => m * (CHART[moveType]?.[t] ?? 1), 1);

// Stats de base de PokéAPI → stats au niveau demandé.
export const DEFAULT_BASE = {hp:45,atk:49,def:49,spa:49,spd:49,spe:45};
export function computeStats(base,level,training={}) {
 const evs=normalizeEVs(training.evs),stats={};
 for(const key of STAT_KEYS){const iv=Number.isInteger(training.ivs?.[key])?Math.max(0,Math.min(31,training.ivs[key])):0;
 const core=Math.floor((2*base[key]+iv+Math.floor(evs[key]/4))*level/100);
 stats[key]=key==='hp'?core+level+10:core+5;}
 return stats;
}

// Attaques connues au niveau donné : les 4 dernières apprises, comme dans les jeux.
// `learnset` est une liste [nomDeLAttaque, niveau], triée par niveau.
export function knownMoves(learnset, level) {
  const seen = [];
  for (const [name, at] of learnset) if (at <= level && !seen.includes(name)) seen.push(name);
  return seen.slice(-4);
}
export const nextMove = (learnset, level) => { const e = learnset.find(([, at]) => at > level); return e ? {name:e[0], level:e[1]} : null; };

export const LUTTE = {name:'struggle', fr:'Lutte', power:40, acc:100, type:'normal', cls:'physical'};
export const isUsable = move => !!move && move.cls !== 'status' && move.power > 0;

export function damage(attacker, defender, move, rand = Math.random) {
  if (move.acc != null && rand() * 100 >= move.acc) return {hit:false, dmg:0, eff:1, stab:false};
  const physical = move.cls === 'physical';
  const a = physical ? attacker.stats.atk : attacker.stats.spa;
  const d = physical ? defender.stats.def : defender.stats.spd;
  const base = Math.floor(Math.floor(Math.floor(2 * attacker.level / 5 + 2) * move.power * a / d) / 50) + 2;
  const stab = attacker.types.includes(move.type), eff = effectiveness(move.type, defender.types);
  let dmg = Math.floor(base * (stab ? 1.5 : 1) * eff * (0.85 + rand() * 0.15));
  if (eff > 0) dmg = Math.max(1, dmg);
  return {hit:true, dmg, eff, stab};
}

// Bonus chromatique : un Pokémon chromatique de l'équipe a toutes ses statistiques ×1,5 (jamais l'adversaire).
export const SHINY_BOOST = 1.5;
export const boostStats = (stats, mult) => mult === 1 ? stats : Object.fromEntries(Object.entries(stats).map(([k, v]) => [k, Math.floor(v * mult)]));

export function makeFighter({id, name, level, types, base, moves, training, boost = 1}) {
  const stats = boostStats(computeStats(base, level, training), boost);
  return {id, name, level, types, stats, moves, hp:stats.hp, maxHp:stats.hp};
}

// Expérience gagnée par chaque participant en battant un Pokémon sauvage (provisoire).
// Plus l'adversaire est haut niveau, plus l'XP est grande ; s'il dépasse le niveau du Pokémon, bonus jusqu'à ×3,
// et s'il est plus faible, malus jusqu'à ×0,5. Ex. : sauvage niv. 30 contre un niv. 8 → 90 XP ; niv. 5 contre niv. 5 → 5 XP.
export const xpReward = (wildLevel, ownLevel = wildLevel) => Math.max(1, Math.round(wildLevel * Math.min(3, Math.max(0.5, wildLevel / Math.max(1, ownLevel)))));

export function createBattle(team, wild, rand = Math.random) {
  return {team, wild, active:0, over:false, winner:null, participants:new Set([team[0].id]), rand};
}
export const activeFighter = b => b.team[b.active];
const usableMoves = f => { const u = f.moves.filter(isUsable); return u.length ? u : [LUTTE]; };
export const playerChoices = f => f.moves.length ? [...f.moves, ...(f.moves.some(isUsable) ? [] : [LUTTE])] : [LUTTE];

// IA de l'adversaire : choisit l'attaque qui devrait infliger le plus de dégâts (efficacité, STAB, précision),
// avec une priorité absolue à celle qui met K.O. la cible. Les ex æquo sont départagés au hasard.
export function expectedDamage(attacker, defender, move) {
  if (!isUsable(move)) return 0;
  const physical = move.cls === 'physical';
  const a = physical ? attacker.stats.atk : attacker.stats.spa, d = physical ? defender.stats.def : defender.stats.spd;
  const base = Math.floor(Math.floor(Math.floor(2 * attacker.level / 5 + 2) * move.power * a / d) / 50) + 2;
  const eff = effectiveness(move.type, defender.types);
  return Math.floor(base * (attacker.types.includes(move.type) ? 1.5 : 1) * eff * 0.925) * ((move.acc ?? 100) / 100);
}
export function chooseAiMove(attacker, defender, rand = Math.random) {
  const moves = usableMoves(attacker);
  const scored = moves.map(m => { const e = expectedDamage(attacker, defender, m); return {m, e, ko: e >= defender.hp}; });
  const kos = scored.filter(x => x.ko), pool = kos.length ? kos : scored;
  const best = Math.max(...pool.map(x => kos.length ? (x.m.acc ?? 100) : x.e));
  const top = pool.filter(x => (kos.length ? (x.m.acc ?? 100) : x.e) >= best - 1e-9);
  return top[Math.floor(rand() * top.length)].m;
}

// Un tour : le joueur choisit une attaque ; renvoie la liste des événements à afficher.
// Si `switchIndex` est donné, le joueur change de Pokémon au lieu d'attaquer et l'adversaire attaque aussitôt.
export function takeTurn(b, move, switchIndex = null) {
  if (b.over) return [];
  const events = [];
  const strike = side => {
    if (b.over) return;
    const attacker = side === 'player' ? activeFighter(b) : b.wild, defender = side === 'player' ? b.wild : activeFighter(b);
    if (attacker.hp <= 0) return;
    const chosen = side === 'player' ? move : chooseAiMove(b.wild, activeFighter(b), b.rand);
    if (side === 'player') b.participants.add(attacker.id);
    const r = damage(attacker, defender, chosen, b.rand);
    defender.hp = Math.max(0, defender.hp - r.dmg);
    events.push({type:'attack', side, user:attacker.name, move:chosen.fr || chosen.name, moveKey:chosen.name, moveType:chosen.type, ...r, target:side === 'player' ? 'wild' : 'player', targetName:defender.name, hp:defender.hp, maxHp:defender.maxHp});
    if (defender.hp > 0) return;
    events.push({type:'faint', side:side === 'player' ? 'wild' : 'player', name:defender.name});
    if (side === 'player') { b.over = true; b.winner = 'player'; return; }
    const next = b.team.findIndex(f => f.hp > 0);
    if (next < 0) { b.over = true; b.winner = 'wild'; return; }
    b.active = next; b.participants.add(b.team[next].id);
    events.push({type:'switch', name:b.team[next].name, hp:b.team[next].hp, maxHp:b.team[next].maxHp});
  };
  if (switchIndex !== null) {
    const f = b.team[switchIndex];
    if (!f || f.hp <= 0 || switchIndex === b.active) return [];
    b.active = switchIndex; b.participants.add(f.id);
    events.push({type:'switch', name:f.name, hp:f.hp, maxHp:f.maxHp, voluntary:true});
    strike('wild');
    return events;
  }
  const playerFirst = activeFighter(b).stats.spe >= b.wild.stats.spe;
  if (playerFirst) { strike('player'); strike('wild'); } else { strike('wild'); if (!b.over && activeFighter(b).hp > 0 && events.at(-1)?.type !== 'switch') strike('player'); }
  return events;
}
