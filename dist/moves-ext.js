// Attaques et statuts avancés (règles des jeux officiels, combat 1 contre 1).
// Chaque attaque garde ses vraies statistiques (puissance, précision, PP, priorité) fournies par PokéAPI ;
// ce fichier ne décrit que ce que PokéAPI ne dit pas : l'effet.
// Le moteur (battle.js) fournit un contexte X : {b, rand, msg, stage, inflict, checkFaint, S, A, O}.

export const V = f => (f.vol ??= {});

// ── Puissance variable ou inconnue (PokéAPI renvoie null pour ces attaques) ──
const hpRatio = f => f.hp / f.maxHp;
const flailPower = f => { const p = Math.floor(48 * f.hp / f.maxHp); return p <= 1 ? 200 : p <= 4 ? 150 : p <= 9 ? 100 : p <= 16 ? 80 : p <= 32 ? 40 : 20; };
export const POWER_FN = {
  'return':() => 102, 'frustration':() => 102, 'hidden-power':() => 60, 'nature-power':() => 80, 'natural-gift':() => 80, 'fling':() => 30,
  'present':(a, d, rand) => { const x = rand(); return x < .4 ? 40 : x < .7 ? 80 : 120; },
  'magnitude':(a, d, rand) => [10, 30, 50, 70, 90, 110, 150][Math.min(6, Math.floor(rand() * 7))],
  'low-kick':(a, d) => 60, 'grass-knot':() => 60, 'heavy-slam':() => 60, 'heat-crash':() => 60,
  'flail':a => flailPower(a), 'reversal':a => flailPower(a),
  'eruption':a => Math.max(1, Math.floor(150 * hpRatio(a))), 'water-spout':a => Math.max(1, Math.floor(150 * hpRatio(a))), 'dragon-energy':a => Math.max(1, Math.floor(150 * hpRatio(a))),
  'crush-grip':(a, d) => Math.max(1, Math.floor(120 * hpRatio(d))), 'wring-out':(a, d) => Math.max(1, Math.floor(120 * hpRatio(d))), 'hard-press':(a, d) => Math.max(1, Math.floor(100 * hpRatio(d))),
  'gyro-ball':(a, d, rand, spe) => Math.min(150, Math.floor(25 * spe(d) / Math.max(1, spe(a))) + 1),
  'electro-ball':(a, d, rand, spe) => { const r = spe(a) / Math.max(1, spe(d)); return r >= 4 ? 150 : r >= 3 ? 120 : r >= 2 ? 80 : r >= 1 ? 60 : 40; },
  'punishment':(a, d) => Math.min(200, 60 + 20 * Object.values(d.stages || {}).filter(v => v > 0).reduce((s, v) => s + v, 0)),
  'trump-card':() => 60, 'stored-power':a => 20 + 20 * Object.values(a.stages || {}).filter(v => v > 0).reduce((s, v) => s + v, 0), 'power-trip':a => 20 + 20 * Object.values(a.stages || {}).filter(v => v > 0).reduce((s, v) => s + v, 0),
  'spit-up':() => 100, 'beat-up':() => 40, 'echoed-voice':() => 40, 'fury-cutter':() => 40, 'rollout':() => 30, 'ice-ball':() => 30, 'round':() => 60,
  'weather-ball':() => 50
};
// Attaques dont la puissance double selon l'état de la cible ou de l'utilisateur.
export function powerMod(name, a, d, p, type) {
  if (type === 'electric' && V(a).charged) return p * 2;
  if (name === 'facade' && a.status) return p * 2;
  if (name === 'venoshock' && (d.status?.type === 'psn' || d.status?.type === 'tox')) return p * 2;
  if (name === 'hex' && d.status) return p * 2;
  if (name === 'brine' && d.hp <= d.maxHp / 2) return p * 2;
  if (name === 'wake-up-slap' && d.status?.type === 'slp') return p * 2;
  if (name === 'smelling-salts' && d.status?.type === 'par') return p * 2;
  if (name === 'assurance' && V(d).hurt) return p * 2;
  if (name === 'payback' && V(d).moved) return p * 2;
  if (name === 'revenge' && V(a).hurt) return p * 2;
  if (name === 'retaliate' && V(a).allyFainted) return p * 2;
  return p;
}
// Dégâts fixes (aucune puissance chez PokéAPI) : nombre, 'level', ou fonction (attaquant, cible, rand).
export const FIXED_FX = {
  'super-fang':(a, d) => Math.max(1, Math.floor(d.hp / 2)), 'nature-madness':(a, d) => Math.max(1, Math.floor(d.hp / 2)), 'ruination':(a, d) => Math.max(1, Math.floor(d.hp / 2)),
  'psywave':(a, d, rand) => Math.max(1, Math.floor(a.level * (.5 + rand()))),
  'endeavor':(a, d) => Math.max(0, d.hp - a.hp),
  'final-gambit':a => a.hp,
  'sonic-boom':() => 20, 'dragon-rage':() => 40
};

// ── Attaques en deux tours / semi-invulnérables ──
export const CHARGE = {
  'solar-beam':'absorbe la lumière', 'solar-blade':'absorbe la lumière', 'razor-wind':'crée un tourbillon', 'sky-attack':'est entouré d’une lumière vive', 'skull-bash':'rentre la tête',
  'freeze-shock':'s’entoure d’une lumière glaciale', 'ice-burn':'est enveloppé d’un air glacial', 'meteor-beam':'accumule de la puissance spatiale', 'geomancy':'absorbe de l’énergie',
  'fly':'s’envole très haut', 'bounce':'bondit très haut', 'dig':'s’enfouit sous terre', 'dive':'plonge sous l’eau', 'shadow-force':'disparaît soudainement', 'phantom-force':'disparaît soudainement'
};
export const SUN_INSTANT = ['solar-beam', 'solar-blade'];
export const SEMI = {'fly':'fly', 'bounce':'fly', 'dig':'dig', 'dive':'dive', 'shadow-force':'shadow', 'phantom-force':'shadow'};
export const HITS_INVULN = {dig:['earthquake', 'magnitude', 'fissure'], fly:['gust', 'twister', 'thunder', 'sky-uppercut', 'hurricane', 'smack-down'], dive:['surf', 'whirlpool'], shadow:[]};
// ── Se reposer après l'attaque ──
export const RECHARGE = ['hyper-beam', 'giga-impact', 'blast-burn', 'frenzy-plant', 'hydro-cannon', 'rock-wrecker', 'roar-of-time', 'prismatic-laser', 'eternabeam', 'meteor-assault'];
// ── Attaques qui durent 2 à 3 tours puis rendent confus ──
export const RAMPAGE = ['thrash', 'outrage', 'petal-dance', 'raging-fury'];
// ── Piège (dégâts chaque tour, pas de changement) ──
export const TRAP = {'wrap':'est ligoté', 'bind':'est serré', 'fire-spin':'est pris dans un tourbillon de feu', 'clamp':'est coincé', 'whirlpool':'est pris dans un tourbillon', 'sand-tomb':'est enfermé dans le sable', 'magma-storm':'est pris dans un tourbillon de lave', 'infestation':'est infesté', 'snap-trap':'est pris au piège', 'thunder-cage':'est enfermé'};
// Champs (5 tours) : effets sur les Pokémon au sol (ni Vol, ni Lévitation).
export const TERRAIN = {
  'electric-terrain':{id:'electric', name:'Champ Électrifié', text:'Un champ électrique se déploie !'},
  'grassy-terrain':{id:'grass', name:'Champ Herbu', text:'Un champ herbu recouvre le sol !'},
  'misty-terrain':{id:'misty', name:'Champ Brumeux', text:'Une brume épaisse recouvre le sol !'},
  'psychic-terrain':{id:'psychic', name:'Champ Psychique', text:'Le sol devient étrange et mystérieux !'}
};
export const grounded = f => !f.types.includes('flying') && f.ability !== 'levitate';
export function terrainMult(t, move, a, d) {
  if (!t) return 1;
  if (t.id === 'electric' && move.type === 'electric' && grounded(a)) return 1.3;
  if (t.id === 'grass' && move.type === 'grass' && grounded(a)) return 1.3;
  if (t.id === 'psychic' && move.type === 'psychic' && grounded(a)) return 1.3;
  if (t.id === 'misty' && move.type === 'dragon' && grounded(d)) return .5;
  return 1;
}
export const SELF_KO = ['explosion', 'self-destruct', 'misty-explosion', 'final-gambit'];
export const PROTECT = ['protect', 'detect', 'spiky-shield', 'kings-shield', 'baneful-bunker', 'obstruct', 'silk-trap', 'burning-bulwark', 'max-guard'];
export const WEATHER_MOVE = {'rain-dance':['rain', 'La pluie se met à tomber !'], 'sunny-day':['sun', 'Le soleil brille intensément !'], 'hail':['hail', 'Il se met à grêler !'], 'snowscape':['hail', 'Il se met à neiger !'], 'sandstorm':['sand', 'Une tempête de sable se lève !']};
const FIELD_TARGETS = ['user', 'users-field', 'user-or-ally', 'entire-field', 'opponents-field', 'all-pokemon', 'user-and-allies', 'all-allies', 'all-opponents'];
export const isSelfish = m => FIELD_TARGETS.includes(m.target);

// Metronome : vraies statistiques de quelques attaques classiques (Gen. I-III).
export const METRONOME = [
  {name:'flamethrower', fr:'Lance-Flammes', power:90, acc:100, type:'fire', cls:'special', ailment:'burn', ailmentChance:10},
  {name:'thunderbolt', fr:'Tonnerre', power:90, acc:100, type:'electric', cls:'special', ailment:'paralysis', ailmentChance:10},
  {name:'ice-beam', fr:'Laser Glace', power:90, acc:100, type:'ice', cls:'special', ailment:'freeze', ailmentChance:10},
  {name:'surf', fr:'Surf', power:90, acc:100, type:'water', cls:'special'},
  {name:'psychic', fr:'Psyko', power:90, acc:100, type:'psychic', cls:'special', statChanges:[['spd', -1]], statChance:10},
  {name:'earthquake', fr:'Séisme', power:100, acc:100, type:'ground', cls:'physical'},
  {name:'body-slam', fr:'Plaquage', power:85, acc:100, type:'normal', cls:'physical', ailment:'paralysis', ailmentChance:30},
  {name:'hyper-beam', fr:'Ultralaser', power:150, acc:90, type:'normal', cls:'special'},
  {name:'razor-leaf', fr:'Tranch’Herbe', power:55, acc:95, type:'grass', cls:'physical', crit:1},
  {name:'slash', fr:'Tranche', power:70, acc:100, type:'normal', cls:'physical', crit:1},
  {name:'shadow-ball', fr:'Ball’Ombre', power:80, acc:100, type:'ghost', cls:'special', statChanges:[['spd', -1]], statChance:20},
  {name:'brick-break', fr:'Casse-Brique', power:75, acc:100, type:'fighting', cls:'physical'},
  {name:'crunch', fr:'Mâchouille', power:80, acc:100, type:'dark', cls:'physical', statChanges:[['def', -1]], statChance:20},
  {name:'dragon-claw', fr:'Draco-Griffe', power:80, acc:100, type:'dragon', cls:'physical'}
];

// ── Attaques de statut : chacune renvoie false si elle échoue ──
const heal = (X, f, side, n) => { const h = Math.min(n, f.maxHp - f.hp); if (h <= 0) return false; f.hp += h; X.msg(`${f.name} récupère ${h} PV !`, f, side); return true; };
const cond = (X, side, key, turns, text, f, need = true) => { const s = X.S(side); if (s[key] > 0) return false; s[key] = turns; X.msg(text, f, side); return true; };
const clearStages = f => { f.stages = {atk:0, def:0, spa:0, spd:0, spe:0, acc:0, eva:0}; };
export const STATUS_FX = {
  'reflect':(X, a, d, s) => cond(X, s, 'reflect', 5, `Un mur protège l’équipe de ${a.name} des attaques physiques !`, a),
  'light-screen':(X, a, d, s) => cond(X, s, 'lightscreen', 5, `Un mur de lumière protège l’équipe de ${a.name} des attaques spéciales !`, a),
  'aurora-veil':(X, a, d, s) => X.b.weather === 'hail' && cond(X, s, 'auroraveil', 5, `Un voile d’aurore protège l’équipe de ${a.name} !`, a),
  'safeguard':(X, a, d, s) => cond(X, s, 'safeguard', 5, `Rune Protect enveloppe l’équipe de ${a.name} !`, a),
  'mist':(X, a, d, s) => cond(X, s, 'mist', 5, `Une brume enveloppe l’équipe de ${a.name} !`, a),
  'tailwind':(X, a, d, s) => cond(X, s, 'tailwind', 4, `Un vent arrière souffle pour l’équipe de ${a.name} !`, a),
  'protect':(X, a, d, s) => protect(X, a, s, 'se protège'), 'detect':(X, a, d, s) => protect(X, a, s, 'se protège'), 'spiky-shield':(X, a, d, s) => protect(X, a, s, 'se couvre de piquants'),
  'kings-shield':(X, a, d, s) => protect(X, a, s, 'se protège'), 'baneful-bunker':(X, a, d, s) => protect(X, a, s, 'se protège'), 'obstruct':(X, a, d, s) => protect(X, a, s, 'se protège'),
  'silk-trap':(X, a, d, s) => protect(X, a, s, 'se protège'), 'burning-bulwark':(X, a, d, s) => protect(X, a, s, 'se protège'),
  'endure':(X, a, d, s) => { const v = V(a); const ok = X.rand() < 1 / Math.pow(3, v.protN || 0); v.protN = (v.protN || 0) + 1; v.usedProt = true; if (!ok) return false; v.endure = true; X.msg(`${a.name} se prépare à encaisser les coups !`, a, s); return true; },
  'rain-dance':(X, a, d, s, m) => weather(X, a, s, m), 'sunny-day':(X, a, d, s, m) => weather(X, a, s, m), 'hail':(X, a, d, s, m) => weather(X, a, s, m), 'snowscape':(X, a, d, s, m) => weather(X, a, s, m), 'sandstorm':(X, a, d, s, m) => weather(X, a, s, m),
  'electric-terrain':(X, a, d, s, mv) => terrain(X, a, s, mv), 'grassy-terrain':(X, a, d, s, mv) => terrain(X, a, s, mv), 'misty-terrain':(X, a, d, s, mv) => terrain(X, a, s, mv), 'psychic-terrain':(X, a, d, s, mv) => terrain(X, a, s, mv),
  'trick-room':(X, a, d, s) => { if (X.b.trickRoom > 0) { X.b.trickRoom = 0; X.msg('Les dimensions retrouvent leur état normal.', a, s); return true; } X.b.trickRoom = 5; X.msg(`${a.name} déforme les dimensions !`, a, s); return true; },
  'stealth-rock':(X, a, d, s, m, ds) => cond(X, ds, 'rocks', 1, 'Des pierres pointues flottent autour de l’équipe adverse !', d),
  'spikes':(X, a, d, s, m, ds) => { const t = X.S(ds); if ((t.spikes || 0) >= 3) return false; t.spikes = (t.spikes || 0) + 1; X.msg('Des picots sont semés aux pieds de l’équipe adverse !', d, ds); return true; },
  'toxic-spikes':(X, a, d, s, m, ds) => { const t = X.S(ds); if ((t.tspikes || 0) >= 2) return false; t.tspikes = (t.tspikes || 0) + 1; X.msg('Des pics toxiques sont semés aux pieds de l’équipe adverse !', d, ds); return true; },
  'sticky-web':(X, a, d, s, m, ds) => cond(X, ds, 'web', 1, 'Une toile gluante recouvre l’équipe adverse !', d),
  'defog':(X, a, d, s, m, ds) => { const t = X.S(s), u = X.S(ds); for (const k of ['rocks', 'spikes', 'tspikes', 'web']) { t[k] = 0; u[k] = 0; } for (const k of ['reflect', 'lightscreen', 'auroraveil', 'safeguard', 'mist']) u[k] = 0; X.stage(d, ds, 'eva', -1, true); return true; },
  'rapid-spin':() => false,
  'leech-seed':(X, a, d, s, m, ds) => { const v = V(d); if (v.seed || d.types.includes('grass')) return false; v.seed = s; X.msg(`${d.name} est infecté par les Vampigraines !`, d, ds); return true; },
  'substitute':(X, a, d, s) => { const v = V(a), c = Math.floor(a.maxHp / 4); if (v.sub > 0 || a.hp <= c) return false; a.hp -= c; v.sub = c; X.msg(`${a.name} crée un clone !`, a, s); return true; },
  'focus-energy':(X, a, d, s) => { const v = V(a); if (v.focus) return false; v.focus = true; X.msg(`${a.name} se concentre : ses coups critiques seront plus fréquents !`, a, s); return true; },
  'laser-focus':(X, a, d, s) => { V(a).focus = true; X.msg(`${a.name} se concentre intensément !`, a, s); return true; },
  'haze':(X, a, d, s, m, ds) => { clearStages(a); clearStages(d); X.msg('Les changements de statistiques sont annulés !', a, s); return true; },
  'psych-up':(X, a, d, s) => { a.stages = {...d.stages}; X.msg(`${a.name} copie les changements de statistiques de l’adversaire !`, a, s); return true; },
  'topsy-turvy':(X, a, d, s, m, ds) => { for (const k of Object.keys(d.stages)) d.stages[k] = -d.stages[k]; X.msg(`Les changements de statistiques de ${d.name} sont inversés !`, d, ds); return true; },
  'belly-drum':(X, a, d, s) => { const c = Math.floor(a.maxHp / 2); if (a.hp <= c || a.stages.atk >= 6) return false; a.hp -= c; a.stages.atk = 6; X.msg(`${a.name} sacrifie des PV et maximise son Attaque !`, a, s); return true; },
  'curse':(X, a, d, s, m, ds) => {
    if (a.types.includes('ghost')) { const c = Math.floor(a.maxHp / 2); if (V(d).curse) return false; a.hp = Math.max(1, a.hp - c); V(d).curse = true; X.msg(`${a.name} sacrifie des PV pour maudire ${d.name} !`, d, ds); return true; }
    X.stage(a, s, 'spe', -1, false); X.stage(a, s, 'atk', 1, false); X.stage(a, s, 'def', 1, false); return true;
  },
  'swagger':(X, a, d, s, m, ds) => { X.stage(d, ds, 'atk', 2, true); X.inflict(d, ds, 'conf', m, a, s); return true; },
  'flatter':(X, a, d, s, m, ds) => { X.stage(d, ds, 'spa', 1, true); X.inflict(d, ds, 'conf', m, a, s); return true; },
  'acupressure':(X, a, d, s) => { const k = ['atk', 'def', 'spa', 'spd', 'spe', 'acc', 'eva'][Math.floor(X.rand() * 7)]; X.stage(a, s, k, 2, false); return true; },
  'charge':(X, a, d, s) => { V(a).charged = {type:'electric'}; X.stage(a, s, 'spd', 1, false); X.msg(`${a.name} se charge en électricité !`, a, s); return true; },
  'heal-bell':(X, a, d, s) => { cureTeam(X, a, s); return true; }, 'aromatherapy':(X, a, d, s) => { cureTeam(X, a, s); return true; },
  'refresh':(X, a, d, s) => { if (!a.status) return false; a.status = null; X.msg(`${a.name} est guéri !`, a, s); return true; },
  'wish':(X, a, d, s) => { const t = X.S(s); if (t.wish) return false; t.wish = {turns:2, hp:Math.floor(a.maxHp / 2)}; X.msg(`${a.name} fait un vœu !`, a, s); return true; },
  'perish-song':(X, a, d, s, m, ds) => { const va = V(a), vd = V(d); if (va.perish != null && vd.perish != null) return false; va.perish ??= 3; vd.perish ??= 3; X.msg('Tous les Pokémon qui entendent la chanson tomberont K.O. dans 3 tours !', a, s); return true; },
  'destiny-bond':(X, a, d, s) => { V(a).bond = true; X.msg(`${a.name} veut emporter son adversaire dans sa chute !`, a, s); return true; },
  'nightmare':(X, a, d, s, m, ds) => { if (d.status?.type !== 'slp' || V(d).nightmare) return false; V(d).nightmare = true; X.msg(`${d.name} est pris d’un cauchemar !`, d, ds); return true; },
  'yawn':(X, a, d, s, m, ds) => { if (d.status || V(d).yawn) return false; V(d).yawn = 2; X.msg(`${d.name} commence à somnoler !`, d, ds); return true; },
  'taunt':(X, a, d, s, m, ds) => { if (V(d).taunt > 0) return false; V(d).taunt = 3; X.msg(`${d.name} se laisse provoquer !`, d, ds); return true; },
  'torment':(X, a, d, s, m, ds) => { if (V(d).torment) return false; V(d).torment = true; X.msg(`${d.name} est tourmenté !`, d, ds); return true; },
  'encore':(X, a, d, s, m, ds) => { const last = V(d).last; if (!last || V(d).encore) return false; V(d).encore = {move:last, turns:3}; X.msg(`${d.name} est forcé de recommencer !`, d, ds); return true; },
  'disable':(X, a, d, s, m, ds) => { const last = V(d).last; if (!last || V(d).disabled) return false; V(d).disabled = {name:last.name, turns:4}; X.msg(`${last.fr || last.name} de ${d.name} est entravée !`, d, ds); return true; },
  'attract':(X, a, d, s, m, ds) => { if (V(d).attract) return false; V(d).attract = true; X.msg(`${d.name} est amoureux !`, d, ds); return true; },
  'mean-look':(X, a, d, s, m, ds) => trapFoe(X, d, ds, 'ne peut plus s’enfuir'), 'block':(X, a, d, s, m, ds) => trapFoe(X, d, ds, 'ne peut plus s’enfuir'), 'spider-web':(X, a, d, s, m, ds) => trapFoe(X, d, ds, 'ne peut plus s’enfuir'),
  'spite':(X, a, d, s, m, ds) => { const last = V(d).last; if (!last || !d.pp?.[last.name]) return false; d.pp[last.name] = Math.max(0, d.pp[last.name] - 4); X.msg(`${last.fr || last.name} de ${d.name} perd des PP !`, d, ds); return true; },
  'pain-split':(X, a, d, s, m, ds) => { const avg = Math.floor((a.hp + d.hp) / 2); a.hp = Math.min(a.maxHp, avg); d.hp = Math.min(d.maxHp, avg); X.msg('Les PV sont partagés !', a, s); return true; },
  'memento':(X, a, d, s, m, ds) => { X.stage(d, ds, 'atk', -2, true); X.stage(d, ds, 'spa', -2, true); a.hp = 0; X.checkFaint(s); return true; },
  'transform':(X, a, d, s) => { a.types = [...d.types]; a.stats = {...d.stats, hp:a.stats.hp}; a.moves = d.moves.slice(); a.pp = Object.fromEntries(a.moves.map(x => [x.name, 5])); a.stages = {...d.stages}; a.ability = d.ability; X.msg(`${a.name} se transforme en ${d.name} !`, a, s); return true; },
  'mimic':(X, a, d, s) => { const last = V(d).last; if (!last || last.name === 'mimic') return false; const i = a.moves.findIndex(x => x.name === 'mimic'); if (i < 0) return false; a.moves[i] = last; a.pp[last.name] = 5; X.msg(`${a.name} copie ${last.fr || last.name} !`, a, s); return true; },
  'metronome':(X, a, d, s, m, ds, run) => { const mv = METRONOME[Math.floor(X.rand() * METRONOME.length)]; X.msg(`${a.name} agite le doigt et lance ${mv.fr} !`, a, s); run(mv); return true; },
  'sleep-talk':(X, a, d, s, m, ds, run) => { if (a.status?.type !== 'slp') return false; const opts = a.moves.filter(x => x.name !== 'sleep-talk' && x.name !== 'rest'); if (!opts.length) return false; run(opts[Math.floor(X.rand() * opts.length)], true); return true; },
  'teleport':() => 'noop', 'splash':() => 'noop', 'celebrate':() => 'noop', 'hold-hands':() => 'noop', 'happy-hour':() => 'noop', 'whirlwind':() => false, 'roar':() => false, 'baton-pass':() => false,
  'future-sight':(X, a, d, s, m, ds, run, calc) => { const t = X.S(ds); if (t.future) return false; t.future = {turns:3, dmg:calc(m), user:a.name}; X.msg(`${a.name} prévoit une attaque pour plus tard !`, a, s); return true; },
  'doom-desire':(X, a, d, s, m, ds, run, calc) => { const t = X.S(ds); if (t.future) return false; t.future = {turns:3, dmg:calc(m), user:a.name}; X.msg(`${a.name} fait un vœu destructeur !`, a, s); return true; },
  'bide':(X, a, d, s) => { V(a).lock = {move:{name:'bide', fr:'Patience', power:null, acc:null, type:'normal', cls:'physical', priority:1}, kind:'bide', turns:2}; V(a).bideTaken = 0; X.msg(`${a.name} encaisse les coups…`, a, s); return true; }
};
export const FX_NAMES = new Set(Object.keys(STATUS_FX));
FX_NAMES.delete('rapid-spin');

function protect(X, a, s, text) {
  const v = V(a); v.usedProt = true;
  const ok = X.rand() < 1 / Math.pow(3, v.protN || 0); v.protN = (v.protN || 0) + 1;
  if (!ok) return false;
  v.protect = true; X.msg(`${a.name} ${text} !`, a, s); return true;
}
function weather(X, a, s, m) {
  const [w, text] = WEATHER_MOVE[m.name];
  if (X.b.weather === w) return false;
  if (!('baseWeather' in X.b)) X.b.baseWeather = X.b.weather || null;
  X.b.weather = w; X.b.weatherTurns = 5; X.msg(text, a, s); return true;
}
function terrain(X, a, s, m) {
  const t = TERRAIN[m.name]; if (X.b.terrain?.id === t.id) return false;
  X.b.terrain = {id:t.id, name:t.name, turns:5}; X.events.push({type:'terrain', terrain:t.id, name:t.name, turns:5}); X.msg(t.text, a, s); return true;
}
function cureTeam(X, a, s) {
  const team = s === 'player' ? X.b.team : [a];
  for (const f of team) { if (f.status) f.status = null; }
  X.msg(`${a.name} soigne les problèmes de statut de son équipe !`, a, s);
}
function trapFoe(X, d, ds, text) { const v = V(d); if (v.trap) return false; v.trap = {turns:99, dmg:false}; X.msg(`${d.name} ${text} !`, d, ds); return true; }

// Soin dépendant de la météo (Aurore, Rayon Lune, Synthèse).
export const WEATHER_HEAL = ['moonlight', 'morning-sun', 'synthesis'];
export const weatherHealPct = (weather) => weather === 'sun' ? 66 : weather === 'rain' || weather === 'hail' || weather === 'sand' ? 25 : 50;

// Utilité d'une attaque de statut pour l'IA de l'adversaire (et le mode Auto).
export function fxUseful(name, a, d, b) {
  const side = a === b?.wild ? 'wild' : 'player', foe = side === 'wild' ? 'player' : 'wild';
  const S = x => (b.sides ??= {player:{}, wild:{}})[x];
  const va = V(a), vd = V(d), mine = S(side), theirs = S(foe);
  switch (name) {
    case 'reflect': return !(mine.reflect > 0);
    case 'light-screen': return !(mine.lightscreen > 0);
    case 'safeguard': return !(mine.safeguard > 0);
    case 'mist': case 'tailwind': return false;
    case 'aurora-veil': return b.weather === 'hail' && !(mine.auroraveil > 0);
    case 'protect': case 'detect': case 'spiky-shield': case 'kings-shield': case 'baneful-bunker': case 'obstruct': case 'silk-trap': case 'burning-bulwark': case 'endure': return false;
    case 'rain-dance': return b.weather !== 'rain'; case 'sunny-day': return b.weather !== 'sun'; case 'hail': case 'snowscape': return b.weather !== 'hail'; case 'sandstorm': return b.weather !== 'sand';
    case 'stealth-rock': return !theirs.rocks; case 'spikes': return (theirs.spikes || 0) < 3; case 'toxic-spikes': return (theirs.tspikes || 0) < 2; case 'sticky-web': return !theirs.web;
    case 'leech-seed': return !vd.seed && !d.types.includes('grass');
    case 'substitute': return !(va.sub > 0) && a.hp > a.maxHp * .5;
    case 'focus-energy': return !va.focus;
    case 'belly-drum': return a.hp > a.maxHp * .6 && a.stages.atk < 2;
    case 'swagger': case 'flatter': return !(d.confused > 0);
    case 'curse': return a.types.includes('ghost') ? a.hp > a.maxHp * .6 && !vd.curse : a.stages.atk < 2;
    case 'heal-bell': case 'aromatherapy': case 'refresh': return !!a.status;
    case 'wish': return a.hp < a.maxHp * .6 && !mine.wish;
    case 'yawn': return !d.status && !vd.yawn;
    case 'nightmare': return d.status?.type === 'slp' && !vd.nightmare;
    case 'taunt': return !(vd.taunt > 0);
    case 'attract': return !vd.attract;
    case 'mean-look': case 'block': case 'spider-web': return !vd.trap;
    case 'pain-split': return a.hp < d.hp * .6;
    case 'haze': return Object.values(d.stages).some(v => v >= 2) || Object.values(a.stages).some(v => v <= -2);
    case 'psych-up': return Object.values(d.stages).some(v => v >= 2);
    case 'topsy-turvy': return Object.values(d.stages).some(v => v >= 2);
    case 'future-sight': case 'doom-desire': return !theirs.future;
    case 'destiny-bond': return a.hp < a.maxHp * .3;
    case 'perish-song': return va.perish == null;
    case 'charge': return !va.charged;
    case 'metronome': return true;
    case 'sleep-talk': return a.status?.type === 'slp';
    case 'transform': case 'mimic': case 'acupressure': case 'spite': case 'torment': case 'encore': case 'disable': case 'memento': case 'laser-focus': case 'trick-room': case 'defog': case 'bide': return false;
    case 'electric-terrain': return b.terrain?.id !== 'electric'; case 'grassy-terrain': return b.terrain?.id !== 'grass'; case 'misty-terrain': return b.terrain?.id !== 'misty'; case 'psychic-terrain': return b.terrain?.id !== 'psychic';
    default: return false;
  }
}
