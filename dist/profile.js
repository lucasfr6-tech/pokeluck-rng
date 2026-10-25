// Profil du dresseur : titres animés (petits bonus) et cadres de photo animés.
// Rien ici ne touche au tirage : les bonus sont faibles (1 à 5 %) et un seul titre est actif à la fois.
import {getAvatar,mountAvatar,DEFAULT_AVATAR} from './avatar.js';
import {companionBonus} from './arcade.js';

// Icônes pixel-propres en SVG (aucun emoji).
export const ICONS={
 leaf:'M4 20C4 10 10 4 20 4c0 10-6 16-16 16z',
 star:'M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3l-6.1 3.3 1.4-6.8-5.1-4.7 6.9-.8z',
 flame:'M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-7 1-10z',
 bolt:'M13 2L4 14h6l-1 8 9-12h-6z',
 drop:'M12 2c4 5 7 8 7 12a7 7 0 0 1-14 0c0-4 3-7 7-12z',
 ghost:'M12 3a7 7 0 0 0-7 7v11l3-2 2 2 2-2 2 2 2-2 3 2V10a7 7 0 0 0-7-7zM9.5 11a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z',
 crown:'M3 18L2 7l5 4 5-8 5 8 5-4-1 11z',
 shield:'M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z',
 sparkle:'M12 2l3.5 6.5L22 12l-6.5 3.5L12 22l-3.5-6.5L2 12l6.5-3.5z',
 moon:'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z',
 ball:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 7a3 3 0 1 1 0 6 3 3 0 0 1 0-6z',
 wing:'M2 6c6 0 10 3 12 8l-3 1c-1-3-3-4-5-4l5 6-2 1C5 17 2 12 2 6zm20 0c0 6-3 11-7 12l-2-1 5-6c-2 0-4 1-5 4l-3-1c2-5 6-8 12-8z',
 gem:'M6 3h12l4 6-10 13L2 9z',
 tower:'M7 2h10v4h-2v3l2 2v11H7V11l2-2V6H7z'
};
const svg=n=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" fill-rule="evenodd"><path d="${ICONS[n]}"/></svg>`;

// Bonus : p = puissance, m = pièces, x = XP. Valeurs en fraction (0,02 = +2 %).
// t : test de déblocage sur les métriques du jeu (m) et l'état (s).
const T=(id,name,icon,fx,bonus,need,t)=>({id,name,icon,fx,bonus,need,t});
export const TITLES=[
 T('rookie','Jeune Pousse','leaf','leaf',null,'Disponible dès le départ.',()=>true),
 T('spark','Chasseur d’Étincelles','sparkle','shimmer',{p:.01},'Obtiens un chromatique.',m=>m.shinies>=1),
 T('astral','Orfèvre d’Astres','star','aurora',{m:.03},'Obtiens 10 chromatiques.',m=>m.shinies>=10),
 T('ember','Cœur de Braise','flame','flame',{p:.02},'Gagne 1 000 combats sauvages.',m=>m.wins>=1000),
 T('storm','Orage Ambulant','bolt','storm',{p:.03},'Gagne 5 000 combats sauvages.',m=>m.wins>=5000),
 T('scribe','Cartographe des Ailes','wing','wave',{x:.02},'Découvre 80 Pokémon de Kanto.',m=>m.discovered>=80),
 T('sage','Maître des Registres','gem','shimmer',{x:.03},'Découvre les 151 Pokémon de Kanto.',m=>m.discovered>=151),
 T('guard','Gardien de Kanto','shield','royal',{p:.02},'Obtiens les 8 badges de Kanto.',m=>m.badges>=8),
 T('indigo','Souverain d’Indigo','crown','royal',{p:.04},'Bats le Maître de la Ligue de Kanto.',(m,s)=>!!s.eliteDone?.blue),
 T('dawn','Voyageur de l’Aube','moon','dawn',{m:.03},'Obtiens les 8 badges de Johto.',m=>m.johtoBadges>=8),
 T('johto','Sage de Cendrelune','crown','aurora',{p:.05},'Termine la Ligue de Johto.',m=>m.johtoElite>=1),
 T('shade','Chasseur d’Ombres','ghost','spectral',{x:.02},'Bats 3 boss d’étage.',m=>m.floorBosses>=3),
 T('breaker','Briseur d’Étages','tower','storm',{p:.03},'Bats 6 boss d’étage.',m=>m.floorBosses>=6),
 T('beast','Éleveur de Légendes','wing','aurora',{m:.02},'Découvre 3 légendaires de Johto.',m=>m.johtoLegend>=3),
 T('mogul','Magnat de la Capsule','gem','royal',{m:.02},'Fais 100 achats en boutique.',m=>m.purchases>=100),
 T('frost','Gel Éternel','sparkle','frost',{p:.03},'Atteins la vague 25 de la Tour de combat.',m=>m.towerBest>=25),
 T('colossus','Colosse de la Tour','tower','flame',{p:.05},'Atteins la vague 50 de la Tour de combat.',m=>m.towerBest>=50),
 T('trio','Trio Intrépide','ball','leaf',{x:.02},'Réussis le défi « Trio » (3 Pokémon seulement).',m=>!!m.chalDone?.trio),
 T('bare','Mains Nues','star','storm',{p:.02},'Réussis le défi « Sans objet ».',m=>!!m.chalDone?.bare),
 T('mono','Monochrome','drop','wave',{m:.02},'Réussis le défi « Un seul type ».',m=>!!m.chalDone?.mono),
 T('hunter','Traqueur de Foudre','bolt','storm',{m:.02},'Capture un légendaire errant.',m=>m.roamCaught>=1),
 T('beastmaster','Dompteur de Tempêtes','flame','flame',{x:.03},'Capture les 3 légendaires errants.',m=>m.roamCaught>=3),
 T('keeper','Habitué du Marché','gem','shimmer',{m:.02},'Achète 10 offres du Marché du jour.',m=>m.marketBuys>=10)
];
export const titleById=id=>TITLES.find(t=>t.id===id);

const F=(id,name,need,t,hint)=>({id,name,need,t,hint});
export const FRAMES=[
 F('plain','Doré','Disponible dès le départ.',()=>true,'Ruban doré'),
 F('flame','Flammes','Gagne 300 combats sauvages.',m=>m.wins>=300,'Des flammes lèchent la photo'),
 F('hail','Grêle','Découvre 40 Pokémon de Kanto.',m=>m.discovered>=40,'Des grêlons tombent autour'),
 F('thunder','Foudre','Fais 3 000 tirages.',m=>m.draws>=3000,'Éclairs et arcs électriques'),
 F('aurora','Aurore','Obtiens 4 badges d’arène.',m=>m.badges>=4,'Rubans de lumière mouvants'),
 F('spectre','Brume spectrale','Bats un boss d’étage.',m=>m.floorBosses>=1,'Volutes de fantôme'),
 F('sakura','Pétales','Obtiens un badge de Johto.',m=>m.johtoBadges>=1,'Pétales qui tournoient'),
 F('ocean','Marée','Gagne 2 000 combats sauvages.',m=>m.wins>=2000,'Vagues et bulles'),
 F('royal','Couronne','Bats le Maître de la Ligue.',(m,s)=>!!s.eliteDone?.blue,'Or royal et éclats'),
 F('shiny','Chromatique','Obtiens 3 chromatiques.',m=>m.shinies>=3,'Arc-en-ciel scintillant'),
 F('dragon','Dragon','Termine la Ligue de Johto.',m=>m.johtoElite>=1,'Anneaux de braise'),
 F('cosmos','Cosmos','Découvre 150 Pokémon (toutes régions).',m=>m.discovered+m.johtoDex>=150,'Étoiles en orbite')
];
export const frameById=id=>FRAMES.find(f=>f.id===id);

export function sanitizeProf(p){
 const o=p&&typeof p==='object'&&!Array.isArray(p)?p:{};
 const done={};if(o.done&&typeof o.done==='object')for(const k of Object.keys(o.done))if(/^[a-z0-9-]{1,24}$/.test(k)&&o.done[k]===true)done[k]=true;
 const n=v=>Number.isFinite(+v)?Math.max(0,Math.min(1e6,Math.floor(+v))):0;
 return{title:titleById(o.title)?o.title:'',frame:frameById(o.frame)?o.frame:'plain',done,towerBest:n(o.towerBest),roam:n(o.roam),market:n(o.market),comp:n(o.comp)>0&&n(o.comp)<=251?n(o.comp):0,mday:n(o.mday),mb:[0,1,2].map(i=>Array.isArray(o.mb)&&o.mb[i]===true)};
}
// key : 'p' (puissance), 'm' (pièces), 'x' (XP) ; renvoie la fraction de bonus.
export const bonusOf=(state,key)=>{const t=titleById(state.prof?.title),c=state.prof?.comp&&state.counts?.[state.prof.comp]?companionBonus(state.prof.comp):null;return (t?.bonus?.[key]||0)+(c?.[key]||0);};
const unlockedTitle=(t,m,s)=>{try{return !!t.t(m,s);}catch{return false;}};
export const ownedTitles=(m,s)=>TITLES.filter(t=>unlockedTitle(t,m,s));
export const ownedFrames=(m,s)=>FRAMES.filter(f=>{try{return !!f.t(m,s);}catch{return false;}});

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const bonusText=b=>b?[b.p?`+${Math.round(b.p*100)} % puissance`:'',b.m?`+${Math.round(b.m*100)} % pièces`:'',b.x?`+${Math.round(b.x*100)} % XP`:''].filter(Boolean).join(' · '):'Aucun bonus';
export const titlePill=t=>`<span class="ttl" data-fx="${t.fx}">${svg(t.icon)}<b>${esc(t.name)}</b></span>`;
// Huit « rayons » autour de la photo : chaque cadre les dessine à sa façon.
export const frameInner=()=>Array.from({length:8},(_,i)=>`<i style="--a:${i*45}deg;--d:${(i*0.37%1.4).toFixed(2)}s"></i>`).join('');
export const frameBox=(frame,src,cls='')=>`<span class="fr ${cls}" data-frame="${frame}">${frameInner()}<img${src===DEFAULT_AVATAR?' class="sprite"':''} src="${src}" alt=""></span>`;

// Bannière : titre actif + cadre autour de la photo. Mise à jour seulement si la clé change (évite de relancer les animations).
export function applyProfile(state){
 const p=state.prof||{},wrap=document.querySelector('#avatar-wrap'),el=document.querySelector('#trainer-title');
 if(wrap){const k=p.frame||'plain';if(wrap.dataset.frame!==k){wrap.dataset.frame=k;if(!wrap.querySelector(':scope>i'))wrap.insertAdjacentHTML('beforeend',frameInner());}}
 if(wrap){const cid=p.comp&&state.counts?.[p.comp]?p.comp:0;if((+wrap.dataset.comp||0)!==cid){wrap.dataset.comp=cid;wrap.querySelector(':scope>.comp')?.remove();if(cid)wrap.insertAdjacentHTML('beforeend',`<img class="comp" alt="" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${cid}.png">`);}}
 if(el){const t=titleById(p.title),k=t?t.id:(state.eliteDone?.blue?'~master':'~base');if(el.dataset.k!==k){el.dataset.k=k;el.classList.remove('master');if(t){el.innerHTML=titlePill(t);}else if(k==='~master'){el.textContent='★ MAÎTRE DE LA LIGUE';el.classList.add('master');}else el.textContent='DRESSEUR';}}
}


// Classement : cinq grades par objectif à long terme.
export const GRADES=[['Aucun','#8aa4be'],['Bronze','#c8803c'],['Argent','#b8c4d0'],['Or','#f2b632'],['Platine','#7fe3d6'],['Maître','#c77bff']];
export const rankRows=(m,st,ach)=>[
 ['Pokédex de Kanto',m.discovered,[20,60,100,140,151],'espèces'],
 ['Pokédex de Johto',m.johtoDex,[10,30,60,90,100],'espèces'],
 ['Chromatiques',m.shinies,[1,5,20,50,100],'obtenus'],
 ['Victoires sauvages',m.wins,[100,1000,5000,20000,100000],'victoires'],
 ['Badges d’arène',m.badges+m.johtoBadges,[2,5,8,12,16],'badges'],
 ['Tour de combat',m.towerBest,[5,10,25,50,100],'vague max'],
 ['Succès',ach,[10,25,40,55,68],'débloqués'],
 ['Titres',ownedTitles(m,st).length,[3,6,10,15,TITLES.length],'débloqués'],
 ['Défis à règles',['trio','bare','mono'].filter(k=>m.chalDone?.[k]).length,[1,2,3,3,3],'réussis']
].map(([name,v,goals,unit])=>{const g=goals.filter(x=>v>=x).length,nx=goals[g],pv=g?goals[g-1]:0;return{name,v,goals,unit,g,nx,pct:nx?Math.round((v-pv)/(nx-pv)*100):100};});

export function mountProfile(host,{getState,metrics,save,onChange,getName,onName,owned,sprite,pname,achCount}){
 const s=()=>getState();
 function paint(){
  const st=s(),m=metrics(),p=st.prof,cur=titleById(p.title),fr=frameById(p.frame)||FRAMES[0];
  const ot=new Set(ownedTitles(m,st).map(t=>t.id)),of=new Set(ownedFrames(m,st).map(f=>f.id));
  const nOT=ot.size,nOF=of.size;
  host.innerHTML=`<div class="prof">
  <article class="setting-card wide prof-hero"><div class="prof-hero-art">${frameBox(p.frame,getAvatar(),'big')}</div><div class="prof-hero-info"><label class="setting-label" for="trainer-setting-name">Pseudo</label><input id="trainer-setting-name" type="text" maxlength="24" autocomplete="nickname" value="${esc(getName())}"><div class="prof-now"><span>Titre actif</span>${cur?titlePill(cur):'<em>Aucun titre</em>'}<small>${bonusText(cur?.bonus)}</small></div><div class="prof-now"><span>Cadre actif</span><b>${fr.name}</b><small>${fr.hint}</small></div></div></article>
  <article class="setting-card wide"><h4>Titres <small class="prof-count">${nOT} / ${TITLES.length}</small></h4><p>Un seul titre actif à la fois : il s’affiche sous ta photo et donne un petit bonus. Les bonus restent faibles et ne changent jamais les chances de tirage.</p><div class="prof-grid" role="group" aria-label="Titres">${TITLES.map(t=>{const own=ot.has(t.id);return `<button type="button" class="prof-card title${own?'':' locked'}${p.title===t.id?' on':''}" data-title="${t.id}" ${own?'':'aria-disabled="true"'} aria-pressed="${p.title===t.id}">${titlePill(t)}<small class="pc-bonus">${bonusText(t.bonus)}</small><small class="pc-need">${own?(p.title===t.id?'Actif · clique pour retirer':'Débloqué'):'Verrouillé · '+esc(t.need)}</small></button>`;}).join('')}</div></article>
  <article class="setting-card wide"><h4>Cadres de photo <small class="prof-count">${nOF} / ${FRAMES.length}</small></h4><p>Purement décoratifs. Tous les cadres sont animés ; ceux que tu n’as pas encore s’affichent en aperçu.</p><div class="prof-grid frames" role="group" aria-label="Cadres">${FRAMES.map(f=>{const own=of.has(f.id);return `<button type="button" class="prof-card frame${own?'':' locked'}${p.frame===f.id?' on':''}" data-frame-pick="${f.id}" ${own?'':'aria-disabled="true"'} aria-pressed="${p.frame===f.id}">${frameBox(f.id,getAvatar())}<strong>${f.name}</strong><small class="pc-need">${own?(p.frame===f.id?'Actif':'Débloqué'):'Verrouillé · '+esc(f.need)}</small></button>`;}).join('')}</div></article>
  <article class="setting-card wide"><h4>Compagnon</h4><p>Un Pokémon de ta collection te suit à côté de ta photo et donne un petit bonus selon son type (jamais sur les chances de tirage).</p>${p.comp&&st.counts[p.comp]?`<div class="cp-now"><img src="${sprite(p.comp)}" alt=""><div><b>${esc(pname(p.comp))}</b><small>${bonusText(companionBonus(p.comp))}</small></div></div>`:'<div class="cp-now"><div><b>Aucun compagnon</b><small>Choisis-en un ci-dessous.</small></div></div>'}<div class="cp-grid" role="group" aria-label="Choisir un compagnon">${owned().map(id=>`<button type="button" class="cp-mon${p.comp===id?' on':''}" data-comp="${id}" title="${esc(pname(id))} · ${bonusText(companionBonus(id))}" aria-pressed="${p.comp===id}"><img src="${sprite(id)}" alt="${esc(pname(id))}" loading="lazy"></button>`).join('')}</div></article>
  <article class="setting-card wide"><h4>Classement de collection</h4><p>Tes objectifs à long terme, du Bronze jusqu’au grade Maître.</p>${(()=>{const rows=rankRows(m,st,achCount()),avg=rows.reduce((n,r)=>n+r.g,0)/rows.length,top=GRADES[Math.min(5,Math.round(avg))];return `<div class="rk-all" style="--g:${top[1]}"><div><small>RANG GLOBAL</small><b>${top[0]}</b></div><small>Moyenne de tes ${rows.length} objectifs</small></div><div class="rk-grid">${rows.map(r=>`<div class="rk-row" style="--g:${GRADES[r.g][1]}"><div class="rk-top"><b>${r.name}</b><em>${GRADES[r.g][0]}</em></div><div class="rk-bar"><i style="width:${r.pct}%"></i></div><small>${r.v.toLocaleString('fr-FR')} ${r.unit}${r.nx?' · prochain grade à '+r.nx.toLocaleString('fr-FR'):' · grade maximal'}</small></div>`).join('')}</div>`;})()}</article>
  <article class="setting-card wide"><h4>Photo de profil</h4><p>Importe ta propre image : elle est recadrée puis stockée uniquement dans ce navigateur.</p><div id="avatar-settings"></div></article></div>`;
  mountAvatar(host.querySelector('#avatar-settings'));
 }
 host.addEventListener('click',e=>{
  const cpk=e.target.closest('[data-comp]');if(cpk){const id=+cpk.dataset.comp,st=s();if(!st.counts[id])return;st.prof.comp=st.prof.comp===id?0:id;save();onChange();paint();return;}
  const t=e.target.closest('[data-title]'),f=e.target.closest('[data-frame-pick]');
  if(t){const own=ownedTitles(metrics(),s()).some(x=>x.id===t.dataset.title);if(!own)return;const st=s();st.prof.title=st.prof.title===t.dataset.title?'':t.dataset.title;save();onChange();paint();}
  else if(f){const own=ownedFrames(metrics(),s()).some(x=>x.id===f.dataset.framePick);if(!own)return;s().prof.frame=f.dataset.framePick;save();onChange();paint();}
 });
 const refresh=()=>{if(!host.isConnected){window.removeEventListener('pokeluck-avatar',refresh);return;}host.querySelectorAll('.fr img').forEach(i=>{i.src=getAvatar();i.classList.toggle('sprite',getAvatar()===DEFAULT_AVATAR);});};
 window.addEventListener('pokeluck-avatar',refresh);
 paint();
}
