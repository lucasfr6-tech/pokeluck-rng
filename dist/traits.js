// Natures et talents, comme dans les jeux : chaque espèce de l'équipe a une nature (+10 % / −10 % sur deux stats)
// et un talent tirés au hasard à la première rencontre, puis conservés.
export const NATURES = {
  hardy:{fr:'Hardi'}, docile:{fr:'Docile'}, bashful:{fr:'Pudique'}, quirky:{fr:'Bizarre'}, serious:{fr:'Sérieux'},
  lonely:{fr:'Solo', up:'atk', down:'def'}, brave:{fr:'Brave', up:'atk', down:'spe'}, adamant:{fr:'Rigide', up:'atk', down:'spa'}, naughty:{fr:'Mauvais', up:'atk', down:'spd'},
  bold:{fr:'Assuré', up:'def', down:'atk'}, relaxed:{fr:'Relax', up:'def', down:'spe'}, impish:{fr:'Malin', up:'def', down:'spa'}, lax:{fr:'Lâche', up:'def', down:'spd'},
  timid:{fr:'Timide', up:'spe', down:'atk'}, hasty:{fr:'Pressé', up:'spe', down:'def'}, jolly:{fr:'Jovial', up:'spe', down:'spa'}, naive:{fr:'Naïf', up:'spe', down:'spd'},
  modest:{fr:'Modeste', up:'spa', down:'atk'}, mild:{fr:'Doux', up:'spa', down:'def'}, quiet:{fr:'Discret', up:'spa', down:'spe'}, rash:{fr:'Foufou', up:'spa', down:'spd'},
  calm:{fr:'Calme', up:'spd', down:'atk'}, gentle:{fr:'Gentil', up:'spd', down:'def'}, sassy:{fr:'Malpoli', up:'spd', down:'spe'}, careful:{fr:'Prudent', up:'spd', down:'spa'}
};
export const NATURE_KEYS = Object.keys(NATURES);
export const STAT_SHORT = {atk:'Attaque', def:'Défense', spa:'Atq. Spé.', spd:'Déf. Spé.', spe:'Vitesse'};
export const natureText = key => { const n = NATURES[key]; return n ? (n.up ? `${n.fr} · +${STAT_SHORT[n.up]} / −${STAT_SHORT[n.down]}` : `${n.fr} · neutre`) : ''; };
export const randomTraits = (rand = Math.random) => ({n:NATURE_KEYS[Math.floor(rand() * NATURE_KEYS.length)], s:rand() < .5 ? 0 : 1});
export const sanitizeTraits = raw => {
  const out = {};
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) for (const [id, t] of Object.entries(raw)) {
    const n = +id; if (Number.isInteger(n) && n >= 1 && n <= 251 && NATURES[t?.n] && (t.s === 0 || t.s === 1)) out[n] = {n:t.n, s:t.s};
  }
  return out;
};
// Talents dont l'effet est actif en combat (descriptions fidèles aux jeux). Les autres s'affichent mais restent sans effet pour l'instant.
export const ABILITIES = {
  intimidate:{fr:'Intimidation', desc:'À son entrée au combat, baisse l’Attaque de l’adversaire d’un niveau.'},
  levitate:{fr:'Lévitation', desc:'Immunise contre les attaques de type Sol.'},
  static:{fr:'Statik', desc:'30 % de chances de paralyser l’attaquant qui le touche avec une attaque physique.'},
  'flame-body':{fr:'Corps Ardent', desc:'30 % de chances de brûler l’attaquant qui le touche avec une attaque physique.'},
  'poison-point':{fr:'Point Poison', desc:'30 % de chances d’empoisonner l’attaquant qui le touche avec une attaque physique.'},
  'effect-spore':{fr:'Pose Spore', desc:'30 % de chances d’endormir, paralyser ou empoisonner l’attaquant physique.'},
  'rough-skin':{fr:'Peau Dure', desc:'Blesse l’attaquant physique (1/8 de ses PV max).'},
  overgrow:{fr:'Engrais', desc:'Attaques Plante ×1,5 quand les PV sont à 1/3 ou moins.'},
  blaze:{fr:'Brasier', desc:'Attaques Feu ×1,5 quand les PV sont à 1/3 ou moins.'},
  torrent:{fr:'Torrent', desc:'Attaques Eau ×1,5 quand les PV sont à 1/3 ou moins.'},
  swarm:{fr:'Essaim', desc:'Attaques Insecte ×1,5 quand les PV sont à 1/3 ou moins.'},
  guts:{fr:'Cran', desc:'Attaque ×1,5 sous statut, et la brûlure ne réduit plus l’Attaque.'},
  'thick-fat':{fr:'Isograisse', desc:'Dégâts des attaques Feu et Glace réduits de moitié.'},
  'water-absorb':{fr:'Absorb Eau', desc:'Immunise contre l’Eau et rend 1/4 des PV max.'},
  'volt-absorb':{fr:'Absorb Volt', desc:'Immunise contre l’Électrik et rend 1/4 des PV max.'},
  'flash-fire':{fr:'Torche', desc:'Immunise contre le Feu et renforce ensuite ses attaques Feu de 50 %.'},
  sturdy:{fr:'Fermeté', desc:'À PV pleins, survit à une attaque qui devrait mettre K.O. (1 PV restant).'},
  'rock-head':{fr:'Tête de Roc', desc:'Aucun contrecoup.'},
  'inner-focus':{fr:'Attention', desc:'Ne peut pas être apeuré.'},
  'own-tempo':{fr:'Tempo Perso', desc:'Ne peut pas être confus.'},
  limber:{fr:'Échauffement', desc:'Ne peut pas être paralysé.'},
  immunity:{fr:'Vaccin', desc:'Ne peut pas être empoisonné.'},
  insomnia:{fr:'Insomnia', desc:'Ne peut pas s’endormir.'},
  'vital-spirit':{fr:'Esprit Vital', desc:'Ne peut pas s’endormir.'},
  'magma-armor':{fr:'Armumagma', desc:'Ne peut pas être gelé.'},
  'water-veil':{fr:'Ignifu-Voile', desc:'Ne peut pas être brûlé.'},
  'shed-skin':{fr:'Mue', desc:'30 % de chances de guérir son statut à chaque tour.'},
  'natural-cure':{fr:'Médic Nature', desc:'Guérit son statut quand il quitte le combat.'},
  'huge-power':{fr:'Force Pure', desc:'Double l’Attaque.'},
  'marvel-scale':{fr:'Écaille Spéciale', desc:'Défense ×1,5 sous statut.'},
  'hyper-cutter':{fr:'Hyper Cutter', desc:'Son Attaque ne peut pas être baissée.'},
  'clear-body':{fr:'Corps Sain', desc:'Aucune de ses stats ne peut être baissée par l’adversaire.'},
  'keen-eye':{fr:'Regard Vif', desc:'Sa Précision ne peut pas être baissée.'},
  'compound-eyes':{fr:'Œil Composé', desc:'Précision de ses attaques ×1,3.'},
  'early-bird':{fr:'Matinal', desc:'Dort deux fois moins longtemps.'},
  synchronize:{fr:'Synchro', desc:'Renvoie brûlure, poison ou paralysie à celui qui les inflige.'}
};
export const abilityFr = name => ABILITIES[name]?.fr || (name ? name.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase()) : '—');
export const abilityDesc = name => ABILITIES[name]?.desc || 'Effet pas encore actif en combat.';
