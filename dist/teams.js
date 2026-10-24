// Équipes sauvegardées : 3 emplacements, chacun une liste d'au plus 6 espèces.
export const TEAM_SLOTS = 3;
export const emptyTeams = () => Array.from({length:TEAM_SLOTS}, () => null);
export function sanitizeTeams(raw) {
  const out = emptyTeams();
  if (!Array.isArray(raw)) return out;
  for (let i = 0; i < TEAM_SLOTS; i++) {
    const ids = raw[i]?.ids;
    if (!Array.isArray(ids)) continue;
    const clean = [...new Set(ids.filter(id => Number.isInteger(id) && id >= 1 && id <= 251))].slice(0, 6);
    if (clean.length) out[i] = {ids:clean};
  }
  return out;
}
// Équipe réellement chargeable : seulement les Pokémon encore possédés, dans l'ordre enregistré.
export const loadableTeam = (slot, counts) => (slot?.ids || []).filter(id => counts[id]).slice(0, 6);
export const sameTeam = (a, b) => a.length === b.length && a.every((id, i) => id === b[i]);
