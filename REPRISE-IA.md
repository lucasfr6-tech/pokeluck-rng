# Mise à jour 1.0 — Bannière et nouveaux paramètres

Le créateur a demandé un grand avatar, des emplacements Pokémon agrandis, la puissance en rectangle horizontal et une mini-barre vers le prochain palier, ainsi que la zone décalée à droite. Les seuils bronze/argent/or/diamant du dernier commit sont préservés. Il a aussi demandé la refonte des paramètres inspirée de sa référence, le mode Jour, des sons de Griffe et Flammèche et des effets courts, et les performances réglables. Fait : rubriques Affichage, Performances, Audio, Compte et sauvegarde, Aide ; réglages automatiquement persistés ; import/export retiré. Sons Game Boy recréés par synthèse, et effets visuels sans impact sur les règles de combat.

Le créateur a explicitement reporté Google/Discord : « non pas encore on le fera plus tard ». Les boutons sont donc désactivés et marqués À venir. La sauvegarde de progression reste locale et automatique. Ne pas présenter les comptes en ligne comme fonctionnels. Aucun Supabase/Firebase n’a été créé ou configuré.

---

# Mise à jour 0.7 — Niveaux (option A)

Le créateur veut des niveaux (départ niveau 5, attaques du niveau 5 des vrais jeux) mais craint que l'évolution par niveau casse la rareté de Dracaufeu. Option A choisie : l'évolution reste un tirage, le niveau est plafonné par stade (levels.js). Fait : niveau de départ 5 (ou niveau d'évolution pour une forme évoluée tirée), plafond = niveau d'évolution suivant − 1, 1 doublon = 1 point d'expérience (coût N pour passer de N à N+1, valeurs provisoires), puissance de 100 % à 200 % de la base selon le niveau dans le stade, affichage dans l'équipe, la collection, l'historique et l'étiquette de tirage. Sauvegarde inchangée : le niveau se déduit du nombre d'exemplaires.

À faire ensuite avec le créateur : attaques par niveau (idée : PokéAPI, version Rouge/Bleu, mises en cache), règles de combat, niveau et vie du Pokémon sauvage, gain d'expérience par combat. Idée non décidée : les doublons d'une forme précédente pourraient nourrir la forme évoluée.

---

# Mise à jour 0.6 — 151 Pokémon, évolutions, Index

Demandes du créateur réalisées : les 151 premiers Pokémon sont dans le jeu (noms français, types de première génération, poids de rareté et puissances PROVISOIRES pour les espèces 32 à 151 : puissance ≈ 12 × (total des stats / 300)^5 ; les 31 premières espèces gardent leurs valeurs) ; une évolution capturée prend la place de sa forme précédente dans l'équipe (équipement manuel : remplacement sur place dans la même lignée ; anciennes sauvegardes dédoublonnées au chargement) ; bouton **Index** à côté du nom de la zone, qui liste les Pokémon de la zone avec leurs chances. Nidoran♀ (50 %) et Salamèche (1/6) conservent leurs chances fixes du prototype. Toutes les espèces peuvent apparaître dans toutes les zones (bonus de type ×3) : des listes d'espèces propres à chaque route restent à décider avec le créateur.

---

# Mise à jour 0.5 — Quatre cadres, fonds par zone, vie en fond, équipe

Le créateur a demandé de refaire l'ergonomie (croquis : 1 scène, 2 bannière, 3 menu, 4 carte). Fait : fonds du pack dungeons associés aux zones (Route 1 beauplains, Route 2 wildplains, Route 3 skyblueplains, Route 4 ravagedfield, Forêt de Jade overgrownforest, Mont Sélénite echocave, Centrale powerplant) ; ronds lumineux cliquables sur la carte (la Centrale a un rond près du pont, position choisie par l'assistant) ; bannière avec les six Pokémon d'équipe ; cadre Menu seul ; équipe de six en grandes cartes à droite de la carte ; petits Pokémon qui se promènent en fond (face, dos, côtés en miroir, diagonales) à la place des GIF animés ; barre de vie sous le Pokémon rencontré ; rechargement automatique de la page après publication.

À décider avec le créateur : règles de combat et de points de vie (la barre actuelle vaut 10 × puissance, purement indicative et toujours pleine), ce que devient un Pokémon rencontré (capture, victoire), sprites de profil véritables si le créateur en fournit. Aucun changement des chances ni de la sauvegarde `pokeluck-save-v1`.

---

# Mise à jour 0.4 — Carte illustrée interactive

Nouvelle disposition demandée par le créateur : bannière en haut à gauche avec toutes les espèces possédées en petit (plus de vignettes à droite) ; bloc Menu / Pokédex / Carte juste dessous ; image fournie en carte interactive en bas à gauche. L’ancienne barre de destinations et ses deux raccourcis ont été supprimés. La grotte en haut à gauche correspond au Mont Sélénite ; la forêt en bas à droite à la Forêt de Jade ; les sentiers accèdent aux routes. Les zones cliquables sont définies dans map.js avec des coordonnées proportionnelles, des labels accessibles et des noms révélés au survol/focus. La navigation reste la même dans la carte agrandie. De légères animations CSS animent la carte, désactivées en réduction des mouvements. La puissance reste calculée sur l’équipe équipée ; la bannière montre la collection, pas seulement les six équipés. Pas de modification des chances ni des sauvegardes.

---

# Mise à jour 0.3 — Aventure rétro plein navigateur

Le créateur a choisi la première maquette Aventure rétro et demandé de remplir toute la fenêtre. Cette direction est maintenant implémentée : canvas pixel art par zone, sprites animés décoratifs, HUD superposé, Pokéball centrale, vrais sprites Pokémon et objets pour les menus, destinations en bas. Les routes 2, 3 et 4 complètent Route 1, Forêt de Jade, Mont Sélénite et Centrale ; les anciens identifiants de zone sont conservés pour les sauvegardes. Carte et historique sont accessibles dans Menu. La collection, les puissances et les probabilités restent celles du prototype. GitHub Pages reste la publication de référence.

---

# Mise à jour 0.2 — 23 octobre 2026

Ce dépôt GitHub est désormais la référence commune : https://github.com/lucasfr6-tech/pokeluck-rng

Nouvelles demandes réalisées : thème sombre, disposition selon le croquis (bannière en haut à gauche, Menu coulissant à gauche, tirage central, zones dessous), pseudo modifiable, puissance de six espèces équipées, collection et paramètres. Kanto dispose de Route 1, Forêt de Jade, Mont Sélénite et Centrale. Les bonus de type pondérés sont actifs ; les autres régions sont à venir. Les puissances sont des propositions provisoires (Rattata 3, Roucoups 46). Export/import de sauvegarde disponible pour changer de site. Ancienne sauvegarde reprise automatiquement. Les fichiers actifs sont game.js, game.css, pokemon.js et world.js dans dist/.

Les fichiers app.js et style.css du prototype ont été remplacés. Les probabilités extrêmes, légendaires, améliorations et renaissances restent à concevoir ; seulement les 31 premières espèces sont présentes. Lire README.md et AGENTS.md pour lancer, tester et publier. Chaque push main publie sur GitHub Pages. Ne pas éditer le site Sites initial séparément : les autres IA doivent utiliser ce dépôt et intégrer leurs changements à main pour mettre le lien partagé à jour.

Le texte ci-dessous est le contexte historique de la version 0.1. Sa section décrivant le code courant décrit l'ancien prototype, pas la version 0.2.

---
# Contexte de reprise — Pokémon RNG

## Intention du créateur

Créer un jeu de navigateur Pokémon RNG en français. L'univers visé comprend les 1 025 espèces du Pokédex national, sans exclusivités particulières pour le moment. Le créateur prévoit de transmettre ses sprites personnalisés ; aucun fichier de sprites personnels n'a encore été reçu.

Le premier prototype servait à valider l'accès aux Pokémon et à PokéAPI. Le créateur a ensuite demandé de repenser le jeu et son équilibrage. Ne pas confondre les chances du prototype avec l'objectif final.

## Demandes explicites confirmées

- Une Pokéball centrale cliquable fait apparaître un Pokémon aléatoire.
- Utiliser PokéAPI et, plus tard, les sprites du créateur.
- Concevoir un RNG vraiment difficile.
- Au début, une chance d'obtenir un légendaire de l'ordre de 1 sur 500 000 000.
- Améliorer progressivement cette chance via des améliorations de chance, des renaissances ou d'autres mécanismes à définir.
- Préparer d'abord les groupes de rareté et l'équilibrage avant de refondre le jeu.
- Dernière demande exécutée : fournir un fichier du jeu pour pouvoir alterner avec une autre IA.

## Propositions de l'assistant, non validées comme règles définitives

Un tirage en deux étapes : sélectionner un groupe de rareté, puis une espèce dans ce groupe. Chaque espèce appartient à un seul groupe ; des poids internes peuvent différencier les Pokémon du même groupe.

Échelle provisoire proposée après la demande de difficulté extrême :

| Groupe | Chance initiale du groupe proposée |
| --- | --- |
| Starters de base | 1 / 5 000 |
| Pokémon rares | 1 / 50 000 |
| Évolutions finales des starters | 1 / 500 000 |
| Pseudo-légendaires | 1 / 5 000 000 |
| Légendaires | 1 / 500 000 000 |
| Fabuleux | 1 / 5 000 000 000 |

Le reste de la probabilité serait partagé entre communs et intermédiaires. Aucune répartition exhaustive des espèces n'est encore faite.

L'assistant a proposé d'interpréter « 1 sur 500 millions » comme la chance du groupe légendaire entier. Le créateur n'a pas encore confirmé si cette valeur concerne le groupe ou chaque espèce. Ne pas présenter cette interprétation comme une décision du créateur.

Autres propositions non validées : convertir les doublons en ressource ; améliorations de chance et de vitesse ; renaissances réinitialisant certaines améliorations contre un multiplicateur permanent tout en conservant le Pokédex ; potions et bonus temporaires.

Exemples de multiplicateurs proposés pour le groupe légendaire : ×10 → 1/50 millions ; ×100 → 1/5 millions ; ×1 000 → 1/500 000 ; ×10 000 → 1/50 000.

Il reste à définir comment ces multiplicateurs s'appliquent aux autres groupes, leurs limites et la normalisation des probabilités. Multiplier naïvement toutes les chances peut faire dépasser 100 %. Ces exemples ne constituent pas un algorithme complet.

La cadence des tirages, l'automatisation, l'économie, les coûts, les renaissances, les plafonds et une éventuelle garantie restent ouverts. Aucun combat, compte utilisateur, classement ou système multijoueur n'a été demandé.

## Code actuellement livré

Application statique HTML/CSS/JavaScript utilisant des modules ES, sans framework ni dépendances.

Les 31 espèces implémentées sont les numéros nationaux 1 à 31. L'assistant avait interprété les noms ambigus de la liste initiale comme Roucarnage et Nidoran♀, et corrigé certaines orthographes. Cette interprétation a été annoncée, pas confirmée explicitement.

`dist/pokemon.js` :
- `pool` contient les espèces et leurs probabilités normalisées.
- Nidoran♀ est actuellement à 50 %, Salamèche à 1/6.
- Les 29 autres espèces se partagent le tiers restant selon leurs poids.
- `pick()` effectue un tirage par intervalles cumulés avec Math.random.
- `rarity()` et `odds()` produisent les libellés de ce prototype ; ces seuils devront évoluer avec la refonte.

`dist/app.js` :
- Animation d'environ 850 ms, un tirage à la fois.
- Bouton de relance et raccourci Espace.
- Collection/doublons enregistrés dans `pokeluck-save-v1` en localStorage.
- Historique limité aux cinq derniers tirages.
- Données API récupérées pour le Pokémon rencontré et mises en cache dans `pokeapi-v2-{id}`.
- L'échec de l'API ne bloque pas le tirage : l'image distante de repli et le nom local restent utilisés.
- Aucun mécanisme de chance améliorée, de renaissance, de monnaie ou de bonus.

L'API `pokemon-species/{id}/` permet de récupérer notamment les indicateurs `is_legendary`, `is_mythical` et les références de chaînes d'évolution. Elle n'est pas encore intégrée au classement. Les groupes starters, fossiles et pseudo-légendaires demanderont des règles ou listes dédiées. Les formes alternatives ne doivent pas être comptées comme de nouvelles espèces parmi les 1 025.

## Vérifications déjà effectuées

- Les 31 probabilités sont strictement positives et leur somme vaut 1 à l'arrondi numérique près.
- Les probabilités de Nidoran♀ et Salamèche correspondent aux valeurs du prototype.
- Chaque intervalle de la fonction de tirage retourne la bonne espèce.
- Vérification dans le navigateur : tirage, affichage d'un sprite et de son type, comptage des doublons, écran Pokédex et fenêtre des probabilités.
- La version initiale a été déployée avec succès sur Sites.

## Suite suggérée

Reprendre la discussion d'équilibrage avec le créateur : clarifier la chance du groupe versus celle d'une espèce, proposer des groupes exhaustifs et une formule de chance qui reste valide à forte progression. Puis seulement implémenter la refonte demandée. Conserver ou migrer explicitement les anciennes sauvegardes si la structure change.


## Version 0.8 : combat

Voir README (« Combat »). Fichiers : `dist/battle.js`, `battle-data.js`, `fight.js`, profil dans `game.js` (`openProfile`). Règles provisoires à valider avec le créateur : riposte automatique, XP = niveau adverse / 2, attaques de statut inutilisables, PV pleins à chaque combat, niveau sauvage = niveau de départ.

Mise en page 0.9 : maquette « Océan & or » (voir AGENTS.md). CSS dans dist/layout.css ; la bannière contient la zone et le bouton Index ; le menu est un rail ; les cartes d'équipe prennent la couleur du premier type (`typeColor` de fight.js).

## Rangs de puissance
Cliquer sur la puissance de la bannière ouvre les quatre rangs actuels (Bronze, Argent, Or, Diamant), leurs seuils et la puissance restante. Le rang courant est mis en évidence. Aucun nouveau palier ni changement de puissance.

## Photo de profil
`avatar.js` ajoute l’import JPG/PNG/WebP (10 Mo), le déplacement souris/tactile, le zoom et deux positions accessibles au clavier. Le carré est confirmé ou annulé avant application. Une miniature JPEG 256×256 est stockée séparément sous `pokeluck-avatar-v1`, sans envoi réseau. Bouton pour revenir à Pikachu. La progression reste inchangée.

## Collection et index : choix du créateur
`catalog.js` / `catalog.css` : « Équipe de champions » (six grandes cartes en haut, autres espèces possédées en dessous, sprites agrandis, types, rareté, niveau/plafond, puissance, XP, exemplaires). Filtres, tri, pagination. Glisser-déposer sur une case pour équiper/remplacer/échanger ; poignée compatible tactile et alternative sélection puis clic. Les Pokémon retirés restent possédés ; une seule forme par lignée. `teamAfterDrop` dans world.js est testé.
Index de zone : « Carnet de raretés », calculé à partir de zonePool, avec cinq colonnes et pagination par catégorie, recherche, type, rareté, statut de découverte et tri. Les légendaires sont accessibles dès la première page à la Centrale. Les espèces indisponibles dans une zone sont indiquées comme absentes.
Correction explicite du créateur : « Très rares » devient « Épiques » (palier 4) ; « Rares » reste le palier 3. Les probabilités ne changent pas.

## Centrage des sprites et rail simplifié
`sprite-centering.js` recentre les pixels opaques des sprites Kanto face/dos (résultat en mémoire, aucune modification de sauvegarde). La source distante reste le repli si le navigateur ne peut pas lire l’image. Les résultats sont mis en cache par URL. Le placement des combattants se recalcule selon la taille de l’arène, des plaques PV et des commandes ; les Pokémon restent entièrement au-dessus des attaques, même sur petit écran. Audit des 302 PNG face/dos : tous non vides et recentrables sans couper le dessin. Tests de géométrie dans check.mjs.
Le rail contient uniquement Menu et Réglages : Menu est un grand rectangle en haut du rail sur ordinateur (hauteur ≈ 2,4 fois sa largeur, selon le croquis corrigé du créateur) ; Réglages reste en bas. Réglages utilise le même sprite `vs-recorder.png` que Paramètres dans le menu. Le raccourci Historique a ensuite été retiré du menu à la demande du créateur.

## Menu principal : Boussole d’aventure
Choix 3 validé par le créateur : dialogue centré et deux raccourcis autour d’une Pokéball : Mes Pokémon à gauche et Paramètres à droite, logos conservés. Le créateur a explicitement retiré de la boussole Carte de Kanto, Probabilités et Dernières rencontres. CSS dans menu.css ; le routage data-view reste dans game.js. Le descriptif apparaît au survol/focus. Compatible Nuit/Jour, mobile et clavier ; fermeture Échap/croix et clic hors du dialogue conservés.

## IV/EV : migration et intégration
training.js / training-ui.js / training.css / ev-yields.js. Chaque espèce possédée a training[id] = {ivs:{hp,atk,def,spa,spd,spe}, evs:{...}}. IV 0–31 tirés une fois ; EV 0–252 par stat / 510 total, validés à la lecture. Les sauvegardes existantes sont enrichies puis enregistrées sans perte de comptes/niveaux/équipe. Doublons = IV/EV conservés. Capture d’une autre forme = un nouveau représentant, règles RNG inchangées.
Les IV/EV influencent computeStats, les combattants de face/dos, les stats du profil et les cartes d’équipe. Nature neutre, puissance liée aux niveaux inchangée. EV réels de l’espèce vaincue pour les participants survivants à la victoire ; gain affiché, pas d’EV sur fuite/défaite. Données des 151 espèces embarquées d’après le CSV primaire PokéAPI, donc les récompenses ne dépendent pas du réseau.
Graphique IV/EV central du profil, commandes à droite de l’évolution, détail numérique et limites. Tests : limites et migration stable, rendements 151 espèces, formules aux niveaux 50/100, radar ; navigateur : IV inchangés après rechargement, victoire contre Férosinge = +1 Attaque pour Têtarte, EV conservé après rechargement, mobile sans débordement.
