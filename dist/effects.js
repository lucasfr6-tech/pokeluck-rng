import {getPreferences} from './preferences.js';
import {playSound} from './audio.js';

export function effectKind(event){return event.moveKey==='ember'||event.moveType==='fire'||/flammèche|flamethrower|lance-flammes/i.test(event.move)?'ember':event.moveKey==='scratch'||/griffe|scratch/i.test(event.move)?'scratch':event.moveType==='water'?'water':event.moveType==='electric'?'electric':'hit';}
export function playAttackEffect(event,previewTarget=null){
 const prefs=getPreferences(),kind=effectKind(event);if(!event.silent)void playSound(kind==='ember'?'ember':'scratch');
 if(event.hit===false||!prefs.effects||prefs.reducedMotion||prefs.quality==='eco'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const scene=previewTarget||document.querySelector('.scene');const target=previewTarget||document.querySelector(event.target==='wild'?'#result img':'#ally');if(!scene||!target)return;
 const r=scene.getBoundingClientRect(),t=target.getBoundingClientRect();if(!r.width||!t.width)return;
 const layer=document.createElement('div');layer.className='attack-effect fx-'+kind;layer.setAttribute('aria-hidden','true');layer.style.left=(t.left-r.left+t.width/2)+'px';layer.style.top=(t.top-r.top+t.height*.48)+'px';
 for(let i=0;i<(kind==='scratch'?3:kind==='ember'?7:5);i++){const particle=document.createElement('i');particle.style.setProperty('--i',i);layer.append(particle);}scene.append(layer);setTimeout(()=>layer.remove(),850);
}
