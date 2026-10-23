// Dresseurs sauvages (rencontres aléatoires dans une zone) et rival (revient après chaque arène). Pure donnée, sans DOM.
import {zonePool, draw, tierOf} from './world.js';
import {wildLevelZone} from './levels.js';
import {victoryMoney} from './money.js';
import {ARENAS, arenaPrize} from './arena.js';

const SPR = n => `https://play.pokemonshowdown.com/sprites/trainers/${n}.png`;
// 10 classes : sprite principal + variantes de secours (certains noms ne sont pas garantis côté Showdown).
export const TRAINER_CLASSES = [
  {id: 'youngster', name: 'Jeune', names: ['Marc', 'Tom', 'Léo'], sprites: ['youngster-gen1', 'youngster-gen3', 'youngster']},
  {id: 'lass', name: 'Gamine', names: ['Julie', 'Lola', 'Zoé'], sprites: ['lass-gen1', 'lass-gen3', 'lass']},
  {id: 'bugcatcher', name: 'Pêcheur de bugs', names: ['Rémi', 'Doug', 'Sam'], sprites: ['bugcatcher-gen1', 'bugcatcher']},
  {id: 'camper', name: 'Campeur', names: ['Liam', 'Ethan', 'Hugo'], sprites: ['camper-gen3', 'camper-gen2']},
  {id: 'hiker', name: 'Montagnard', names: ['Bruno', 'Gaël', 'Ivan'], sprites: ['hiker-gen1', 'hiker-gen3', 'hiker']},
  {id: 'biker', name: 'Motard', names: ['Jax', 'Rick', 'Vlad'], sprites: ['biker-gen1', 'biker']},
  {id: 'blackbelt', name: 'Karatéka', names: ['Kenji', 'Ryu', 'Taro'], sprites: ['blackbelt-gen1', 'blackbelt']},
  {id: 'birdkeeper', name: 'Éleveur d’oiseaux', names: ['Jules', 'Phil', 'Ange'], sprites: ['birdkeeper-gen1', 'birdkeeper']},
  {id: 'beauty', name: 'Canon', names: ['Mireille', 'Rose', 'Clara'], sprites: ['beauty-gen1', 'beauty']},
  {id: 'channeler', name: 'Médium', names: ['Agnès', 'Odile', 'Mona'], sprites: ['channeler-gen1', 'channeler']},
];
export const TRAINER_CHANCE = 0.1;
export const TRAINER_MONEY = 2.5;
export const TRAINER_XP = 1.5;

// Dresseur sauvage de la zone : 2 ou 3 Pokémon tirés dans la zone, niveau de zone +1.
export function wildTrainerFor(zoneId, rand = Math.random) {
  const cls = TRAINER_CLASSES[Math.floor(rand() * TRAINER_CLASSES.length)], first = cls.names[Math.floor(rand() * cls.names.length)];
  const entries = zonePool(zoneId), size = rand() < .5 ? 2 : 3, lvl = Math.min(100, wildLevelZone(zoneId, rand) + 1), team = [];
  for (let i = 0; i < size; i++) team.push([draw(entries, rand()).id, lvl]);
  return {trainer: true, id: 'trainer-' + cls.id, leader: `${cls.name} ${first}`, title: `${cls.name} sauvage`, sprite: SPR(cls.sprites[0]), alts: cls.sprites.slice(1).map(SPR), team, badgeSprite: null, n: 0, xpBonus: TRAINER_XP};
}
export const shouldTrainer = (rand = Math.random) => rand() < TRAINER_CHANCE;
export const trainerPrize = team => Math.round(TRAINER_MONEY * team.reduce((s, [id, lv]) => s + victoryMoney(tierOf(id), lv), 0));

// Rival : après l'arène n (1–8), il revient avec une équipe plus forte (niveau de l'as de l'arène + 3).
const RIVAL_TEAMS = {1: [16, 63, 19], 2: [17, 64, 20], 3: [17, 64, 20, 58], 4: [18, 64, 111, 58], 5: [18, 65, 111, 59, 102], 6: [18, 65, 112, 59, 103], 7: [18, 65, 112, 59, 103, 9], 8: [18, 65, 112, 59, 103, 9]};
export const RIVAL_ALTS = ['red-gen1rb', 'red-gen3', 'red', 'blue-gen1'];
export function rivalDef(n) {
  const a = ARENAS[n - 1], lvl = Math.min(100, a.ace + 3), size = Math.min(6, 2 + Math.ceil(n / 2));
  return {rival: true, id: 'rival-' + n, n, leader: 'Rival', title: `Ton rival · après ${a.city}`, sprite: SPR('red-gen1'), alts: RIVAL_ALTS.map(SPR), team: RIVAL_TEAMS[n].slice(0, size).map(id => [id, lvl]), badgeSprite: null, prize: Math.round(arenaPrize(a, true) * .6)};
}
export const sanitizeRival = r => { const o = {}; if (r && typeof r === 'object') for (let n = 1; n <= ARENAS.length; n++) if (r[n] === true) o[n] = true; return o; };
