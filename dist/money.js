// Pokédollars (₽) : barèmes inspirés des jeux Game Boy.
// Combat : niveau du Pokémon vaincu × barème de sa rareté (Gen. 1 : dresseur 16–30 ×niveau, champion 99 ×niveau).
export const PAYOUT_PER_LEVEL = [0, 16, 24, 40, 64, 99];
// Prime de première capture d'une espèce : 100 ₽ × multiplicateur (une Poké Ball coûte 200 ₽).
export const FIRST_CATCH = [0, 100, 200, 400, 800, 2000];
// Capture d'un chromatique : récompense exceptionnelle (plusieurs Hyper Ball).
export const SHINY_REWARD = 5000;
// Les gains d'argent de tous les combats sont réduits de 20 %.
export const COMBAT_MONEY = 0.8;
// Au-delà du niveau 30, le gain n'augmente presque plus avec le niveau (10 % de la pente) : une victoire niveau 90 rapporte environ 2,5 fois moins qu'avec un barème linéaire.
export const MONEY_SOFT_LEVEL = 30, MONEY_SOFT_SLOPE = .1;
export const effectiveLevel = lv => lv <= MONEY_SOFT_LEVEL ? lv : MONEY_SOFT_LEVEL + (lv - MONEY_SOFT_LEVEL) * MONEY_SOFT_SLOPE;
// Au-delà du niveau 30, le gain est aussi réduit progressivement (×0,35 au niveau 100) : les dernières zones ne doivent plus inonder le joueur d'argent.
export const lateMoneyFactor = lv => lv <= MONEY_SOFT_LEVEL ? 1 : Math.max(.35, 1 - (lv - MONEY_SOFT_LEVEL) * .0093);
export const victoryMoney = (tier, wildLevel) => { const lv = Math.max(1, Math.round(wildLevel)); return Math.max(1, Math.round(effectiveLevel(lv) * (PAYOUT_PER_LEVEL[tier] || PAYOUT_PER_LEVEL[1]) * lateMoneyFactor(lv))); };
export const captureMoney = (tier, isNewSpecies, shiny) => (isNewSpecies ? FIRST_CATCH[tier] || FIRST_CATCH[1] : 0) + (shiny ? SHINY_REWARD : 0);
export const fmtMoney = n => Math.max(0, Math.floor(n)).toLocaleString('fr-FR') + ' ₽';
export const sanitizeMoney = n => Number.isFinite(n) && n >= 0 ? Math.min(Number.MAX_SAFE_INTEGER, Math.floor(n)) : 0;
