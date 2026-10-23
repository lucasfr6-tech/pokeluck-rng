// Tirage indépendant de l'espèce. Les futures améliorations passeront par ce taux.
export const SHINY_DENOMINATOR = 4096;
export const SHINY_CHANCE = 1 / SHINY_DENOMINATOR;
// Le Charme Chroma change le dénominateur (1 sur 2 048) ; sans lui, 1 sur 4 096.
let denominator = SHINY_DENOMINATOR;
export const setShinyDenominator = n => {denominator = Number.isInteger(n) && n >= 1 ? n : SHINY_DENOMINATOR;};
export const getShinyDenominator = () => denominator;
export const rollShiny = (random = Math.random()) => random >= 0 && random < 1 / denominator;
export function formCount(state, id, shiny = false) {
 const total = state.counts[id] || 0;
 const count = Math.min(total, state.shinyCounts?.[id] || 0);
 return shiny ? count : total - count;
}
export function selectedShiny(state, id) {
 return !!formCount(state, id, true) && (state.appearance?.[id] === 'shiny' || !formCount(state, id));
}
export function migrateShinies(counts, rawCounts, rawAppearance) {
 const shinyCounts = {}, appearance = {};
 for (const [id, total] of Object.entries(counts)) {
  const n = rawCounts?.[id];
  if (Number.isSafeInteger(n) && n > 0) shinyCounts[id] = Math.min(total, n);
  if (shinyCounts[id] && (rawAppearance?.[id] === 'shiny' || shinyCounts[id] === total)) appearance[id] = 'shiny';
 }
 return {shinyCounts, appearance};
}
export function recordForm(state, id, shiny) {
 state.counts[id] = (state.counts[id] || 0) + 1;
 if (shiny) {
  const first = !state.shinyCounts[id];
  state.shinyCounts[id] = (state.shinyCounts[id] || 0) + 1;
  if (first) state.appearance[id] = 'shiny';
 }
}
export const formProbability = (probability, shiny) => probability * (shiny ? 1 / denominator : 1 - 1 / denominator);
export const shinyBadge = '<span class="shiny-badge">✦ Chromatique</span>';
