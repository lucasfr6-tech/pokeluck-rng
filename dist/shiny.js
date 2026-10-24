// Tirage indépendant de l'espèce. Les futures améliorations passeront par ce taux.
export const SHINY_DENOMINATOR = 4096;
export const SHINY_CHANCE = 1 / SHINY_DENOMINATOR;
// Le Charme Chroma change le dénominateur (×4 : 1 sur 1 024) ; sans lui, 1 sur 4 096.
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
// Étoile chromatique des jeux Pokémon : étoile rouge à cinq branches, liseré sombre, reflet blanc.
export const shinyStar = (size = 16, cls = 'shiny-star') => `<svg class="${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" role="img" aria-label="Chromatique"><path d="M12 1.6l3.1 6.6 7.2.9-5.3 5 1.4 7.2L12 17.7l-6.4 3.6L7 14.1 1.7 9.1l7.2-.9z" fill="#1b0a0a" stroke="#1b0a0a" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 3.4l2.5 5.4 5.9.7-4.3 4.1 1.1 5.9L12 16.6 6.8 19.5l1.1-5.9L3.6 9.5l5.9-.7z" fill="#ef3b36"/><path d="M12 3.4l2.5 5.4L12 9.4 9.5 8.8z" fill="#ff8f86"/><path d="M8.2 11.2l-2 2" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".8"/></svg>`;
export const shinyBadge = `<span class="shiny-badge">${shinyStar(13)} Chromatique</span>`;
