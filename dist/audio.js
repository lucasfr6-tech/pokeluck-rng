import {getPreferences} from './preferences.js';

// Reconstructed Game Boy channel-4 noise, based on the original note sequences:
// https://github.com/pret/pokered/blob/master/data/moves/sfx.asm
// https://github.com/pret/pokered/blob/master/audio/sfx/damage.asm (Scratch)
// https://github.com/pret/pokered/blob/master/audio/sfx/battle_19.asm (Ember)
// Browser synthesis approximates the hardware output; these are not recordings.
export const SOUND_NOTES={scratch:[[2,15,4,68],[2,15,4,20],[15,15,1,50]],ember:[[2,8,4,67],[2,12,4,34],[8,15,2,52]]};
export function renderRetroNoise(kind,sampleRate=22050){
 const notes=SOUND_NOTES[kind]||SOUND_NOTES.scratch;
 const lengths=notes.map(n=>Math.round((n[0]+1)/60*sampleRate));
 const out=new Float32Array(lengths.reduce((a,b)=>a+b,0));let offset=0;
 for(let k=0;k<notes.length;k++){
   const [,volume,envelope,reg]=notes[k],length=lengths[k],shift=reg>>4,divisor=(reg&7)||.5,frequency=524288/divisor/2**(shift+1);let lfsr=0x7fff,phase=0;
   for(let i=0;i<length;i++){
     phase+=frequency/sampleRate;while(phase>=1){const bit=(lfsr^(lfsr>>1))&1;lfsr=(lfsr>>1)|(bit<<14);if(reg&8)lfsr=(lfsr&~64)|(bit<<6);phase--;}
     const t=i/sampleRate,level=Math.max(0,volume-Math.floor(t/(envelope/64||1)))/15;
     const fade=Math.min(1,i/40,(length-i)/80);out[offset+i]=((lfsr&1)?-1:1)*level*fade*.3;
   }offset+=length;
 }return out;
}
let context,master;const active=new Set();
export async function unlockAudio(){
 const prefs=getPreferences();if(!prefs.sound)return false;
 try{const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return false;if(!context){context=new Audio();master=context.createGain();master.connect(context.destination);}master.gain.value=prefs.volume/100;if(context.state==='suspended')await context.resume();return context.state==='running';}catch{return false;}
}
export function updateAudio(){if(master)master.gain.value=getPreferences().volume/100;if(!getPreferences().sound){for(const source of active){try{source.stop();}catch{}}active.clear();}}
export async function playSound(kind){if(!await unlockAudio())return false;try{const samples=renderRetroNoise(kind,context.sampleRate),buffer=context.createBuffer(1,samples.length,context.sampleRate);buffer.copyToChannel(samples,0);const source=context.createBufferSource();source.buffer=buffer;source.connect(master);active.add(source);source.onended=()=>{active.delete(source);source.disconnect();};source.start();return true;}catch{return false;}}
// Carillon d'apparition d'un chromatique : petit arpège aigu (synthèse, pas un enregistrement).
export async function playShinyChime(){
 if(!await unlockAudio())return false;
 try{const t0=context.currentTime+.02;[[1319,0],[1568,.09],[2093,.18],[2637,.29]].forEach(([f,d],i)=>{const o=context.createOscillator(),g=context.createGain();o.type=i%2?'triangle':'square';o.frequency.value=f;g.gain.setValueAtTime(0,t0+d);g.gain.linearRampToValueAtTime(.16,t0+d+.01);g.gain.exponentialRampToValueAtTime(.001,t0+d+.32);o.connect(g);g.connect(master);o.start(t0+d);o.stop(t0+d+.34);active.add(o);o.onended=()=>{active.delete(o);o.disconnect();g.disconnect();};});return true;}catch{return false;}
}
if(typeof document!=='undefined'){document.addEventListener('pointerdown',()=>{void unlockAudio();},{passive:true});document.addEventListener('keydown',()=>{void unlockAudio();},{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden&&context)void context.suspend();});}
