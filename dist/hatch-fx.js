// Animation d'éclosion : l'œuf se balance, se fissure, éclate, puis la fiche du nouveau-né s'ouvre (radar des IV).
const KEYS = ['hp', 'atk', 'def', 'spe', 'spd', 'spa'];
const LABELS = {hp: 'PV', atk: 'Atq', def: 'Déf', spe: 'Vit', spd: 'Déf. Sp.', spa: 'Atq. Sp.'};
const FULL = {hp: 'PV', atk: 'Attaque', def: 'Défense', spa: 'Atq. Spé.', spd: 'Déf. Spé.', spe: 'Vitesse'};
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
export function radarPoints(ivs, cx = 130, cy = 130, r = 100) {
  return KEYS.map((k, i) => { const a = (-90 + i * 60) * Math.PI / 180, v = Math.max(0, Math.min(31, +ivs?.[k] || 0)) / 31; return [+(cx + Math.cos(a) * r * v).toFixed(1), +(cy + Math.sin(a) * r * v).toFixed(1)]; });
}
const ring = (cx, cy, r) => KEYS.map((_, i) => { const a = (-90 + i * 60) * Math.PI / 180; return `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`; }).join(' ');
export function playHatch({name, shiny = false, isNew = false, ivs = {}, improved = [], eggSrc, spriteSrc, reduced = false}) {
  document.querySelector('.hx')?.remove();
  const imp = Object.fromEntries((improved || []).map(x => [x.key, x]));
  const pts = radarPoints(ivs).map(p => p.join(',')).join(' ');
  const labels = KEYS.map((k, i) => { const a = (-90 + i * 60) * Math.PI / 180; return `<text x="${(130 + Math.cos(a) * 116).toFixed(1)}" y="${(134 + Math.sin(a) * 116).toFixed(1)}">${LABELS[k]}</text>`; }).join('');
  const grid = KEYS.map(k => `<div class="${imp[k] ? 'up' : ''}"><small>${FULL[k].toUpperCase()}</small><b>${ivs[k] ?? 0}</b>${imp[k] ? `<em>+${imp[k].to - imp[k].from} hérité</em>` : ivs[k] === 31 ? '<em>maximum</em>' : ''}</div>`).join('');
  const el = document.createElement('div'); el.className = 'hx' + (shiny ? ' shiny' : '') + (reduced ? ' calm' : ''); el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Éclosion');
  el.innerHTML = `<div class="hx-box"><div class="hx-left"><div class="hx-stage"><span class="hx-glow"></span><span class="hx-rays"></span><span class="hx-shadow"></span><img class="hx-egg" src="${eggSrc}" alt="Œuf"><img class="hx-mon" src="${spriteSrc}" alt="${esc(name)}"></div><ol class="hx-steps"><li data-s="1">L’œuf bouge</li><li data-s="2">Il se fissure</li><li data-s="3">Flash</li><li data-s="4">${esc(name)} est né</li></ol></div>
  <div class="hx-card"><b class="hx-name">${esc(name)}</b><span class="hx-tag">${shiny ? 'CHROMATIQUE' : 'FORME NORMALE'}${isNew ? ' · NOUVEAU' : ''}</span><svg viewBox="0 0 260 260" width="230" height="230" role="img" aria-label="Radar des IV"><g fill="none" stroke="currentColor" stroke-opacity=".35" stroke-width="1.5"><polygon points="${ring(130, 130, 100)}"/><polygon points="${ring(130, 130, 50)}"/></g><polygon class="hx-poly" points="${pts}" stroke-width="3"/><g class="hx-lab" text-anchor="middle">${labels}</g></svg><div class="hx-grid">${grid}</div><button class="hx-ok" type="button">Continuer</button></div></div><div class="hx-flash"></div>`;
  document.body.appendChild(el);
  const setStep = n => { el.dataset.step = n; };
  const close = () => el.remove();
  el.querySelector('.hx-ok').onclick = close; el.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  if (reduced) { setStep(4); } else { setStep(1); setTimeout(() => setStep(2), 1500); setTimeout(() => setStep(3), 2900); setTimeout(() => setStep(4), 3500); }
  setTimeout(() => el.querySelector('.hx-ok').focus(), reduced ? 50 : 4200);
  return el;
}
