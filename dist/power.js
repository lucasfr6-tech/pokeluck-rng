// Rangs de puissance d'équipe. Une équipe de six Pokémon niveau 100 (légendaires compris) tourne autour de 50 M au maximum.
export const POWER_THRESHOLDS = [0, 100_000, 1_000_000, 6_000_000, 20_000_000, 40_000_000];
export const powerRank = n => { const p = Number.isFinite(n) ? Math.max(0, n) : 0; let i = 0; while (i + 1 < POWER_THRESHOLDS.length && p >= POWER_THRESHOLDS[i + 1]) i++; return i; };
