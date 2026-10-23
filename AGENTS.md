# Consignes de continuité

- Lire README.md et REPRISE-IA.md avant modification. Le dépôt GitHub est la source commune du projet.
- Modifier les fichiers dans dist/. Ne pas modifier public/, généré au déploiement.
- Préserver la sauvegarde pokeluck-save-v1 et valider/migrer les champs si sa structure change.
- Interface française, thème sombre. Ne pas ajouter le mode clair avant une demande du créateur.
- Préserver la mise en page en quatre cadres choisie par le créateur : cadre 1 scène avec Pokéball centrale et arrière-plan par zone (grand, au centre) ; cadre 2 bannière avec nom, puissance et six Pokémon d'équipe (en haut) ; cadre 3 « Menu », un simple cadre (à gauche) ; cadre 4 carte illustrée avec ronds lumineux cliquables (en bas à gauche), avec l'équipe de six en grandes cartes à sa droite. Petits Pokémon qui se promènent en fond de scène, pas de Pokémon animés (GIF) derrière. Les menus restent défilables.
- Les probabilités de base et puissances actuelles sont provisoires. Ne pas annoncer que la difficulté extrême ou les 1 025 espèces sont implémentées.
- Un bonus de type ne doit s'appliquer qu'une fois même si les deux types du Pokémon sont favorisés. Toutes les probabilités doivent rester normalisées.
- Exécuter npm test et npm run build après un changement du tirage ou du déploiement ; vérifier les interactions touchées dans le navigateur quand disponible.
- Avant de travailler, récupérer les changements distants sans écraser de modifications locales. Publier sur Pages exige un push dans main ou la fusion d'une branche dans main. Ne pas forcer un push.
- Ne pas inclure de secrets, sauvegardes de joueur ou identifiants d'accès dans le dépôt.
- Équipe : une seule forme par lignée d'évolution ; une évolution capturée remplace sa forme précédente (`teamAfterCapture` dans world.js, testé dans scripts/check.mjs). Les 151 espèces de Kanto sont présentes ; poids et puissances des espèces 32 à 151 sont provisoires.
