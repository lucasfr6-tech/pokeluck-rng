export const PREFERENCE_KEY='pokeluck-preferences-v1';
export const DEFAULT_PREFERENCES={theme:'dark',quality:'standard',sound:true,volume:45,effects:true,reducedMotion:false};
export function normalizePreferences(value={}){
  const p=value&&typeof value==='object'?value:{};
  return {theme:['dark','light'].includes(p.theme)?p.theme:'dark',quality:['eco','standard','high'].includes(p.quality)?p.quality:'standard',sound:typeof p.sound==='boolean'?p.sound:true,volume:Number.isFinite(p.volume)?Math.max(0,Math.min(100,Math.round(p.volume))):45,effects:typeof p.effects==='boolean'?p.effects:true,reducedMotion:!!p.reducedMotion};
}
let preferences={...DEFAULT_PREFERENCES};
try {const saved=localStorage.getItem(PREFERENCE_KEY);if(saved)preferences=normalizePreferences(JSON.parse(saved));else{const old=JSON.parse(localStorage.getItem('pokeluck-save-v1'));preferences.reducedMotion=!!old?.reducedMotion;}}catch{}
export const getPreferences=()=>({...preferences});
export function setPreferences(change){preferences=normalizePreferences({...preferences,...change});let persisted=true;try{localStorage.setItem(PREFERENCE_KEY,JSON.stringify(preferences));}catch{persisted=false;}return {preferences:getPreferences(),persisted};}

export const POWER_THRESHOLDS=[0,100_000,100_000_000,1_000_000_000];
export function powerProgress(value){const power=Number.isFinite(value)?Math.max(0,value):0;const index=power<1e5?0:power<1e8?1:power<1e9?2:3;const floor=POWER_THRESHOLDS[index],next=POWER_THRESHOLDS[index+1]??null;return {index,floor,next,remaining:next===null?0:Math.max(0,next-power),percent:next===null?100:Math.max(0,Math.min(100,(power-floor)/(next-floor)*100))};}
