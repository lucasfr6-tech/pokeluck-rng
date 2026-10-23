// Surnoms et favoris : données par espèce, sans DOM.
export const NICK_MAX = 12;
export const cleanNick = s => String(s ?? '').replace(/[\u0000-\u001f<>&"'`]/g, '').replace(/\s+/g, ' ').trim().slice(0, NICK_MAX);
export const sanitizeNick = o => { const r = {}; if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { const id = +k, n = cleanNick(v); if (Number.isInteger(id) && id >= 1 && id <= 151 && n) r[id] = n; } return r; };
export const sanitizeFav = o => { const r = {}; if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { const id = +k; if (Number.isInteger(id) && id >= 1 && id <= 151 && v === true) r[id] = true; } return r; };
export const nameOf = (state, id, base) => state.nick?.[id] || base;
// Comparateur : les favoris d'abord, puis l'ordre donné.
export const favFirst = (state, cmp) => (a, b) => (state.fav?.[b.id] ? 1 : 0) - (state.fav?.[a.id] ? 1 : 0) || cmp(a, b);
export const escHtml = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
