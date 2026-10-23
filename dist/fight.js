// Interface de combat dans la scène : barre de PV du Pokémon sauvage, carte du combattant, attaques et journal.
import {createBattle, takeTurn, activeFighter, playerChoices, isUsable, makeFighter, knownMoves, xpReward, TYPE_FR, DEFAULT_BASE} from './battle.js';
import {getSpecies, getMoves, getMove} from './battle-data.js';

const $ = s => document.querySelector(s);
const wait = ms => new Promise(r => setTimeout(r, ms));
const COLORS = {normal:'#a8a77a',fire:'#ee8130',water:'#6390f0',electric:'#f7d02c',grass:'#7ac74c',ice:'#96d9d6',fighting:'#c22e28',poison:'#a33ea1',ground:'#e2bf65',flying:'#a98ff3',psychic:'#f95587',bug:'#a6b91a',rock:'#b6a136',ghost:'#735797',dragon:'#6f35fc',dark:'#705746',steel:'#b7b7ce',fairy:'#d685ad'};
export const typeColor = t => COLORS[t] || COLORS.normal;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt = n => n.toLocaleString('fr-FR');

export async function buildFighter(spec, level, types, id, name) {
  const sp = await getSpecies(id);
  const moves = await getMoves(knownMoves(sp.learnset, level));
  return {fighter: makeFighter({id, name, level, types, base: sp.stats || DEFAULT_BASE, moves}), learnset: sp.learnset};
}

// ctx : {team(), level(id), name(id), types(id), backSprite(id), reduced(), addXp(id, amount) → {before, after}}
export function createFight(ctx) {
  let token = 0, bt = null, wildLevel = 0, learnsets = {}, playing = false;
  const el = {battle: $('#battle'), log: $('#battle-log'), moves: $('#moves'), card: $('#fighter'), cardImg: $('#ally'), cardXp: $('#fighter-xp'), cardXpText: $('#fighter-xptext'), cardName: $('#fighter-name'), cardFill: $('#fighter-fill'), cardText: $('#fighter-text'),
    victory: $('#victory'), flee: $('#flee'), hp: $('#hp'), hpName: $('#hp-name'), hpText: $('#hp-text'), hpFill: $('#hp-fill'), stage: $('#stage')};
  if (window.ResizeObserver) new ResizeObserver(() => { const h = el.battle.offsetHeight; if (h) document.querySelector('.scene').style.setProperty('--strip', h + 'px'); }).observe(el.battle);
  const delay = ms => wait(ctx.reduced() ? Math.min(ms, 120) : ms);
  const bar = (fill, hp, max) => { const r = max ? hp / max : 0; fill.style.width = Math.max(0, r * 100) + '%'; fill.dataset.level = r > .5 ? 'high' : r > .2 ? 'mid' : 'low'; };
  const say = text => { el.log.textContent = text; };
  const setWild = hp => { el.hpText.textContent = `PV ${fmt(hp)} / ${fmt(bt.wild.maxHp)}`; bar(el.hpFill, hp, bt.wild.maxHp); };
  const setCard = (f, hp = f.hp) => { const inf = ctx.info(f.id); el.cardImg.style.opacity = ''; if (el.cardImg.dataset.id !== String(f.id)) { el.cardImg.dataset.id = f.id; el.cardImg.src = ctx.backSprite(f.id); } el.cardImg.hidden = false; el.cardName.textContent = `${f.name} · Niv. ${inf.level}`; el.cardXp.style.width = inf.pct + '%'; el.cardXpText.textContent = inf.text; el.cardText.textContent = `PV ${fmt(hp)} / ${fmt(f.maxHp)}`; bar(el.cardFill, hp, f.maxHp); el.card.hidden = false; };
  function renderMoves(enabled = true) {
    const f = activeFighter(bt);
    el.moves.innerHTML = playerChoices(f).map((m, i) => {
      const usable = isUsable(m);
      const info = usable ? `Puiss. ${m.power}${m.acc ? ' · Préc. ' + m.acc : ''}` : 'Effet à venir';
      return `<button class="move" data-i="${i}" ${enabled && usable ? '' : 'disabled'} style="--tc:${typeColor(m.type)}" title="${esc(TYPE_FR[m.type] || m.type)} · ${info}"><b>${i + 1} · ${esc(m.fr)}</b><small>${esc(TYPE_FR[m.type] || m.type)} · ${info}</small></button>`;
    }).join('');
  }
  const effectText = e => !e.hit ? 'Raté !' : e.eff === 0 ? 'Ça n’affecte pas la cible…' : e.eff > 1 ? 'C’est super efficace !' : e.eff < 1 ? 'Ce n’est pas très efficace…' : '';

  function flash(img) { if (!img) return; img.classList.remove('hit'); void img.offsetWidth; img.classList.add('hit'); }
  async function play(events) {
    for (const e of events) {
      if (e.type === 'attack') {
        say(`${e.user} utilise ${e.move} !`); await delay(650);
        if (e.target === 'wild') setWild(e.hp); else setCard(bt.team.find(t => t.name === e.targetName), e.hp);
        if (e.hit && e.dmg) flash(e.target === 'wild' ? $('#result img') : el.cardImg);
        const t = effectText(e); if (t) { say(`${e.user} utilise ${e.move} ! ${t}`); await delay(700); }
      } else if (e.type === 'faint') { say(`${e.name} est K.O. !`); const fi = e.side === 'wild' ? $('#result img') : el.cardImg; if (fi) fi.style.opacity = '.3'; await delay(900); }
      else if (e.type === 'switch') { const f = bt.team.find(t => t.name === e.name); setCard(f, f.hp); say(`${e.name} entre au combat !`); await delay(800); }
    }
  }

  async function finish() {
    el.moves.innerHTML = '';
    const lost = bt.winner !== 'player';
    let html;
    if (!lost) {
      const gain = xpReward(wildLevel), rows = [];
      for (const id of bt.participants) {
        const r = ctx.addXp(id, gain), name = esc(ctx.name(id)), up = r.after > r.before, inf = ctx.info(id);
        const fresh = (learnsets[id] || []).filter(([, at]) => at > r.before && at <= r.after), defs = await Promise.all(fresh.map(([mv]) => getMove(mv)));
        const moves = fresh.map(([, at], k) => `<span class="new-move">Nouvelle attaque disponible : ${esc(defs[k].fr)} (niv. ${at})</span>`).join('');
        rows.push(`<li class="${up ? 'up' : ''}"><b>${name}</b><span class="gain">+${gain} XP</span><small>${esc(inf.text)}</small><span class="lvl">${up ? `Niv. ${r.before} → ${r.after}` : `Niv. ${r.after}`}</span>${moves}</li>`);
      }
      setCard(activeFighter(bt), activeFighter(bt).hp);
      html = `<div class="v-card" role="dialog" aria-label="Victoire"><h2>Victoire !</h2><p>${esc(bt.wild.name)} sauvage est K.O. · +${gain} XP par Pokémon engagé</p><ul class="v-list">${rows.join('')}</ul><button class="v-continue" id="v-continue">Continuer · Espace</button></div>`;
    } else html = `<div class="v-card lost" role="dialog" aria-label="Défaite"><h2>Défaite…</h2><p>Toute ton équipe est K.O. Aucune pénalité : relance un tirage pour retenter ta chance.</p><button class="v-continue" id="v-continue">Continuer · Espace</button></div>`;
    await delay(500);
    if (!bt) return;
    el.victory.innerHTML = html; el.victory.hidden = false; el.battle.hidden = true;
    $('#v-continue').focus({preventScroll: true});
    $('#v-continue').onclick = () => ctx.onContinue();
    ctx.onEnd?.(lost ? 'loss' : 'win');
  }

  el.moves.addEventListener('click', async e => {
    const b = e.target.closest('.move'); if (!b || playing || !bt || bt.over) return;
    const my = token, move = playerChoices(activeFighter(bt))[+b.dataset.i]; if (!move) return;
    playing = true; renderMoves(false);
    const events = takeTurn(bt, move);
    await play(events);
    if (my !== token) return;
    playing = false;
    if (bt.over) await finish(); else { say(`Que doit faire ${activeFighter(bt).name} ?`); renderMoves(true); }
  });

  el.flee.onclick = () => ctx.onFlee();
  document.addEventListener('keydown', e => {
    if (!/^[1-4]$/.test(e.key) || playing || !bt || bt.over || document.querySelector('dialog[open]')) return;
    const b = el.moves.querySelectorAll('.move')[+e.key - 1]; if (b && !b.disabled) b.click();
  });

  return {
    active: () => !!bt && !bt.over,
    cancel() { token++; bt = null; playing = false; el.battle.hidden = true; el.victory.hidden = true; el.victory.innerHTML = ''; el.card.hidden = true; el.cardImg.hidden = true; delete el.cardImg.dataset.id; el.moves.innerHTML = ''; el.stage.classList.remove('fighting'); },
    async start(p, types) {
      this.cancel(); const my = token; wildLevel = ctx.wildLevel(p.id);
      el.battle.hidden = false; el.stage.classList.add('fighting'); el.moves.innerHTML = ''; say('Préparation du combat…');
      try {
        const ids = ctx.team();
        if (!ids.length) { say('Aucun Pokémon dans ton équipe.'); return; }
        const [wild, ...mine] = await Promise.all([buildFighter(null, wildLevel, types, p.id, p.name), ...ids.map(id => buildFighter(null, ctx.level(id), ctx.types(id), id, ctx.name(id)))]);
        if (my !== token) return;
        learnsets = Object.fromEntries(mine.map(m => [m.fighter.id, m.learnset]));
        bt = createBattle(mine.map(m => m.fighter), wild.fighter);
        this.wild = wild.fighter;
        el.hpName.textContent = `${p.name} · Niv. ${wildLevel}`; setWild(wild.fighter.hp); el.hp.hidden = false;
        setCard(activeFighter(bt)); renderMoves(true);
        say(`Un ${p.name} sauvage apparaît ! Que doit faire ${activeFighter(bt).name} ?`);
      } catch { if (my === token) say('Combat indisponible pour le moment.'); }
    }
  };
}
