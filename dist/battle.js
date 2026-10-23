import {STAT_KEYS,normalizeEVs} from './training.js';
import {weatherMult, hailHits} from './weather.js';
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
const dmgKind = m => m && m.cls !== 'status' ? (m.power > 0 ? 'hit' : FIXED[m.name] ? 'fixed' : m.category === 'ohko' ? 'ohko' : null) : null;
// Nature d'une attaque de statut gérée : 'ail' (inflige un statut), 'stat' (change des stats), 'heal', 'rest'.
export function statusKind(m) {
  if (!m || m.cls !== 'status') return null;
  if (m.name === 'rest') return 'rest';
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
  if (key === 'atk') { if (f.ability === 'huge-power') v *= 2; if (f.ability === 'guts' && st) v *= 1.5; else if (st === 'brn') v *= .5; }
  if (key === 'def' && f.ability === 'marvel-scale' && st) v *= 1.5;
  return Math.max(1, Math.floor(v));
}
const typeImmune = (f, move) => effectiveness(move.type, f.types) === 0 || (f.ability === 'levitate' && move.type === 'ground');

function movePower(attacker, defender, move) {
  let p = move.power;
  if (PINCH[attacker.ability] === move.type && attacker.hp <= attacker.maxHp / 3) p *= 1.5;
  if (attacker.flashFire && move.type === 'fire') p *= 1.5;
  if (defender.ability === 'thick-fat' && (move.type === 'fire' || move.type === 'ice')) p *= .5;
  return p;
}
export function damage(attacker, defender, move, rand = Math.random, weather = null) {
  if (move.acc != null) {
    const th = move.acc * accMult(Math.max(-6, Math.min(6, stageOf(attacker, 'acc') - stageOf(defender, 'eva')))) * (attacker.ability === 'compound-eyes' ? 1.3 : 1);
    if (rand() * 100 >= th) return {hit:false, dmg:0, eff:1, stab:false};
  }
  const kind = dmgKind(move), eff = effectiveness(move.type, defender.types) * (defender.ability === 'levitate' && move.type === 'ground' ? 0 : 1);
  if (kind === 'fixed') return {hit:true, dmg:eff > 0 ? (FIXED[move.name] === 'level' ? attacker.level : FIXED[move.name]) : 0, eff, stab:false};
  const physical = move.cls === 'physical';
  const crit = rand() < CRIT[Math.min(3, move.crit || 0)];
  const ak = physical ? 'atk' : 'spa', dk = physical ? 'def' : 'spd';
  const a = effStat(attacker, ak, {ignoreNeg:crit}), d = effStat(defender, dk, {ignorePos:crit});
  const base = Math.floor(Math.floor(Math.floor(2 * attacker.level / 5 + 2) * movePower(attacker, defender, move) * a / d) / 50) + 2;
  const stab = attacker.types.includes(move.type);
  let dmg = Math.floor(base * (crit ? 1.5 : 1) * (stab ? 1.5 : 1) * eff * weatherMult(weather, move.type) * (0.85 + rand() * 0.15));
  if (eff > 0) dmg = Math.max(1, dmg);
  return {hit:true, dmg, eff, stab, crit};
}

// Bonus chromatique : un Pokémon chromatique de l'équipe a toutes ses statistiques ×1,5 (jamais l'adversaire).
export const SHINY_BOOST = 1.5;
// `mult` : un nombre (toutes les stats) ou un objet {stat: multiplicateur} (objets tenus, chromatique).
export const boostStats = (stats, mult) => mult === 1 ? stats : Object.fromEntries(Object.entries(stats).map(([k, v]) => [k, Math.floor(v * (typeof mult === 'number' ? mult : (mult?.[k] ?? 1)))]));

export function makeFighter({id, name, level, types, base, moves, training, boost = 1, sash = false, berry = false, nature = null, ability = null, leftovers = false}) {
  const stats = boostStats(computeStats(base, level, training, nature), boost);
  return {id, name, level, types, stats, moves, hp:stats.hp, maxHp:stats.hp, sash, berry, leftovers, ability, status:null, confused:0, flinched:false, stages:{atk:0, def:0, spa:0, spd:0, spe:0, acc:0, eva:0}};
}

// Expérience gagnée par chaque participant en battant un Pokémon sauvage (provisoire).
// Plus l'adversaire est haut niveau, plus l'XP est grande ; s'il dépasse le niveau du Pokémon, bonus jusqu'à ×3,
// et s'il est plus faible, malus jusqu'à ×0,5. Ex. : sauvage niv. 30 contre un niveau 8 → 90 XP ; niv. 5 contre niv. 5 → 5 XP.
// XP gagnée : niveau de l'adversaire ÷ 8, ×(écart de niveau)² (un adversaire plus faible rapporte très peu, plus fort beaucoup), ×bonus de rareté.
export const XP_RARITY = [1, 1.3, 1.7, 2.3, 4];
export const xpReward = (wildLevel, ownLevel = wildLevel, tier = 1) => Math.max(1, Math.round(wildLevel / 8 * Math.min(3, Math.max(0.2, (wildLevel / Math.max(1, ownLevel)) ** 2)) * (XP_RARITY[Math.min(5, Math.max(1, tier)) - 1] || 1)));

// `queue` : adversaires suivants (combat d'arène : le champion envoie ses Pokémon un par un).
export function createBattle(team, wild, rand = Math.random, queue = []) {
  const b = {team, wild, active:0, over:false, winner:null, participants:new Set([team[0].id]), rand, intro:[], queue:[...queue], defeated:[]};
  const E = engine(b, b.intro); E.entry('wild'); E.entry('player');
  return b;
}
export const activeFighter = b => b.team[b.active];
const usableMoves = f => { const u = f.moves.filter(isUsable); return u.length ? u : [LUTTE]; };
export const playerChoices = f => f.moves.length ? [...f.moves, ...(f.moves.some(isUsable) ? [] : [LUTTE])] : [LUTTE];

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
  if (kind === 'fixed') return typeImmune(defender, move) ? 0 : (FIXED[move.name] === 'level' ? attacker.level : FIXED[move.name]) * ((move.acc ?? 100) / 100);
  if (kind === 'ohko') return defender.hp * .3;
  const physical = move.cls === 'physical';
  const a = effStat(attacker, physical ? 'atk' : 'spa'), d = effStat(defender, physical ? 'def' : 'spd');
  const base = Math.floor(Math.floor(Math.floor(2 * attacker.level / 5 + 2) * movePower(attacker, defender, move) * a / d) / 50) + 2;
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
  const pool = kos.length ? kos : scored;
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
        E.entry('wild'); E.entry('player'); return false;
      }
      b.over = true; b.winner = 'player'; return true;
    }
    const next = b.team.findIndex(x => x.hp > 0);
    if (next < 0) { b.over = true; b.winner = 'wild'; return true; }
    b.active = next; b.participants.add(b.team[next].id);
    events.push({type:'switch', name:b.team[next].name, hp:b.team[next].hp, maxHp:b.team[next].maxHp, snap:snap(b.team[next])});
    E.entry('player'); E.switched = true; return false;
  };
  const drop = f => { f.stages = {atk:0, def:0, spa:0, spd:0, spe:0, acc:0, eva:0}; f.confused = 0; f.flinched = false; };
  const stage = (f, side, key, delta, fromFoe) => {
    if (fromFoe && delta < 0 && (f.ability === 'clear-body' || (f.ability === 'hyper-cutter' && key === 'atk') || (f.ability === 'keen-eye' && key === 'acc'))) { msg(`${abilityFrName(f)} de ${f.name} empêche la baisse de ${STAT_FR[key]} !`, f, side); return; }
    const cur = stageOf(f, key), next = Math.max(-6, Math.min(6, cur + delta));
    if (next === cur) { msg(`${STAT_FR[key]} de ${f.name} ne peut plus ${delta > 0 ? 'augmenter' : 'baisser'} !`, f, side); return; }
    f.stages[key] = next; const n = Math.abs(delta);
    msg(`${STAT_FR[key]} de ${f.name} ${delta > 0 ? 'augmente' : 'baisse'}${n === 2 ? ' beaucoup' : n >= 3 ? ' énormément' : ''} !`, f, side);
  };
  const inflict = (f, side, code, m, src, srcSide) => {
    if (code === 'conf') { if (f.confused > 0 || !canInflict(f, code, m)) return false; f.confused = 2 + Math.floor(rand() * 4); msg(`${f.name} est confus !`, f, side); return true; }
    if (f.status || !canInflict(f, code, m)) return false;
    let turns = 0; if (code === 'slp') { turns = 1 + Math.floor(rand() * 3); if (f.ability === 'early-bird') turns = Math.max(1, Math.floor(turns / 2)); }
    f.status = {type:code, turns, n:1};
    msg(`${f.name} est ${STATUS_FR[code]} !`, f, side);
    if (f.ability === 'synchronize' && src && srcSide && ['psn', 'tox', 'brn', 'par'].includes(code) && !src.status && canInflict(src, code === 'tox' ? 'psn' : code)) { src.status = {type:code === 'tox' ? 'psn' : code, turns:0, n:1}; msg(`Synchro : ${src.name} est ${STATUS_FR[src.status.type]} !`, src, srcSide); }
    return true;
  };
  const E = {
    switched:false,
    entry(side) {
      const f = A(side); if (f.ability !== 'intimidate' || b.over) return;
      const o = A(O(side)); if (o.hp <= 0) return;
      msg(`Intimidation de ${f.name} !`, f, side); stage(o, O(side), 'atk', -1, true);
    },
    strike(side, movedFirst, move) {
      if (b.over) return;
      const a = A(side), d = A(O(side)), dside = O(side); if (a.hp <= 0) return;
      if (side === 'player') b.participants.add(a.id);
      const flinched = a.flinched; a.flinched = false;
      // Avant l'attaque : sommeil, gel, peur, confusion, paralysie
      if (a.status?.type === 'slp') {
        if (a.status.turns <= 0) { a.status = null; msg(`${a.name} se réveille !`, a, side); }
        else { a.status.turns--; msg(`${a.name} dort profondément…`, a, side); return; }
      } else if (a.status?.type === 'frz') {
        if (move.type === 'fire' || rand() < .2) { a.status = null; msg(`${a.name} n’est plus gelé !`, a, side); }
        else { msg(`${a.name} est gelé : il ne peut pas attaquer !`, a, side); return; }
      }
      if (flinched) { msg(`${a.name} a peur et ne peut pas attaquer !`, a, side); return; }
      if (a.confused > 0) {
        a.confused--;
        if (a.confused === 0) msg(`${a.name} n’est plus confus !`, a, side);
        else if (rand() < 1 / 3) {
          const hurt = Math.floor(Math.floor(Math.floor(2 * a.level / 5 + 2) * 40 * effStat(a, 'atk') / effStat(a, 'def')) / 50) + 2;
          a.hp = Math.max(0, a.hp - hurt); msg(`${a.name} est confus : il se blesse !`, a, side); checkFaint(side); return;
        }
      }
      if (a.status?.type === 'par' && rand() < .25) { msg(`${a.name} est paralysé : il ne peut pas attaquer !`, a, side); return; }
      const base = {type:'attack', side, user:a.name, move:move.fr || move.name, moveKey:move.name, moveType:move.type, target:side === 'player' ? 'wild' : 'player', targetName:d.name, targetId:d.id};
      const sk = statusKind(move);
      if (!sk && dmgKind(move) === null) { events.push({...base, status:true, hit:true, dmg:0, eff:1, stab:false, hp:d.hp, maxHp:d.maxHp}); msg('Mais rien ne se passe…', d, dside); return; }
      if (sk) { this.status(a, d, side, dside, move, sk, base); return; }
      // Talents qui absorbent l'attaque
      const absorb = (d.ability === 'water-absorb' && move.type === 'water') || (d.ability === 'volt-absorb' && move.type === 'electric');
      if (absorb || (d.ability === 'flash-fire' && move.type === 'fire')) {
        events.push({...base, hit:true, dmg:0, eff:1, stab:false, hp:d.hp, maxHp:d.maxHp});
        if (absorb) { const h = Math.min(Math.floor(d.maxHp / 4), d.maxHp - d.hp); d.hp += h; msg(`${abilityFrName(d)} : ${d.name} récupère ${h} PV !`, d, dside); }
        else { d.flashFire = true; msg(`Torche de ${d.name} : ses attaques Feu sont renforcées !`, d, dside); }
        return;
      }
      let r, hits = 1;
      if (dmgKind(move) === 'ohko') {
        const th = 30 + a.level - d.level;
        r = a.level < d.level || rand() * 100 >= th ? {hit:false, dmg:0, eff:1, stab:false} : {hit:true, dmg:d.hp, eff:1, stab:false};
      } else {
        r = damage(a, d, move, rand, b.weather);
        if (r.hit && move.maxHits > 1 && r.dmg > 0) {
          const n = move.minHits === move.maxHits ? move.maxHits : (() => { const x = rand(); return x < .375 ? 2 : x < .75 ? 3 : x < .875 ? 4 : 5; })();
          const rest = {...move, acc:null};
          for (hits = 1; hits < n && r.dmg < d.hp; hits++) r.dmg += damage(a, d, rest, rand, b.weather).dmg;
        }
      }
      // Ceinture Force / Fermeté : à PV pleins, un coup fatal laisse 1 PV
      let sashSaved = false, sturdy = false;
      if (r.dmg >= d.hp && d.hp === d.maxHp && dmgKind(move) !== 'ohko') {
        if (d.ability === 'sturdy') { r.dmg = d.hp - 1; sturdy = true; }
        else if (d.sash) { r.dmg = d.hp - 1; d.sash = false; sashSaved = true; }
      }
      d.hp = Math.max(0, d.hp - r.dmg);
      events.push({...base, sashSaved, hits, ...r, hp:d.hp, maxHp:d.maxHp});
      if (sturdy) msg(`Fermeté : ${d.name} tient bon avec 1 PV !`, d, dside);
      if (d.berry && d.hp > 0 && d.hp <= d.maxHp / 2) {
        const healed = Math.min(10, d.maxHp - d.hp); d.hp += healed; d.berry = false;
        events.push({type:'berry', side:dside, targetId:d.id, name:d.name, healed, hp:d.hp, maxHp:d.maxHp});
      }
      if (r.hit && r.dmg > 0) {
        if (d.status?.type === 'frz' && move.type === 'fire' && d.hp > 0) { d.status = null; msg(`${d.name} dégèle !`, d, dside); }
        if (move.drain > 0) { const h = Math.max(1, Math.floor(r.dmg * move.drain / 100)), real = Math.min(h, a.maxHp - a.hp); a.hp += real; if (real) msg(`${a.name} absorbe de l’énergie : +${real} PV !`, a, side); }
      }
      if (checkFaint(dside) || d.hp <= 0) return;
      if (r.hit && r.dmg > 0) {
        if (move.drain < 0 && a.ability !== 'rock-head') { const rec = Math.max(1, Math.floor(r.dmg * -move.drain / 100)); a.hp = Math.max(0, a.hp - rec); msg(`${a.name} est blessé par le contrecoup !`, a, side); if (checkFaint(side)) return; }
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
      }
    },
    status(a, d, side, dside, move, kind, base) {
      const self = kind === 'heal' || kind === 'rest' || move.target === 'user';
      let hit = true;
      if (!self && move.acc != null) {
        const th = move.acc * accMult(Math.max(-6, Math.min(6, stageOf(a, 'acc') - stageOf(d, 'eva')))) * (a.ability === 'compound-eyes' ? 1.3 : 1);
        hit = rand() * 100 < th;
      }
      events.push({...base, status:true, hit, dmg:0, eff:1, stab:false, hp:d.hp, maxHp:d.maxHp});
      if (!hit) return;
      if (kind === 'ail') {
        const code = move.name === 'toxic' ? 'tox' : AILMENT[move.ailment];
        if (!inflict(d, dside, code, move, a, side)) msg(`Mais ça n’a aucun effet sur ${d.name} !`, d, dside);
      } else if (kind === 'stat') {
        for (const [k, c] of move.statChanges) stage(self ? a : d, self ? side : dside, k, c, !self);
      } else if (kind === 'heal') {
        const h = Math.min(Math.floor(a.maxHp * move.healing / 100), a.maxHp - a.hp);
        if (h <= 0) msg('Mais ça échoue !', a, side); else { a.hp += h; msg(`${a.name} récupère ${h} PV !`, a, side); }
      } else if (kind === 'rest') {
        if (a.hp >= a.maxHp || a.status?.type === 'slp') msg('Mais ça échoue !', a, side);
        else { a.hp = a.maxHp; a.status = {type:'slp', turns:2, n:1}; msg(`${a.name} s’endort et récupère tous ses PV !`, a, side); }
      }
    },
    residual() {
      for (const side of ['player', 'wild']) {
        if (b.over) return;
        const f = A(side);
        if (f.leftovers && f.hp > 0 && f.hp < f.maxHp) { f.hp = Math.min(f.maxHp, f.hp + Math.max(1, Math.floor(f.maxHp / 16))); msg(`${f.name} récupère des PV grâce aux Restes !`, f, side); }
        if (b.weather === 'hail' && f.hp > 0 && hailHits(f)) { f.hp = Math.max(0, f.hp - Math.max(1, Math.floor(f.maxHp / 16))); msg(`La grêle frappe ${f.name} !`, f, side); checkFaint(side); }
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
  const playerFirst = pp !== wp ? pp > wp : effStat(me, 'spe') >= effStat(b.wild, 'spe');
  if (playerFirst) { const foe0 = b.wild; E.strike('player', true, move); if (b.wild === foe0) E.strike('wild', false, wildMove); }
  else { E.strike('wild', true, wildMove); if (!b.over && activeFighter(b).hp > 0 && !E.switched) E.strike('player', false, move); }
  if (!b.over) E.residual();
  return events;
}
