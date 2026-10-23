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
- `pokemon.js` : les 31 espèces du prototype et les probabilités de base.
- `world.js` : zones, parcours de Kanto, types, poids de rencontre et puissances provisoires.
- `scenery.js` : paysages pixel art, dessinés dans un canvas plein navigateur.
- `map.js` : zones cliquables de la carte illustrée (positions en pourcentage), marqueur de destination et noms au survol.
- `map-layout.css` : disposition de la bannière, du bloc de navigation et de la carte.
- `assets/` : illustrations fournies par le créateur.

`npm test` vérifie les tirages pondérés des zones. `npm run build` génère `public/`, avec une version des fichiers CSS/JS pour éviter qu'une nouvelle publication conserve les anciens scripts en cache. Ne pas modifier `public/` directement.

Chaque push dans `main` lance `.github/workflows/pages.yml`, exécute les vérifications et publie `dist/` sur GitHub Pages via l'étape de préparation. Le statut est visible dans **Actions**. La mise en ligne peut prendre quelques minutes. Aucun service worker ne maintient une copie hors ligne.

Une autre IA doit travailler depuis ce même dépôt, récupérer la dernière version, modifier les sources puis pousser ses changements. Des modifications restées sur son ordinateur ne mettent pas le site à jour. Les changements dans une branche ne sont publiés qu'après leur intégration dans `main`.

## Progression du joueur

La sauvegarde est locale au navigateur et à l'adresse du jeu. Pour la déplacer entre le premier site, GitHub Pages ou un autre navigateur : Menu → Paramètres → Exporter / Importer ma sauvegarde. La première version du site n'avait pas l'export : utiliser sa mise à jour 0.2 pour récupérer sa progression.

Le total de puissance correspond aux six espèces équipées au maximum. Les valeurs sont provisoires ; les doublons ne gonflent pas ce total. Une ancienne sauvegarde du prototype est reprise automatiquement.

## Interface 0.4

La bannière regroupe le profil, la puissance de l’équipe et les vignettes des espèces possédées. La carte illustrée fournie par le créateur occupe le coin inférieur gauche. Grotte → Mont Sélénite ; forêt en bas à droite → Forêt de Jade ; les sentiers accèdent aux routes. Les noms apparaissent au survol ou au focus clavier ; aucun bouton de route permanent ne recouvre l’image. Un repère indique le lieu actuel, avec de légères animations de l’eau et des points lumineux. La carte est une représentation artistique de voyage, pas une carte géographique officielle de Kanto. Le bloc Menu / Pokédex / Carte est à gauche ; les raccourcis Probabilités et Carte de l’ancienne barre du bas ont été retirés. Les probabilités restent consultables dans Menu. Les animations de carte respectent la réduction des mouvements.

## Historique : interface 0.3

Direction retenue par le créateur : Aventure rétro. La scène occupe 100 % de la fenêtre (100dvh), sans défilement du terrain, avec un HUD en superposition et un bouton de plein écran optionnel. Menus et collection restent défilables. Les routes 1, 2, 3 et 4, la Forêt de Jade, le Mont Sélénite et la Centrale sont sélectionnables. La Centrale se trouve dans la carte, hors du parcours initial. Les paysages changent selon la zone ; les Pokémon du décor sont décoratifs, sans promesse de rencontre dans le lot actuel. La réduction des animations masque les sprites animés.

## Limites actuelles

Seulement les 31 premières espèces et Kanto sont jouables. Les autres régions sont annoncées dans le sélecteur. Le bonus de zone applique un poids ×3 aux espèces ayant au moins un type favorisé, puis normalise toutes les probabilités. La rareté extrême (légendaires à 1/500 millions), les améliorations et les renaissances ne sont pas encore implémentées. Il n'y a ni compte joueur ni synchronisation serveur des collections.

PokéAPI : https://pokeapi.co/docs/v2

Les sprites sont chargés à distance depuis le dépôt PokeAPI/sprites ; les données API sont mises en cache localement. Pokémon appartient à ses ayants droit respectifs.
