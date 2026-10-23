# Consignes de continuité

- Lire README.md et REPRISE-IA.md avant modification. Le dépôt GitHub est la source commune du projet.
- Modifier les fichiers dans dist/. Ne pas modifier public/, généré au déploiement.
- Préserver la sauvegarde pokeluck-save-v1 et valider/migrer les champs si sa structure change.
- Interface française. Le créateur a demandé les modes Nuit et Jour ; conserver les deux, avec préférences locales automatiques.
- Préserver la mise en page « Océan & or » choisie par le créateur (maquette 1) : bannière large en haut (grand avatar, nom, puissance horizontale rectangulaire avec progression vers le prochain palier, zone + Index décalés à droite, six grands emplacements d’équipe colorés par type) ; rail de menu à gauche (Menu doré, Pokémon, Carte, Chances, Historique, Réglages) ; grande scène au centre (Pokéball, arrière-plan par zone, petits Pokémon qui se promènent ; en combat : son Pokémon à gauche, l'adversaire à droite, boîte d'attaques en bas) ; carte illustrée avec ronds lumineux et six grandes cartes d'équipe colorées par type en bas. Écran de victoire/XP séparé du journal. Pas de Pokémon animés (GIF). Les menus restent défilables.
- Les probabilités de base et puissances actuelles sont provisoires. Ne pas annoncer que la difficulté extrême ou les 1 025 espèces sont implémentées.
- Un bonus de type ne doit s'appliquer qu'une fois même si les deux types du Pokémon sont favorisés. Toutes les probabilités doivent rester normalisées.
- Exécuter npm test et npm run build après un changement du tirage ou du déploiement ; vérifier les interactions touchées dans le navigateur quand disponible.
- Avant de travailler, récupérer les changements distants sans écraser de modifications locales. Publier sur Pages exige un push dans main ou la fusion d'une branche dans main. Ne pas forcer un push.
- Ne pas inclure de secrets, sauvegardes de joueur ou identifiants d'accès dans le dépôt.
- Équipe : une seule forme par lignée d'évolution ; une évolution capturée remplace sa forme précédente (`teamAfterCapture` dans world.js, testé dans scripts/check.mjs). Les 151 espèces de Kanto sont présentes ; poids et puissances des espèces 32 à 151 sont provisoires.
- Niveaux : l'évolution reste un tirage (option A choisie par le créateur) ; le niveau est plafonné par stade et se déduit des doublons (levels.js, testé). Ne pas permettre l'évolution par simple montée de niveau sans en parler au créateur : cela casserait la rareté des formes évoluées.

- Paramètres : rubriques Affichage, Performances, Audio, Compte et sauvegarde, Aide. Aucun import/export JSON. Connexions Google et Discord explicitement reportées par le créateur : ne pas annoncer de connexion ou de synchronisation active sans service configuré.
- Préférences séparées de la progression dans pokeluck-preferences-v1. Préserver les seuils de puissance existants : bronze <100 k, argent <100 M, or <1 Md, diamant ensuite. Les effets des attaques ne doivent jamais modifier les dégâts.
- Menus collection/index : conserver les choix « Équipe de champions » et « Carnet de raretés », implémentés dans catalog.js/css. Le palier 3 reste Rares ; seul Très rares est renommé Épiques au palier 4, à la demande explicite du créateur. Ne pas changer les probabilités en renommant.
