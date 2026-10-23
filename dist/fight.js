import {createTraining,effortYield,STAT_KEYS,STAT_NAMES} from './training.js';
// Interface de combat dans la scène : barre de PV du Pokémon sauvage, carte du combattant, attaques et journal.
import {effectiveness, chooseAiMove, chooseAutoSwitch, createBattle, takeTurn, activeFighter, playerChoices, isUsable, isDamaging, statusKind, cureMatch, makeFighter, knownMoves, xpReward, STATUS_TAG, TYPE_FR, DEFAULT_BASE} from './battle.js';
import {randomTraits, NATURE_KEYS} from './traits.js';
import {getSpecies, getMoves, getMove} from './battle-data.js';
import {playAttackEffect} from './effects.js';
import {mountTrainer, unmountTrainer, sendOut} from './trainer-fx.js';

const $ = s => document.querySelector(s);
const wait = ms => new Promise(r => setTimeout(r, ms));
const COLORS = {normal:'#a8a77a',fire:'#ee8130',water:'#6390f0',electric:'#f7d02c',grass:'#7ac74c',ice:'#96d9d6',fighting:'#c22e28',poison:'#a33ea1',ground:'#e2bf65',flying:'#a98ff3',psychic:'#f95587',bug:'#a6b91a',rock:'#b6a136',ghost:'#735797',dragon:'#6f35fc',dark:'#705746',steel:'#b7b7ce',fairy:'#d685ad'};
export const typeColor = t => COLORS[t] || COLORS.normal;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt = n => n.toLocaleString('fr-FR');

export async function buildFighter(spec, level, types, id, name, training, knownNames, boost = 1, sash = false, berry = false, trait = null, leftovers = false) {
  const sp = await getSpecies(id);
  const moves = await getMoves(knownNames || knownMoves(sp.learnset, level));
  const t = trait || randomTraits(), list = sp.abilities || [], ability = list.length ? list[Math.min(t.s, list.length - 1)] : null;
  return {fighter: makeFighter({id, name, level, types, base: sp.stats || DEFAULT_BASE, moves,training,boost,sash,berry,leftovers,nature:t.n,ability}), learnset: sp.learnset};
}

// ctx : {team(), level(id), name(id), types(id), backSprite(id), reduced(), addXp(id, amount) → {before, after}}
export function createFight(ctx) {
  let token = 0, boss = null, autoSwitches = 0, bt = null, wildLevel = 0, learnsets = {}, playing = false, starting = false, vWait = 0;
  const el = {battle: $('#battle'), log: $('#battle-log'), moves: $('#moves'), card: $('#fighter'), cardImg: $('#ally'), cardXp: $('#fighter-xp'), cardXpText: $('#fighter-xptext'), cardName: $('#fighter-name'), cardFill: $('#fighter-fill'), cardText: $('#fighter-text'),
    victory: $('#victory'), swBtn: $('#switch'), swPanel: $('#switch-panel'), flee: $('#flee'), hp: $('#hp'), hpName: $('#hp-name'), hpSt: $('#hp-st'), cardSt: $('#fighter-st'), hpText: $('#hp-text'), hpFill: $('#hp-fill'), stage: $('#stage')};
  if (window.ResizeObserver) new ResizeObserver(() => { const h = el.battle.offsetHeight; if (h) document.querySelector('.scene').style.setProperty('--strip', h + 'px'); }).observe(el.battle);
  const delay = ms => wait(ctx.reduced() ? Math.min(ms, 120) : ms);
  const bar = (fill, hp, max) => { const r = max ? hp / max : 0; fill.style.width = Math.max(0, r * 100) + '%'; fill.dataset.level = r > .5 ? 'high' : r > .2 ? 'mid' : 'low'; };
  const say = text => { el.log.textContent = text; };
  const chips = s => s ? `${s.status ? `<i class="st-chip st-${s.status}">${STATUS_TAG[s.status]}</i>` : ''}${s.conf ? '<i class="st-chip st-conf">CONF</i>' : ''}` : '';
  const snapOf = f => ({status: f.status?.type || null, conf: f.confused > 0});
  const setWild = (hp, s = snapOf(bt.wild), max = s?.maxHp ?? bt.wild.maxHp) => { el.hpSt.innerHTML = chips(s); el.hpText.textContent = `PV ${fmt(hp)} / ${fmt(max)}`; bar(el.hpFill, hp, max); };
  const setCard = (f, hp = f.hp, s = snapOf(f)) => { el.cardSt.innerHTML = chips(s); const inf = ctx.info(f.id); el.cardImg.style.opacity = ''; if (el.cardImg.dataset.id !== String(f.id)) { el.cardImg.dataset.id = f.id; el.cardImg.src = ctx.backSprite(f.id); } el.cardImg.hidden = false; el.cardName.textContent = `${f.name} · Niv. ${inf.level}`; el.cardXp.style.width = inf.pct + '%'; el.cardXpText.textContent = inf.text; el.cardText.textContent = `PV ${fmt(hp)} / ${fmt(f.maxHp)}`; bar(el.cardFill, hp, f.maxHp); el.card.hidden = false; };
  function renderMoves(enabled = true) {
    el.swBtn.disabled = !enabled || !bt || bt.team.filter(t => t.hp > 0).length < 2; $('#bag').disabled = !enabled || !bt;
    const f = activeFighter(bt);
    el.moves.innerHTML = playerChoices(f).map((m, i) => {
      const usable = isUsable(m);
      const info = !usable ? 'Effet à venir' : isDamaging(m) ? `Puiss. ${m.power || '—'}${m.acc ? ' · Préc. ' + m.acc : ''}` : `Statut${m.acc ? ' · Préc. ' + m.acc : ''}`;
      return `<button class="move" data-i="${i}" ${enabled && usable ? '' : 'disabled'} style="--tc:${typeColor(m.type)}" title="${esc(TYPE_FR[m.type] || m.type)} · ${info}"><b>${i + 1} · ${esc(m.fr)}</b><small>${esc(TYPE_FR[m.type] || m.type)} · ${info}</small></button>`;
    }).join('');
  }
  const effectText = e => !e.hit ? 'Raté !' : e.eff === 0 ? 'Ça n’affecte pas la cible…' : e.eff > 1 ? 'C’est super efficace !' : e.eff < 1 ? 'Ce n’est pas très efficace…' : '';

  function flash(img) { if (!img) return; img.classList.remove('hit'); void img.offsetWidth; img.classList.add('hit'); }
  async function play(events) {
    for (const e of events) {
      if (e.type === 'msg') {
        say(e.text);
        if (e.side === 'wild') setWild(e.snap.hp, e.snap); else { const f = bt.team.find(t => t.id === e.id); if (f && activeFighter(bt).id === e.id) setCard(f, e.snap.hp, e.snap); }
        await delay(900);
      } else if (e.type === 'attack' && e.status) {
        say(`${e.user} utilise ${e.move} !`); await delay(750);
        if (!e.hit) { say(`${e.user} utilise ${e.move} ! Raté !`); await delay(600); }
      } else if (e.type === 'attack') {
        say(`${e.user} utilise ${e.move} !`); playAttackEffect(e); await delay(650);
        if (e.target === 'wild') setWild(e.hp, undefined, e.maxHp); else setCard(bt.team.find(t => t.name === e.targetName), e.hp);
        if (e.hit && e.dmg) flash(e.target === 'wild' ? $('#result img') : el.cardImg);
        const t = effectText(e); if (t) { say(`${e.user} utilise ${e.move} ! ${t}`); await delay(700); }
        if (e.hit && e.hits > 1) { say(`Touché ${e.hits} fois !`); await delay(700); }
        if (e.crit && e.dmg) { say('Coup critique !'); await delay(700); }
        if (e.sashSaved && e.target === 'player') { say(`${e.targetName} s’accroche grâce à sa Ceinture Force !`); ctx.consumeHeld?.(e.targetId, 'band'); await delay(1000); }
      } else if (e.type === 'berry') { if (e.side === 'player') setCard(bt.team.find(t => t.id === e.targetId), e.hp); say(`${e.name} mange sa Baie Oran et récupère ${e.healed} PV !`); ctx.consumeHeld?.(e.targetId, 'oran'); await delay(1000); }
      else if (e.type === 'heal') { if (activeFighter(bt).id === e.id) setCard(activeFighter(bt), e.hp, e.snap); say(e.healed ? `${e.name} récupère ${e.healed} PV grâce à ${e.item} !` : `${e.name} est soigné grâce à ${e.item} !`); await delay(900); }
      else if (e.type === 'foeSwitch') {
        say(`${boss?.leader || 'L’adversaire'} envoie ${e.name} !`); ctx.showFoe?.(e.id);
        el.hpName.textContent = `${e.name} · Niv. ${e.level}`; setWild(e.hp, e.snap); wildLevel = e.level; await sendOut({side: 'foe', img: $('#result img'), reduced: ctx.reduced()}); await delay(500);
      }
      else if (e.type === 'faint') { say(`${e.name} est K.O. !`); const fi = e.side === 'wild' ? $('#result img') : el.cardImg; if (fi) fi.style.opacity = '.3'; await delay(900); }
      else if (e.type === 'switch') { const f = bt.team.find(t => t.name === e.name); setCard(f, e.hp, e.snap); say(`${e.name} entre au combat !`); if (boss) await sendOut({side: 'ally', img: el.cardImg, reduced: ctx.reduced()}); await delay(800); }
    }
  }

  async function finish() {
    el.moves.innerHTML = '';
    const resolvedBattle=bt;
    const lost = bt.winner !== 'player';
    let html;
    if (!lost) {
      const rows = [];
      for (const id of resolvedBattle.participants) {
        if(bt!==resolvedBattle)return;
        const foes = resolvedBattle.defeated.length ? resolvedBattle.defeated : [{id:resolvedBattle.wild.id, level:wildLevel}];
        let earned = null;
        if (resolvedBattle.team.find(f => f.id === id)?.hp > 0) for (const foe of foes) { const g = ctx.addEVs?.(id, effortYield(foe.id)); if (g) { earned = earned || {}; for (const k of STAT_KEYS) if (g[k]) earned[k] = (earned[k] || 0) + g[k]; } }
        const evText=earned?STAT_KEYS.filter(key=>earned[key]).map(key=>'+'+earned[key]+' '+STAT_NAMES[key]).join(' · '):'';
        const gain = foes.reduce((n, foe) => n + Math.max(1, Math.round(xpReward(foe.level, ctx.level(id)) * (ctx.xpMult?.(id) || 1))), 0), r = ctx.addXp(id, gain), name = esc(ctx.name(id)), up = r.after > r.before, inf = ctx.info(id);
        const fresh = (learnsets[id] || []).filter(([, at]) => at > r.before && at <= r.after), defs = await Promise.all(fresh.map(([mv]) => getMove(mv)));
        const moves = fresh.map(([, at], k) => `<span class="new-move">Nouvelle attaque disponible : ${esc(defs[k].fr)} (niv. ${at})</span>`).join('');
        rows.push(`<li class="${up ? 'up' : ''}"><b>${name}</b><span class="gain">+${gain} XP</span><small>${esc(inf.text)}</small><span class="lvl">${up ? `Niv. ${r.before} → ${r.after}` : `Niv. ${r.after}`}</span>${evText?`<span class="ev-reward">EV : ${esc(evText)}</span>`:earned?'<span class="ev-reward">EV au plafond pour ces statistiques</span>':''}${moves}</li>`);
      }
      if(bt!==resolvedBattle)return;
      setCard(activeFighter(bt), activeFighter(bt).hp);
      const win = boss ? ctx.arenaWin?.(boss) : null, prize = boss ? (win?.money || 0) : (ctx.addMoney?.(bt.wild.id, wildLevel) || 0);
      const bossHead = boss ? `<p>${esc(boss.leader)} est vaincu !</p>${boss.elite ? `<p class="v-badge">Membre ${boss.n} / 4 du Conseil vaincu</p>${win?.first ? '' : '<p>Revanche gagnée · prime réduite.</p>'}` : win?.first ? `<p class="v-badge"><img src="${boss.badgeSprite}" alt=""> ${esc(boss.badgeName)} obtenu !</p>` : '<p>Revanche gagnée · prime réduite.</p>'}${win?.note ? `<p class="v-tm">${esc(win.note)}</p>` : ''}${win?.tm ? `<p class="v-tm">CT reçue : ${esc(win.tm)}</p>` : ''}${win?.first && win.cap ? `<p class="v-tm">Plafond de niveau relevé : ${win.cap}</p>` : ''}` : '';
      html = `<div class="v-card" role="dialog" aria-label="Victoire"><h2>Victoire !</h2>${boss ? bossHead : `<p>${esc(bt.wild.name)} sauvage est K.O. · l’XP dépend de son niveau (${wildLevel})</p>`}${prize?`<p class="v-money">+${prize.toLocaleString('fr-FR')} ₽</p>`:''}<ul class="v-list">${rows.join('')}</ul><button class="v-continue" id="v-continue">Continuer · Espace</button></div>`;
    } else html = `<div class="v-card lost" role="dialog" aria-label="Défaite"><h2>Défaite…</h2><p>Toute ton équipe est K.O. Aucune pénalité : relance un tirage pour retenter ta chance.</p><button class="v-continue" id="v-continue">Continuer · Espace</button></div>`;
    await delay(500);
    if (bt!==resolvedBattle) return;
    el.victory.innerHTML = html; el.victory.hidden = false; el.battle.hidden = true;
    $('#v-continue').focus({preventScroll: true});
    $('#v-continue').onclick = () => ctx.onContinue();
    ctx.onEnd?.(lost ? 'loss' : 'win');
  }

  async function turn(move, sw = null, heal = null) {
    const my = token;
    playing = true; renderMoves(false);
    const events = takeTurn(bt, move, sw, heal);
    await play(events);
    if (my !== token) return;
    playing = false;
    if (bt.over) await finish(); else { say(`Que doit faire ${activeFighter(bt).name} ?`); renderMoves(true); }
  }
  el.moves.addEventListener('click', e => {
    const b = e.target.closest('.move'); if (!b || playing || !bt || bt.over) return;
    const move = playerChoices(activeFighter(bt))[+b.dataset.i]; if (move) turn(move);
  });
  const hint = (f) => {
    const mine = f.moves.filter(isDamaging).map(m => effectiveness(m.type, bt.wild.types)), theirs = bt.wild.moves.filter(isDamaging).map(m => effectiveness(m.type, f.types));
    const out = [];
    if (mine.length && Math.max(...mine) > 1) out.push('<em class="hint good">Avantage</em>');
    else if (mine.length && Math.max(...mine) < 1) out.push('<em class="hint bad">Peu efficace</em>');
    if (theirs.length && Math.max(...theirs) > 1) out.push('<em class="hint bad">Menacé</em>');
    return out.join('');
  };
  function openSwitch() {
    if (!bt || bt.over || playing) return;
    const wt = bt.wild.types.map(t => TYPE_FR[t] || t).join(' / ');
    el.swPanel.innerHTML = `<div class="v-card sw-card" role="dialog" aria-label="Changer de Pokémon"><h2>Changer de Pokémon</h2><p>Adversaire : ${esc(bt.wild.name)} · ${esc(wt)} — changer te fait perdre ton tour.</p><div class="sw-list">${bt.team.map((f, i) => {
      const cur = i === bt.active, dead = f.hp <= 0, r = Math.round(f.hp / f.maxHp * 100);
      return `<button class="sw-item${cur ? ' current' : ''}" data-i="${i}" ${cur || dead ? 'disabled' : ''} style="--tc:${typeColor(f.types[0])}"><img src="${ctx.sprite(f.id)}" alt=""><span class="sw-name"><b>${esc(f.name)}</b><small>Niv. ${f.level} · ${f.types.map(t => esc(TYPE_FR[t] || t)).join(' / ')}</small></span><span class="sw-hp"><span class="hp-track"><i data-level="${r > 50 ? 'high' : r > 20 ? 'mid' : 'low'}" style="width:${r}%"></i></span><small>${dead ? 'K.O.' : cur ? 'au combat' : `PV ${f.hp} / ${f.maxHp}`}</small></span>${dead || cur ? '' : hint(f)}</button>`;
    }).join('')}</div><button class="v-continue sw-close" id="sw-close">Retour au combat</button></div>`;
    el.swPanel.hidden = false;
    el.swPanel.querySelector('.sw-item:not([disabled])')?.focus({preventScroll: true});
  }
  // Sac de combat : choisir une potion, puis le Pokémon à soigner (le sauvage joue ensuite son tour).
  function openBag(pickedId = null) {
    if (!bt || bt.over || playing) return;
    const items = ctx.bagItems?.() || [], pick = items.find(i => i.id === pickedId);
    let body;
    const effect = i => i.heal ? `Rend ${i.heal} PV` : i.cures === 'all' ? 'Guérit tous les statuts' : `Guérit : ${i.cures.map(c => ({psn:'poison', tox:'poison', brn:'brûlure', par:'paralysie', slp:'sommeil', frz:'gel'}[c])).filter((v, k, a) => a.indexOf(v) === k).join(', ')}`;
    if (!pick) body = `<p>Choisis un objet à utiliser — le Pokémon sauvage jouera son tour.</p><div class="sw-list">${items.length ? items.map(i => `<button class="sw-item bag-use" data-item="${i.id}" style="--tc:#5fd468"><img src="${i.sprite}" alt=""><span class="sw-name"><b>${esc(i.name)}</b><small>${effect(i)}</small></span><span class="sw-hp"><small>×${i.qty}</small></span></button>`).join('') : '<p class="bag-empty">Ton sac est vide. Achète des potions à la boutique !</p>'}</div>`;
    else body = `<p>${esc(pick.name)} : qui soigner ? (${effect(pick)})</p><div class="sw-list">${bt.team.map((f, i) => {
      const dead = f.hp <= 0, useless = !((pick.heal > 0 && f.hp < f.maxHp) || cureMatch(f, pick.cures)), full = f.hp >= f.maxHp, r = Math.round(f.hp / f.maxHp * 100);
      return `<button class="sw-item bag-target" data-i="${i}" data-item="${pick.id}" ${dead || useless ? 'disabled' : ''} style="--tc:${typeColor(f.types[0])}"><img src="${ctx.sprite(f.id)}" alt=""><span class="sw-name"><b>${esc(f.name)}</b><small>Niv. ${f.level}</small></span><span class="sw-hp"><span class="hp-track"><i data-level="${r > 50 ? 'high' : r > 20 ? 'mid' : 'low'}" style="width:${r}%"></i></span><small>${dead ? 'K.O.' : f.status ? STATUS_TAG[f.status.type] + ' · ' : ''}${dead ? '' : full ? 'PV pleins' : `PV ${f.hp} / ${f.maxHp}`}</small></span></button>`;
    }).join('')}</div>`;
    el.swPanel.innerHTML = `<div class="v-card sw-card" role="dialog" aria-label="Sac"><h2>Sac</h2>${body}<button class="v-continue sw-close" id="sw-close">${pick ? 'Retour au sac' : 'Retour au combat'}</button></div>`;
    el.swPanel.dataset.bag = pick ? 'target' : 'list'; el.swPanel.hidden = false;
    el.swPanel.querySelector('.sw-item:not([disabled])')?.focus({preventScroll: true});
  }
  const closeSwitch = () => { delete el.swPanel.dataset.bag; el.swPanel.hidden = true; el.swPanel.innerHTML = ''; };
  el.swBtn.onclick = openSwitch; $('#bag').onclick = () => openBag();
  el.swPanel.addEventListener('click', e => {
    if (el.swPanel.dataset.bag && e.target.closest('#sw-close') && el.swPanel.dataset.bag === 'target') { openBag(); return; }
    const bu = e.target.closest('.bag-use'); if (bu) { openBag(bu.dataset.item); return; }
    const btg = e.target.closest('.bag-target');
    if (btg && !btg.disabled && bt && !playing) {
      const item = (ctx.bagItems?.() || []).find(i => i.id === btg.dataset.item);
      if (item && ctx.useHeal?.(item.id)) { closeSwitch(); turn(null, null, {index: +btg.dataset.i, amount: item.heal || 0, cures: item.cures || null, name: item.name}); }
      return;
    }
    if (e.target === el.swPanel || e.target.closest('#sw-close')) { closeSwitch(); return; }
    const it = e.target.closest('.sw-item'); if (!it || it.disabled || !bt || playing) return;
    const i = +it.dataset.i; closeSwitch(); turn(null, i);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !el.swPanel.hidden) { e.preventDefault(); closeSwitch(); } });

  el.flee.onclick = () => { if (!boss) ctx.onFlee(); };
  document.addEventListener('keydown', e => {
    if (!/^[1-4]$/.test(e.key) || playing || !bt || bt.over || document.querySelector('dialog[open]')) return;
    const b = el.moves.querySelectorAll('.move')[+e.key - 1]; if (b && !b.disabled) b.click();
  });

  return {
    active: () => !!bt && !bt.over,
    isBoss: () => !!boss,
    cancel() { token++; boss = null; unmountTrainer(); document.body.classList.remove('boss-fight'); bt = null; playing = false; starting = false; vWait = 0; el.battle.hidden = true; closeSwitch(); el.victory.hidden = true; el.victory.innerHTML = ''; el.card.hidden = true; el.cardImg.hidden = true; delete el.cardImg.dataset.id; el.moves.innerHTML = ''; el.stage.classList.remove('fighting'); document.body.classList.remove('in-fight'); },
    // Mode Auto : joue le tour (meilleure attaque selon l'efficacité, le STAB et la précision) ou passe l'écran de fin.
    autoStep(wait = 2) {
      if (starting || playing) return 'wait';
      if (bt && !bt.over && el.swPanel.hidden) {
        const sw = chooseAutoSwitch(bt, autoSwitches);
        if (sw !== null) { autoSwitches++; turn(null, sw); return 'turn'; }
        turn(chooseAiMove(activeFighter(bt), bt.wild)); return 'turn';
      }
      if (!el.victory.hidden && $('#v-continue')) { if (++vWait >= wait) { vWait = 0; $('#v-continue').click(); return 'continue'; } return 'wait'; }
      return bt ? 'wait' : 'idle';
    },
    // Combat d'arène : le champion envoie ses Pokémon l'un après l'autre (équipe réelle, niveaux fixes).
    async startBoss(arena) {
      this.cancel(); const my = token; starting = true; autoSwitches = 0; boss = arena;
      el.battle.hidden = false; el.stage.classList.add('fighting'); document.body.classList.add('in-fight', 'boss-fight'); el.moves.innerHTML = ''; say(`${arena.leader} veut se battre !`); mountTrainer(arena); $('#result').hidden = true; el.cardImg.hidden = true;
      try {
        const ids = ctx.team();
        if (!ids.length) { say('Aucun Pokémon dans ton équipe.'); return; }
        const [foes, mine] = await Promise.all([
          Promise.all(arena.team.map(([id, lvl]) => buildFighter(null, lvl, ctx.types(id), id, ctx.foeName?.(id) || String(id), createTraining()))),
          Promise.all(ids.map(async id => buildFighter(null, ctx.level(id), ctx.types(id), id, ctx.name(id), ctx.training?.(id), await ctx.moves?.(id), ctx.boost?.(id) || 1, !!ctx.sash?.(id), !!ctx.oran?.(id), ctx.trait?.(id), !!ctx.leftovers?.(id))))]);
        if (my !== token) return;
        learnsets = Object.fromEntries(mine.map(m => [m.fighter.id, m.learnset]));
        bt = createBattle(mine.map(m => m.fighter), foes[0].fighter, undefined, foes.slice(1).map(f => f.fighter));
        this.wild = foes[0].fighter; wildLevel = foes[0].fighter.level;
        ctx.showFoe?.(foes[0].fighter.id);
        el.hpName.textContent = `${foes[0].fighter.name} · Niv. ${wildLevel}`; setWild(foes[0].fighter.hp); el.hp.hidden = false;
        setCard(activeFighter(bt)); el.cardImg.style.opacity = '0';
        say(`${arena.leader} veut se battre ! Il envoie ${foes[0].fighter.name} !`); await sendOut({side: 'foe', img: $('#result img'), reduced: ctx.reduced()}); if (my !== token) return;
        say(`À toi, ${activeFighter(bt).name} !`); await sendOut({side: 'ally', img: el.cardImg, reduced: ctx.reduced()}); await wait(ctx.reduced() ? 150 : 500);
        if (bt.intro.length) { playing = true; await play(bt.intro); playing = false; if (my !== token) return; }
        say(`Que doit faire ${activeFighter(bt).name} ?`); renderMoves(true);
      } catch { if (my === token) say('Combat indisponible pour le moment.'); }
      finally { if (my === token) starting = false; }
    },
    async start(p, types, encounterTraining=createTraining()) {
      this.cancel(); const my = token; starting = true; autoSwitches = 0; wildLevel = ctx.wildLevel(p.id);
      el.battle.hidden = false; el.stage.classList.add('fighting'); document.body.classList.add('in-fight'); el.moves.innerHTML = ''; say('Préparation du combat…');
      try {
        const ids = ctx.team();
        if (!ids.length) { say('Aucun Pokémon dans ton équipe.'); return; }
        const [wild, ...mine] = await Promise.all([buildFighter(null, wildLevel, types, p.id, p.name+(p.shiny?' ✦':''),encounterTraining), ...ids.map(async id => buildFighter(null, ctx.level(id), ctx.types(id), id, ctx.name(id),ctx.training?.(id), await ctx.moves?.(id), ctx.boost?.(id) || 1, !!ctx.sash?.(id), !!ctx.oran?.(id), ctx.trait?.(id), !!ctx.leftovers?.(id)))]);
        if (my !== token) return;
        learnsets = Object.fromEntries(mine.map(m => [m.fighter.id, m.learnset]));
        bt = createBattle(mine.map(m => m.fighter), wild.fighter);
        this.wild = wild.fighter;
        el.hpName.textContent = `${p.name}${p.shiny?' ✦ Chromatique':''} · Niv. ${wildLevel}`; setWild(wild.fighter.hp); el.hp.hidden = false;
        setCard(activeFighter(bt)); setWild(wild.fighter.hp);
        if (bt.intro.length) { playing = true; await play(bt.intro); playing = false; if (my !== token) return; }
        renderMoves(true);
        say(`Un ${p.name}${p.shiny?' chromatique':''} sauvage apparaît ! Que doit faire ${activeFighter(bt).name} ?`);
      } catch { if (my === token) say('Combat indisponible pour le moment.'); }
      finally { if (my === token) starting = false; }
    }
  };
}
