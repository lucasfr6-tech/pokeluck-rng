# Consignes de continuité

- Lire README.md et REPRISE-IA.md avant modification. Le dépôt GitHub est la source commune du projet.
- Modifier les fichiers dans dist/. Ne pas modifier public/, généré au déploiement.
- Préserver la sauvegarde pokeluck-save-v1 et valider/migrer les champs si sa structure change.
- Interface française, thème sombre. Ne pas ajouter le mode clair avant une demande du créateur.
- Préserver la direction Aventure rétro choisie par le créateur : décor pixel art occupant toute la fenêtre, sans marges ni scroll du terrain ; bannière du dresseur en haut à gauche ; Menu sur la gauche ; Pokéball centrale ; parcours des zones en bas. Les menus restent défilables.
- Les probabilités de base et puissances actuelles sont provisoires. Ne pas annoncer que la difficulté extrême ou les 1 025 espèces sont implémentées.
- Un bonus de type ne doit s'appliquer qu'une fois même si les deux types du Pokémon sont favorisés. Toutes les probabilités doivent rester normalisées.
- Exécuter npm test et npm run build après un changement du tirage ou du déploiement ; vérifier les interactions touchées dans le navigateur quand disponible.
- Avant de travailler, récupérer les changements distants sans écraser de modifications locales. Publier sur Pages exige un push dans main ou la fusion d'une branche dans main. Ne pas forcer un push.
- Ne pas inclure de secrets, sauvegardes de joueur ou identifiants d'accès dans le dépôt.
