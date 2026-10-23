// Moteur de combat (fonctions pures, sans réseau ni DOM). Règles PROVISOIRES, inspirées des jeux :
// - stats = formule officielle sans IV/EV/nature, à partir des stats de base de PokéAPI ;
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
export function computeStats(base, level) {
  const core = b => Math.floor(2 * b * level / 100);
  return {hp:core(base.hp)+level+10, atk:core(base.atk)+5, def:core(base.def)+5, spa:core(base.spa)+5, spd:core(base.spd)+5, spe:core(base.spe)+5};
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

export function makeFighter({id, name, level, types, base, moves}) {
  const stats = computeStats(base, level);
  return {id, name, level, types, stats, moves, hp:stats.hp, maxHp:stats.hp};
}

// Expérience gagnée par chaque participant en battant un Pokémon sauvage (provisoire).
export const xpReward = wildLevel => Math.max(1, Math.round(wildLevel / 2));

export function createBattle(team, wild, rand = Math.random) {
  return {team, wild, active:0, over:false, winner:null, participants:new Set([team[0].id]), rand};
}
export const activeFighter = b => b.team[b.active];
const usableMoves = f => { const u = f.moves.filter(isUsable); return u.length ? u : [LUTTE]; };
export const playerChoices = f => f.moves.length ? [...f.moves, ...(f.moves.some(isUsable) ? [] : [LUTTE])] : [LUTTE];

// Un tour : le joueur choisit une attaque ; renvoie la liste des événements à afficher.
export function takeTurn(b, move) {
  if (b.over) return [];
  const events = [];
  const strike = side => {
    if (b.over) return;
    const attacker = side === 'player' ? activeFighter(b) : b.wild, defender = side === 'player' ? b.wild : activeFighter(b);
    if (attacker.hp <= 0) return;
    const chosen = side === 'player' ? move : (m => m[Math.floor(b.rand() * m.length)])(usableMoves(b.wild));
    if (side === 'player') b.participants.add(attacker.id);
    const r = damage(attacker, defender, chosen, b.rand);
    defender.hp = Math.max(0, defender.hp - r.dmg);
    events.push({type:'attack', side, user:attacker.name, move:chosen.fr || chosen.name, ...r, target:side === 'player' ? 'wild' : 'player', targetName:defender.name, hp:defender.hp, maxHp:defender.maxHp});
    if (defender.hp > 0) return;
    events.push({type:'faint', side:side === 'player' ? 'wild' : 'player', name:defender.name});
    if (side === 'player') { b.over = true; b.winner = 'player'; return; }
    const next = b.team.findIndex(f => f.hp > 0);
    if (next < 0) { b.over = true; b.winner = 'wild'; return; }
    b.active = next; b.participants.add(b.team[next].id);
    events.push({type:'switch', name:b.team[next].name, hp:b.team[next].hp, maxHp:b.team[next].maxHp});
  };
  const playerFirst = activeFighter(b).stats.spe >= b.wild.stats.spe;
  if (playerFirst) { strike('player'); strike('wild'); } else { strike('wild'); if (!b.over && activeFighter(b).hp > 0 && events.at(-1)?.type !== 'switch') strike('player'); }
  return events;
}
