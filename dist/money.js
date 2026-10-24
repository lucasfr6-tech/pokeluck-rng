// Pokédollars (₽) : barèmes inspirés des jeux Game Boy.
// Combat : niveau du Pokémon vaincu × barème de sa rareté (Gen. 1 : dresseur 16–30 ×niveau, champion 99 ×niveau).
export const PAYOUT_PER_LEVEL = [0, 16, 24, 40, 64, 99];
// Prime de première capture d'une espèce : 100 ₽ × multiplicateur (une Poké Ball coûte 200 ₽).
export const FIRST_CATCH = [0, 100, 200, 400, 800, 2000];
// Capture d'un chromatique : récompense exceptionnelle (plusieurs Hyper Ball).
export const SHINY_REWARD = 5000;
// Les gains d'argent de tous les combats sont réduits de 20 %.
export const COMBAT_MONEY = 0.8;
export const victoryMoney = (tier, wildLevel) => Math.max(1, Math.round(wildLevel)) * (PAYOUT_PER_LEVEL[tier] || PAYOUT_PER_LEVEL[1]);
export const captureMoney = (tier, isNewSpecies, shiny) => (isNewSpecies ? FIRST_CATCH[tier] || FIRST_CATCH[1] : 0) + (shiny ? SHINY_REWARD : 0);
export const fmtMoney = n => Math.max(0, Math.floor(n)).toLocaleString('fr-FR') + ' ₽';
export const sanitizeMoney = n => Number.isFinite(n) && n >= 0 ? Math.min(Number.MAX_SAFE_INTEGER, Math.floor(n)) : 0;
