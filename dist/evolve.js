// Écran d'évolution : détecte l'évolution d'un membre de l'équipe et joue une courte animation. Purement visuel.
export function teamEvolution(before, after) {
  for (let i = 0; i < before.length; i++) if (after[i] && after[i] !== before[i] && !before.includes(after[i])) return {from: before[i], to: after[i]};
  return null;
}
export function playEvolution({from, to, fromName, toName, fromSrc, toSrc, reduced = false}) {
  document.querySelector('.evo-screen')?.remove();
  const el = document.createElement('div'); el.className = 'evo-screen' + (reduced ? ' calm' : ''); el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', `${fromName} évolue`);
  el.innerHTML = `<div class="evo-box"><small class="evo-kick">ÉVOLUTION</small><div class="evo-art"><span class="evo-glow"></span><img class="evo-from" src="${fromSrc}" alt="${fromName}"><img class="evo-to" src="${toSrc}" alt="${toName}"></div><p class="evo-text">Quoi ? <b>${fromName}</b> évolue !</p><button class="evo-ok" type="button" hidden>Continuer</button></div>`;
  document.body.appendChild(el);
  const text = el.querySelector('.evo-text'), ok = el.querySelector('.evo-ok');
  const close = () => el.remove();
  const done = () => { text.innerHTML = `Félicitations ! <b>${fromName}</b> a évolué en <b>${toName}</b> !`; el.classList.add('done'); ok.hidden = false; ok.focus(); };
  ok.onclick = close; el.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  if (reduced) done(); else setTimeout(done, 2600);
  return el;
}
