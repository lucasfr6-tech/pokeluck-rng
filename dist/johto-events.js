// Événements de zone de Johto et légendaires errants. Tout est déterministe selon l'horloge :
// aucun état à sauvegarder, et tous les joueurs voient la même chose au même moment.
import {johtoZones} from './world.js';
import {types} from './world.js';
import {HOUR,seeded} from './events.js';

export const ZONE_EVENT_LEN = 2 * HOUR;
export const ZONE_EVENT_SPAWN = 3;   // poids d'apparition ×3 pour les types à l'honneur
export const ZONE_EVENT_XP = 1.25;   // XP +25 % tant que l'événement est actif dans la zone
// Un événement par zone : nom, texte d'ambiance et types mis à l'honneur.
export const ZONE_EVENTS = {
 route29:{name:'Matinée tranquille', text:'Les Pokémon des prairies sortent se dégourdir.', types:['normal','flying']},
 route31:{name:'Vent de fête', text:'Les oiseaux planent bas au-dessus des champs.', types:['flying','normal']},
 tourchetiflor:{name:'Brise sacrée', text:'La tour oscille doucement : le vent attire les ailes.', types:['flying','grass']},
 ruinesalpha:{name:'Écho des ruines', text:'Les murs murmurent : les esprits curieux approchent.', types:['psychic','normal']},
 puitsramoloss:{name:'Marée de Ramolosses', text:'Le puits déborde de Pokémon rêveurs.', types:['water','psychic']},
 boischenes:{name:'Floraison des chênes', text:'Les pétales tombent, les insectes affluent.', types:['grass','bug']},
 parcnaturel:{name:'Grand concours', text:'Le parc ouvre son concours : les insectes sont de sortie.', types:['bug','grass']},
 tourcendree:{name:'Nuit des Spectres', text:'Les flammes bleues vacillent : les fantômes sortent de leurs cendres.', types:['ghost','poison']},
 tourferraille:{name:'Orage de ferraille', text:'Les éclairs claquent sur les poutres rouillées.', types:['electric','normal']},
 chenal40:{name:'Raz-de-marée', text:'Une grosse houle rabat les Pokémon marins vers la côte.', types:['water']},
 pharoliville:{name:'Nuit du phare', text:'Le phare brille plus fort : tout ce qui nage ou étincelle accourt.', types:['electric','water']},
 montcreuset:{name:'Éboulement', text:'La roche tremble, les creuseurs délogés fuient vers le sentier.', types:['rock','ground']},
 routeglace:{name:'Tempête de neige', text:'Le blizzard pousse les Pokémon polaires hors des grottes.', types:['ice','water']},
 laccolere:{name:'Colère du lac', text:'Les eaux bouillonnent : quelque chose de grand remue.', types:['water','dragon']},
 antredragon:{name:'Rugissement ancestral', text:'Un cri résonne dans l’antre et réveille les dragons.', types:['dragon','flying']},
 montargente:{name:'Pluie de météores', text:'Des éclats tombent du ciel sur la montagne.', types:['rock','psychic']}
};
const ids = () => johtoZones.map(z => z.id).filter(id => ZONE_EVENTS[id]);

// Deux événements simultanés par tranche de 2 h, dans des zones différentes.
export function zoneEvents(now = Date.now()) {
  const list = ids(), slot = Math.floor(now / ZONE_EVENT_LEN), rand = seeded(slot * 97531 + 11), out = [], pool = [...list];
  for (let i = 0; i < Math.min(2, pool.length); i++) { const k = Math.floor(rand() * pool.length), zone = pool.splice(k, 1)[0]; out.push({zone, ...ZONE_EVENTS[zone], startsAt: slot * ZONE_EVENT_LEN, endsAt: (slot + 1) * ZONE_EVENT_LEN}); }
  return out;
}
export const zoneEventAt = (zoneId, now = Date.now()) => zoneEvents(now).find(e => e.zone === zoneId) || null;
export const eventXp = (zoneId, now = Date.now()) => zoneEventAt(zoneId, now) ? ZONE_EVENT_XP : 1;
// Applique le poids d'apparition et renormalise (la somme reste 1).
export function eventAdjust(entries, zoneId, now = Date.now()) {
  const ev = zoneEventAt(zoneId, now); if (!ev) return entries;
  const w = entries.map(p => p.probability * (types[p.id]?.some(t => ev.types.includes(t)) ? ZONE_EVENT_SPAWN : 1)), sum = w.reduce((n, v) => n + v, 0) || 1;
  return entries.map((p, i) => ({...p, probability: w[i] / sum}));
}

// Légendaires errants : Raikou, Entei et Suicune changent de zone chaque heure (toujours trois zones différentes).
export const ROAMERS = [
 {id:243, name:'Raikou', hint:z => `Un orage gronde du côté de ${z}.`},
 {id:244, name:'Entei', hint:z => `Une colonne de fumée s’élève près de ${z}.`},
 {id:245, name:'Suicune', hint:z => `Une brise glaciale souffle sur ${z}.`}
];
export const ROAM_CHANCE = .05;
export function roamZones(now = Date.now()) {
  const list = johtoZones.map(z => z.id), slot = Math.floor(now / HOUR), rand = seeded(slot * 60013 + 7), pool = [...list], out = {};
  for (const r of ROAMERS) { const k = Math.floor(rand() * pool.length); out[r.id] = pool.splice(k, 1)[0]; }
  return {zones: out, endsAt: (slot + 1) * HOUR};
}
// Un errant présent dans la zone apparaît avec ROAM_CHANCE à chaque tirage.
export function roamPick(zoneId, now = Date.now(), rand = Math.random) {
  const {zones} = roamZones(now), here = ROAMERS.filter(r => zones[r.id] === zoneId);
  return here.length && rand() < ROAM_CHANCE ? here[Math.floor(rand() * here.length)].id : null;
}
export const roamCaughtCount = done => ROAMERS.filter(r => done?.['roam' + r.id]).length;
