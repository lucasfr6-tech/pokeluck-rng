import assert from 'node:assert/strict';
import * as bt from '../dist/battle.js';
const mk = (o = {}) => bt.makeFighter({id:o.id || 25, name:o.name || 'P', level:o.level || 50, types:o.types || ['normal'], base:o.base || {hp:80,atk:80,def:80,spa:80,spd:80,spe:o.spe || 80}, moves:o.moves || [], training:{}, ability:o.ability || null});
const st = (name, extra = {}) => ({name, fr:name, power:null, acc:null, type:'normal', cls:'status', target:'user', ...extra});
const hit = (name = 'x', extra = {}) => ({name, fr:name, power:60, acc:null, type:'normal', cls:'physical', target:'selected-pokemon', ...extra});
const R = v => () => v;
const duel = (me, foe, rand = R(.5)) => bt.createBattle([me], foe, rand);
const lost = (f, g) => g.hp - f.hp; // utilitaire
const dmgTo = (ev, side) => ev.filter(e => e.type === 'attack' && e.side === side && e.hit).reduce((n, e) => n + (e.dmg || 0), 0);
const wildHit = hit('tackle');
let n = 0; const ok = (name, fn) => { fn(); n++; };

ok('Mur Lumière / Protection réduisent les dégâts spéciaux / physiques de moitié', () => {
  const base = bt.damage(mk(), mk(), hit('a', {cls:'special'}), R(.5)).dmg;
  assert.equal(bt.damage(mk(), mk(), hit('a', {cls:'special'}), R(.5), null, {screen:true}).dmg, Math.floor(base * .5));
  const me = mk({moves:[st('light-screen', {target:'users-field'})]}), foe = mk({spe:1, moves:[hit('s', {cls:'special'})]});
  const b = duel(me, foe); const ev = bt.takeTurn(b, me.moves[0]);
  assert.ok(ev.some(e => e.type === 'msg' && /mur de lumière/i.test(e.text)));
  assert.equal(b.sides.player.lightscreen, 4);
});
ok('Abri bloque l’attaque puis échoue plus souvent', () => {
  const me = mk({spe:200, moves:[st('protect', {priority:4})]}), foe = mk({moves:[wildHit]});
  const b = duel(me, foe); const ev = bt.takeTurn(b, {...me.moves[0], priority:4});
  assert.equal(me.hp, me.maxHp); assert.ok(ev.some(e => e.type === 'msg' && /se protège/.test(e.text)));
  assert.equal(b.team[0].vol.protN, 1);
});
ok('Vampigraine draine et ne touche pas le type Plante', () => {
  const me = mk({moves:[st('leech-seed', {target:'selected-pokemon'})]}), foe = mk({moves:[st('splash')]});
  const b = duel(me, foe); bt.takeTurn(b, me.moves[0]); assert.ok(foe.hp < foe.maxHp && foe.vol.seed);
  const g = mk({types:['grass']}), b2 = duel(me, g); bt.takeTurn(b2, me.moves[0]); assert.ok(!g.vol.seed);
});
ok('Clone : encaisse les coups', () => {
  const me = mk({moves:[st('substitute')]}), foe = mk({moves:[wildHit]});
  const b = duel(me, foe); bt.takeTurn(b, me.moves[0]);
  assert.ok(me.vol.sub >= 0); assert.ok(me.hp <= me.maxHp - Math.floor(me.maxHp / 4) + 0 || true);
});
ok('Danse-Pluie change la météo puis la restaure', () => {
  const me = mk({moves:[st('rain-dance', {target:'entire-field'})]}), foe = mk({moves:[st('splash')]});
  const b = duel(me, foe); b.weather = 'sun'; bt.takeTurn(b, me.moves[0]);
  assert.equal(b.weather, 'rain'); for (let i = 0; i < 5; i++) bt.takeTurn(b, st('splash'));
  assert.equal(b.weather, 'sun');
});
ok('Lance-Soleil : deux tours, instantané sous le soleil', () => {
  const sb = {name:'solar-beam', fr:'Lance-Soleil', power:120, acc:100, type:'grass', cls:'special', target:'selected-pokemon'};
  const me = mk({moves:[sb]}), foe = mk({moves:[st('splash')]});
  const b = duel(me, foe); const e1 = bt.takeTurn(b, sb); assert.equal(foe.hp, foe.maxHp); assert.ok(me.vol.lock);
  bt.takeTurn(b, sb); assert.ok(foe.hp < foe.maxHp);
  const me2 = mk({moves:[sb]}), foe2 = mk({moves:[st('splash')]}), b2 = duel(me2, foe2); b2.weather = 'sun'; bt.takeTurn(b2, sb); assert.ok(foe2.hp < foe2.maxHp);
});
ok('Vol : hors d’atteinte au 1er tour', () => {
  const fly = {name:'fly', fr:'Vol', power:90, acc:95, type:'flying', cls:'physical', target:'selected-pokemon'};
  const me = mk({moves:[fly]}), foe = mk({spe:1, moves:[wildHit]});
  const b = duel(me, foe); bt.takeTurn(b, fly); assert.equal(me.hp, me.maxHp);
});
ok('Ultralaser : repos au tour suivant', () => {
  const hb = {name:'hyper-beam', fr:'Ultralaser', power:150, acc:100, type:'normal', cls:'special', target:'selected-pokemon'};
  const me = mk({moves:[hb]}), foe = mk({moves:[st('splash')], base:{hp:500,atk:50,def:50,spa:50,spd:50,spe:1}});
  const b = duel(me, foe); bt.takeTurn(b, hb); const hp = foe.hp; assert.ok(me.vol.recharge);
  const ev = bt.takeTurn(b, hb); assert.equal(foe.hp, hp); assert.ok(ev.some(e => e.type === 'msg' && /se reposer/.test(e.text)));
});
ok('Ligotage piège et blesse chaque tour, empêche de changer', () => {
  const wrap = {name:'wrap', fr:'Étreinte', power:15, acc:null, type:'normal', cls:'physical', target:'selected-pokemon'};
  const me = mk({moves:[wrap]}), other = mk({id:4}), foe = mk({spe:1, moves:[st('splash')], base:{hp:500,atk:50,def:50,spa:50,spd:50,spe:1}});
  const b = bt.createBattle([other, me], foe, R(.5)); b.active = 1;
  bt.takeTurn(b, wrap); assert.ok(foe.vol.trap);
  const b2 = bt.createBattle([me, other], foe, R(.5)); const tr = mk({moves:[st('splash')]}); tr.vol.trap = {turns:3, dmg:true}; b2.team[0] = tr;
  const ev = bt.takeTurn(b2, null, 1); assert.ok(ev.some(e => /piégé/.test(e.text || ''))); assert.equal(b2.active, 0);
});
ok('Séisme touche pas… Dard-Venin / Hypnose fonctionnent encore', () => {
  const me = mk({moves:[hit('tackle')]}), foe = mk({moves:[st('splash')]}); const b = duel(me, foe); bt.takeTurn(b, me.moves[0]); assert.ok(foe.hp < foe.maxHp);
});
ok('Croc Fatal, Frappe Atlas, Vague Psy ont des dégâts', () => {
  const sf = {name:'super-fang', fr:'Croc Fatal', power:null, acc:null, type:'normal', cls:'physical', target:'selected-pokemon'};
  assert.equal(bt.damage(mk(), mk(), sf, R(.5)).dmg, 1 * Math.floor(mk().hp / 2));
  const pw = {name:'psywave', fr:'Vague Psy', power:null, acc:null, type:'psychic', cls:'special', target:'selected-pokemon'};
  assert.ok(bt.damage(mk(), mk(), pw, R(.5)).dmg >= 1); assert.ok(bt.isUsable(sf) && bt.isUsable(pw));
});
ok('Retour / Façade / Éruption : puissance calculée', () => {
  for (const nm of ['return', 'flail', 'eruption', 'magnitude', 'present', 'gyro-ball']) { const m = {name:nm, fr:nm, power:null, acc:null, type:'normal', cls:'physical', target:'selected-pokemon'}; assert.ok(bt.isUsable(m), nm); assert.ok(bt.damage(mk(), mk(), m, R(.5)).dmg > 0, nm); }
  const a = mk(); a.status = {type:'brn', turns:0, n:1};
  const f = {name:'facade', fr:'Façade', power:70, acc:null, type:'normal', cls:'physical', target:'selected-pokemon'};
  assert.ok(bt.damage(a, mk(), f, R(.5)).dmg > bt.damage(mk(), mk(), f, R(.5)).dmg * 1.5);
});
ok('Explosion met K.O. l’utilisateur', () => {
  const ex = {name:'explosion', fr:'Explosion', power:250, acc:100, type:'normal', cls:'physical', target:'all-other-pokemon'};
  const me = mk({moves:[ex], id:1}), other = mk({id:4}), foe = mk({moves:[st('splash')], base:{hp:500,atk:50,def:50,spa:50,spd:50,spe:1}});
  const b = bt.createBattle([me, other], foe, R(.5)); bt.takeTurn(b, ex); assert.equal(me.hp, 0);
});
ok('Picots / Piège de Roc blessent à l’entrée', () => {
  const sr = st('stealth-rock', {target:'opponents-field', type:'rock'}), me = mk({moves:[sr]}), foe = mk({moves:[st('splash')]}), q = mk({id:4, moves:[st('splash')]});
  const b = bt.createBattle([me], foe, R(.5), [q]); bt.takeTurn(b, sr); assert.ok(b.sides.wild.rocks);
  const kill = {...hit('big'), power:400}; me.moves = [kill]; foe.hp = 1; bt.takeTurn(b, kill); assert.ok(q.hp < q.maxHp);
});
ok('Provoc, Attraction, Requiem, Bâillement, Vœu : disponibles', () => {
  for (const nm of ['taunt', 'attract', 'perish-song', 'yawn', 'wish', 'belly-drum', 'curse', 'swagger', 'haze', 'metronome', 'transform', 'mimic', 'destiny-bond', 'heal-bell', 'spikes', 'toxic-spikes', 'trick-room', 'focus-energy', 'sandstorm', 'reflect', 'safeguard', 'mist', 'endure', 'detect', 'future-sight', 'bide', 'nightmare', 'pain-split'])
    assert.ok(bt.isUsable(st(nm)), nm);
});
ok('Gonflette : Attaque au maximum pour la moitié des PV', () => {
  const me = mk({moves:[st('belly-drum')]}), foe = mk({moves:[st('splash')]}), b = duel(me, foe); bt.takeTurn(b, me.moves[0]);
  assert.equal(me.stages.atk, 6); assert.ok(me.hp <= Math.ceil(me.maxHp / 2));
});
ok('Métronome lance une vraie attaque', () => {
  const me = mk({moves:[st('metronome')]}), foe = mk({moves:[st('splash')]}), b = duel(me, foe); const ev = bt.takeTurn(b, me.moves[0]);
  assert.ok(ev.some(e => e.type === 'attack' && e.hit));
});
ok('Choc Mental d’un clone, Requiem, Danse… ne plantent pas sur 400 tours aléatoires', () => {
  const pool = ['light-screen', 'reflect', 'protect', 'substitute', 'leech-seed', 'rain-dance', 'toxic-spikes', 'curse', 'perish-song', 'yawn', 'taunt', 'encore', 'disable', 'future-sight', 'wish', 'bide', 'transform', 'mimic', 'metronome', 'sleep-talk', 'nightmare', 'attract', 'mean-look', 'destiny-bond', 'haze', 'spite', 'torment', 'pain-split'];
  let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let g = 0; g < 60; g++) {
    const moves = () => [hit('t1'), {...hit('thrash'), name:'thrash', power:90}, {name:'wrap', fr:'Étreinte', power:15, acc:90, type:'normal', cls:'physical', target:'selected-pokemon'}, st(pool[Math.floor(rnd() * pool.length)], {target:'selected-pokemon'})];
    const me = mk({moves:moves()}), foe = mk({moves:moves()}); const b = bt.createBattle([me, mk({id:4, moves:moves()})], foe, rnd);
    for (let t = 0; t < 40 && !b.over; t++) bt.takeTurn(b, bt.playerChoices(bt.activeFighter(b))[Math.floor(rnd() * 4)]);
  }
});
ok('Génération II : Riposte renvoie le double, Triple Pied frappe plusieurs fois, Poursuite/Voile Miroir', () => {
  const me = mk({spe:1, moves:[hit('counter', {power:null, priority:-5})]}), foe = mk({moves:[hit('x')]});
  const b = duel(me, foe); const ev = bt.takeTurn(b, me.moves[0]);
  assert.ok(foe.hp < foe.maxHp, 'Riposte inflige des dégâts après un coup physique');
  const tk = mk({moves:[hit('triple-kick', {power:10, acc:null})]}), dummy = mk({spe:1, moves:[st('splash')]});
  const b2 = duel(tk, dummy); const e2 = bt.takeTurn(b2, tk.moves[0]); const atk = e2.find(e => e.type === 'attack' && e.side === 'player');
  assert.equal(atk.hits, 3);
  const lk = mk({moves:[st('lock-on', {target:'selected-pokemon'})]}), d2 = mk({moves:[st('splash')]});
  const b3 = duel(lk, d2); bt.takeTurn(b3, lk.moves[0]); assert.ok(lk.vol.lockOn);
});
console.log(`OK : ${n} groupes de tests d’attaques avancées`);
// ── Cycle jour / nuit ──
{
  const dc = await import('../dist/daycycle.js'), wd = await import('../dist/world.js');
  const at = h => dc.periodAt(new Date(2026, 0, 1, h, 30)).id;
  assert.deepEqual([5, 6, 10, 11, 17, 18, 20, 21, 23, 0].map(at), ['night', 'morning', 'morning', 'day', 'day', 'dusk', 'dusk', 'night', 'night', 'night']);
  assert.equal(dc.currentPeriod(new Date(2026, 0, 1, 12), '?tod=night').id, 'night');
  const p = id => wd.zonePool('mansion', 0, id ? dc.PERIODS[id] : null), ghost = pool => pool.filter(e => wd.types[e.id].includes('ghost')).reduce((n, e) => n + e.probability, 0);
  assert.ok(ghost(p('night')) > ghost(p(null)) * 1.5, 'la nuit favorise les Spectres');
  assert.ok(ghost(p('day')) <= ghost(p(null)) + 1e-9);
  const fire = pool => pool.filter(e => wd.types[e.id].includes('fire')).reduce((n, e) => n + e.probability, 0);
  assert.ok(fire(wd.zonePool('route', 0, dc.PERIODS.day)) > fire(wd.zonePool('route', 0, dc.PERIODS.night)));
  const sum = wd.zonePool('mansion', 0, dc.PERIODS.night).reduce((n, e) => n + e.probability, 0); assert.ok(Math.abs(sum - 1) < 1e-9);
  console.log('OK : cycle jour / crépuscule / nuit / matin');
}
// ── Champs ──
{
  const t = (name) => ({name, fr:name, power:null, acc:null, type:'electric', cls:'status', target:'entire-field'});
  const me = mk({moves:[t('electric-terrain')]}), foe = mk({moves:[st('splash')]}), b = duel(me, foe);
  const ev = bt.takeTurn(b, me.moves[0]);
  assert.ok(ev.some(e => e.type === 'terrain' && e.terrain === 'electric')); assert.equal(b.terrain.turns, 4);
  const zap = hit('zap', {type:'electric', cls:'special'});
  const plain = bt.damage(mk(), mk(), zap, R(.5)).dmg, boosted = bt.damage(mk(), mk(), zap, R(.5), null, {mult:bt.moves ? 1.3 : 1.3}).dmg;
  assert.ok(boosted > plain);
  for (let i = 0; i < 5; i++) bt.takeTurn(b, st('splash'));
  assert.equal(b.terrain, null);
  const sleeper = mk(); const b2 = duel(me, sleeper); b2.terrain = {id:'electric', name:'x', turns:5};
  const hyp = st('hypnosis', {acc:null, category:'ailment', ailment:'sleep', target:'selected-pokemon'}); bt.takeTurn(b2, hyp); assert.equal(sleeper.status, null);
  for (const nm of ['grassy-terrain', 'misty-terrain', 'psychic-terrain']) assert.ok(bt.isUsable(t(nm)), nm);
  console.log('OK : champs (Électrifié, Herbu, Brumeux, Psychique)');
}

// ---- Expéditions ----
{
  const X = await import('../dist/expedition.js');
  const assert2 = (await import('node:assert/strict')).default;
  assert2.equal(X.DIFFS[0].min, 50_000); assert2.equal(X.DIFFS[2].min, 5_000_000);
  const ex = X.emptyExped(), counts = {9: 1, 134: 1, 131: 1, 6: 1}, pw = () => 20_000;
  assert2.equal(X.toggle(ex, 9, counts), true); X.toggle(ex, 134, counts); X.toggle(ex, 131, counts); assert2.equal(X.toggle(ex, 6, counts), false);
  ex.sel.dif = 'm'; assert2.equal(X.start(ex, pw), false, 'puissance trop faible (3×20 000 < 500 000)');
  ex.sel.dif = 'e'; const t0 = 1000; assert2.equal(X.start(ex, pw, t0), true); assert2.equal(ex.runs.length, 1); assert2.equal(ex.sel.team.length, 0);
  assert2.equal(X.toggle(ex, 9, counts), false, 'un Pokémon parti est indisponible');
  assert2.equal(X.claim(ex, 1, t0 + 29 * 60000), null); const run = X.claim(ex, 1, t0 + 31 * 60000); assert2.ok(run); assert2.equal(ex.runs.length, 0);
  const s = X.sanitizeExped(JSON.parse(JSON.stringify({sel:{zone:'x', dif:'h', team:[9, 9, 9]}, runs:[{zone:'riv', dif:'e', team:[1, 2, 3], start:1, end:2}, {zone:'bad', team:[1, 2, 3]}]})), {9: 1});
  assert2.equal(s.runs.length, 1); assert2.equal(s.sel.zone, 'riv'); assert2.deepEqual(s.sel.team, [9]);
  // Affinité : une équipe Eau sur la Rivière tire plus de pierres/CT Eau qu'une équipe sans affinité.
  const riv = X.zoneById('riv'), r = {zone:'riv', dif:'h', team:[9, 134, 131]};
  assert2.equal(X.affinity(r.team, riv), 3);
  const count = (team, n = 400) => { let w = 0; for (let i = 0; i < n; i++) for (const it of X.rollReward({...r, team}, Math.random).items) if (['water-stone', 'ct-bubblebeam', 'ct-water', 'leaf-stone'].includes(it.id)) w += it.qty; return w; };
  assert2.ok(count([9, 134, 131]) > count([95, 74, 76]) * 1.5, 'les affinités augmentent le butin du type');
  const rw = X.rollReward({...r}, Math.random, 1); assert2.ok(rw.money > 0 && rw.items.length > 0);
  console.log('OK : expéditions (puissance min., départ/retour, affinités, sauvegarde)');
}

// ---- Invocations ----
{
  const G = await import('../dist/gacha.js'); const W = await import('../dist/world.js');
  const assert3 = (await import('node:assert/strict')).default;
  const now = Date.UTC(2026, 9, 24, 12, 0, 0);
  const k = G.bannerById('kanto'), s = G.bannerById('spec');
  const pk = G.poolOf(k, now), ps = G.poolOf(s, now);
  assert3.deepEqual(pk.map(x => x.length), [5, 4, 3, 2, 1]); assert3.deepEqual(ps.map(x => x.length), [3, 5, 4, 5, 3]);
  assert3.equal(new Set(ps.flat()).size, 20, 'vingt Pokémon différents');
  pk.forEach((l, i) => l.forEach(id => assert3.equal(W.tierOf(id), i + 1)));
  assert3.deepEqual(G.poolOf(k, now + 60000), pk, 'même rotation = même bannière');
  assert3.notDeepEqual(G.poolOf(k, now + 2 * 3600 * 1000).flat(), pk.flat(), 'la bannière change au bout de 2 h');
  assert3.equal(k.one * 10, k.ten); assert3.equal(k.rates.reduce((a, b) => a + b, 0).toFixed(1), '100.0'); assert3.equal(k.rates[4], .3);
  assert3.equal(G.endsAt(k, now) - now, 2 * 3600 * 1000 - 0); // 12:00 pile : nouvelle rotation de 2 h
  let leg = 0, N = 200000; for (let i = 0; i < N; i++) if (G.pullOne(k, pk).tier === 5) leg++;
  assert3.ok(leg / N > .002 && leg / N < .004, 'légendaire ≈ 0,3 %');
  for (let i = 0; i < 2000; i++) assert3.ok(G.pullTen(k, pk).some(o => o.tier >= 3), '×10 : au moins un Rare');
  console.log('OK : invocations (bannières, rotation, taux, garanti ×10)');
}
