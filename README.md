# Pokéluck

Jeu Pokémon RNG en français. Aventure rétro en pixel art, plein navigateur, zones de Kanto, collection et équipe de six.

- Jouer : https://lucasfr6-tech.github.io/pokeluck-rng/
- Dépôt partagé : https://github.com/lucasfr6-tech/pokeluck-rng
- Reprise par une IA : lire `REPRISE-IA.md` et `AGENTS.md`.

## Lancer en local

Avec Node.js 18 ou plus récent : `npm start`, puis ouvrir http://127.0.0.1:8765. Aucune installation de dépendances n'est nécessaire. Internet est requis pour PokéAPI, les sprites et les polices.

## Modifier et publier

Les sources du jeu se trouvent uniquement dans `dist/` :
- `index.html` : disposition et structure des menus.
- `game.css` : thème sombre et responsive.
- `game.js` : interactions, collection, équipe, sauvegarde, appels PokéAPI.
- `pokemon.js` : les 151 espèces de Kanto (noms français, poids de base, table d'évolutions `evolvesFrom`).
- `world.js` : zones, parcours de Kanto, types, poids de rencontre, puissances provisoires et règles d'équipe (une évolution remplace sa forme précédente).
- `battle.js` (moteur de combat pur : types, stats, dégâts), `battle-data.js` (PokéAPI : attaques par niveau Rouge/Bleu, stats, noms français, cache localStorage), `fight.js` (interface de combat).
- `levels.js` : niveaux (départ, plafond par stade, expérience par doublon, puissance selon le niveau).
- `wander.js` : petits Pokémon qui se promènent dans la scène.
- `update.js` : rechargement automatique après une nouvelle publication.
- `map.js` : ronds lumineux cliquables de la carte illustrée (positions en pourcentage) et noms au survol.
- `layout.css` : mise en page des quatre cadres, barre de vie, équipe et carte.
- `assets/` : illustrations fournies par le créateur.

`npm test` vérifie les tirages pondérés des zones. `npm run build` génère `public/`, avec une version des fichiers CSS/JS pour éviter qu'une nouvelle publication conserve les anciens scripts en cache. Ne pas modifier `public/` directement.

Chaque push dans `main` lance `.github/workflows/pages.yml`, exécute les vérifications et publie `dist/` sur GitHub Pages via l'étape de préparation. Le statut est visible dans **Actions**. La mise en ligne peut prendre quelques minutes. Aucun service worker ne maintient une copie hors ligne.

Une autre IA doit travailler depuis ce même dépôt, récupérer la dernière version, modifier les sources puis pousser ses changements. Des modifications restées sur son ordinateur ne mettent pas le site à jour. Les changements dans une branche ne sont publiés qu'après leur intégration dans `main`.

## Progression du joueur

La sauvegarde de progression est automatique, locale au navigateur et à l’adresse du jeu. L’import/export JSON a été retiré à la demande du créateur. Google et Discord sont affichés comme « À venir » : le créateur a reporté la configuration d’un service de comptes. Aucun compte ni synchronisation cloud n’est actuellement actif.

Le total de puissance correspond aux six espèces équipées au maximum. Les valeurs sont provisoires ; les doublons ne gonflent pas ce total. Une ancienne sauvegarde du prototype est reprise automatiquement.

## Interface 1.0 — Bannière et paramètres

Grand avatar, six grands emplacements, puissance rectangulaire horizontale et barre de progression au sein du palier. Les seuils existants sont inchangés : Argent à 100 000 ; Or à 100 000 000 ; Diamant à 1 000 000 000. La barre revient à zéro au début de chaque nouveau palier et affiche 100 % au dernier.

Les paramètres utilisent cinq rubriques et se sauvegardent automatiquement : profil et thèmes Nuit/Jour ; performances (Économie = aucun promeneur ni effet, Équilibré = 5 promeneurs à 30 images/s, Élevée = jusqu’à 10 à 60 images/s) ; audio (sons activables, volume, aperçus) ; compte/sauvegarde locale ; aide. Les mouvements sont suspendus quand l’onglet est masqué. Les préférences sont séparées de la progression dans `pokeluck-preferences-v1`.

Nouveaux modules : `preferences.js` (validation et progression), `settings.js` (paramètres), `settings.css` (bannière, thèmes et réglages), `audio.js` (synthèse Web Audio), `effects.js` (animations temporaires).

Griffe et Flammèche sont synthétisés à partir des séquences de bruit Game Boy de Rouge/Bleu ; ce ne sont pas des enregistrements bit-identiques au matériel. Sources : [table des sons](https://github.com/pret/pokered/blob/master/data/moves/sfx.asm), [Griffe](https://github.com/pret/pokered/blob/master/audio/sfx/damage.asm), [Flammèche](https://github.com/pret/pokered/blob/master/audio/sfx/battle_19.asm). Aucun son ne joue avant une interaction du joueur. Les événements de combat fournissent le nom interne et le type de l’attaque, uniquement pour l’audio et les effets visuels.

## Historique : interface 0.5

Quatre cadres, selon le croquis du créateur :
1. **Scène** (centre) : lieu d'apparition des Pokémon, Pokéball au centre, arrière-plan propre à la zone (`world.js` → `backgrounds`, images dans `assets/backgrounds/`, mises à l'échelle du cadre sans être modifiées). Une petite vie en fond (`wander.js`) : des Pokémon de la zone se promènent, y compris en diagonale, vus de face, de dos ou de côté (miroir de la face, PokéAPI n'a pas de sprites de profil). Après un tirage, le Pokémon apparaît au milieu avec une barre de vie.
2. **Bannière** (en haut) : nom, puissance et les six Pokémon de l'équipe.
3. **Menu** (à gauche) : un seul cadre qui ouvre le menu coulissant.
4. **Carte** (en bas à gauche) : carte illustrée avec des ronds lumineux cliquables (`map.js`). L'**équipe de six** (grandes cartes avec nom et puissance) est à droite de la carte.

Le bouton **Index**, à côté du nom de la zone, ouvre la liste des Pokémon de cette zone avec leurs chances (les espèces pas encore rencontrées restent en ombre). Une évolution capturée prend la place de sa forme précédente dans l'équipe ; une forme plus ancienne ne remplace pas une évolution déjà équipée.

**Combat (provisoire)** : chaque tirage lance un combat contre le Pokémon rencontré (niveau de départ de l'espèce). Ton premier Pokémon d'équipe attaque avec ses 4 dernières attaques apprises par niveau (jeux Rouge/Bleu, sinon Jaune) ; les attaques de statut ne sont pas encore utilisables. Dégâts selon la formule officielle (STAB, efficacité des types), l'adversaire riposte avec l'attaque la plus efficace (efficacité des types, STAB, précision ; il privilégie un K.O.), un K.O. fait entrer le Pokémon suivant. Victoire : chaque participant gagne `round(niveau adverse / 2)` XP, stockée dans `xp` de la sauvegarde (en plus des doublons). Pendant un combat, ton Pokémon (de dos) est à gauche et l'adversaire à droite ; PV et barre d'XP du combattant sont affichés, les attaques sont dans la boîte du bas (touches 1 à 4, Espace pour fuir) et la victoire a son propre écran (XP, niveaux, nouvelles attaques). Le bouton « Équipe » change de Pokémon en combat (ça coûte le tour : l'adversaire attaque le nouveau venu ; des pastilles indiquent avantage / menace). Les cartes d'équipe se réorganisent en les faisant glisser (le premier combat avec le Pokémon en tête). Cliquer une carte d'équipe ouvre le profil (niveau, XP, attaques, stats). Relancer = fuir.

**Niveaux (provisoires)** : une espèce de base commence au niveau 5 ; une forme évoluée tirée directement commence au niveau où sa forme précédente évolue dans les jeux (Reptincel 16, Dracaufeu 36…). Chaque doublon tiré donne 1 point d'expérience (passer du niveau N à N+1 coûte N points). Un Pokémon est plafonné un niveau avant l'évolution suivante (Salamèche 15, Reptincel 35) : pour aller plus loin, il faut tirer l'évolution, ce qui garde sa rareté. La puissance va de 100 % de la valeur de base au niveau de départ à 200 % au plafond du stade. Le niveau se déduit du nombre d'exemplaires : la sauvegarde `pokeluck-save-v1` gagne un champ `xp` (XP de combat par espèce).

La barre de vie est provisoire : `maxHp(power)` dans `world.js` (10 × puissance), à décider avec le créateur ; il n'y a pas encore de mécanique de combat. La page se recharge automatiquement quand une nouvelle version est publiée (`update.js`, `version.json` écrit par le build).

## Historique : interface 0.3

Direction retenue par le créateur : Aventure rétro. La scène occupe 100 % de la fenêtre (100dvh), sans défilement du terrain, avec un HUD en superposition et un bouton de plein écran optionnel. Menus et collection restent défilables. Les routes 1, 2, 3 et 4, la Forêt de Jade, le Mont Sélénite et la Centrale sont sélectionnables. La Centrale se trouve dans la carte, hors du parcours initial. Les paysages changent selon la zone ; les Pokémon du décor sont décoratifs, sans promesse de rencontre dans le lot actuel. La réduction des animations masque les sprites animés.

## Limites actuelles

Seulement les 151 premières espèces et Kanto sont jouables. Les autres régions sont annoncées dans le sélecteur. Le bonus de zone applique un poids ×3 aux espèces ayant au moins un type favorisé, puis normalise toutes les probabilités. La rareté extrême (légendaires à 1/500 millions), les améliorations et les renaissances ne sont pas encore implémentées. Il n'y a ni compte joueur ni synchronisation serveur des collections.

PokéAPI : https://pokeapi.co/docs/v2

Les sprites sont chargés à distance depuis le dépôt PokeAPI/sprites ; les données API sont mises en cache localement. Pokémon appartient à ses ayants droit respectifs.
