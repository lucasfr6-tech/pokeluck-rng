// Dresseurs sauvages (rencontres aléatoires dans une zone) et rival (revient après chaque arène). Pure donnée, sans DOM.
import {zonePool, draw, tierOf} from './world.js';
import {wildLevelZone, MAX_LEVEL} from './levels.js';
import {victoryMoney} from './money.js';
import {ARENAS, arenaPrize} from './arena.js';

// 7 classes, sprites fournis (dossier assets/trainers).
export const TRAINER_CLASSES = [
  {id: 'dresseur', name: 'Dresseur', names: ['Ethan', 'Gaël', 'Noé'], file: 'dresseur'},
  {id: 'karateka', name: 'Karatéka', names: ['Kenji', 'Ryu', 'Taro'], file: 'karateka'},
  {id: 'citadine', name: 'Citadine', names: ['Lola', 'Clara', 'Zoé'], file: 'citadine'},
  {id: 'rouge', name: 'Dresseuse experte', names: ['Mireille', 'Agnès', 'Mona'], file: 'rouge'},
  {id: 'nageur', name: 'Nageur', names: ['Tom', 'Léo', 'Hugo'], file: 'nageur'},
  {id: 'sage', name: 'Sage', names: ['Maître Oku', 'Maître Jin', 'Maître Sho'], file: 'sage'},
  {id: 'bugs', name: 'Pêcheur de bugs', names: ['Rémi', 'Sam', 'Doug'], file: 'bugs'}
];
export const TRAINER_CHANCE = 0.05;
export const TRAINER_MONEY = 2.5;
export const TRAINER_XP = 1.5;

// Dresseur sauvage de la zone : 2 ou 3 Pokémon tirés dans la zone, niveau de zone +1.
export function wildTrainerFor(zoneId, rand = Math.random) {
  const cls = TRAINER_CLASSES[Math.floor(rand() * TRAINER_CLASSES.length)], first = cls.names[Math.floor(rand() * cls.names.length)];
  const entries = zonePool(zoneId,0,false), size = rand() < .5 ? 2 : 3, lvl = Math.min(MAX_LEVEL, wildLevelZone(zoneId, rand) + 1), team = [];
  for (let i = 0; i < size; i++) team.push([draw(entries, rand()).id, lvl]);
  return {trainer: true, id: 'trainer-' + cls.id, leader: `${cls.name} ${first}`, title: `${cls.name} sauvage`, sprite: `assets/trainers/${cls.file}.png`, alts: [], team, badgeSprite: null, n: 0, xpBonus: TRAINER_XP};
}
export const shouldTrainer = (rand = Math.random) => rand() < TRAINER_CHANCE;
export const trainerPrize = team => Math.round(TRAINER_MONEY * team.reduce((s, [id, lv]) => s + victoryMoney(tierOf(id), lv), 0));

// Rival : après l'arène n (1–8), il revient avec une équipe plus forte (niveau de l'as de l'arène + 3).
const RIVAL_TEAMS = {1: [16, 63, 19], 2: [17, 64, 20], 3: [17, 64, 20, 58], 4: [18, 64, 111, 58], 5: [18, 65, 111, 59, 102], 6: [18, 65, 112, 59, 103], 7: [18, 65, 112, 59, 103, 9], 8: [18, 65, 112, 59, 103, 9]};
export function rivalDef(n) {
  const a = ARENAS[n - 1], lvl = Math.min(100, a.ace + 3), size = Math.min(6, 2 + Math.ceil(n / 2));
  return {rival: true, id: 'rival-' + n, n, leader: 'Rival', title: `Ton rival · après ${a.city}`, sprite: 'assets/trainers/rival.png', alts: [], team: RIVAL_TEAMS[n].slice(0, size).map(id => [id, lvl]), badgeSprite: null, prize: Math.round(arenaPrize(a, true) * .6)};
}
export const sanitizeRival = r => { const o = {}; if (r && typeof r === 'object') for (let n = 1; n <= ARENAS.length; n++) if (r[n] === true) o[n] = true; return o; };
