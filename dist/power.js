// Rangs de puissance d'équipe (somme des 6). La puissance d'un Pokémon tient compte de son niveau, de ses IV/EV, de son chromatique et de sa forme (Méga / Dynamax).
// Équipe parfaite : Mewtwo niv. 100 en Méga (IV/EV max, chromatique ≈ 39 M), plus Mew, Dracolosse et les trois oiseaux parfaits ≈ 107 M. Sans la Méga-Gemme de Mewtwo, on plafonne vers 96 M : le rang Maître l'exige donc.
export const POWER_THRESHOLDS = [0, 150_000, 2_000_000, 12_000_000, 40_000_000, 100_000_000];
// Facteur d'entraînement : IV moyens (×0,8 à ×1,2) et EV totaux (×0,9 à ×1,1). Un Pokémon parfait vaut ×1,32, un Pokémon moyen sans EV ≈ ×0,9.
export const trainingPower = (tr) => {
  const ivs = Object.values(tr?.ivs || {}), evs = Object.values(tr?.evs || {});
  const iv = ivs.length ? ivs.reduce((n, v) => n + (+v || 0), 0) / ivs.length : 15.5, ev = evs.reduce((n, v) => n + (+v || 0), 0);
  return (0.8 + 0.4 * Math.min(1, iv / 31)) * (0.9 + 0.2 * Math.min(1, ev / 510));
};
export const powerRank = n => { const p = Number.isFinite(n) ? Math.max(0, n) : 0; let i = 0; while (i + 1 < POWER_THRESHOLDS.length && p >= POWER_THRESHOLDS[i + 1]) i++; return i; };
