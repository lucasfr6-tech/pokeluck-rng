import {seeded, dayKey} from './events.js';
import {TYPE_FR} from './battle.js';

// Quêtes : 3 quotidiennes (≈ 15 min chacune) et 3 hebdomadaires (≈ 4 h chacune, faisables en 3-4 jours à ~1 h/jour).
// Tirage déterministe selon la date (jour / semaine du lundi), progression = écart avec un instantané des compteurs pris au début de la période.
export const QUEST_TYPES = ['normal', 'water', 'grass', 'bug', 'poison', 'flying', 'ground'];
export const DAILY_BASE = 3000, WEEKLY_BASE = 20000;
export const questScale = badges => 1 + .25 * Math.max(0, Math.min(8, badges | 0));
export const streakBonus = count => 1 + Math.min(.5, .05 * Math.max(0, count - 1));
const TEMPLATES = [
  {key:'wins',  metric:'wins',       weight:1,   daily:[25, 35], weekly:[320, 420], text:n => `Bats ${n} Pokémon sauvages`},
  {key:'draws', metric:'draws',      weight:.8,  daily:[30, 45], weekly:[420, 560], text:n => `Fais ${n} tirages`},
  {key:'type',  metric:null,         weight:1.1, daily:[6, 10],  weekly:[60, 90],   text:(n, t) => `Tire ${n} Pokémon de type ${TYPE_FR[t] || t}`},
  {key:'rare',  metric:'rareKills',  weight:1.3, daily:[2, 4],   weekly:[20, 30],   text:n => `Bats ${n} Pokémon rares ou mieux`, needs:c => c.badges >= 2},
  {key:'new',   metric:'newSpecies', weight:1.2, weeklyWeight:2, daily:[1, 1], weekly:[20, 20], text:n => `Découvre ${n} nouvelle${n > 1 ? 's' : ''} espèce${n > 1 ? 's' : ''}`, needs:c => c.discovered <= 130},
  {key:'arena', metric:'arenaWins',  weight:1.2, daily:[1, 1],   weekly:[4, 6],     text:n => `Gagne ${n} combat${n > 1 ? 's' : ''} d’arène`, needs:c => c.badges >= 1}
];
const pick = (rand, [lo, hi]) => lo + Math.floor(rand() * (hi - lo + 1));
export function generateQuests(kind, key, ctx = {badges:0, discovered:0}) {
  const rand = seeded(key * (kind === 'daily' ? 7919 : 104729)), pool = TEMPLATES.filter(t => !t.needs || t.needs(ctx));
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, 3).map((t, i) => {
    const type = t.key === 'type' ? QUEST_TYPES[Math.floor(rand() * QUEST_TYPES.length)] : null, target = pick(rand, t[kind]);
    return {id:`${kind}:${key}:${i}`, kind, key:t.key, metric:t.metric || 't_' + type, target, weight:kind === 'weekly' && t.weeklyWeight ? t.weeklyWeight : t.weight, text:t.text(target, type)};
  });
}
export const questReward = (q, badges) => Math.round((q.kind === 'daily' ? DAILY_BASE : WEEKLY_BASE) * q.weight * questScale(badges) / 100) * 100;

// Lundi de la semaine en cours (heure locale), au format AAAAMMJJ.
export function weekStart(now = Date.now()) { const d = new Date(now); const back = (d.getDay() + 6) % 7; return new Date(d.getFullYear(), d.getMonth(), d.getDate() - back).getTime(); }
export const weekKey = (now = Date.now()) => dayKey(weekStart(now));
export const nextDayStart = (now = Date.now()) => { const d = new Date(now); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime(); };
export const nextWeekStart = (now = Date.now()) => { const d = new Date(weekStart(now)); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7).getTime(); };
export const yesterdayKey = (now = Date.now()) => { const d = new Date(now); return dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1).getTime()); };

const emptyCtx = () => ({badges:0, discovered:0});
export const emptyQuests = () => ({day:0, week:0, dBase:{}, wBase:{}, dCtx:emptyCtx(), wCtx:emptyCtx(), claimed:{}, streak:{count:0, last:0}});
const cleanCtx = raw => ({badges:Number.isSafeInteger(raw?.badges) ? Math.max(0, Math.min(8, raw.badges)) : 0, discovered:Number.isSafeInteger(raw?.discovered) ? Math.max(0, Math.min(151, raw.discovered)) : 0});
const cleanMap = raw => { const o = {}; if (raw && typeof raw === 'object') for (const [k, v] of Object.entries(raw)) if (Number.isSafeInteger(v) && v >= 0) o[k] = v; return o; };
export function sanitizeQuests(raw) {
  const q = emptyQuests(); if (!raw || typeof raw !== 'object') return q;
  if (Number.isSafeInteger(raw.day)) q.day = raw.day; if (Number.isSafeInteger(raw.week)) q.week = raw.week;
  q.dBase = cleanMap(raw.dBase); q.wBase = cleanMap(raw.wBase); q.dCtx = cleanCtx(raw.dCtx); q.wCtx = cleanCtx(raw.wCtx);
  if (raw.claimed && typeof raw.claimed === 'object') for (const [k, v] of Object.entries(raw.claimed)) if (v === true && /^(daily|weekly):\d+:\d$/.test(k)) q.claimed[k] = true;
  if (raw.streak && Number.isSafeInteger(raw.streak.count) && Number.isSafeInteger(raw.streak.last)) q.streak = {count:Math.max(0, raw.streak.count), last:raw.streak.last};
  return q;
}
// Nouveau jour / nouvelle semaine : instantané des compteurs et remise à zéro des récompenses. Renvoie true si l'état a changé.
export function syncQuests(q, now, metrics, ctx = emptyCtx()) {
  let changed = false; const dk = dayKey(now), wk = weekKey(now);
  if (q.day !== dk) { q.day = dk; q.dBase = {...metrics}; q.dCtx = {...ctx}; for (const k of Object.keys(q.claimed)) if (k.startsWith('daily:')) delete q.claimed[k]; changed = true; }
  if (q.week !== wk) { q.week = wk; q.wBase = {...metrics}; q.wCtx = {...ctx}; for (const k of Object.keys(q.claimed)) if (k.startsWith('weekly:')) delete q.claimed[k]; changed = true; }
  return changed;
}
export const questProgress = (q, quest, metrics) => Math.max(0, Math.min(quest.target, (metrics[quest.metric] || 0) - ((quest.kind === 'daily' ? q.dBase : q.wBase)[quest.metric] || 0)));
export const questDone = (q, quest, metrics) => questProgress(q, quest, metrics) >= quest.target;
export const currentStreak = (q, now) => (q.streak.last === dayKey(now) || q.streak.last === yesterdayKey(now)) ? q.streak.count : 0;
// Récupère la récompense ; renvoie l'argent gagné (0 si impossible).
export function claimQuest(q, quest, now, metrics, badges) {
  if (q.claimed[quest.id] || !questDone(q, quest, metrics)) return 0;
  q.claimed[quest.id] = true; let money = questReward(quest, badges);
  if (quest.kind === 'daily') {
    const dk = dayKey(now); if (q.streak.last !== dk) { q.streak = {count:q.streak.last === yesterdayKey(now) ? q.streak.count + 1 : 1, last:dk}; }
    money = Math.round(money * streakBonus(q.streak.count) / 100) * 100;
  }
  return money;
}
export const questsOf = q => ({daily:generateQuests('daily', q.day, q.dCtx), weekly:generateQuests('weekly', q.week, q.wCtx)});
