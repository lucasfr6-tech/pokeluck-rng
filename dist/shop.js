// Boutiques posées sur la carte, objets achetables et effets actifs.
import {zones} from './world.js';
import {fmtMoney} from './money.js';
const SPRITE = n => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${n}.png`;
export const CLERK_SPRITE = 'https://play.pokemonshowdown.com/sprites/trainers/clerk.png';
// Prix PROVISOIRES, calés sur le temps de farm visé (Super Ball ≈ 15 min, Multi-XP ≈ 45 min, Hyper Ball ≈ 1 h, Pièce Rune ≈ 3 h).
export const ITEMS = {
  poke:   {id:'poke',   kind:'ball',    name:'Poké Ball',     price:0,       sprite:SPRITE('poke-ball'),   bonus:0,    effect:'Tirage normal · aucun bonus de rareté', desc:'La Poké Ball de départ. Aucun bonus.'},
  super:  {id:'super',  kind:'ball',    name:'Super Ball',    price:7500,    sprite:SPRITE('great-ball'),  bonus:.25,  effect:'Raretés +25 %', desc:'Équipée sur la Pokéball du milieu, elle augmente de 25 % la part des Pokémon rares à chaque tirage.'},
  hyper:  {id:'hyper',  kind:'ball',    name:'Hyper Ball',    price:90000,   sprite:SPRITE('ultra-ball'),  bonus:.60,  effect:'Raretés +60 %', desc:'Équipée sur la Pokéball du milieu, elle augmente de 60 % la part des Pokémon rares à chaque tirage.'},
  xp:     {id:'xp',     kind:'passive', name:'Multi-XP',      price:75000,   sprite:SPRITE('exp-share'),   effect:'XP des combats ×1,5', desc:'Actif dès l’achat : tous tes combats rapportent 50 % d’XP en plus.'},
  rune:   {id:'rune',   kind:'passive', name:'Pièce Rune',    price:900000,  sprite:SPRITE('amulet-coin'), effect:'Pokédollars ×2 sur les combats', desc:'Actif dès l’achat : chaque victoire rapporte deux fois plus de Pokédollars.'},
  chroma: {id:'chroma', kind:'passive', name:'Charme Chroma', price:3000000, sprite:SPRITE('shiny-charm'), effect:'Chromatiques : 1 sur 2 048', desc:'Actif dès l’achat : la chance de rencontrer un chromatique passe de 1 sur 4 096 à 1 sur 2 048.'}
};
export const XP_MULTIPLIER = 1.5, MONEY_MULTIPLIER = 2, CHARM_DENOMINATOR = 2048, KILLS_TO_UNLOCK = 3;
// `after` : zone à explorer ; `at` : position (en % de la carte) du logo, entre `after` et la zone suivante.
export const SHOPS = [
  {id:'jade',  name:'Boutique de la Forêt',   after:'forest', before:'route3', at:{x:35,y:23}, stock:['super','hyper'], hello:'Bienvenue ! La Hyper Ball fait de l’effet sur les Rares.'},
  {id:'sud',   name:'Boutique de la Centrale', after:'route4', before:'power',  at:{x:63,y:78}, stock:['xp','rune','chroma'], hello:'Bienvenue ! Ici, on équipe les dresseurs qui voient loin.'}
];
export const shopById = id => SHOPS.find(s => s.id === id) || SHOPS[0];
export const zoneName = id => zones.find(z => z.id === id)?.name || id;
export const defaultInv = () => ({owned:{}, ball:'poke'});
export function sanitizeInv(raw) {
  const inv = defaultInv();
  if (raw && typeof raw === 'object') {
    for (const id of Object.keys(ITEMS)) if (id !== 'poke' && raw.owned?.[id] === true) inv.owned[id] = true;
    if (ITEMS[raw.ball]?.kind === 'ball' && (raw.ball === 'poke' || inv.owned[raw.ball])) inv.ball = raw.ball;
  }
  return inv;
}
export function sanitizeKills(raw) {
  const out = {};
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) for (const z of zones) if (Number.isSafeInteger(raw[z.id]) && raw[z.id] > 0) out[z.id] = raw[z.id];
  return out;
}
export const owns = (inv, id) => id === 'poke' || inv.owned[id] === true;
export const rarityBonus = inv => ITEMS[inv.ball]?.bonus || 0;
export const xpMultiplier = inv => inv.owned.xp ? XP_MULTIPLIER : 1;
export const moneyMultiplier = inv => inv.owned.rune ? MONEY_MULTIPLIER : 1;
export const shinyDenominator = inv => inv.owned.chroma ? CHARM_DENOMINATOR : 4096;
export const shopKills = (kills, shop) => Math.min(KILLS_TO_UNLOCK, kills[shop.after] || 0);
export const shopOpen = (kills, shop) => shopKills(kills, shop) >= KILLS_TO_UNLOCK;
export function buyItem(state, id) {
  const item = ITEMS[id];
  if (!item || id === 'poke') return {ok:false, reason:'unknown'};
  if (owns(state.inv, id)) return {ok:false, reason:'owned'};
  if (state.money < item.price) return {ok:false, reason:'money', missing:item.price - state.money};
  state.money -= item.price; state.inv.owned[id] = true;
  if (item.kind === 'ball' && item.bonus > ITEMS[state.inv.ball].bonus) state.inv.ball = id;
  return {ok:true};
}
export function equipBall(state, id) {
  if (ITEMS[id]?.kind !== 'ball' || !owns(state.inv, id)) return false;
  state.inv.ball = id; return true;
}
export const activeItems = inv => Object.values(ITEMS).filter(i => i.kind === 'passive' && inv.owned[i.id]);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const icon = (item, size = 64) => `<img class="shop-icon" src="${item.sprite}" alt="" width="${size}" height="${size}" style="width:${size}px;height:${size}px">`;

export function mountShop(container, {getState, shopId, onChange}) {
  const shop = shopById(shopId);
  let selected = shop.stock[0], message = '';
  container.innerHTML = '<div class="shop"></div>';
  const root = container.querySelector('.shop');
  function render() {
    const state = getState(), open = shopOpen(state.kills, shop), item = ITEMS[selected], own = owns(state.inv, selected), afford = state.money >= item.price;
    const say = !open ? `Désolé, la boutique n’ouvre pas encore. Bats ${KILLS_TO_UNLOCK} Pokémon de la zone « ${zoneName(shop.after)} » : ${shopKills(state.kills, shop)} / ${KILLS_TO_UNLOCK}.` : message || shop.hello;
    root.innerHTML = `<aside class="shop-clerk"><img class="clerk-sprite" src="${CLERK_SPRITE}" alt="Vendeur du Pokémart" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'clerk-fallback',textContent:'🧑‍💼'}))"><p class="clerk-bubble" role="status">« ${esc(say)} »</p></aside>
    <section class="shop-main"><header class="shop-top"><span class="shop-label">${esc(shop.name)} · entre ${esc(zoneName(shop.after))} et ${esc(zoneName(shop.before))}</span><span class="shop-money" aria-label="Pokédollars"><span class="shop-coin" aria-hidden="true">₽</span>${esc(fmtMoney(state.money))}</span></header>
    ${open ? '' : `<div class="shop-locked"><b>🔒 Fermée</b> · ${shopKills(state.kills, shop)} / ${KILLS_TO_UNLOCK} Pokémon vaincus en ${esc(zoneName(shop.after))}<span class="shop-lockbar"><i style="width:${shopKills(state.kills, shop) / KILLS_TO_UNLOCK * 100}%"></i></span></div>`}
    <div class="shop-shelf ${open ? '' : 'closed'}">${shop.stock.map(id => {const it = ITEMS[id], has = owns(state.inv, id), ok = state.money >= it.price; return `<button type="button" class="shop-item${id === selected ? ' sel' : ''}${has ? ' own' : ''}" data-item="${id}" aria-pressed="${id === selected}" ${open ? '' : 'disabled'}><span class="shop-art">${icon(it, 96)}</span><span class="shop-tag"><b>${esc(it.name)}</b><span class="${has ? 'own' : ok ? '' : 'poor'}">${has ? '✓ Possédé' : fmtMoney(it.price)}</span></span></button>`;}).join('')}</div>    <footer class="shop-buy"><div class="shop-desc"><b>${esc(item.name)}</b> · ${esc(item.desc)}<small>${esc(item.effect)}</small></div>${own ? '<span class="shop-owned">✓ Déjà acquis</span>' : `<button type="button" class="shop-buy-btn" data-buy ${open && afford ? '' : 'disabled'}>${!open ? 'Fermée' : afford ? 'Acheter · ' + fmtMoney(item.price) : 'Manque ' + fmtMoney(item.price - state.money)}</button>`}</footer></section>`;
  }
  root.onclick = e => {
    const pick = e.target.closest('[data-item]');
    if (pick) {selected = pick.dataset.item; message = ''; render(); return;}
    if (e.target.closest('[data-buy]')) {
      const state = getState(), r = buyItem(state, selected);
      if (r.ok) {message = `Merci ! ${ITEMS[selected].name} : ${ITEMS[selected].kind === 'ball' ? 'équipée sur ta Pokéball.' : 'déjà actif !'}`; onChange(selected);}
      else message = r.reason === 'money' ? `Il te manque ${fmtMoney(r.missing)}.` : 'Tu l’as déjà.';
      render();
    }
  };
  render();
  return {refresh: render};
}

export function mountItems(container, {getState, onChange}) {
  container.innerHTML = '<div class="bag"></div>';
  const root = container.querySelector('.bag');
  function render() {
    const state = getState(), inv = state.inv, balls = Object.values(ITEMS).filter(i => i.kind === 'ball' && owns(inv, i.id)), passives = activeItems(inv);
    root.innerHTML = `<section><h3>Ball du milieu</h3><div class="bag-balls">${balls.map(b => `<button type="button" class="bag-ball${inv.ball === b.id ? ' on' : ''}" data-ball="${b.id}" aria-pressed="${inv.ball === b.id}">${icon(b, 64)}<span><b>${esc(b.name)}</b><small>${esc(b.effect)}</small></span>${inv.ball === b.id ? '<em>ÉQUIPÉE</em>' : '<em class="off">Équiper</em>'}</button>`).join('')}</div></section>
    <section><h3>Objets actifs</h3>${passives.length ? passives.map(p => `<div class="bag-item">${icon(p, 64)}<span><b>${esc(p.name)}</b><small>${esc(p.effect)}</small></span><em>ACTIF</em></div>`).join('') : '<p class="bag-empty">Aucun objet actif pour l’instant. Les boutiques de la carte en vendent : repère le logo 🛒 sur le chemin.</p>'}</section>`;
  }
  root.onclick = e => {const b = e.target.closest('[data-ball]'); if (b && equipBall(getState(), b.dataset.ball)) {onChange(); render();}};
  render();
  return {refresh: render};
}
