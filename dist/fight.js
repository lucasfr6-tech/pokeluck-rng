// Interface de combat dans la scène : barre de PV du Pokémon sauvage, carte du combattant, attaques et journal.
import {createBattle, takeTurn, activeFighter, playerChoices, isUsable, makeFighter, knownMoves, xpReward, TYPE_FR, DEFAULT_BASE} from './battle.js';
import {getSpecies, getMoves} from './battle-data.js';

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
  const el = {battle: $('#battle'), log: $('#battle-log'), moves: $('#moves'), card: $('#fighter'), cardImg: $('#fighter img'), cardName: $('#fighter-name'), cardFill: $('#fighter-fill'), cardText: $('#fighter-text'),
    hp: $('#hp'), hpName: $('#hp-name'), hpText: $('#hp-text'), hpFill: $('#hp-fill'), stage: $('#stage')};
  const delay = ms => wait(ctx.reduced() ? Math.min(ms, 120) : ms);
  const bar = (fill, hp, max) => { const r = max ? hp / max : 0; fill.style.width = Math.max(0, r * 100) + '%'; fill.dataset.level = r > .5 ? 'high' : r > .2 ? 'mid' : 'low'; };
  const say = text => { el.log.textContent = text; };
  const setWild = hp => { el.hpText.textContent = `PV ${fmt(hp)} / ${fmt(bt.wild.maxHp)}`; bar(el.hpFill, hp, bt.wild.maxHp); };
  const setCard = (f, hp = f.hp) => { el.cardImg.src = ctx.backSprite(f.id); el.cardName.textContent = `${f.name} · Niv. ${f.level}`; el.cardText.textContent = `PV ${fmt(hp)} / ${fmt(f.maxHp)}`; bar(el.cardFill, hp, f.maxHp); el.card.hidden = false; };
  function renderMoves(enabled = true) {
    const f = activeFighter(bt);
    el.moves.innerHTML = playerChoices(f).map((m, i) => {
      const usable = isUsable(m);
      const info = usable ? `Puiss. ${m.power}${m.acc ? ' · Préc. ' + m.acc : ''}` : 'Effet à venir';
      return `<button class="move" data-i="${i}" ${enabled && usable ? '' : 'disabled'} style="--tc:${typeColor(m.type)}" title="${esc(TYPE_FR[m.type] || m.type)} · ${info}"><b>${esc(m.fr)}</b><small>${esc(TYPE_FR[m.type] || m.type)} · ${info}</small></button>`;
    }).join('');
  }
  const effectText = e => !e.hit ? 'Raté !' : e.eff === 0 ? 'Ça n’affecte pas la cible…' : e.eff > 1 ? 'C’est super efficace !' : e.eff < 1 ? 'Ce n’est pas très efficace…' : '';

  async function play(events) {
    for (const e of events) {
      if (e.type === 'attack') {
        say(`${e.user} utilise ${e.move} !`); await delay(650);
        if (e.target === 'wild') setWild(e.hp); else setCard(bt.team.find(t => t.name === e.targetName), e.hp);
        const t = effectText(e); if (t) { say(`${e.user} utilise ${e.move} ! ${t}`); await delay(700); }
      } else if (e.type === 'faint') { say(`${e.name} est K.O. !`); await delay(900); }
      else if (e.type === 'switch') { const f = bt.team.find(t => t.name === e.name); setCard(f, f.hp); say(`${e.name} entre au combat !`); await delay(800); }
    }
  }

  async function finish(ctxEnd) {
    el.moves.innerHTML = '';
    if (bt.winner === 'player') {
      const gain = xpReward(wildLevel), lines = [`${bt.wild.name} sauvage est K.O. !`];
      for (const id of bt.participants) {
        const r = ctx.addXp(id, gain), name = ctx.name(id);
        lines.push(r.after > r.before ? `${name} gagne ${gain} XP et passe au niveau ${r.after} !` : `${name} gagne ${gain} XP.`);
        const ls = learnsets[id] || [];
        for (const [mv, at] of ls) if (at > r.before && at <= r.after) lines.push(`${name} peut apprendre ${mv.replace(/-/g, ' ')} (niv. ${at}).`);
      }
      for (const l of lines) { say(l); await delay(1100); }
      say(`Victoire ! ${bt.participants.size > 1 ? bt.participants.size + ' Pokémon ont' : '1 Pokémon a'} gagné ${gain} XP.`);
      ctxEnd?.('win');
    } else { say('Toute ton équipe est K.O. Pas de pénalité : relance un tirage pour retenter ta chance.'); ctxEnd?.('loss'); }
  }

  el.moves.addEventListener('click', async e => {
    const b = e.target.closest('.move'); if (!b || playing || !bt || bt.over) return;
    const my = token, move = playerChoices(activeFighter(bt))[+b.dataset.i]; if (!move) return;
    playing = true; renderMoves(false);
    const events = takeTurn(bt, move);
    await play(events);
    if (my !== token) return;
    playing = false;
    if (bt.over) await finish(ctx.onEnd); else { say(`Que doit faire ${activeFighter(bt).name} ?`); renderMoves(true); }
  });

  return {
    active: () => !!bt && !bt.over,
    cancel() { token++; bt = null; playing = false; el.battle.hidden = true; el.card.hidden = true; el.moves.innerHTML = ''; el.stage.classList.remove('fighting'); },
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
