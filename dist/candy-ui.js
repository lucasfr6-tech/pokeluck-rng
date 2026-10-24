// Boutique des Bonbons : Méga-Gemmes et Bracelets Dynamax, achetés avec les Bonbons de l'espèce.
import {FORMS, FORM_MIN_LEVEL, CANDY_PER_DUPLICATE, CANDY_PER_SHINY_DUPLICATE, formsOf, formSpecies, formTotal, formPowerMult, ownsForm, activeKey, candyOf, canBuy, buyForm, equipForm} from './forms.js';
import {baseTotals} from './pokemon.js';

const ITEM_URL = n => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${n}.png`;
const SORTS = [['power', 'Puissance'], ['candy', 'Plus de Bonbons'], ['shiny', 'Chromatique'], ['type', 'Type'], ['level', 'Niveau'], ['dex', 'N° Pokédex']];
const FILTERS = [['all', 'Tous'], ['ready', 'Achetable'], ['mega', 'Méga'], ['dyna', 'Dynamax'], ['equipped', 'Équipé'], ['shiny', 'Chromatique']];
const ui = {sel: null, sort: 'power', filter: 'all', q: ''};
// Chaque espèce a son Bonbon : même sprite, teinte différente (angle d'or pour bien les séparer).
const hueOf = id => Math.round((formSpecies.indexOf(id) * 137.508) % 360);
const candyImg = (src, id, cls = '') => `<img class="${cls}" src="${src}" alt="" style="filter:hue-rotate(${hueOf(id)}deg) saturate(1.5)">`;
const norm = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const candyUi = ui;

export function candyRows(c) {
  const st = c.getState();
  const rows = formSpecies.map(id => {
    const owned = !!st.counts[id], lvl = owned ? c.level(id) : 0;
    const forms = formsOf(id), buyable = owned && forms.some(f => canBuy(st, id, f.key, lvl).ok);
    return {id, name: c.name(id), owned, lvl, forms, buyable, candy: candyOf(st.candy, id), power: owned ? c.power(id) : 0, shiny: !!st.shinyCounts[id], type: c.types(id)[0], active: activeKey(st.forms, id)};
  });
  const q = norm(ui.q.trim());
  const pass = r => (!q || norm(r.name).includes(q)) && (ui.filter === 'all' || (ui.filter === 'ready' ? r.buyable : ui.filter === 'mega' ? r.forms.some(f => f.kind === 'mega') : ui.filter === 'dyna' ? r.forms.some(f => f.kind === 'dyna') : ui.filter === 'equipped' ? !!r.active : r.shiny));
  const cmp = {power: (a, b) => b.power - a.power, candy: (a, b) => b.candy - a.candy, shiny: (a, b) => b.shiny - a.shiny || b.power - a.power, type: (a, b) => a.type.localeCompare(b.type) || b.power - a.power, level: (a, b) => b.lvl - a.lvl, dex: (a, b) => a.id - b.id}[ui.sort];
  return rows.filter(pass).sort((a, b) => (b.owned - a.owned) || cmp(a, b));
}

const fmtN = n => n.toLocaleString('fr-FR');
function detail(c, r) {
  const st = c.getState(), id = r.id, name = c.name(id), lvl = r.lvl;
  const rowsHtml = r.forms.map(f => {
    const own = ownsForm(st.forms, id, f.key), on = activeKey(st.forms, id) === f.key, can = canBuy(st, id, f.key, lvl);
    const mult = formPowerMult(id, f.key);
    const info = f.kind === 'mega'
      ? `Stats totales <b>${baseTotals[id - 1]}</b> → <b>${formTotal(f)}</b> · types ${f.types.map(t => `<span class="type-badge" style="--tc:${c.typeColor(t)}">${c.typeFr[t] || t}</span>`).join('')}`
      : 'Une fois par combat : <b>3 tours</b> avec PV ×1,5 et dégâts ×1,5 (sprite Gigamax).';
    let btn;
    if (on) btn = `<button class="cd-btn off" data-cd-eq="${id}:" type="button">Retirer</button>`;
    else if (own) btn = `<button class="cd-btn go" data-cd-eq="${id}:${f.key}" type="button">Équiper</button>`;
    else if (!r.owned) btn = `<button class="cd-btn" disabled type="button">Non capturé</button>`;
    else if (can.reason === 'level') btn = `<button class="cd-btn" disabled type="button">Niv. ${can.need} requis</button>`;
    else if (can.reason === 'candy') btn = `<button class="cd-btn" disabled type="button">Il manque ${fmtN(can.missing)}</button>`;
    else btn = `<button class="cd-btn buy" data-cd-buy="${id}:${f.key}" type="button">Acheter · ${f.cost}</button>`;
    return `<article class="cd-form${on ? ' on' : ''}${own ? ' own' : ''}"><img class="cd-item" src="${ITEM_URL(f.itemSprite)}" alt="" onerror="this.style.visibility='hidden'"><div class="cd-fi"><h4>${f.item}${on ? ' <em>équipé</em>' : own ? ' <em>possédé</em>' : ''}</h4><p><b>${f.name}</b> — ${info}</p><small>Puissance ×${mult.toFixed(2).replace('.', ',')} · coût ${f.cost} Bonbons · niv. ${f.minLevel} minimum</small></div>${btn}</article>`;
  }).join('');
  return `<aside class="cd-detail"><div class="cd-hero"><img src="${c.sprite(id)}" alt="${name}"><div><h3>${name}</h3><p>${r.owned ? `Niv. <b>${lvl}</b> · Puissance <b>${fmtN(r.power)}</b>` : 'Pas encore capturé'}</p><span class="cd-bal">${candyImg(c.candyIcon, id)}${fmtN(r.candy)} Bonbons ${name}</span></div></div><div class="cd-forms">${rowsHtml}</div></aside>`;
}

export function mountCandy(body, c) {
  const draw = () => {
    const rows = candyRows(c), st = c.getState();
    if (!rows.some(r => r.id === ui.sel)) ui.sel = rows[0]?.id ?? null;
    const sel = rows.find(r => r.id === ui.sel);
    const total = Object.values(st.candy).reduce((a, b) => a + b, 0);
    body.innerHTML = `<div class="cd"><div class="cd-top"><div class="cd-wallet"><img src="${c.candyIcon}" alt=""><span><small>Tes Bonbons</small><b>${fmtN(total)}</b></span></div>
      <label class="cd-sort">Trier par <select data-cd-sort aria-label="Trier">${SORTS.map(([k, n]) => `<option value="${k}"${ui.sort === k ? ' selected' : ''}>${n}</option>`).join('')}</select></label></div>
      <label class="cd-search"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M15 15l6 6" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg><input type="search" data-cd-q value="${ui.q.replace(/"/g, '&quot;')}" placeholder="Chercher un Pokémon…" aria-label="Chercher un Pokémon" autocomplete="off"></label>
      <div class="ex-pills" role="group" aria-label="Filtres">${FILTERS.map(([k, n]) => `<button class="ex-pill" type="button" data-cd-filter="${k}" aria-pressed="${ui.filter === k}">${n}</button>`).join('')}</div>
      <div class="cd-main"><div class="cd-list">${rows.map(r => `<button type="button" class="cd-row${r.id === ui.sel ? ' sel' : ''}${r.owned ? '' : ' locked'}" data-cd-sel="${r.id}" style="--tc:${c.typeColor(r.type)}"><img src="${c.sprite(r.id)}" alt=""><span><b>${c.name(r.id)}${r.shiny ? ' ✦' : ''}</b><small>${r.owned ? `Niv. ${r.lvl} · ${fmtN(r.power)}` : 'Non capturé'}</small></span><em>${candyImg(c.candyIcon, r.id)}${fmtN(r.candy)}</em>${r.active ? '<i class="cd-tag">forme</i>' : r.buyable ? '<i class="cd-tag ok">achetable</i>' : ''}</button>`).join('') || '<p class="cd-empty">Aucun Pokémon pour ce filtre.</p>'}</div>
      ${sel ? detail(c, sel) : ''}</div>
      <div class="cd-how"><h4>Comment gagner des Bonbons</h4><ul><li>Capturer un <b>légendaire</b> donne <b>3 Bonbons</b>, un <b>épique</b> <b>2</b>, même la première fois.</li><li>Chaque doublon d'une espèce donne <b>${CANDY_PER_DUPLICATE} Bonbon</b> de cette espèce (<b>${CANDY_PER_SHINY_DUPLICATE}</b> pour un doublon chromatique).</li><li>Les <b>expéditions</b> rapportent 1 à 3 Bonbons, plus si le type de l'équipe correspond.</li><li>Les objets exigent le niveau <b>${FORM_MIN_LEVEL}</b> et fonctionnent comme dans les vrais jeux.</li></ul></div></div>`;
  };
  body.onclick = e => {
    const t = e.target.closest('[data-cd-sel],[data-cd-filter],[data-cd-buy],[data-cd-eq]'); if (!t) return;
    if (t.dataset.cdSel) ui.sel = +t.dataset.cdSel;
    else if (t.dataset.cdFilter) ui.filter = t.dataset.cdFilter;
    else if (t.dataset.cdBuy) { const [id, key] = t.dataset.cdBuy.split(':'); if (buyForm(c.getState(), +id, key, c.level(+id)).ok) { equipForm(c.getState(), +id, key); c.onChange(); } }
    else if (t.dataset.cdEq !== undefined) { const [id, key] = t.dataset.cdEq.split(':'); equipForm(c.getState(), +id, key || null); c.onChange(); }
    draw();
  };
  body.oninput = e => { if (!e.target.matches('[data-cd-q]')) return; ui.q = e.target.value; const pos = e.target.selectionStart; draw(); const i = body.querySelector('[data-cd-q]'); i.focus(); i.setSelectionRange(pos, pos); };
  body.onchange = e => { if (e.target.matches('[data-cd-sort]')) { ui.sort = e.target.value; draw(); } };
  draw();
  return {redraw: draw};
}

// Bloc du profil : Bonbons de l'espèce et accès à la boutique.
export const candyIconHtml = (src, id) => candyImg(src, id);
export function candyBlockHtml(st, id, candyIcon) {
  if (!formSpecies.includes(id)) return '';
  const forms = formsOf(id), have = forms.filter(f => ownsForm(st.forms, id, f.key)).length, act = activeKey(st.forms, id);
  return `<div class="cd-pf">${candyImg(candyIcon, id)}<span><b>${fmtN(candyOf(st.candy, id))} Bonbons</b><small>${have}/${forms.length} formes débloquées${act ? ' · forme équipée' : ''}</small></span><button type="button" class="cd-btn go" data-cd-open="${id}">Boutique des Bonbons</button></div>`;
}
