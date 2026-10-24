// Série de victoires : plus on enchaîne de victoires dans la même zone, plus les raretés montent. Changer de zone remet à zéro.
// Paliers volontairement lents : 15, 45, 90, 150, 225, 315, 420, 540 victoires pour +5 % chacun (+40 % au maximum).
export const STREAK_STEPS = [15, 45, 90, 150, 225, 315, 420, 540];
export const STREAK_STEP_BONUS = .05;
export const emptyStreak = () => ({zone: '', n: 0});
export const sanitizeStreak = raw => raw && typeof raw.zone === 'string' && Number.isSafeInteger(raw.n) && raw.n >= 0 ? {zone: raw.zone.slice(0, 30), n: Math.min(raw.n, 100000)} : emptyStreak();
export const streakLevel = n => STREAK_STEPS.filter(s => n >= s).length;
export const streakBonus = n => streakLevel(n) * STREAK_STEP_BONUS;
export const streakNext = n => STREAK_STEPS.find(s => n < s) || null;
// Une victoire dans `zone` : la série repart de zéro si la zone a changé.
export function bumpStreak(st, zone) { if (st.zone !== zone) { st.zone = zone; st.n = 0; } st.n = Math.min(100000, st.n + 1); return st; }
export const streakIn = (st, zone) => st.zone === zone ? st.n : 0;
