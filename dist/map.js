import {zones} from './world.js';
import {ARENAS,ELITE,arenaById,eliteById,buildPath} from './arena.js';

// Carte du voyage : l'illustration de Kanto avec un parcours en serpentin de 24 petits ronds (16 zones + 8 arènes),
// 8 par rangée, reliés par un trait fléché. Les arènes sont d'une autre couleur (rouge), le champion est plus grand.
// Aucun texte sur la carte : le nom apparaît au survol. Coordonnées en % de la largeur (x) et de la hauteur (y).
const SHOP_ICON='<svg viewBox="0 0 40 40" aria-hidden="true"><path class="sh-roof" d="M4 16 L8 6 H32 L36 16 Z"/><path class="sh-stripe" d="M12 6 L11 16 M20 6 V16 M28 6 L29 16"/><rect class="sh-wall" x="6" y="16" width="28" height="18"/><rect class="sh-door" x="16" y="22" width="8" height="12"/><rect class="sh-win" x="8" y="20" width="6" height="6"/><rect class="sh-win" x="26" y="20" width="6" height="6"/></svg>';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export const ROW_SIZE=8;
export const ASPECT=1.6; // largeur / hauteur de la carte
const ROWS_Y=[13,37,61,85];
export function spotPosition(i){
  const row=Math.min(3,Math.floor(i/ROW_SIZE)),k=i%ROW_SIZE,col=row%2?ROW_SIZE-1-k:k;
  return {x:+(8+col*(84/(ROW_SIZE-1))).toFixed(1),y:+(ROWS_Y[row]+(k%2?3.5:-3.5)).toFixed(1)};
}
function trailSvg(pos,cur){
  let out='';
  for(let i=0;i<pos.length-1;i++){
    const a=pos[i],b=pos[i+1],ax=a.x*ASPECT,bx=b.x*ASPECT,dx=bx-ax,dy=b.y-a.y,k=.12;
    const cx=(ax+bx)/2-dy*k,cy=(a.y+b.y)/2+dx*k,mx=.25*ax+.5*cx+.25*bx,my=.25*a.y+.5*cy+.25*b.y,ang=Math.atan2(dy,dx)*180/Math.PI;
    const d=`M${ax.toFixed(1)} ${a.y} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${bx.toFixed(1)} ${b.y}`;
    out+=`<g class="route-step${i<cur?' done':''}"><path class="under" d="${d}"/><path class="line" d="${d}"/><path class="arrow" transform="translate(${mx.toFixed(1)} ${my.toFixed(1)}) rotate(${ang.toFixed(0)})" d="M-1.9 -1.7 L1.7 0 L-1.9 1.7 Z"/></g>`;
  }
  return `<svg class="map-route" viewBox="0 0 ${100*ASPECT} 100" aria-hidden="true">${out}</svg>`;
}
export function mapMarkup(selected,busy=false,shops=[],info={zones:{},arenas:{}}){
  const path=buildPath(shops),main=path.filter(n=>n.kind!=='shop'),pos=main.map((_,i)=>spotPosition(i));
  const side=p=>(p.x>72?' edge-r':p.x<28?' edge-l':'')+(p.y<30?' below':'');
  let html='';
  main.forEach((n,i)=>{
    const p=pos[i],style=`left:${p.x}%;top:${p.y}%`;
    if(n.kind==='zone'){
      const z=zones.find(z=>z.id===n.id),acc=info.zones?.[n.id]||{ok:true},cur=n.id===selected;
      const need=acc.ok?`niveau ${z.min}+`:acc.reason==='badge'?`badge n°${acc.arena.n} requis (${acc.arena.leader})`:`niveau ${acc.need} requis`;
      html+=`<button class="map-spot${cur?' current':''}${acc.ok?'':' locked'}${side(p)}" data-zone="${n.id}" aria-label="${esc(z.name)} (${need})" aria-pressed="${cur}" ${busy?'disabled':''} style="${style}"><span class="map-spot-dot" aria-hidden="true"></span><span class="map-tooltip">${i+1} · ${esc(z.name)}<small>${acc.ok?'Niv. '+z.min+'+':'🔒 '+esc(need)}</small></span></button>`;
    }else if(n.kind==='elite'){
      const m=eliteById(n.id),ac=info.elite||{},done=!!ac.members?.[m.id];
      html+=`<button class="map-spot spot-elite${done?' won':''}${ac.ok||ac.done?'':' locked'}${side(p)}" data-elite="${m.id}" aria-label="Conseil des 4 : ${esc(m.leader)}${done?' (battu)':''}" style="${style}"><span class="map-spot-dot" aria-hidden="true"></span><span class="map-tooltip">Conseil des 4 · ${esc(m.leader)}<small>${done?'Vaincu ✓':'Niv. '+m.ace+(ac.ok?'':' · 🔒')}</small></span></button>`;
    }else{
      const a=arenaById(n.id),st=info.arenas?.[n.id]||{},won=!!st.won,champ=a.n===ARENAS.length;
      html+=`<button class="map-spot spot-arena${won?' won':''}${st.ok||won?'':' locked'}${champ?' champion':''}${side(p)}" data-arena="${a.id}" aria-label="${champ?'Champion':'Arène'} de ${esc(a.city)} : ${esc(a.leader)}${won?' (battu)':''}" style="${style}"><span class="map-spot-dot" aria-hidden="true"></span><span class="map-tooltip">${champ?'Champion':'Arène'} · ${esc(a.leader)}<small>${won?'Badge obtenu ✓':'Niv. '+a.ace+(st.ok?'':' · 🔒')}</small></span></button>`;
    }
  });
  const placed=[];
  path.forEach((n,i)=>{ // boutiques : posées juste sous l'étape qu'elles suivent
    if(n.kind!=='shop')return;
    const prev=main.findIndex(m=>m.kind==='zone'&&m.id===shops.find(s=>s.id===n.id)?.after),a=pos[prev]||{x:50,y:50},b=pos[prev+1]||a;
    // Pose la boutique là où elle ne recouvre aucun rond : on teste plusieurs décalages et on garde le plus dégagé.
    const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,cands=[];
    for(const dy of [-12,-10,-8,8,10,12])for(const dx of [0,-4,4,-8,8])cands.push({x:mx+dx,y:my+dy});
    const clear=c=>Math.min(...pos.map(p=>Math.hypot((p.x-c.x)*ASPECT,p.y-c.y)),...placed.map(p=>Math.hypot((p.x-c.x)*ASPECT,p.y-c.y)))-(Math.abs(c.x-mx)+Math.abs(c.y-my))*.04;
    const inMap=c=>c.x>=5&&c.x<=95&&c.y>=7&&c.y<=93;
    const best=cands.filter(inMap).reduce((m,c)=>clear(c)>clear(m)?c:m,cands.filter(inMap)[0]||{x:mx,y:my+9});placed.push(best);
    const x=best.x,y=best.y;
    const s=shops.find(s=>s.id===n.id);
    html+=`<button class="map-shop${s.open?' open':' closed'}${y<30?' below':''}" data-shop="${s.id}" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%" aria-label="${esc(s.name)}${s.open?'':' (fermée : '+s.kills+' / '+s.need+' Pokémon vaincus)'}"><span class="map-shop-art">${SHOP_ICON}</span>${s.open?'':`<span class="map-shop-lock" aria-hidden="true">${s.kills}/${s.need}</span>`}<span class="map-tooltip">${esc(s.name)}${s.open?'':' · '+s.kills+' / '+s.need}</span></button>`;
  });
  const cur=zones.find(z=>z.id===selected),curIdx=main.findIndex(m=>m.kind==='zone'&&m.id===selected);
  return `<div class="illustrated-map" role="group" aria-label="Carte interactive des destinations de Kanto">
    <img class="exploration-image" src="assets/kanto-exploration.png" alt="" draggable="false">
    ${trailSvg(pos,curIdx)}
    <span class="map-water" aria-hidden="true"></span><span class="map-glint g1" aria-hidden="true"></span><span class="map-glint g2" aria-hidden="true"></span>
    ${html}
    <span class="sr-only">Destination actuelle : ${esc(cur?.name||'Route 1')}. Choisis un rond sur la carte pour voyager ou défier un champion.</span>
  </div>`;
}
