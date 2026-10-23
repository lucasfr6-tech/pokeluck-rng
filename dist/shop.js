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
  'ct-water': {id:'ct-water', kind:'tm', stack:true, move:'water-gun', name:'CT12 · Pistolet à O', price:3000,  sprite:SPRITE('tm-water'),    effect:'Eau · Puissance 40 · Précision 100', desc:'Apprend Pistolet à O à un Pokémon compatible. Consommable : disparaît après usage.'},
  'ct-swift': {id:'ct-swift', kind:'tm', stack:true, move:'swift',     name:'CT39 · Météores',     price:4500,  sprite:SPRITE('tm-normal'),   effect:'Normal · Puissance 60 · Précision 100', desc:'Apprend Météores à un Pokémon compatible. Consommable : disparaît après usage.'},
  'ct-thunder': {id:'ct-thunder', kind:'tm', stack:true, move:'thunderbolt', name:'CT24 · Tonnerre', price:60000, sprite:SPRITE('tm-electric'), effect:'Électrik · Puissance 90 · Précision 100', desc:'Apprend Tonnerre à un Pokémon compatible. Consommable : disparaît après usage.'},
  band:   {id:'band',   kind:'held', stack:true, name:'Ceinture Force', price:250000, sprite:SPRITE('muscle-band'), mult:{atk:1.2}, power:1.15, effect:'Attaque +20 % · Puissance +15 %', desc:'Objet à faire porter à un Pokémon : son Attaque augmente de 20 %. Un exemplaire par Pokémon.'},
  chroma: {id:'chroma', kind:'passive', name:'Charme Chroma', price:3000000, sprite:SPRITE('shiny-charm'), effect:'Chromatiques : 1 sur 2 048', desc:'Actif dès l’achat : la chance de rencontrer un chromatique passe de 1 sur 4 096 à 1 sur 2 048.'}
};
export const XP_MULTIPLIER = 1.5, MONEY_MULTIPLIER = 2, CHARM_DENOMINATOR = 2048, KILLS_TO_UNLOCK = 3;
// `after` : zone à explorer ; `at` : position (en % de la carte) du logo, entre `after` et la zone suivante.
export const SHOPS = [
  {id:'jade',  name:'Boutique de la Forêt',   after:'forest', before:'route3', at:{x:35,y:23}, stock:['super','xp','ct-water','ct-swift'], hello:'Bienvenue ! Une Super Ball et un Multi-XP, et ton aventure file plus vite.'},
  {id:'sud',   name:'Boutique de la Centrale', after:'route4', before:'power',  at:{x:63,y:78}, stock:['hyper','rune','chroma','ct-thunder','band'], hello:'Bienvenue ! Ici, on équipe les dresseurs qui voient loin.'}
];
export const shopById = id => SHOPS.find(s => s.id === id) || SHOPS[0];
export const zoneName = id => zones.find(z => z.id === id)?.name || id;
export const defaultInv = () => ({owned:{}, ball:'poke', stock:{}, held:{}});
// Pokémon qui possèdent une méga-évolution (Gen. 1) : ils portent deux objets, les autres un seul.
export const MEGA_SPECIES = [3, 6, 9, 15, 18, 65, 80, 94, 115, 127, 130, 142, 150];
export const slotsFor = id => MEGA_SPECIES.includes(id) ? 2 : 1;
export const isStack = id => ITEMS[id]?.stack === true;
export function sanitizeInv(raw) {
  const inv = defaultInv();
  if (raw && typeof raw === 'object') {
    for (const id of Object.keys(ITEMS)) if (id !== 'poke' && raw.owned?.[id] === true) inv.owned[id] = true;
    if (ITEMS[raw.ball]?.kind === 'ball' && (raw.ball === 'poke' || inv.owned[raw.ball])) inv.ball = raw.ball;
    if (raw.stock && typeof raw.stock === 'object') for (const id of Object.keys(ITEMS)) if (isStack(id) && Number.isSafeInteger(raw.stock[id]) && raw.stock[id] > 0) inv.stock[id] = Math.min(raw.stock[id], 9999);
    if (raw.held && typeof raw.held === 'object') {
      const used = {};
      for (const [pid, list] of Object.entries(raw.held)) {
        const n = +pid; if (!Number.isInteger(n) || n < 1 || n > 151 || !Array.isArray(list)) continue;
        const keep = [];
        for (const id of list) if (ITEMS[id]?.kind === 'held' && !keep.includes(id) && keep.length < slotsFor(n) && (used[id] || 0) < (inv.stock[id] || 0)) {keep.push(id); used[id] = (used[id] || 0) + 1;}
        if (keep.length) inv.held[n] = keep;
      }
    }
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
  if (!isStack(id) && owns(state.inv, id)) return {ok:false, reason:'owned'};
  if (state.money < item.price) return {ok:false, reason:'money', missing:item.price - state.money};
  state.money -= item.price;
  if (isStack(id)) {state.inv.stock[id] = Math.min(9999, (state.inv.stock[id] || 0) + 1); return {ok:true};}
  state.inv.owned[id] = true;
  if (item.kind === 'ball' && item.bonus > ITEMS[state.inv.ball].bonus) state.inv.ball = id;
  return {ok:true};
}
export function equipBall(state, id) {
  if (ITEMS[id]?.kind !== 'ball' || !owns(state.inv, id)) return false;
  state.inv.ball = id; return true;
}
// Objets tenus et CT : exemplaires possédés, portés ou libres, effets et consommation.
export const stockOf = (inv, id) => inv.stock[id] || 0;
export const heldList = (inv, pid) => inv.held[pid] || [];
export const heldCount = (inv, id) => Object.values(inv.held).reduce((n, l) => n + l.filter(x => x === id).length, 0);
export const freeCopies = (inv, id) => stockOf(inv, id) - heldCount(inv, id);
export function equipHeld(state, pid, id) {
  const inv = state.inv, list = heldList(inv, pid);
  if (ITEMS[id]?.kind !== 'held' || list.includes(id) || list.length >= slotsFor(pid) || freeCopies(inv, id) < 1) return false;
  inv.held[pid] = [...list, id]; return true;
}
export function unequipHeld(state, pid, id) {
  const list = heldList(state.inv, pid); if (!list.includes(id)) return false;
  const next = list.filter(x => x !== id); if (next.length) state.inv.held[pid] = next; else delete state.inv.held[pid]; return true;
}
export function useTm(state, id) {
  if (ITEMS[id]?.kind !== 'tm' || stockOf(state.inv, id) < 1) return false;
  state.inv.stock[id] -= 1; if (state.inv.stock[id] <= 0) delete state.inv.stock[id]; return true;
}
export const statMultipliers = (inv, pid) => heldList(inv, pid).reduce((m, id) => {for (const [k, v] of Object.entries(ITEMS[id]?.mult || {})) m[k] = (m[k] || 1) * v; return m;}, {});
export const powerMultiplier = (inv, pid) => heldList(inv, pid).reduce((m, id) => m * (ITEMS[id]?.power || 1), 1);
export const activeItems = inv => Object.values(ITEMS).filter(i => i.kind === 'passive' && inv.owned[i.id]);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const icon = (item, size = 64) => `<img class="shop-icon" src="${item.sprite}" alt="" width="${size}" height="${size}" style="width:${size}px;height:${size}px">`;

export function mountShop(container, {getState, shopId, onChange}) {
  const shop = shopById(shopId);
  let selected = shop.stock[0], message = '';
  container.innerHTML = '<div class="shop"></div>';
  const root = container.querySelector('.shop');
  function render() {
    const state = getState(), open = shopOpen(state.kills, shop), item = ITEMS[selected], own = !isStack(selected) && owns(state.inv, selected), afford = state.money >= item.price;
    const say = !open ? `Désolé, la boutique n’ouvre pas encore. Bats ${KILLS_TO_UNLOCK} Pokémon de la zone « ${zoneName(shop.after)} » : ${shopKills(state.kills, shop)} / ${KILLS_TO_UNLOCK}.` : message || shop.hello;
    root.innerHTML = `<aside class="shop-clerk"><img class="clerk-sprite" src="${CLERK_SPRITE}" alt="Vendeur du Pokémart" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'clerk-fallback',textContent:'🧑‍💼'}))"><p class="clerk-bubble" role="status">« ${esc(say)} »</p></aside>
    <section class="shop-main"><header class="shop-top"><span class="shop-label">${esc(shop.name)} · entre ${esc(zoneName(shop.after))} et ${esc(zoneName(shop.before))}</span><span class="shop-money" aria-label="Pokédollars"><span class="shop-coin" aria-hidden="true">₽</span>${esc(fmtMoney(state.money))}</span></header>
    ${open ? '' : `<div class="shop-locked"><b>🔒 Fermée</b> · ${shopKills(state.kills, shop)} / ${KILLS_TO_UNLOCK} Pokémon vaincus en ${esc(zoneName(shop.after))}<span class="shop-lockbar"><i style="width:${shopKills(state.kills, shop) / KILLS_TO_UNLOCK * 100}%"></i></span></div>`}
    <div class="shop-shelf ${open ? '' : 'closed'}">${shop.stock.map(id => {const it = ITEMS[id], qty = isStack(id) ? stockOf(state.inv, id) : 0, has = isStack(id) ? false : owns(state.inv, id), ok = state.money >= it.price; return `<button type="button" class="shop-item${id === selected ? ' sel' : ''}${has ? ' own' : ''}" data-item="${id}" aria-pressed="${id === selected}" ${open ? '' : 'disabled'}><span class="shop-art">${icon(it, 96)}</span><span class="shop-tag"><b>${esc(it.name)}</b><span class="${has ? 'own' : ok ? '' : 'poor'}">${has ? '✓ Possédé' : fmtMoney(it.price)}</span>${qty ? `<small class="shop-qty">Dans ton sac : ×${qty}</small>` : ''}</span></button>`;}).join('')}</div>    <footer class="shop-buy"><div class="shop-desc"><b>${esc(item.name)}</b> · ${esc(item.desc)}<small>${esc(item.effect)}</small></div>${own ? '<span class="shop-owned">✓ Déjà acquis</span>' : `<button type="button" class="shop-buy-btn" data-buy ${open && afford ? '' : 'disabled'}>${!open ? 'Fermée' : afford ? 'Acheter · ' + fmtMoney(item.price) : 'Manque ' + fmtMoney(item.price - state.money)}</button>`}</footer></section>`;
  }
  root.onclick = e => {
    const pick = e.target.closest('[data-item]');
    if (pick) {selected = pick.dataset.item; message = ''; render(); return;}
    if (e.target.closest('[data-buy]')) {
      const state = getState(), r = buyItem(state, selected);
      if (r.ok) {message = `Merci ! ${ITEMS[selected].name} : ${ITEMS[selected].kind === 'ball' ? 'équipée sur ta Pokéball.' : ITEMS[selected].kind === 'tm' ? 'ajoutée à ton sac. À utiliser depuis le profil d’un Pokémon.' : ITEMS[selected].kind === 'held' ? 'ajoutée à ton sac. À faire porter depuis le profil d’un Pokémon.' : 'déjà actif !'}`; onChange(selected);}
      else message = r.reason === 'money' ? `Il te manque ${fmtMoney(r.missing)}.` : 'Tu l’as déjà.';
      render();
    }
  };
  render();
  return {refresh: render};
}

const stackList = inv => {
  const rows = Object.values(ITEMS).filter(i => i.stack && stockOf(inv, i.id) > 0).map(i => {
    const holders = i.kind === 'held' ? Object.entries(inv.held).filter(([, l]) => l.includes(i.id)).length : 0;
    return `<div class="bag-item stack">${icon(i, 64)}<span><b>${esc(i.name)}</b><small>${esc(i.effect)}${holders ? ' · porté ×' + holders : ''}</small></span><em class="qty">×${stockOf(inv, i.id)}</em></div>`;
  });
  return rows.length ? rows.join('') : '<p class="bag-empty">Ton sac est vide. Les boutiques vendent des CT et des objets à faire porter à tes Pokémon.</p>';
};
export function mountItems(container, {getState, onChange}) {
  container.innerHTML = '<div class="bag"></div>';
  const root = container.querySelector('.bag');
  function render() {
    const state = getState(), inv = state.inv, balls = Object.values(ITEMS).filter(i => i.kind === 'ball' && owns(inv, i.id)), passives = activeItems(inv);
    root.innerHTML = `<section><h3>Ball du milieu</h3><div class="bag-balls">${balls.map(b => `<button type="button" class="bag-ball${inv.ball === b.id ? ' on' : ''}" data-ball="${b.id}" aria-pressed="${inv.ball === b.id}">${icon(b, 64)}<span><b>${esc(b.name)}</b><small>${esc(b.effect)}</small></span>${inv.ball === b.id ? '<em>ÉQUIPÉE</em>' : '<em class="off">Équiper</em>'}</button>`).join('')}</div></section>
    <section><h3>Sac · CT et objets à porter</h3>${stackList(inv)}</section>
    <section><h3>Objets actifs</h3>${passives.length ? passives.map(p => `<div class="bag-item">${icon(p, 64)}<span><b>${esc(p.name)}</b><small>${esc(p.effect)}</small></span><em>ACTIF</em></div>`).join('') : '<p class="bag-empty">Aucun objet actif pour l’instant. Les boutiques de la carte en vendent : repère le logo 🛒 sur le chemin.</p>'}</section>`;
  }
  root.onclick = e => {const b = e.target.closest('[data-ball]'); if (b && equipBall(getState(), b.dataset.ball)) {onChange(); render();}};
  render();
  return {refresh: render};
}
