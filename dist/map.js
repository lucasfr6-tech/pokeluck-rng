import {zones} from './world.js';
import {ARENAS,arenaById,buildPath} from './arena.js';

// Carte du voyage : un parcours en serpentin de 24 étapes (16 zones + 8 arènes), 8 étapes par rangée.
// Deux zones, puis une arène (rouge) ; la dernière est le champion. Les boutiques s'intercalent entre deux étapes.
const SHOP_ICON='<svg viewBox="0 0 40 40" aria-hidden="true"><path class="sh-roof" d="M4 16 L8 6 H32 L36 16 Z"/><path class="sh-stripe" d="M12 6 L11 16 M20 6 V16 M28 6 L29 16"/><rect class="sh-wall" x="6" y="16" width="28" height="18"/><rect class="sh-door" x="16" y="22" width="8" height="12"/><rect class="sh-win" x="8" y="20" width="6" height="6"/><rect class="sh-win" x="26" y="20" width="6" height="6"/></svg>';
const LOCK='<svg class="bn-lock" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke-width="1.6"/></svg>';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export const ROW_SIZE=8;
export function mapMarkup(selected,busy=false,shops=[],info={zones:{},arenas:{}}){
  const path=buildPath(shops),rows=[[],[],[]];let count=0;
  for(const n of path){rows[Math.min(2,Math.floor(count/ROW_SIZE))].push(n);if(n.kind!=='shop')count++;}
  const node=n=>{
    if(n.kind==='zone'){
      const z=zones.find(z=>z.id===n.id),acc=info.zones?.[n.id]||{ok:true},cur=n.id===selected;
      const need=acc.ok?'':acc.reason==='badge'?`Badge ${acc.arena.n}`:`Niv. ${acc.need}`;
      return `<button class="bnode n-zone${cur?' current':''}${acc.ok?'':' locked'}" data-zone="${n.id}" aria-pressed="${cur}" aria-label="${esc(z.name)}${acc.ok?'':' (verrouillée : '+need+')'}" title="${esc(z.name)} · niveau ${z.min}+" ${busy?'disabled':''}><span class="bn-n">${n.n}</span><b>${esc(z.name)}</b><small>${acc.ok?'Niv. '+z.min+'+':LOCK+need}</small></button>`;
    }
    if(n.kind==='arena'){
      const a=arenaById(n.id),st=info.arenas?.[n.id]||{},won=!!st.won,champ=a.n===ARENAS.length;
      return `<button class="bnode n-arena${won?' won':''}${st.ok||won?'':' locked'}${champ?' champion':''}" data-arena="${a.id}" aria-label="Arène de ${esc(a.city)} : ${esc(a.leader)}${won?' (battu)':''}" title="${esc(a.title)} · niveau ${a.need}+"><img class="bn-badge" src="${a.badgeSprite}" alt=""><b>${esc(a.leader)}</b><small>${won?'Badge ✓':champ?'Champion · Niv. '+a.ace:'Arène · Niv. '+a.ace}</small></button>`;
    }
    const s=shops.find(s=>s.id===n.id);
    return `<button class="bnode n-shop ${s.open?'open':'closed'}" data-shop="${s.id}" aria-label="${esc(s.name)}${s.open?'':' (fermée : '+s.kills+' / '+s.need+' Pokémon vaincus)'}" title="${esc(s.name)}${s.open?'':' · '+s.kills+' / '+s.need}"><span class="bshop-art">${SHOP_ICON}</span>${s.open?'':`<span class="bshop-lock">${s.kills}/${s.need}</span>`}</button>`;
  };
  const cur=zones.find(z=>z.id===selected);
  return `<div class="board-scroll"><div class="board" role="group" aria-label="Carte des destinations de Kanto">${rows.map((r,i)=>`<div class="board-row${i%2?' rev':''}">${r.map(node).join('')}</div>`).join('')}</div></div><span class="sr-only">Destination actuelle : ${esc(cur?.name||'Route 1')}. Choisis une étape sur la carte pour voyager ou défier un champion.</span>`;
}
