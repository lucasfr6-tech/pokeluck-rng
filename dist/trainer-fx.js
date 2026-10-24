// Dresseurs d'arène : sprite animé derrière le Pokémon adverse et lancer de Pokéball à chaque envoi (champions et joueur).
const scene = () => document.querySelector('.scene');
let trainerEl = null, generation = 0;
export function mountTrainer(arena) {
  unmountTrainer();
  const stage = document.getElementById('stage'); if (!stage || !arena) return;
  trainerEl = document.createElement('img');
  trainerEl.className = 'boss-trainer'; trainerEl.src = arena.sprite; fallbackSprite(trainerEl, arena.alts); trainerEl.alt = ''; trainerEl.draggable = false;
  trainerEl.onerror = () => { trainerEl.hidden = true; };
  stage.prepend(trainerEl);
}
export function unmountTrainer() { generation++; trainerEl?.remove(); trainerEl = null; scene()?.querySelectorAll('.fx-ball,.fx-flash,.attack-effect').forEach(el => { el.getAnimations().forEach(a => a.cancel()); el.remove(); }); }
export function trainerThrow() { if (!trainerEl) return; trainerEl.classList.remove('throw'); void trainerEl.offsetWidth; trainerEl.classList.add('throw'); }

const BALL = '<span class="fx-ball-top"></span><span class="fx-ball-line"></span><span class="fx-ball-core"></span>';
const rectIn = (el, host) => { const r = el.getBoundingClientRect(), h = host.getBoundingClientRect(); return {x: r.left - h.left + r.width / 2, y: r.top - h.top + r.height / 2, w: r.width, h: r.height}; };

// Lance une Pokéball de `from` vers le centre de `target`, puis fait apparaître le Pokémon (image `img`) en la faisant s'ouvrir.
// side : 'foe' (le dresseur lance) ou 'ally' (le joueur). Résout quand le Pokémon est apparu. Sans mouvement si reduced.
export async function sendOut({side, img, reduced = false, sound}) {
  const current = generation;
  const host = scene(); if (!host || !img) return;
  if (reduced || !img.animate) { img.style.opacity = ''; return; }
  img.style.opacity = '0';
  if (side === 'foe') trainerThrow();
  const hr = host.getBoundingClientRect(), t = rectIn(img, host);
  const start = side === 'foe' && trainerEl && !trainerEl.hidden ? (() => { const p = rectIn(trainerEl, host); return {x: p.x - p.w * .25, y: p.y - p.h * .1}; })()
    : side === 'foe' ? {x: hr.width * 1.02, y: hr.height * .1} : {x: -hr.width * .02, y: hr.height * .72};
  const end = {x: t.x, y: t.y + t.h * .1}, size = Math.max(16, Math.min(34, hr.height * .07));
  const ball = document.createElement('span'); ball.className = 'fx-ball'; ball.innerHTML = BALL; ball.style.cssText = `width:${size}px;height:${size}px;margin:${-size / 2}px 0 0 ${-size / 2}px`;
  host.appendChild(ball);
  const arc = Math.max(40, hr.height * .28), N = 12, frames = [];
  for (let i = 0; i <= N; i++) { const k = i / N; frames.push({transform: `translate(${start.x + (end.x - start.x) * k}px,${start.y + (end.y - start.y) * k - Math.sin(Math.PI * k) * arc}px) rotate(${k * (side === 'foe' ? -720 : 720)}deg)`, offset: k}); }
  await ball.animate(frames, {duration: 650, easing: 'linear', fill: 'forwards'}).finished.catch(() => {});
  if (current !== generation) { ball.remove(); return; }
  const flash = document.createElement('span'); flash.className = 'fx-flash'; flash.style.cssText = `left:${end.x}px;top:${end.y}px`;
  host.appendChild(flash); ball.remove(); sound?.();
  flash.animate([{transform: 'translate(-50%,-50%) scale(.2)', opacity: .95}, {transform: 'translate(-50%,-50%) scale(2.6)', opacity: 0}], {duration: 520, easing: 'ease-out'}).finished.catch(() => {}).finally(() => flash.remove());
  img.style.opacity = '';
  await img.animate([{transform: 'scale(.05)', filter: 'brightness(4) saturate(0)', opacity: 1, offset: 0}, {transform: 'scale(1.12)', filter: 'brightness(1.6)', offset: .6}, {transform: 'scale(1)', filter: 'none', opacity: 1, offset: 1}], {duration: 520, easing: 'ease-out', transformOrigin: '50% 90%'}).finished.catch(() => {});
}

// Essaie les autres versions d'un sprite de dresseur si la première est introuvable.
export function fallbackSprite(img, alts) {
  const list = (alts || []).slice(); img.onerror = () => { const n = list.shift(); if (n) img.src = n; else { img.onerror = null; img.style.visibility = 'hidden'; } };
}
