import {EV_YIELDS} from './ev-yields.js';
export const STAT_KEYS=['hp','atk','def','spa','spd','spe'];
export const STAT_NAMES={hp:'PV',atk:'Attaque',def:'Défense',spa:'Att. Spé.',spd:'Déf. Spé.',spe:'Vitesse'};
export const IV_MAX=31,EV_MAX=252,EV_TOTAL=510;
export const blankStats=()=>Object.fromEntries(STAT_KEYS.map(key=>[key,0]));
const validIV=value=>Number.isInteger(value)&&value>=0&&value<=IV_MAX;
function rollIV(random){if(random)return Math.max(0,Math.min(31,Math.floor(random()*32)));const bytes=new Uint8Array(1);if(globalThis.crypto?.getRandomValues){crypto.getRandomValues(bytes);return bytes[0]&31;}return Math.floor(Math.random()*32);}
export function normalizeEVs(raw={}){let remaining=EV_TOTAL;const result=blankStats();for(const key of STAT_KEYS){const value=Number.isFinite(raw?.[key])?Math.max(0,Math.min(EV_MAX,Math.floor(raw[key]))):0;result[key]=Math.min(value,remaining);remaining-=result[key];}return result;}
export function normalizeTraining(raw={},random){return {ivs:Object.fromEntries(STAT_KEYS.map(key=>[key,validIV(raw?.ivs?.[key])?raw.ivs[key]:rollIV(random)])),evs:normalizeEVs(raw?.evs)};}
export const createTraining=random=>normalizeTraining({},random);
export function migrateTraining(counts,raw,random){return Object.fromEntries(Object.keys(counts).map(id=>[id,normalizeTraining(raw?.[id],random)]));}
export const totalEVs=evs=>STAT_KEYS.reduce((sum,key)=>sum+(evs?.[key]||0),0);
export function effortYield(id){return Object.fromEntries(STAT_KEYS.map((key,i)=>[key,EV_YIELDS[id-1]?.[i]||0]));}
export function gainEVs(record,yieldStats){const evs=normalizeEVs(record.evs),gained=blankStats();let remaining=EV_TOTAL-totalEVs(evs);for(const key of STAT_KEYS){const requested=Number.isFinite(yieldStats?.[key])?Math.max(0,Math.floor(yieldStats[key])):0;const gain=Math.min(requested,EV_MAX-evs[key],remaining);evs[key]+=gain;gained[key]=gain;remaining-=gain;}return {record:{ivs:{...record.ivs},evs},gained};}
// Nouvelle capture d'une espèce déjà possédée : chaque IV garde la meilleure valeur entre l'ancien et le nouvel exemplaire.
// Les IV moins bons sont ignorés ; les EV (acquis en combat) ne changent pas.
export function mergeBestIVs(current,caught){const ivs={...current.ivs},improved=[];for(const key of STAT_KEYS){if(validIV(caught?.ivs?.[key])&&caught.ivs[key]>ivs[key]){improved.push({key,from:ivs[key],to:caught.ivs[key]});ivs[key]=caught.ivs[key];}}return {record:{ivs,evs:{...current.evs}},improved};}
export const trainingSignature=record=>JSON.stringify(record);
export const ivJudgement=value=>value===31?'Exceptionnel':value===0?'Pas top':value<=15?'Passable':value<=25?'Bon':value<=29?'Très bon':'Fantastique';
