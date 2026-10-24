import {STAT_KEYS,normalizeEVs} from './training.js';
import {weatherMult, hailHits} from './weather.js';
import {V, grounded, terrainMult, POWER_FN, powerMod, FIXED_FX, CHARGE, SUN_INSTANT, SEMI, HITS_INVULN, RECHARGE, RAMPAGE, TRAP, SELF_KO, isSelfish, STATUS_FX, FX_NAMES, WEATHER_HEAL, weatherHealPct, fxUseful} from './moves-ext.js';
import {NATURES, ABILITIES} from './traits.js';
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
export function computeStats(base,level,training={},nature=null) {
 const evs=normalizeEVs(training.evs),stats={},n=NATURES[nature];
 for(const key of STAT_KEYS){const iv=Number.isInteger(training.ivs?.[key])?Math.max(0,Math.min(31,training.ivs[key])):0;
 const core=Math.floor((2*base[key]+iv+Math.floor(evs[key]/4))*level/100);
 stats[key]=key==='hp'?core+level+10:Math.floor((core+5)*(n?.up===key?1.1:n?.down===key?0.9:1));}
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

// PP : valeur des vrais jeux (fournie par PokéAPI) ; à défaut, estimée d'après la puissance.
export const ppOf = m => m?.pp > 0 ? m.pp : !(m?.power > 0) ? 20 : m.power >= 120 ? 5 : m.power >= 90 ? 10 : m.power >= 70 ? 15 : m.power >= 50 ? 20 : 25;
export const ppLeft = (f, m) => f?.pp ? (f.pp[m.name] ?? ppOf(m)) : ppOf(m);
export const LUTTE = {name:'struggle', fr:'Lutte', power:40, acc:100, type:'normal', cls:'physical'};

// ── Statuts, niveaux de stats, attaques de statut (règles des jeux récents) ──
export const STATUS_FR = {psn:'empoisonné', tox:'gravement empoisonné', brn:'brûlé', par:'paralysé', slp:'endormi', frz:'gelé'};
export const STATUS_TAG = {psn:'PSN', tox:'PSN', brn:'BRÛ', par:'PAR', slp:'SOM', frz:'GEL', conf:'CONF'};
const STAT_FR = {atk:'Attaque', def:'Défense', spa:'Atq. Spé.', spd:'Déf. Spé.', spe:'Vitesse', acc:'Précision', eva:'Esquive'};
const AILMENT = {poison:'psn', burn:'brn', paralysis:'par', sleep:'slp', freeze:'frz', confusion:'conf'};
const stageMult = s => s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
const accMult = s => s >= 0 ? (3 + s) / 3 : 3 / (3 - s);
const CRIT = [1 / 24, 1 / 8, 1 / 2, 1];
// Attaques à dégâts fixes (sans puissance dans PokéAPI) : niveau de l'attaquant ou nombre de PV.
const FIXED = {'seismic-toss':'level', 'night-shade':'level', 'dragon-rage':40, 'sonic-boom':20};
const POWDER = ['sleep-powder', 'stun-spore', 'poison-powder', 'spore'];
const PINCH = {overgrow:'grass', blaze:'fire', torrent:'water', swarm:'bug'};
const stageOf = (f, k) => f.stages?.[k] || 0;
const fixedOf = m => FIXED[m.name] ?? FIXED_FX[m.name];
const dmgKind = m => m && m.cls !== 'status' ? (m.power > 0 ? 'hit' : fixedOf(m) != null ? 'fixed' : m.category === 'ohko' ? 'ohko' : POWER_FN[m.name] ? 'hit' : null) : null;
const fixedDamage = (m, a, d, rand) => { const f = fixedOf(m); return f === 'level' ? a.level : typeof f === 'function' ? f(a, d, rand) : f; };
const sideOf = f => f._b ? (f._b.wild === f ? 'wild' : 'player') : null;
// Nature d'une attaque de statut gérée : 'ail' (inflige un statut), 'stat' (change des stats), 'heal', 'rest'.
export function statusKind(m) {
  if (!m || m.cls !== 'status') return null;
  if (m.name === 'rest') return 'rest';
  if (FX_NAMES.has(m.name)) return 'fx';
  if (m.name === 'toxic' || (m.category === 'ailment' && AILMENT[m.ailment])) return 'ail';
  if (m.category === 'net-good-stats' && m.statChanges?.length && m.target !== 'users-field' && m.target !== 'entire-field') return 'stat';
  if (m.category === 'heal' && m.healing > 0 && m.target === 'user') return 'heal';
  return null;
}
export const isUsable = move => !!move && (dmgKind(move) !== null || statusKind(move) !== null);
export const isDamaging = move => dmgKind(move) !== null;

export function effStat(f, key, o = {}) {
  let s = stageOf(f, key); if (o.ignoreNeg && s < 0) s = 0; if (o.ignorePos && s > 0) s = 0;
  let v = f.stats[key] * stageMult(s);
  const st = f.status?.type;
  if (key === 'spe' && st === 'par') v *= .5;
  if (key === 'spe' && f._b?.sides?.[sideOf(f)]?.tailwind > 0) v *= 2;
  if (key === 'atk') { if (f.ability === 'huge-power') v *= 2; if (f.ability === 'guts' && st) v *= 1.5; else if (st === 'brn' && !o.ignoreBrn) v *= .5; }
  if (key === 'def' && f.ability === 'marvel-scale' && st) v *= 1.5;
  return Math.max(1, Math.floor(v));
}
const typeImmune = (f, move) => effectiveness(move.type, f.types) === 0 || (f.ability === 'levitate' && move.type === 'ground');

function movePower(attacker, defender, move, rand = () => .5) {
  let p = move.power ?? POWER_FN[move.name]?.(attacker, defender, rand, f => effStat(f, 'spe'));
  p = powerMod(move.name, attacker, defender, p, move.type);
  if (PINCH[attacker.ability] === move.type && attacker.hp <= attacker.maxHp / 3) p *= 1.5;
  if (attacker.flashFire && move.type === 'fire') p *= 1.5;
  if (defender.ability === 'thick-fat' && (move.type === 'fire' || move.type === 'ice')) p *= .5;
  return p;
}
export function damage(attacker, defender, move, rand = Math.random, weather = null, opts = {}) {
  if (move.acc != null && !opts.sureHit) {
    const th = move.acc * accMult(Math.max(-6, Math.min(6, stageOf(attacker, 'acc') - stageOf(defender, 'eva')))) * (attacker.ability === 'compound-eyes' ? 1.3 : 1);
    if (rand() * 100 >= th) return {hit:false, dmg:0, eff:1, stab:false};
  }
  const kind = dmgKind(move), eff = effectiveness(move.type, defender.types) * (defender.ability === 'levitate' && move.type === 'ground' ? 0 : 1);
  if (kind === 'fixed') return {hit:true, dmg:eff > 0 ? fixedDamage(move, attacker, defender, rand) : 0, eff, stab:false};
  const physical = move.cls === 'physical';
  const crit = rand() < CRIT[Math.min(3, (move.crit || 0) + (opts.critBoost || 0))];
  const ak = physical ? 'atk' : 'spa', dk = physical ? 'def' : 'spd';
  const a = effStat(attacker, ak, {ignoreNeg:crit, ignoreBrn:move.name === 'facade'}), d = effStat(defender, dk, {ignorePos:crit});
  const base = Math.floor(Math.floor(Math.floor(2 * attacker.level / 5 + 2) * movePower(attacker, defender, move, rand) * a / d) / 50) + 2;
  const stab = attacker.types.includes(move.type);
  let dmg = Math.floor(base * (crit ? 1.5 : 1) * (stab ? 1.5 : 1) * eff * weatherMult(weather, move.type) * (opts.screen && !crit ? .5 : 1) * (opts.mult || 1) * (0.85 + rand() * 0.15));
  if (eff > 0) dmg = Math.max(1, dmg);
  return {hit:true, dmg, eff, stab, crit};
}

// Bonus chromatique : un Pokémon chromatique de l'équipe a toutes ses statistiques ×1,5 (jamais l'adversaire).
export const SHINY_BOOST = 1.5;
// `mult` : un nombre (toutes les stats) ou un objet {stat: multiplicateur} (objets tenus, chromatique).
export const boostStats = (stats, mult) => mult === 1 ? stats : Object.fromEntries(Object.entries(stats).map(([k, v]) => [k, Math.floor(v * (typeof mult === 'number' ? mult : (mult?.[k] ?? 1)))]));

export function makeFighter({id, name, level, types, base, moves, training, boost = 1, sash = false, berry = false, nature = null, ability = null, leftovers = false}) {
  const stats = boostStats(computeStats(base, level, training, nature), boost);
  return {id, name, level, types, stats, moves, pp:Object.fromEntries(moves.map(m => [m.name, ppOf(m)])), hp:stats.hp, maxHp:stats.hp, sash, berry, leftovers, ability, status:null, confused:0, flinched:false, vol:{}, stages:{atk:0, def:0, spa:0, spd:0, spe:0, acc:0, eva:0}};
}

// Expérience gagnée par chaque participant en battant un Pokémon sauvage (provisoire).
// Plus l'adversaire est haut niveau, plus l'XP est grande ; s'il dépasse le niveau du Pokémon, bonus jusqu'à ×3,
// et s'il est plus faible, malus jusqu'à ×0,5. Ex. : sauvage niv. 30 contre un niveau 8 → 90 XP ; niv. 5 contre niv. 5 → 5 XP.
// XP gagnée : niveau de l'adversaire ÷ 8, ×(écart de niveau)² (un adversaire plus faible rapporte très peu, plus fort beaucoup), ×bonus de rareté.
export const XP_RARITY = [1, 1.3, 1.7, 2.3, 4];
export const xpReward = (wildLevel, ownLevel = wildLevel, tier = 1) => Math.max(1, Math.round(wildLevel * (3 + wildLevel / 10) / 12 * Math.min(3, Math.max(0.2, (wildLevel / Math.max(1, ownLevel)) ** 2)) * (XP_RARITY[Math.min(5, Math.max(1, tier)) - 1] || 1)));

// `queue` : adversaires suivants (combat d'arène : le champion envoie ses Pokémon un par un).
export function createBattle(team, wild, rand = Math.random, queue = []) {
  const b = {team, wild, active:0, over:false, winner:null, participants:new Set([team[0].id]), rand, intro:[], queue:[...queue], defeated:[]};
  for (const f of [...team, wild, ...queue]) Object.defineProperty(f, '_b', {value:b, writable:true, enumerable:false, configurable:true});
  const E = engine(b, b.intro); E.entry('wild'); E.entry('player', false);
  return b;
}
export const activeFighter = b => b.team[b.active];
const hasPp = (f, m) => ppLeft(f, m) > 0;
const usableMoves = f => { const u = f.moves.filter(m => isUsable(m) && hasPp(f, m)); return u.length ? u : [LUTTE]; };
export const playerChoices = f => f.moves.length ? [...f.moves, ...(f.moves.some(m => isUsable(m) && hasPp(f, m)) ? [] : [LUTTE])] : [LUTTE];

function canInflict(f, code, m) {
  const t = f.types, ab = f.ability;
  if (m && m.type === 'electric' && code === 'par' && t.includes('ground')) return false;
  if (m && POWDER.includes(m.name) && t.includes('grass')) return false;
  if (code === 'psn' || code === 'tox') return !t.includes('poison') && !t.includes('steel') && ab !== 'immunity';
  if (code === 'brn') return !t.includes('fire') && ab !== 'water-veil';
  if (code === 'par') return !t.includes('electric') && ab !== 'limber';
  if (code === 'frz') return !t.includes('ice') && ab !== 'magma-armor';
  if (code === 'slp') return ab !== 'insomnia' && ab !== 'vital-spirit';
  if (code === 'conf') return ab !== 'own-tempo';
  return true;
}
// Fait-il sens d'utiliser cette attaque de statut maintenant ? (IA de l'adversaire et mode Auto)
export function statusUseful(attacker, defender, m) {
  const k = statusKind(m); if (!k) return false;
  if (k === 'fx') return fxUseful(m.name, attacker, defender, attacker._b);
  if (k === 'heal') return attacker.hp < attacker.maxHp * .5;
  if (k === 'rest') return attacker.hp < attacker.maxHp * .4 && attacker.status?.type !== 'slp';
  if (k === 'ail') {
    const code = m.name === 'toxic' ? 'tox' : AILMENT[m.ailment];
    if (code === 'conf' ? defender.confused > 0 : defender.status) return false;
    if (defender.hp < defender.maxHp * .35) return false;
    return canInflict(defender, code, m);
  }
  const self = m.target === 'user';
  return m.statChanges.some(([k2, c]) => self ? (c > 0 && stageOf(attacker, k2) < 2 && attacker.hp > attacker.maxHp * .5) : (c < 0 && stageOf(defender, k2) > -2 && defender.hp > defender.maxHp * .35));
}

// IA de l'adversaire (et du mode Auto) : met K.O. si possible ; sinon, une fois sur trois environ, une attaque de statut
// utile (endormir, paralyser, se renforcer, se soigner…) ; sinon l'attaque qui devrait infliger le plus de dégâts.
export function expectedDamage(attacker, defender, move) {
  const kind = dmgKind(move); if (!kind) return 0;
  if (kind === 'fixed') return typeImmune(defender, move) ? 0 : fixedDamage(move, attacker, defender, () => .5) * ((move.acc ?? 100) / 100);
  if (kind === 'ohko') return defender.hp * .3;
  const physical = move.cls === 'physical';
  const a = effStat(attacker, physical ? 'atk' : 'spa'), d = effStat(defender, physical ? 'def' : 'spd');
  const base = Math.floor(Math.floor(Math.floor(2 * attacker.level / 5 + 2) * movePower(attacker, defender, move, () => .5) * a / d) / 50) + 2;
  const absorbed = (defender.ability === 'water-absorb' && move.type === 'water') || (defender.ability === 'volt-absorb' && move.type === 'electric') || (defender.ability === 'flash-fire' && move.type === 'fire');
  const eff = absorbed ? 0 : effectiveness(move.type, defender.types) * (defender.ability === 'levitate' && move.type === 'ground' ? 0 : 1);
  return Math.floor(base * (attacker.types.includes(move.type) ? 1.5 : 1) * eff * 0.925) * ((move.acc ?? 100) / 100);
}
export function chooseAiMove(attacker, defender, rand = Math.random) {
  const moves = usableMoves(attacker), hits = moves.filter(isDamaging), statuses = moves.filter(m => statusKind(m));
  const scored = hits.map(m => { const e = expectedDamage(attacker, defender, m); return {m, e, ko: e >= defender.hp}; });
  const kos = scored.filter(x => x.ko), useful = statuses.filter(m => statusUseful(attacker, defender, m));
  if (!kos.length && useful.length && (!scored.length || rand() < .33)) return useful[Math.floor(rand() * useful.length)];
  if (!scored.length) return statuses[0] || LUTTE;
  let pool = kos.length ? kos : scored;
  // Sans KO : on évite les attaques « peu efficaces » dès qu'une attaque normale ou super efficace fait au moins 55 % des dégâts de la meilleure.
  if (!kos.length) { const top0 = Math.max(...scored.map(x => x.e)), ok = scored.filter(x => x.e > 0 && effectiveness(x.m.type, defender.types) >= 1 && x.e >= top0 * .55); if (ok.length && effectiveness(scored.find(x => x.e === top0)?.m.type, defender.types) < 1) pool = ok; }
  const best = Math.max(...pool.map(x => kos.length ? (x.m.acc ?? 100) : x.e));
  const top = pool.filter(x => (kos.length ? (x.m.acc ?? 100) : x.e) >= best - 1e-9);
  return top[Math.floor(rand() * top.length)].m;
}

// Mode Auto : faut-il changer de Pokémon ? Renvoie l'index du remplaçant ou null.
// On change si le Pokémon actif est mal engagé (attaques peu efficaces ou menacé) et qu'un coéquipier gagne nettement le duel.
export function chooseAutoSwitch(b, usedSwitches = 0) {
  if (usedSwitches >= 2 || b.over) return null;
  const me = activeFighter(b), foe = b.wild;
  const best = (f, t) => Math.max(0, ...f.moves.filter(isDamaging).map(m => expectedDamage(f, t, m)));
  const duel = f => best(f, foe) / Math.max(1, foe.hp) - best(foe, f) / Math.max(1, f.hp);
  const threatened = best(foe, me) >= me.hp * .6, weak = best(me, foe) < foe.hp * .3;
  if (!threatened && !weak) return null;
  let pick = null, score = duel(me) + .6;
  b.team.forEach((f, i) => { if (i === b.active || f.hp <= 0 || !f.moves.some(isDamaging)) return; const s = duel(f); if (s > score) { score = s; pick = i; } });
  return pick;
}

// ── Déroulement d'un tour : produit la liste des événements à afficher ──
const abilityFrName = f => ABILITIES[f.ability]?.fr || f.ability;
function engine(b, events) {
  const rand = b.rand, A = side => side === 'player' ? activeFighter(b) : b.wild, O = side => side === 'player' ? 'wild' : 'player';
  const snap = f => ({hp:f.hp, maxHp:f.maxHp, status:f.status?.type || null, conf:f.confused > 0});
  const msg = (text, f, side) => events.push({type:'msg', text, side, id:f.id, snap:snap(f)});
  const checkFaint = side => {
    const f = A(side); if (f.hp > 0) return false;
    events.push({type:'faint', side, name:f.name});
    if (side === 'wild') {
      b.defeated.push({id:f.id, level:f.level});
      if (b.queue.length) {
        b.wild = b.queue.shift(); const w = b.wild;
        events.push({type:'foeSwitch', name:w.name, id:w.id, level:w.level, hp:w.hp, maxHp:w.maxHp, snap:snap(w)});
        E.entry('wild'); E.entry('player', false); return false;
      }
      b.over = true; b.winner = 'player'; return true;
    }
    const next = b.team.findIndex(x => x.hp > 0);
    if (next < 0) { b.over = true; b.winner = 'wild'; return true; }
    b.active = next; b.participants.add(b.team[next].id);
    events.push({type:'switch', name:b.team[next].name, hp:b.team[next].hp, maxHp:b.team[next].maxHp, snap:snap(b.team[next])});
    E.entry('player'); E.switched = true; return false;
  };
  const S = side => ((b.sides ??= {player:{}, wild:{}})[side]);
  const drop = f => { f.stages = {atk:0, def:0, spa:0, spd:0, spe:0, acc:0, eva:0}; f.confused = 0; f.flinched = false; f.vol = {}; };
  const stage = (f, side, key, delta, fromFoe) => {
    if (fromFoe && delta < 0 && S(side).mist > 0) { msg(`La brume protège ${f.name} !`, f, side); return; }
    if (fromFoe && delta < 0 && (f.ability === 'clear-body' || (f.ability === 'hyper-cutter' && key === 'atk') || (f.ability === 'keen-eye' && key === 'acc'))) { msg(`${abilityFrName(f)} de ${f.name} empêche la baisse de ${STAT_FR[key]} !`, f, side); return; }
    const cur = stageOf(f, key), next = Math.max(-6, Math.min(6, cur + delta));
    if (next === cur) { msg(`${STAT_FR[key]} de ${f.name} ne peut plus ${delta > 0 ? 'augmenter' : 'baisser'} !`, f, side); return; }
    f.stages[key] = next; const n = Math.abs(delta);
    msg(`${STAT_FR[key]} de ${f.name} ${delta > 0 ? 'augmente' : 'baisse'}${n === 2 ? ' beaucoup' : n >= 3 ? ' énormément' : ''} !`, f, side);
  };
  const inflict = (f, side, code, m, src, srcSide) => {
    if (srcSide && srcSide !== side && S(side).safeguard > 0) { msg(`Rune Protect protège ${f.name} !`, f, side); return false; }
    if (b.terrain && grounded(f)) {
      if (b.terrain.id === 'misty') { msg(`Le champ brumeux protège ${f.name} !`, f, side); return false; }
      if (b.terrain.id === 'electric' && code === 'slp') { msg(`Le champ électrique empêche ${f.name} de s’endormir !`, f, side); return false; }
    }
    if (code === 'conf') { if (f.confused > 0 || !canInflict(f, code, m)) return false; f.confused = 2 + Math.floor(rand() * 4); msg(`${f.name} est confus !`, f, side); return true; }
    if (f.status || !canInflict(f, code, m)) return false;
    let turns = 0; if (code === 'slp') { turns = 1 + Math.floor(rand() * 3); if (f.ability === 'early-bird') turns = Math.max(1, Math.floor(turns / 2)); }
    f.status = {type:code, turns, n:1};
    msg(`${f.name} est ${STATUS_FR[code]} !`, f, side);
    if (f.ability === 'synchronize' && src && srcSide && ['psn', 'tox', 'brn', 'par'].includes(code) && !src.status && canInflict(src, code === 'tox' ? 'psn' : code)) { src.status = {type:code === 'tox' ? 'psn' : code, turns:0, n:1}; msg(`Synchro : ${src.name} est ${STATUS_FR[src.status.type]} !`, src, srcSide); }
    return true;
  };
  const X = {b, rand, msg, stage, inflict, checkFaint:s => checkFaint(s), S, events};
  const E = {
    switched:false,
    entry(side, fresh = true) {
      const f = A(side); if (b.over) return;
      V(f).turns = 0;
      if (fresh) {
        const s = S(side), grounded = !f.types.includes('flying') && f.ability !== 'levitate';
        if (s.rocks) { f.hp = Math.max(0, f.hp - Math.max(1, Math.floor(f.maxHp * effectiveness('rock', f.types) / 8))); msg(`Des pierres pointues blessent ${f.name} !`, f, side); if (checkFaint(side)) return; }
        if (grounded && s.spikes) { f.hp = Math.max(0, f.hp - Math.max(1, Math.floor(f.maxHp / [8, 6, 4][Math.min(3, s.spikes) - 1]))); msg(`Les picots blessent ${f.name} !`, f, side); if (checkFaint(side)) return; }
        if (grounded && s.tspikes) { if (f.types.includes('poison')) { s.tspikes = 0; msg(`${f.name} absorbe les pics toxiques !`, f, side); } else inflict(f, side, s.tspikes > 1 ? 'tox' : 'psn', null, null, null); }
        if (grounded && s.web) stage(f, side, 'spe', -1, true);
        if (b.over || A(side) !== f) return;
      }
      if (f.ability !== 'intimidate') return;
      const o = A(O(side)); if (o.hp <= 0) return;
      msg(`Intimidation de ${f.name} !`, f, side); stage(o, O(side), 'atk', -1, true);
    },
    // Avant l'attaque : sommeil, gel, peur, confusion, paralysie, amour, provocation…
    strike(side, movedFirst, move) {
      if (b.over) return;
      const a = A(side), d = A(O(side)), dside = O(side); if (a.hp <= 0) return;
      const va = V(a); V(d);
      if (side === 'player') b.participants.add(a.id);
      const flinched = a.flinched; a.flinched = false;
      let forced = false;
      if (va.lock) { move = va.lock.move; forced = true; }
      if (a.status?.type === 'slp') {
        if (a.status.turns <= 0) { a.status = null; msg(`${a.name} se réveille !`, a, side); }
        else if (move.name === 'sleep-talk' || move.name === 'snore') { a.status.turns--; }
        else { a.status.turns--; msg(`${a.name} dort profondément…`, a, side); return; }
      } else if (a.status?.type === 'frz') {
        if (move.type === 'fire' || ['flame-wheel', 'sacred-fire', 'flare-blitz', 'scald', 'steam-eruption', 'burn-up'].includes(move.name) || rand() < .2) { a.status = null; msg(`${a.name} n’est plus gelé !`, a, side); }
        else { msg(`${a.name} est gelé : il ne peut pas attaquer !`, a, side); return; }
      }
      if (flinched) { delete va.lock; msg(`${a.name} a peur et ne peut pas attaquer !`, a, side); return; }
      if (a.confused > 0) {
        a.confused--;
        if (a.confused === 0) msg(`${a.name} n’est plus confus !`, a, side);
        else if (rand() < 1 / 3) {
          const hurt = Math.floor(Math.floor(Math.floor(2 * a.level / 5 + 2) * 40 * effStat(a, 'atk') / effStat(a, 'def')) / 50) + 2;
          a.hp = Math.max(0, a.hp - hurt); delete va.lock; msg(`${a.name} est confus : il se blesse !`, a, side); checkFaint(side); return;
        }
      }
      if (a.status?.type === 'par' && rand() < .25) { delete va.lock; msg(`${a.name} est paralysé : il ne peut pas attaquer !`, a, side); return; }
      if (va.recharge) { va.recharge = false; msg(`${a.name} doit se reposer !`, a, side); return; }
      if (va.attract && rand() < .5) { msg(`${a.name} est amoureux : il ne peut pas attaquer !`, a, side); return; }
      if (!forced) {
        if (va.taunt > 0 && move.cls === 'status') { msg(`${a.name} ne peut pas utiliser ${move.fr || move.name} après la provocation !`, a, side); return; }
        if (va.disabled && va.disabled.name === move.name) { msg(`${move.fr || move.name} de ${a.name} est entravée !`, a, side); return; }
        if (va.torment && va.last && va.last.name === move.name && move.name !== 'struggle') { msg(`${a.name} est tourmenté : il ne peut pas répéter ${move.fr || move.name} !`, a, side); return; }
        if (va.encore && va.encore.move) move = va.encore.move;
        if ((move.name === 'fake-out' || move.name === 'first-impression') && va.turns > 0) { msg('Mais ça échoue !', a, side); return; }
      }
      if (!forced && move.name !== 'struggle' && a.pp && a.pp[move.name] != null) a.pp[move.name] = Math.max(0, a.pp[move.name] - 1);
      if (!forced && move.name !== 'struggle') va.last = move;
      va.turns = (va.turns || 0) + 1; va.moved = true;
      this.use(side, movedFirst, move, {forced});
    },
    use(side, movedFirst, move, o = {}) {
      const a = A(side), d = A(O(side)), dside = O(side), va = V(a), vd = V(d);
      const base = {type:'attack', side, user:a.name, move:move.fr || move.name, moveKey:move.name, moveType:move.type, target:side === 'player' ? 'wild' : 'player', targetName:d.name, targetId:d.id};
      const evStatus = hit => events.push({...base, status:true, hit, dmg:0, eff:1, stab:false, hp:d.hp, maxHp:d.maxHp});
      const sk = statusKind(move), foeTarget = !isSelfish(move);
      // Attaques en deux tours
      const charged = va.lock?.kind === 'charge' && o.forced;
      if (CHARGE[move.name] && !charged && !(SUN_INSTANT.includes(move.name) && b.weather === 'sun')) {
        va.lock = {move, kind:'charge'}; if (SEMI[move.name]) va.invuln = SEMI[move.name];
        evStatus(true); msg(`${a.name} ${CHARGE[move.name]} !`, a, side); return;
      }
      if (charged) { delete va.lock; delete va.invuln; }
      if (va.lock?.kind === 'bide' && o.forced) {
        va.lock.turns--;
        if (va.lock.turns > 0) { evStatus(true); msg(`${a.name} accumule de l’énergie…`, a, side); return; }
        const dmg = (va.bideTaken || 0) * 2; delete va.lock; evStatus(true);
        if (dmg <= 0) { msg('Mais ça échoue !', a, side); return; }
        d.hp = Math.max(0, d.hp - dmg); msg(`${a.name} libère l’énergie accumulée !`, d, dside); checkFaint(dside); return;
      }
      // Cibles protégées ou hors d'atteinte
      if (foeTarget && move.name !== 'struggle' && move.name !== 'feint' && vd.protect) { evStatus(true); msg(`${d.name} se protège !`, d, dside); if (['jump-kick', 'high-jump-kick', 'supercell-slam'].includes(move.name)) this.crash(a, side); delete va.lock; return; }
      if (foeTarget && vd.invuln && !(HITS_INVULN[vd.invuln] || []).includes(move.name)) { evStatus(false); msg(`${d.name} est hors d’atteinte !`, d, dside); delete va.lock; return; }
      if (foeTarget && b.terrain?.id === 'psychic' && (move.priority || 0) > 0 && grounded(d)) { evStatus(true); msg(`Le champ psychique protège ${d.name} !`, d, dside); return; }
      if (!sk && dmgKind(move) === null) { evStatus(true); msg('Mais rien ne se passe…', d, dside); return; }
      if (sk) { this.status(a, d, side, dside, move, sk, base, movedFirst); return; }
      if (move.name === 'dream-eater' && d.status?.type !== 'slp') { evStatus(true); msg('Mais ça échoue !', d, dside); return; }
      // Talents qui absorbent l'attaque
      const absorb = (d.ability === 'water-absorb' && move.type === 'water') || (d.ability === 'volt-absorb' && move.type === 'electric');
      if (absorb || (d.ability === 'flash-fire' && move.type === 'fire')) {
        events.push({...base, hit:true, dmg:0, eff:1, stab:false, hp:d.hp, maxHp:d.maxHp});
        if (absorb) { const h = Math.min(Math.floor(d.maxHp / 4), d.maxHp - d.hp); d.hp += h; msg(`${abilityFrName(d)} : ${d.name} récupère ${h} PV !`, d, dside); }
        else { d.flashFire = true; msg(`Torche de ${d.name} : ses attaques Feu sont renforcées !`, d, dside); }
        return;
      }
      // Casse-Brique et consorts brisent les écrans avant de frapper
      if (['brick-break', 'psychic-fangs', 'raging-bull'].includes(move.name)) { const t = S(dside); if (t.reflect > 0 || t.lightscreen > 0 || t.auroraveil > 0) { t.reflect = t.lightscreen = t.auroraveil = 0; msg(`Les écrans de ${d.name} sont brisés !`, d, dside); } }
      const physical = move.cls === 'physical', sc = S(dside);
      const opts = {mult:terrainMult(b.terrain, move, a, d), screen:(physical ? sc.reflect : sc.lightscreen) > 0 || sc.auroraveil > 0, sureHit:!!vd.sureHitBy, critBoost:va.focus ? 2 : 0, defenderInvulnerable:false};
      if (va.lockOn) { opts.sureHit = true; va.lockOn = false; }
      const sub = vd.sub > 0 && !['sonic-boom'].includes(move.name);
      let r, hits = 1;
      if (dmgKind(move) === 'ohko') {
        const th = 30 + a.level - d.level;
        r = a.level < d.level || rand() * 100 >= th ? {hit:false, dmg:0, eff:1, stab:false} : {hit:true, dmg:d.hp, eff:1, stab:false};
      } else {
        r = damage(a, d, move, rand, b.weather, opts);
        if (r.hit && move.maxHits > 1 && r.dmg > 0) {
          const n = move.minHits === move.maxHits ? move.maxHits : (() => { const x = rand(); return x < .375 ? 2 : x < .75 ? 3 : x < .875 ? 4 : 5; })();
          const rest = {...move, acc:null};
          for (hits = 1; hits < n && r.dmg < d.hp; hits++) r.dmg += damage(a, d, rest, rand, b.weather, opts).dmg;
        }
      }
      if (move.type === 'electric' && va.charged) va.charged = null;
      // Clone : il encaisse à la place de la cible
      if (sub && r.hit && r.dmg > 0) {
        const taken = Math.min(vd.sub, r.dmg); vd.sub -= taken;
        events.push({...base, hits, ...r, dmg:0, hp:d.hp, maxHp:d.maxHp});
        msg(vd.sub <= 0 ? `Le clone de ${d.name} disparaît !` : `Le clone de ${d.name} encaisse le coup !`, d, dside);
        if (vd.sub <= 0) vd.sub = 0;
        this.afterHit(a, d, side, dside, move, 0, true); return;
      }
      // Ceinture Force / Fermeté / Ténacité : à PV pleins, un coup fatal laisse 1 PV
      let sashSaved = false, sturdy = false;
      if (r.dmg >= d.hp && dmgKind(move) !== 'ohko' && vd.endure) { r.dmg = d.hp - 1; msg(`${d.name} tient bon !`, d, dside); }
      else if (r.dmg >= d.hp && d.hp === d.maxHp && dmgKind(move) !== 'ohko') {
        if (d.ability === 'sturdy') { r.dmg = d.hp - 1; sturdy = true; }
        else if (d.sash) { r.dmg = d.hp - 1; d.sash = false; sashSaved = true; }
      }
      if (['false-swipe', 'hold-back'].includes(move.name) && r.dmg >= d.hp) r.dmg = Math.max(0, d.hp - 1);
      d.hp = Math.max(0, d.hp - r.dmg);
      if (r.hit && r.dmg > 0) { vd.hurt = true; if (vd.lock?.kind === 'bide') vd.bideTaken = (vd.bideTaken || 0) + r.dmg; vd.lastHitBy = {move, dmg:r.dmg, cls:move.cls}; }
      events.push({...base, sashSaved, hits, ...r, hp:d.hp, maxHp:d.maxHp});
      if (sturdy) msg(`Fermeté : ${d.name} tient bon avec 1 PV !`, d, dside);
      if (d.berry && d.hp > 0 && d.hp <= d.maxHp / 2) {
        const healed = Math.min(10, d.maxHp - d.hp); d.hp += healed; d.berry = false;
        events.push({type:'berry', side:dside, targetId:d.id, name:d.name, healed, hp:d.hp, maxHp:d.maxHp});
      }
      if (!r.hit && ['jump-kick', 'high-jump-kick'].includes(move.name)) this.crash(a, side);
      if (r.hit && r.dmg > 0) {
        if (d.status?.type === 'frz' && (move.type === 'fire' || ['scald', 'flame-wheel', 'sacred-fire', 'flare-blitz'].includes(move.name)) && d.hp > 0) { d.status = null; msg(`${d.name} dégèle !`, d, dside); }
        if (move.drain > 0) { const h = Math.max(1, Math.floor(r.dmg * move.drain / 100)), real = Math.min(h, a.maxHp - a.hp); a.hp += real; if (real) msg(`${a.name} absorbe de l’énergie : +${real} PV !`, a, side); }
      }
      // Destin lié : l'attaquant tombe avec la cible
      if (d.hp <= 0 && vd.bond && a.hp > 0) { a.hp = 0; msg(`${a.name} est emporté dans la chute de ${d.name} !`, a, side); }
      const dFaint = checkFaint(dside);
      if (a.hp <= 0 && !b.over) checkFaint(side);
      if (SELF_KO.includes(move.name) && a.hp > 0) { a.hp = 0; msg(`${a.name} s’effondre !`, a, side); if (!b.over) checkFaint(side); }
      if (dFaint || d.hp <= 0 || b.over) return;
      this.afterHit(a, d, side, dside, move, r.dmg, false, r, movedFirst);
    },
    crash(a, side) { const h = Math.max(1, Math.floor(a.maxHp / 2)); a.hp = Math.max(0, a.hp - h); msg(`${a.name} s’écrase par terre et se blesse !`, a, side); checkFaint(side); },
    // Après un coup : recul, effets secondaires, pièges, recharge, rage…
    afterHit(a, d, side, dside, move, dmg, blockedBySub = false, r = null, movedFirst = false) {
      const va = V(a), vd = V(d);
      if (!blockedBySub && r?.hit && dmg > 0) {
        if (move.drain < 0 && a.ability !== 'rock-head') { const rec = Math.max(1, Math.floor(dmg * -move.drain / 100)); a.hp = Math.max(0, a.hp - rec); msg(`${a.name} est blessé par le contrecoup !`, a, side); if (checkFaint(side)) return; }
        if (move.name === 'rapid-spin') { const t = S(side); t.rocks = t.spikes = t.tspikes = t.web = 0; delete va.trap; delete va.seed; }
        if (move.name === 'knock-off') { if (d.sash || d.berry || d.leftovers) { d.sash = d.berry = d.leftovers = false; msg(`${a.name} fait tomber l’objet de ${d.name} !`, d, dside); } }
        if (move.name === 'smelling-salts' && d.status?.type === 'par') { d.status = null; msg(`${d.name} n’est plus paralysé !`, d, dside); }
        if (move.name === 'wake-up-slap' && d.status?.type === 'slp') { d.status = null; msg(`${d.name} se réveille !`, d, dside); }
        if (TRAP[move.name] && !vd.trap && d.hp > 0) { vd.trap = {turns:4 + Math.floor(rand() * 2), dmg:true, text:TRAP[move.name]}; msg(`${d.name} ${TRAP[move.name]} !`, d, dside); }
        if (RECHARGE.includes(move.name)) va.recharge = true;
      }
      if (r?.hit && RAMPAGE.includes(move.name)) {
        if (!va.lock) va.lock = {move, kind:'rampage', turns:1 + Math.floor(rand() * 2)};
        else { va.lock.turns--; if (va.lock.turns < 0) { delete va.lock; if (!(a.confused > 0)) { a.confused = 2 + Math.floor(rand() * 3); msg(`${a.name} est pris de confusion à cause de la fatigue !`, a, side); } } }
      } else if (va.lock?.kind === 'rampage') delete va.lock;
      if (blockedBySub || !r?.hit || dmg <= 0) return;
      // Effets secondaires
      if (move.ailment && AILMENT[move.ailment] && move.ailmentChance > 0 && rand() * 100 < move.ailmentChance && d.ability !== 'shield-dust') inflict(d, dside, move.name === 'toxic' ? 'tox' : AILMENT[move.ailment], move, a, side);
      if (move.statChanges?.length && d.hp > 0 && d.ability !== 'shield-dust' && rand() * 100 < (move.statChance || 100)) {
        const tgt = move.target === 'user' ? a : d, ts = move.target === 'user' ? side : dside;
        for (const [k, c] of move.statChanges) stage(tgt, ts, k, c, tgt !== a);
      }
      if (move.flinch > 0 && movedFirst && rand() * 100 < move.flinch && d.ability !== 'inner-focus') d.flinched = true;
      if (move.cls === 'physical' && d.hp > 0 && !a.status && rand() < .3) {
        const ab = d.ability, code = ab === 'static' ? 'par' : ab === 'flame-body' ? 'brn' : ab === 'poison-point' ? 'psn' : ab === 'effect-spore' ? ['slp', 'par', 'psn'][Math.floor(rand() * 3)] : null;
        if (code) inflict(a, side, code, null, d, dside);
      }
      if (move.cls === 'physical' && d.ability === 'rough-skin' && a.hp > 0) { a.hp = Math.max(0, a.hp - Math.max(1, Math.floor(a.maxHp / 8))); msg(`Peau Dure : ${a.name} est blessé !`, a, side); checkFaint(side); }
      if (vd.protect && move.name === 'x') return;
    },
    // Contre, Riposte, Mimique et attaques de statut
    status(a, d, side, dside, move, kind, base, movedFirst = false) {
      const va = V(a), vd = V(d);
      const self = kind === 'heal' || kind === 'rest' || kind === 'fx' || move.target === 'user';
      let hit = true;
      if (!self && move.acc != null) {
        const th = move.acc * accMult(Math.max(-6, Math.min(6, stageOf(a, 'acc') - stageOf(d, 'eva')))) * (a.ability === 'compound-eyes' ? 1.3 : 1);
        hit = va.lockOn || rand() * 100 < th; va.lockOn = false;
      }
      events.push({...base, status:true, hit, dmg:0, eff:1, stab:false, hp:d.hp, maxHp:d.maxHp});
      if (!hit) return;
      if (kind === 'fx') {
        const run = (mv, ignoreSleep) => this.use(side, movedFirst, mv, {forced:true, sub:true});
        const calc = mv => damage(a, d, mv, rand, b.weather, {}).dmg;
        const ok = STATUS_FX[move.name](X, a, d, side, move, dside, run, calc);
        if (ok === 'noop') msg('Mais rien ne se passe…', a, side); else if (!ok) msg('Mais ça échoue !', a, side);
        return;
      }
      if (kind === 'ail') {
        const code = move.name === 'toxic' ? 'tox' : AILMENT[move.ailment];
        if (!inflict(d, dside, code, move, a, side)) msg(`Mais ça n’a aucun effet sur ${d.name} !`, d, dside);
      } else if (kind === 'stat') {
        for (const [k, c] of move.statChanges) stage(self ? a : d, self ? side : dside, k, c, !self);
      } else if (kind === 'heal') {
        const pct = WEATHER_HEAL.includes(move.name) ? weatherHealPct(b.weather) : move.healing;
        const h = Math.min(Math.floor(a.maxHp * pct / 100), a.maxHp - a.hp);
        if (h <= 0) msg('Mais ça échoue !', a, side); else { a.hp += h; msg(`${a.name} récupère ${h} PV !`, a, side); }
      } else if (kind === 'rest') {
        if (a.hp >= a.maxHp || a.status?.type === 'slp') msg('Mais ça échoue !', a, side);
        else { a.hp = a.maxHp; a.status = {type:'slp', turns:2, n:1}; msg(`${a.name} s’endort et récupère tous ses PV !`, a, side); }
      }
    },
    residual() {
      for (const side of ['player', 'wild']) {
        if (b.over) return;
        const f = A(side), v = V(f);
        if (f.leftovers && f.hp > 0 && f.hp < f.maxHp) { f.hp = Math.min(f.maxHp, f.hp + Math.max(1, Math.floor(f.maxHp / 16))); msg(`${f.name} récupère des PV grâce aux Restes !`, f, side); }
        if (b.terrain?.id === 'grass' && f.hp > 0 && f.hp < f.maxHp && grounded(f)) { f.hp = Math.min(f.maxHp, f.hp + Math.max(1, Math.floor(f.maxHp / 16))); msg(`Le champ herbu soigne ${f.name} !`, f, side); }
        if (b.weather === 'hail' && f.hp > 0 && hailHits(f)) { f.hp = Math.max(0, f.hp - Math.max(1, Math.floor(f.maxHp / 16))); msg(`La grêle frappe ${f.name} !`, f, side); checkFaint(side); }
        if (b.weather === 'sand' && f.hp > 0 && !f.types.some(t => ['rock', 'ground', 'steel'].includes(t))) { f.hp = Math.max(0, f.hp - Math.max(1, Math.floor(f.maxHp / 16))); msg(`La tempête de sable frappe ${f.name} !`, f, side); checkFaint(side); }
        if (f.hp <= 0 || b.over) continue;
        // Vampigraine, piège, malédiction, cauchemar
        if (v.seed && f.hp > 0) { const loss = Math.max(1, Math.floor(f.maxHp / 8)); f.hp = Math.max(0, f.hp - loss); const o = A(O(side)); if (o.hp > 0) o.hp = Math.min(o.maxHp, o.hp + loss); msg(`Vampigraine draine l’énergie de ${f.name} !`, f, side); checkFaint(side); if (f.hp <= 0) continue; }
        if (v.trap?.dmg) { if (--v.trap.turns < 0) { delete v.trap; msg(`${f.name} est libéré !`, f, side); } else { f.hp = Math.max(0, f.hp - Math.max(1, Math.floor(f.maxHp / 8))); msg(`${f.name} ${v.trap.text || 'est piégé'} et souffre !`, f, side); checkFaint(side); if (f.hp <= 0) continue; } }
        if (v.curse) { f.hp = Math.max(0, f.hp - Math.max(1, Math.floor(f.maxHp / 4))); msg(`${f.name} souffre de la malédiction !`, f, side); checkFaint(side); if (f.hp <= 0) continue; }
        if (v.nightmare) { if (f.status?.type !== 'slp') v.nightmare = false; else { f.hp = Math.max(0, f.hp - Math.max(1, Math.floor(f.maxHp / 4))); msg(`${f.name} fait un cauchemar !`, f, side); checkFaint(side); if (f.hp <= 0) continue; } }
        if (v.yawn) { if (--v.yawn <= 0) { v.yawn = 0; if (!f.status) inflict(f, side, 'slp', null, null, null); } }
        if (v.perish != null) { v.perish--; if (v.perish <= 0) { f.hp = 0; msg(`${f.name} succombe au Requiem !`, f, side); checkFaint(side); continue; } msg(`Requiem : ${f.name} tombera K.O. dans ${v.perish} tour${v.perish > 1 ? 's' : ''}.`, f, side); }
        if (f.hp <= 0 || !f.status) continue;
        const t = f.status.type;
        if (f.ability === 'shed-skin' && rand() < .3) { f.status = null; msg(`Mue : ${f.name} est guéri !`, f, side); continue; }
        if (t === 'psn' || t === 'tox' || t === 'brn') {
          const part = t === 'psn' ? 8 : t === 'brn' ? 16 : 16 / f.status.n;
          const loss = Math.max(1, Math.floor(f.maxHp / part)); if (t === 'tox') f.status.n = Math.min(15, f.status.n + 1);
          f.hp = Math.max(0, f.hp - loss);
          msg(`${f.name} souffre ${t === 'brn' ? 'de sa brûlure' : 'du poison'} !`, f, side); checkFaint(side);
        }
      }
      for (const side of ['player', 'wild']) this.tick(V(A(side)));
      if (b.over) return;
      // Effets de côté : vœu, attaques différées, écrans, météo
      for (const side of ['player', 'wild']) {
        const s = S(side), f = A(side);
        if (s.wish && --s.wish.turns <= 0 && f.hp > 0) { const h = Math.min(s.wish.hp, f.maxHp - f.hp); f.hp += h; msg(`Le vœu se réalise : ${f.name} récupère ${h} PV !`, f, side); s.wish = null; }
        if (s.future && --s.future.turns <= 0) { const dmg = s.future.dmg; s.future = null; if (f.hp > 0) { f.hp = Math.max(0, f.hp - dmg); msg(`${f.name} subit l’attaque prévue !`, f, side); checkFaint(side); } if (b.over) return; }
        for (const [k, text] of [['reflect', 'Le mur protecteur s’efface.'], ['lightscreen', 'Le mur de lumière s’efface.'], ['auroraveil', 'Le voile d’aurore se dissipe.'], ['safeguard', 'Rune Protect se dissipe.'], ['mist', 'La brume se dissipe.'], ['tailwind', 'Le vent arrière retombe.']]) {
          if (s[k] > 0 && --s[k] === 0) msg(text, f, side);
        }
      }
      if (b.weatherTurns > 0 && --b.weatherTurns === 0) { b.weather = b.baseWeather || null; msg('Le temps revient à la normale.', A('player'), 'player'); }
      if (b.terrain && --b.terrain.turns <= 0) { const n = b.terrain.name; b.terrain = null; events.push({type:'terrain', terrain:null}); msg(`Le ${n.toLowerCase()} disparaît.`, A('player'), 'player'); }
      if (b.trickRoom > 0 && --b.trickRoom === 0) msg('Les dimensions retrouvent leur état normal.', A('player'), 'player');
    },
    tick(v) {
      v.protect = false; v.endure = false; if (!v.usedProt) v.protN = 0; v.usedProt = false; v.hurt = false; v.moved = false;
      if (v.taunt > 0) v.taunt--; if (v.encore && --v.encore.turns <= 0) delete v.encore; if (v.disabled && --v.disabled.turns <= 0) delete v.disabled;
    },
    leave(side) { const f = A(side); if (f.ability === 'natural-cure' && f.status) f.status = null; drop(f); }
  };
  return E;
}

export const cureMatch = (f, cures) => !!cures && (cures === 'all' ? (!!f.status || f.confused > 0) : !!f.status && cures.includes(f.status.type));
export function takeTurn(b, move, switchIndex = null, heal = null) {
  if (b.over) return [];
  const events = [], E = engine(b, events);
  if (heal) {
    const f = b.team[heal.index];
    if (!f || f.hp <= 0) return [];
    const canHeal = heal.amount > 0 && f.hp < f.maxHp, canCure = cureMatch(f, heal.cures);
    if (!canHeal && !canCure) return [];
    const healed = canHeal ? Math.min(heal.amount, f.maxHp - f.hp) : 0; f.hp += healed;
    if (canCure) { f.status = null; if (heal.cures === 'all') f.confused = 0; }
    events.push({type:'heal', name:f.name, id:f.id, healed, cured:canCure, hp:f.hp, maxHp:f.maxHp, item:heal.name, snap:{hp:f.hp, status:f.status?.type || null, conf:f.confused > 0}});
    E.strike('wild', false, chooseAiMove(b.wild, activeFighter(b), b.rand));
    if (!b.over) E.residual();
    return events;
  }
  if (switchIndex !== null) {
    const f = b.team[switchIndex];
    if (!f || f.hp <= 0 || switchIndex === b.active) return [];
    const cur = activeFighter(b);
    if (V(cur).trap && cur.hp > 0) { events.push({type:'msg', text:`${cur.name} est piégé : impossible de changer de Pokémon !`, side:'player', id:cur.id, snap:{hp:cur.hp, maxHp:cur.maxHp, status:cur.status?.type || null, conf:cur.confused > 0}}); return events; }
    E.leave('player');
    b.active = switchIndex; b.participants.add(f.id);
    events.push({type:'switch', name:f.name, hp:f.hp, maxHp:f.maxHp, voluntary:true, snap:{hp:f.hp, status:f.status?.type || null, conf:false}});
    E.entry('player');
    E.strike('wild', false, chooseAiMove(b.wild, f, b.rand));
    if (!b.over) E.residual();
    return events;
  }
  const me = activeFighter(b), wildMove = chooseAiMove(b.wild, me, b.rand);
  const pp = move.priority || 0, wp = wildMove.priority || 0;
  const sp = effStat(me, 'spe'), sw = effStat(b.wild, 'spe');
  const playerFirst = pp !== wp ? pp > wp : (b.trickRoom > 0 ? sp <= sw : sp >= sw);
  if (playerFirst) { const foe0 = b.wild; E.strike('player', true, move); if (b.wild === foe0) E.strike('wild', false, wildMove); }
  else { E.strike('wild', true, wildMove); if (!b.over && activeFighter(b).hp > 0 && !E.switched) E.strike('player', false, move); }
  if (!b.over) E.residual();
  return events;
}
