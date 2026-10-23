// Succès : 50 objectifs répartis en quatre rangs (Bronze, Argent, Or, Platine). Chaque succès compare une statistique du joueur
// (calculée dans game.js) à un seuil. Une fois obtenu, un succès reste acquis (state.ach).
export const TIERS = [null, {name:'Bronze', color:'#d08a4e'}, {name:'Argent', color:'#c4cfdb'}, {name:'Or', color:'#ffd27c'}, {name:'Platine', color:'#8ad4ff'}];
const A = (id, tier, name, desc, metric, target) => ({id, tier, name, desc, metric, target});
export const ACHIEVEMENTS = [
  // Tirages
  A('draw-1', 1, 'Premier tirage', 'Fais ton premier tirage.', 'draws', 1),
  A('draw-100', 1, 'Dresseur assidu', 'Fais 100 tirages.', 'draws', 100),
  A('draw-1000', 2, 'Marathon de Pokéballs', 'Fais 1 000 tirages.', 'draws', 1000),
  A('draw-10000', 3, 'Pouce d’acier', 'Fais 10 000 tirages.', 'draws', 10000),
  A('draw-50000', 4, 'Légende du tirage', 'Fais 50 000 tirages.', 'draws', 50000),
  // Découvertes
  A('dex-10', 1, 'Apprenti chercheur', 'Découvre 10 Pokémon différents.', 'discovered', 10),
  A('dex-40', 2, 'Carnet bien rempli', 'Découvre 40 Pokémon différents.', 'discovered', 40),
  A('dex-80', 2, 'Grand explorateur', 'Découvre 80 Pokémon différents.', 'discovered', 80),
  A('dex-120', 3, 'Presque complet', 'Découvre 120 Pokémon différents.', 'discovered', 120),
  A('dex-151', 4, 'Maître du Pokédex', 'Découvre les 151 Pokémon de Kanto.', 'discovered', 151),
  // Chromatiques
  A('shiny-1', 2, 'Une étincelle', 'Obtiens un Pokémon chromatique.', 'shinies', 1),
  A('shiny-3', 3, 'Collectionneur d’étoiles', 'Obtiens 3 chromatiques.', 'shinies', 3),
  A('shiny-10', 4, 'Chasseur de brillants', 'Obtiens 10 chromatiques.', 'shinies', 10),
  // Légendaires
  A('legend-1', 2, 'Rencontre mythique', 'Découvre un Pokémon légendaire.', 'legendaries', 1),
  A('legend-3', 3, 'Trio céleste', 'Découvre 3 légendaires.', 'legendaries', 3),
  A('legend-5', 4, 'Tous les légendaires', 'Découvre les 5 légendaires de Kanto.', 'legendaries', 5),
  // Combats
  A('win-1', 1, 'Première victoire', 'Gagne un combat sauvage.', 'wins', 1),
  A('win-50', 1, 'Dresseur confirmé', 'Gagne 50 combats sauvages.', 'wins', 50),
  A('win-300', 2, 'Vétéran', 'Gagne 300 combats sauvages.', 'wins', 300),
  A('win-1500', 3, 'Machine de guerre', 'Gagne 1 500 combats sauvages.', 'wins', 1500),
  A('win-6000', 4, 'Invaincu', 'Gagne 6 000 combats sauvages.', 'wins', 6000),
  // Zones
  A('zone-4', 1, 'Voyageur', 'Remporte un combat dans 4 zones différentes.', 'zones', 4),
  A('zone-10', 2, 'Globe-trotter', 'Remporte un combat dans 10 zones différentes.', 'zones', 10),
  A('zone-16', 3, 'Tour de Kanto', 'Remporte un combat dans les 16 zones.', 'zones', 16),
  // Arènes
  A('badge-1', 1, 'Premier badge', 'Bats Pierre et obtiens le Badge Roche.', 'badges', 1),
  A('badge-3', 2, 'Trio de badges', 'Obtiens 3 badges d’arène.', 'badges', 3),
  A('badge-5', 2, 'Cinq étoiles', 'Obtiens 5 badges d’arène.', 'badges', 5),
  A('badge-8', 3, 'Collection complète', 'Obtiens les 8 badges d’arène.', 'badges', 8),
  A('master', 4, 'Maître de Kanto', 'Obtiens les 8 badges avec un Pokémon niveau 100.', 'masters', 1),
  // Niveaux
  A('lvl-20', 1, 'Ça monte !', 'Atteins le niveau 20 avec un Pokémon.', 'maxLevel', 20),
  A('lvl-50', 2, 'Mi-chemin', 'Atteins le niveau 50 avec un Pokémon.', 'maxLevel', 50),
  A('lvl-80', 3, 'Élite', 'Atteins le niveau 80 avec un Pokémon.', 'maxLevel', 80),
  A('lvl-100', 4, 'Niveau 100', 'Atteins le niveau 100 avec un Pokémon.', 'maxLevel', 100),
  // Équipe et puissance
  A('team-6', 1, 'Équipe au complet', 'Remplis les 6 emplacements de ton équipe.', 'teamSize', 6),
  A('power-silver', 2, 'Rang Argent', 'Atteins le rang de puissance Argent.', 'powerRank', 1),
  A('power-gold', 3, 'Rang Or', 'Atteins le rang de puissance Or.', 'powerRank', 2),
  A('power-diamond', 4, 'Rang Diamant', 'Atteins le rang de puissance Diamant.', 'powerRank', 3),
  // Argent
  A('money-50k', 1, 'Petit porte-monnaie', 'Gagne 50 000 ₽ au total.', 'moneyEarned', 50000),
  A('money-1m', 2, 'Millionnaire', 'Gagne 1 000 000 ₽ au total.', 'moneyEarned', 1000000),
  A('money-20m', 3, 'Magnat', 'Gagne 20 000 000 ₽ au total.', 'moneyEarned', 20000000),
  // Boutiques et objets
  A('shop-1', 1, 'Premier achat', 'Achète un objet en boutique.', 'purchases', 1),
  A('held-1', 1, 'Bien équipé', 'Fais porter un objet à un Pokémon.', 'heldEquipped', 1),
  A('tm-1', 1, 'Nouvelle attaque', 'Apprends une attaque grâce à une CT.', 'tmUsed', 1),
  A('heal-10', 1, 'Infirmier', 'Utilise 10 soins en combat.', 'heals', 10),
  // Évolutions
  A('evo-1', 2, 'Elle évolue !', 'Fais évoluer un Pokémon avec une pierre.', 'evolutions', 1),
  A('evo-5', 3, 'Éleveur', 'Fais évoluer 5 Pokémon avec des pierres.', 'evolutions', 5),
  // Collections thématiques
  A('types-10', 2, 'Arc-en-ciel', 'Découvre des Pokémon de 10 types différents.', 'types', 10),
  A('types-15', 3, 'Tous les types', 'Découvre des Pokémon de 15 types différents.', 'types', 15),
  A('starters', 2, 'Trio de départ', 'Découvre Bulbizarre, Salamèche et Carapuce (ou leurs évolutions).', 'starters', 3),
  A('eevee', 3, 'Évoli et ses évolutions', 'Découvre Évoli, Aquali, Voltali et Pyroli.', 'eevee', 4)
];
export const achievementById = id => ACHIEVEMENTS.find(a => a.id === id);
export const progressOf = (a, m) => { const cur = Math.max(0, Math.floor(m[a.metric] || 0)); return {cur: Math.min(cur, a.target), target: a.target, done: cur >= a.target}; };
export const sanitizeAch = raw => { const out = {}; if (raw && typeof raw === 'object' && !Array.isArray(raw)) for (const a of ACHIEVEMENTS) if (raw[a.id] === true) out[a.id] = true; return out; };
const STAT_KEYS = ['moneyEarned', 'purchases', 'tmUsed', 'heals', 'evolutions', 'newSpecies', 'rareKills', 'arenaWins', ...['normal', 'water', 'grass', 'bug', 'poison', 'flying', 'ground'].map(t => 't_' + t)];
export const sanitizeStats = raw => { const out = {}; if (raw && typeof raw === 'object' && !Array.isArray(raw)) for (const k of STAT_KEYS) if (Number.isSafeInteger(raw[k]) && raw[k] > 0) out[k] = raw[k]; return out; };
// Succès nouvellement remplis (non encore acquis) pour des statistiques données.
export const newlyDone = (ach, m) => ACHIEVEMENTS.filter(a => !ach[a.id] && progressOf(a, m).done);
export const powerRankOf = n => n >= 1e9 ? 3 : n >= 1e8 ? 2 : n >= 1e5 ? 1 : 0;
