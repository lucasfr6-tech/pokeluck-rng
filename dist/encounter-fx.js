// Animations de rencontre : épique (tier 4) = animation normale, légendaire (tier 5) = grosse animation. Purement visuel.
export const FX_TIERS = {4: {cls: 'epic', ms: 1700, label: 'ÉPIQUE !'}, 5: {cls: 'legend', ms: 3200, label: 'LÉGENDAIRE !'}};
export function playEncounterFx(tier, host, reduced = false) {
  const t = FX_TIERS[tier]; if (!t || !host) return null;
  host.querySelector('.enc-fx')?.remove();
  const el = document.createElement('div'); el.className = 'enc-fx ' + t.cls + (reduced ? ' calm' : ''); el.setAttribute('aria-hidden', 'true');
  const sparks = Array.from({length: tier === 5 ? 18 : 9}, (_, i) => `<i style="--a:${Math.round(i * 360 / (tier === 5 ? 18 : 9))}deg;--d:${(i % 3) * .12}s"></i>`).join('');
  el.innerHTML = `<span class="enc-flash"></span><span class="enc-rays"></span><span class="enc-ring r1"></span><span class="enc-ring r2"></span><span class="enc-sparks">${sparks}</span><strong class="enc-label">${t.label}</strong>`;
  host.appendChild(el);
  if (tier === 5 && !reduced) { host.classList.add('enc-shake'); setTimeout(() => host.classList.remove('enc-shake'), 700); }
  setTimeout(() => el.remove(), t.ms + 200);
  return el;
}
