// Wiki du jeu : toutes les règles, formules et pourcentages, rangés par catégories. Les valeurs viennent des modules du jeu pour rester exactes.
import {zones, TIER_NAMES} from './world.js';
import {ARENAS, ELITE, LEVEL_CAPS} from './arena.js';
import {POWER_THRESHOLDS} from './power.js';
import {SHINY_DENOMINATOR} from './shiny.js';
import {XP_RARITY} from './battle.js';
import {PAYOUT_PER_LEVEL, FIRST_CATCH, SHINY_REWARD} from './money.js';
import {XP_MULTIPLIER, MONEY_MULTIPLIER, CHARM_DENOMINATOR, KILLS_TO_UNLOCK, ITEMS, SHOPS} from './shop.js';
import {DEX_MILESTONES, SHINY_MILESTONES} from './dex.js';
import {LUCK_MULT, DAILY_SHINY_MULT} from './events.js';
import {WEATHER, ZONE_WEATHER} from './weather.js';
import {TRAINER_CLASSES, TRAINER_CHANCE, TRAINER_MONEY, TRAINER_XP} from './trainers.js';
import {EGG_NEED, MUTATION, SHINY_BASE, SHINY_PER_PARENT} from './pension.js';
import {NICK_MAX} from './nick.js';
import {escHtml as esc} from './nick.js';

const fr = n => n.toLocaleString('fr-FR');
const money = n => fr(n) + ' ₽';
const pct = n => (n * 100).toLocaleString('fr-FR', {maximumFractionDigits: 1}) + ' %';
const RANKS = ['Bronze', 'Argent', 'Or', 'Platine', 'Diamant', 'Maître'];
const li = a => '<ul>' + a.map(x => `<li>${x}</li>`).join('') + '</ul>';
const table = (head, rows) => `<div class="wk-tablewrap"><table class="wk-table"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const tip = t => `<p class="wk-tip"><b>Astuce :</b> ${t}</p>`;
const compactN = n => n >= 1e6 ? (n / 1e6).toLocaleString('fr-FR', {maximumFractionDigits: 1}) + ' M' : n >= 1e3 ? (n / 1e3).toLocaleString('fr-FR', {maximumFractionDigits: 1}) + ' k' : String(n);

export const WIKI = [
  {id: 'start', icon: '', title: 'Bien démarrer', cards: [
    {t: 'Le principe', h: () => `<p>Pokéluck est un jeu de chance : tu touches la <b>Pokéball du milieu</b> (ou tu appuies sur <b>Espace</b>) et un Pokémon sauvage de la zone apparaît. Tu peux le combattre pour gagner de l’XP et des ₽, ou le fuir (Espace) pour relancer.</p>${li(['Chaque Pokémon <b>obtenu pour la première fois</b> rejoint ta collection (et ton équipe s’il y a de la place).', 'Un <b>doublon</b> donne +1 XP à l’espèce : plus tu la croises, plus elle monte de niveau.', 'Ton équipe compte <b>6 Pokémon</b>, une seule forme par lignée d’évolution.', 'Tout est sauvegardé automatiquement dans ton navigateur.'])}`},
    {t: 'Ta progression en 6 étapes', h: () => li(['Tire des Pokémon dans la <b>Route 1</b>, bats-les pour gagner de l’XP.', 'Monte tes Pokémon : le <b>niveau de tête</b> (ton premier Pokémon) ouvre les zones suivantes.', 'Bats les <b>8 champions d’arène</b> : chaque badge débloque deux nouvelles zones et relève le plafond de niveau.', 'Achète des objets dans les <b>boutiques</b> (Super Ball, Multi-XP, Mode Auto…).', 'Complète le <b>Pokédex</b> et les <b>quêtes</b> pour gagner de la chance et des ₽.', 'Après 8 badges et un légendaire, affronte le <b>Conseil des 4</b> et le Champion Blue.'])},
    {t: 'Le menu', h: () => table(['Bouton', 'À quoi il sert'], [['Pokédex', 'Les 151 espèces, évolutions, zones, paliers de chance (onglets Normal et Chromatique).'], ['Quêtes', 'Objectifs quotidiens et hebdomadaires qui rapportent des ₽.'], ['Mes Pokémon', 'Ta collection : équipe, tri, profils.'], ['Paramètres', 'Nom, thème, animations, sauvegarde.'], ['Succès', 'Les objectifs à long terme.'], ['Pension', 'Œufs et IV hérités.'], ['Wiki', 'Cette page, sous le bouton Menu.']])},
    {t: 'Raccourcis', h: () => li(['<b>Espace</b> : tirer / fuir et relancer / continuer après une victoire.', '<b>1 à 4</b> : choisir l’attaque en combat.', 'Bouton <b>AUTO</b> (Mode Auto, boutique) : les rencontres s’enchaînent seules.'])}
  ]},
  {id: 'zones', icon: '', title: 'Zones & rencontres', cards: [
    {t: 'Comment une zone est choisie', h: () => `<p>La carte de Kanto est un parcours en serpentin : <b>2 zones, puis 1 arène</b>, et ainsi de suite. Pour entrer dans une zone il faut :</p>${li(['avoir le <b>badge</b> de l’arène qui la précède ;', 'un Pokémon de tête de <b>niveau suffisant</b> (niveau d’entrée de la zone).'])}${tip('Les zones verrouillées affichent ce qui manque dans leur infobulle sur la carte.')}`},
    {t: 'Niveau des Pokémon sauvages', h: () => `<p>Il dépend de la <b>zone</b>, pas de ton équipe : de son niveau d’entrée à <b>+2</b>, sans jamais dépasser le niveau d’entrée de la zone suivante − 1. Exemple : Route 2 → niveaux 8 à 10, Route 3 → 22 à 24.</p>`},
    {t: 'Raretés', h: () => `<p>Les Pokémon sont classés en 5 raretés : ${TIER_NAMES.slice(1).map(esc).join(' · ')}. Chaque zone a sa répartition, qui s’enrichit en rares au fil du parcours. Dans chaque zone, deux <b>types favoris</b> ont un poids <b>×3</b>.</p>`},
    {t: 'Tableau des zones', h: () => table(['Zone', 'Niv. d’entrée', 'Communs', 'Peu comm.', 'Rares', 'Épiques', 'Légend.'], zones.map(z => [esc(z.name), z.min, ...[0, 1, 2, 3, 4].map(i => z.shares[i] ? pct(z.shares[i]) : '—')]))},
    {t: 'Chance de raretés', h: () => `<p>La chance augmente la part des Pokémon rares (et déplace les communs vers les raretés supérieures). Elle vient de :</p>${li([`ta <b>Pokéball équipée</b> : Super Ball +${pct(ITEMS.super.bonus)}, Hyper Ball +${pct(ITEMS.hyper.bonus)} ;`, `les <b>paliers du Pokédex</b> : ${DEX_MILESTONES.map(m => `${m.n} espèces → +${pct(m.luck)}`).join(', ')} (le dernier atteint, pas cumulé) ;`, `l’événement <b>Chance doublée</b> d’une zone (×${LUCK_MULT} sur les raretés, 1 h).`])}`}
  ]},
  {id: 'levels', icon: '', title: 'Niveaux & XP', cards: [
    {t: 'Monter de niveau', h: () => `<p>Passer du niveau <b>N</b> au niveau <b>N+1</b> coûte <b>N points d’XP</b>. Un Pokémon commence au niveau 5 (ou à son niveau d’évolution) et s’arrête au niveau <b>100</b>.</p>${li(['Un <b>doublon</b> tiré donne +1 XP.', 'Un <b>combat gagné</b> donne de l’XP au Pokémon qui l’a mené.'])}`},
    {t: 'XP d’un combat', h: () => `<p>XP = niveau du vaincu ÷ 8 × (niveau vaincu ÷ ton niveau)² × bonus de rareté. Le rapport de niveaux est borné entre ×0,2 et ×3 (un Pokémon bien plus fort rapporte beaucoup, un faible presque rien). Minimum 1 XP.</p>${table(['Rareté', ...TIER_NAMES.slice(1)], [['Bonus de rareté', ...XP_RARITY.map(x => '×' + String(x).replace('.', ','))]])}${li([`<b>Multi-XP</b> (boutique) : ×${String(XP_MULTIPLIER).replace('.', ',')} sur tous les combats, et les Pokémon de l’équipe qui n’ont pas combattu gagnent <b>la moitié</b> de l’XP.`, '<b>Œuf Chance</b> (objet tenu) : +50 % pour le porteur.', `<b>Dresseurs sauvages</b> : ×${String(TRAINER_XP).replace('.', ',')}.`])}`},
    {t: 'Plafond de niveau et évolutions', h: () => `<p>Tes badges limitent le niveau maximum de tes Pokémon :</p>${table(['Badges', '0', '1', '2', '3', '4', '5', '6', '7', '8'], [['Niveau max', ...LEVEL_CAPS]])}<p>Chaque stade d’évolution a aussi son niveau maximum : un Pokémon qui atteint le niveau d’évolution <b>attend d’être tiré sous sa forme évoluée</b> (ou de recevoir la bonne pierre d’évolution) pour progresser.</p>`}
  ]},
  {id: 'stats', icon: '', title: 'Stats, IV, EV, natures', cards: [
    {t: 'Les 6 statistiques', h: () => `<p><b>PV</b>, <b>Attaque</b>, <b>Défense</b>, <b>Att. Spé.</b>, <b>Déf. Spé.</b> et <b>Vitesse</b>. Elles se calculent comme dans les jeux : stats de base de l’espèce, niveau, IV, EV et nature.</p>`},
    {t: 'IV (talent naturel)', h: () => `<p>Chaque stat a un IV de <b>0 à 31</b>, tiré au hasard à la première rencontre de l’espèce. À chaque nouveau tirage du même Pokémon, <b>le meilleur IV est conservé</b> pour chaque stat : tu peux donc les améliorer en re-tirant. Jugement : 31 Exceptionnel · 30–29 Fantastique · 26–29 Très bon · 16–25 Bon · 1–15 Passable · 0 Pas top.</p>`},
    {t: 'EV (entraînement)', h: () => `<p>Les <b>EV</b> se gagnent en combat, selon l’espèce vaincue. Maximum <b>252 par stat</b> et <b>510 au total</b> (4 EV = +1 point de stat au niveau 100).</p>`},
    {t: 'Nature et talent', h: () => `<p>Chaque espèce reçoit une <b>nature</b> : 20 sur 25 augmentent une stat de <b>+10 %</b> et en baissent une autre de <b>−10 %</b> (les 5 autres sont neutres). Elle reçoit aussi l’un de ses <b>deux talents</b> possibles. Tout se voit dans le profil du Pokémon.</p>`},
    {t: 'Attaques', h: () => `<p>Un Pokémon connaît jusqu’à <b>4 attaques</b> apprises par niveau. Les <b>CT</b> (boutiques ou récompenses d’arène) apprennent une attaque supplémentaire, en remplaçant l’une des tiennes.</p>`}
  ]},
  {id: 'power', icon: '', title: 'Puissance & rangs', cards: [
    {t: 'La puissance d’un Pokémon', h: () => `<p>Puissance = puissance de base de l’espèce × (niveau ÷ 5)<sup>2,15</sup>. Elle augmente donc très vite avec le niveau : <b>monter un Pokémon rapporte beaucoup plus que d’en accumuler</b>. Une équipe de 6 légendaires niveau 100 plafonne autour de 50 M.</p>`},
    {t: 'Rangs de puissance d’équipe', h: () => `<p>La puissance de ton équipe (somme des 6) donne ton rang, affiché en haut de l’écran :</p>${table(['Rang', 'À partir de'], RANKS.map((r, i) => [r, i ? compactN(POWER_THRESHOLDS[i]) : '0']))}`}
  ]},
  {id: 'fight', icon: '', title: 'Combat', cards: [
    {t: 'Déroulement', h: () => li(['Tour par tour : tu choisis une attaque (ou changer de Pokémon, ou un objet), l’adversaire riposte.', 'Le plus <b>rapide</b> (Vitesse) attaque en premier, sauf attaques prioritaires.', 'Dégâts : formule officielle, avec <b>STAB ×1,5</b> (attaque du même type), <b>efficacité des types</b> (×2, ×½, immunité), aléa 85–100 % et coups critiques (×1,5).', 'Statuts : poison, brûlure, paralysie, sommeil, gel, confusion. Les objets de soin les guérissent.', 'Les combats sauvages se fuient (Espace) ; <b>arènes, Conseil des 4, dresseurs et rival : pas de fuite</b>.'])},
    {t: 'Mode Auto', h: () => `<p>Débloqué en boutique (${money(ITEMS.auto.price)}). Le bouton AUTO enchaîne les rencontres et les combats pour toi. Il ne change pas de Pokémon à ta place.</p>`},
    {t: 'Récompenses d’un combat sauvage', h: () => `<p>Argent = niveau du vaincu × barème de sa rareté :</p>${table(['Rareté', ...TIER_NAMES.slice(1)], [['₽ par niveau', ...PAYOUT_PER_LEVEL.slice(1)]])}<p><b>Pièce Rune</b> (boutique) : ×${MONEY_MULTIPLIER} sur tous les gains de combat.</p><p>Tous les gains d’argent de combat sont ensuite réduits de 20 %.</p>`}
  ]},
  {id: 'shiny', icon: '', title: 'Chromatiques', cards: [
    {t: 'La chance de base', h: () => `<p>Chaque rencontre a <b>1 chance sur ${fr(SHINY_DENOMINATOR)}</b> (${(100 / SHINY_DENOMINATOR).toLocaleString('fr-FR', {maximumFractionDigits: 4})} %) d’être chromatique. Attraper un chromatique rapporte <b>${money(SHINY_REWARD)}</b>.</p>`},
    {t: 'Tout ce qui augmente la chance', h: () => table(['Source', 'Effet', 'Résultat'], [
      ['Charme Chroma (boutique)', `×${SHINY_DENOMINATOR / CHARM_DENOMINATOR}`, `1 sur ${fr(CHARM_DENOMINATOR)}`],
      ['Brillant du jour', `×${DAILY_SHINY_MULT} sur 1 espèce`, `1 sur ${fr(Math.round(SHINY_DENOMINATOR / DAILY_SHINY_MULT))} pour elle`],
      ...SHINY_MILESTONES.map(m => [`Pokédex chromatique : ${m.n} formes`, '+' + pct(m.mult), 'sur toutes les rencontres (palier le plus haut, pas cumulé)']),
      ['Œuf de Pension', `×${SHINY_BASE}`, `1 sur ${fr(SHINY_DENOMINATOR / SHINY_BASE)}`],
      ['… + un parent chromatique', `×${SHINY_PER_PARENT} par parent`, `jusqu’à 1 sur ${fr(SHINY_DENOMINATOR / SHINY_BASE / SHINY_PER_PARENT ** 2)}`]
    ])},
    {t: 'Pokédex chromatique', h: () => `<p>L’onglet <b>✦ Chromatique</b> du Pokédex compte les 151 formes brillantes. Paliers : ${SHINY_MILESTONES.map(m => `<b>${m.n}</b> → ${pct(m.mult)} de chance en plus${m.money ? ` + ${money(m.money)}` : ''}`).join(' · ')}. Pense à cliquer sur <b>Récupérer</b>.</p>`},
    {t: 'Apparence', h: () => `<p>Dans le profil d’un Pokémon, bascule entre <b>Normal</b> et <b>✦ Chromatique</b> : c’est l’apparence de ton équipe. Niveau, IV et EV sont partagés par espèce.</p>`}
  ]},
  {id: 'arenas', icon: '', title: 'Arènes, Ligue & rival', cards: [
    {t: 'Les 8 arènes', h: () => table(['N°', 'Champion', 'Ville', 'Type', 'Niveau des Pokémon', 'Niveau requis', 'Prime'], ARENAS.map(a => [a.n, esc(a.leader), esc(a.city), esc(a.type), a.team[0][1], a.need, money(5000 * a.n)])) + `<p>Les arènes se combattent dans l’ordre. <b>Tous les Pokémon du champion sont au niveau affiché sur la carte.</b> Première victoire : badge, <b>CT</b>, relèvement du plafond de niveau et prime. Revanche : 10 % de la prime.</p>`},
    {t: 'Conseil des 4 et Champion', h: () => `<p>Condition : les <b>8 badges</b> et un <b>Pokémon légendaire</b> dans ta collection. Les 5 combats s’enchaînent : ${ELITE.map(m => esc(m.leader)).join(', ')} (Champion). Niveaux : ${ELITE.map(m => m.team[0][1]).join(', ')}.</p><p>Vaincre Blue te donne le titre <b>★ Maître de la Ligue</b>.</p>`},
    {t: 'Le rival', h: () => `<p>Après chaque arène remportée, ton <b>rival</b> apparaît en petit sur la carte, près de l’arène. Clique dessus pour l’affronter : équipe de ${ARENAS.length ? '3 à 6' : ''} Pokémon, niveau de l’as de l’arène <b>+3</b>, récompense d’environ 60 % de la prime de l’arène. Chaque rival ne se bat qu’une fois.</p>`}
  ]},
  {id: 'trainers', icon: '', title: 'Dresseurs sauvages', cards: [
    {t: 'Rencontres de dresseurs', h: () => `<p>À chaque tirage, environ <b>${pct(TRAINER_CHANCE)}</b> de chances qu’un dresseur te défie à la place d’un Pokémon sauvage (si ton équipe n’est pas vide). Il a <b>2 ou 3 Pokémon</b> tirés dans la zone, de niveau de zone +1. Pas de fuite possible.</p>${li([`<b>${String(TRAINER_MONEY).replace('.', ',')}×</b> l’argent d’un combat sauvage équivalent ;`, `<b>×${String(TRAINER_XP).replace('.', ',')}</b> d’XP.`])}`},
    {t: 'Les 7 classes', h: () => `<p>${TRAINER_CLASSES.map(c => esc(c.name)).join(' · ')}.</p>`}
  ]},
  {id: 'shop', icon: '', title: 'Boutiques & objets', cards: [
    {t: 'Encens et série de victoires', h: () => `<p><b>Encens Chance</b> (Boutique du Plateau) : à allumer depuis le sac, il augmente les raretés de <b>50 %</b> pendant 30 minutes. Un seul à la fois.</p><p><b>Série de victoires</b> : chaque victoire dans la même zone fait monter une série. Aux paliers de 15, 45, 90, 150, 225, 315, 420 et 540 victoires, les raretés gagnent <b>+5 %</b> (jusqu’à +40 %). Changer de zone remet la série à zéro.</p>`},
    {t: 'Les boutiques', h: () => `<p>Quatre boutiques sont posées sur la carte. Chacune ouvre quand tu as vaincu <b>${KILLS_TO_UNLOCK} Pokémon</b> dans la zone qui la précède : ${SHOPS.map(s => esc(s.name)).join(', ')}.</p>`},
    {t: 'Boules & bonus passifs', h: () => table(['Objet', 'Prix', 'Effet'], ['super', 'hyper', 'safari', 'xp', 'rune', 'auto', 'chroma'].map(k => [esc(ITEMS[k].name), money(ITEMS[k].price), esc(ITEMS[k].effect)]))},
    {t: 'Soins, objets tenus, CT et pierres', h: () => li([`<b>Potions et soins de statut</b> : utilisables en combat (de ${money(ITEMS.antidote.price)} à ${money(ITEMS['max-potion'].price)}).`, '<b>Objets tenus</b> : Restes, Baie Oran, Ceinture Force, Œuf Chance — un seul par Pokémon.', '<b>CT</b> : apprennent une attaque ; certaines sont des récompenses d’arène.', '<b>Pierres d’évolution</b> : Feu, Eau, Foudre, Plante, Lune.'])}
  ]},
  {id: 'dex', icon: '', title: 'Pokédex & quêtes', cards: [
    {t: 'Pokédex', h: () => `<p>Chaque espèce découverte s’ajoute au Pokédex. Clique sur une espèce pour voir son profil, ses évolutions (et comment les obtenir) et les zones où la trouver.</p>${table(['Espèces', 'Bonus de chance', 'Argent'], DEX_MILESTONES.map(m => [m.n, '+' + pct(m.luck), m.money ? money(m.money) : '—']))}<p>Le bonus est celui du dernier palier récupéré (pas cumulé). À 151 : titre <b>Maître Pokédex</b>.</p>`},
    {t: 'Quêtes', h: () => `<p>Chaque jour, des <b>quêtes quotidiennes</b> (≈ 15 minutes de jeu chacune) ; chaque semaine, des <b>quêtes hebdomadaires</b> (≈ 4 heures) dont « découvrir 20 espèces ». Elles rapportent des ₽. Enchaîner les jours donne un bonus de série (jusqu’à +50 %).</p>`},
    {t: 'Succès', h: () => `<p>Une cinquantaine d’objectifs à long terme (tirages, victoires, découvertes, badges, chromatiques…) qui apparaissent dans l’onglet Succès.</p>`}
  ]},
  {id: 'manage', icon: '', title: 'Équipes, surnoms, Pension', cards: [
    {t: 'Équipes sauvegardées', h: () => `<p>Trois emplacements numérotés sous « Mon équipe » mémorisent une composition d’équipe : clique pour la recharger en un instant (impossible pendant un combat).</p>`},
    {t: 'Surnoms et favoris', h: () => `<p>Dans le <b>profil</b> d’un Pokémon : donne-lui un surnom (${NICK_MAX} caractères max) et marque-le ★ <b>favori</b>. Les favoris passent en premier dans ta collection ; le surnom s’affiche dans l’équipe, en combat et dans les listes.</p>`},
    {t: 'Pension Pokémon', h: () => `<p>Dépose <b>2 Pokémon</b> : un œuf apparaît. Il éclot après un nombre de victoires (tous combats) qui dépend de la rareté des parents : <b>30</b> par parent Commun, <b>40</b> Peu commun, <b>60</b> Rare, <b>90</b> Épique, <b>150</b> Légendaire, additionnés (de ${EGG_NEED} à 300). Le bébé est la forme de base d’un des parents (tirée au hasard).</p>${li([`<b>IV hérités</b> : chaque IV vient d’un parent au hasard, avec ${pct(MUTATION)} de chance d’être retiré.`, `<b>Chromatique</b> : ×${SHINY_BASE}, et ×${SHINY_PER_PARENT} de plus par parent possédant une forme chromatique.`, 'Si les deux parents restent, un nouvel œuf démarre tout de suite.', 'Retirer un parent perd l’œuf en cours.'])}`}
  ]},
  {id: 'world', icon: '', title: 'Météo & événements', cards: [
    {t: 'Météo des zones', h: () => `<p>Chaque zone a sa météo fixe, qui influence les combats sauvages et de dresseurs (pas les arènes ni la Ligue).</p>${table(['Météo', 'Effet'], ['sun', 'rain', 'hail', 'clear'].map(k => [WEATHER[k].icon + ' ' + esc(WEATHER[k].name), esc(WEATHER[k].hint)]))}<p>Exemples : Route 1 et Route 2 → ${esc(WEATHER[ZONE_WEATHER.route].name)} · Forêt de Jade → ${esc(WEATHER[ZONE_WEATHER.forest].name)} · Mont Sélénite → ${esc(WEATHER[ZONE_WEATHER.cave].name)}.</p>`},
    {t: 'Événements', h: () => li([`<b>Chance doublée</b> : chaque heure, une zone tirée au sort double (×${LUCK_MULT}) la chance de raretés pendant 1 h.`, `<b>Brillant du jour</b> : chaque jour, une espèce d’une zone a une chance chromatique ×${DAILY_SHINY_MULT}.`, 'Les deux événements sont affichés en haut de la zone avec leur compte à rebours, et sont les mêmes pour tout le monde.'])}
  ]}
];
export const wikiText = c => c.h().replace(/<[^>]+>/g, ' ').toLowerCase();
export const wikiSearch = q => { const s = q.trim().toLowerCase(); if (!s) return []; return WIKI.flatMap(sec => sec.cards.filter(c => (c.t + ' ' + wikiText(c)).toLowerCase().includes(s)).map(c => ({sec, c}))); };

let cat = WIKI[0].id, query = '';
export function mountWiki(container) {
  container.innerHTML = `<div class="wk"><div class="wk-bar"><input type="search" class="wk-search" placeholder="Rechercher : chromatique, XP, boutique…" aria-label="Rechercher dans le wiki" value="${esc(query)}"></div><div class="wk-body"><nav class="wk-nav" aria-label="Catégories">${WIKI.map(s => `<button type="button" data-wk="${s.id}">${esc(s.title)}</button>`).join('')}</nav><div class="wk-main" tabindex="0"></div></div></div>`;
  const main = container.querySelector('.wk-main'), navs = container.querySelectorAll('[data-wk]');
  const card = c => `<article class="wk-card"><h4>${esc(c.t)}</h4>${c.h()}</article>`;
  function draw() {
    navs.forEach(b => b.setAttribute('aria-current', String(!query && b.dataset.wk === cat)));
    if (query.trim()) { const r = wikiSearch(query); main.innerHTML = r.length ? `<h3 class="wk-title">${r.length} résultat${r.length > 1 ? 's' : ''}</h3>` + r.map(x => `<small class="wk-from">${esc(x.sec.title)}</small>${card(x.c)}`).join('') : '<p class="wk-empty">Aucun résultat. Essaie un autre mot.</p>'; }
    else { const s = WIKI.find(x => x.id === cat); main.innerHTML = `<h3 class="wk-title">${esc(s.title)}</h3>` + s.cards.map(card).join(''); }
    main.scrollTop = 0;
  }
  container.querySelector('.wk-search').oninput = e => { query = e.target.value; draw(); };
  container.querySelector('.wk-nav').onclick = e => { const b = e.target.closest('[data-wk]'); if (!b) return; cat = b.dataset.wk; query = ''; container.querySelector('.wk-search').value = ''; draw(); };
  draw();
}
