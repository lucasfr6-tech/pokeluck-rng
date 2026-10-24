// Turbo ×2 : tous les délais de combat et toutes les animations CSS tournent deux fois plus vite.
let on = false;
export const turboOn = () => on;
export const sd = ms => on ? ms / 2 : ms;
const rate = el => { try { for (const a of (el.getAnimations ? el.getAnimations({subtree:true}) : [])) a.playbackRate = on ? 2 : 1; } catch {} };
export function setTurbo(v) {
  on = !!v; document.documentElement.classList.toggle('turbo', on);
  try { for (const a of document.getAnimations()) a.playbackRate = on ? 2 : 1; } catch {}
}
if (typeof document !== 'undefined') for (const ev of ['animationstart', 'transitionrun']) document.addEventListener(ev, e => { if (on && e.target?.getAnimations) rate(e.target); }, true);
