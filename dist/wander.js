import {sprite} from './pokemon.js';
import {zonePool,draw} from './world.js';

// Petits Pokémon qui se promènent en fond de la scène (décor vivant, sans effet sur le jeu).
// PokéAPI ne fournit que des sprites de face et de dos : le côté gauche utilise la face,
// le côté droit la face en miroir, le haut le dos, et les diagonales mélangent les deux.
const base='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
const frontUrl=id=>`${base}versions/generation-v/black-white/${id}.png`;
const backUrl=id=>`${base}versions/generation-v/black-white/back/${id}.png`;

const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

export function createWanderers(container){
  let walkers=[],area={w:0,h:0},reduced=false,raf=0,last=0,zoneId='',quality='standard',lastPaint=0;
  const ground=()=>({x0:area.w*.04,x1:area.w*.96,y0:area.h*.45,y1:area.h*.97});
  const depth=y=>{const g=ground();return clamp((y-g.y0)/Math.max(1,g.y1-g.y0),0,1);};
  const sizeAt=y=>Math.round((area.h>=260?52:42)*(.7+.65*depth(y)));

  function makeWalker(id){
    const el=document.createElement('div');el.className='wanderer';
    const shadow=document.createElement('span');shadow.className='wanderer-shadow';
    const body=document.createElement('span');body.className='wanderer-body';
    const front=new Image(),back=new Image();front.className='wf';back.className='wb';front.alt=back.alt='';front.draggable=back.draggable=false;
    let backOk=true;
    front.onerror=()=>{front.onerror=null;front.src=sprite(id);};
    back.onerror=()=>{if(back.dataset.fallback){backOk=false;return;}back.dataset.fallback='1';back.src=`${base}back/${id}.png`;};
    front.src=frontUrl(id);back.src=backUrl(id);
    body.append(front,back);el.append(shadow,body);container.append(el);
    const g=ground();
    const w={id,el,body,front,back,get backOk(){return backOk;},x:rand(g.x0,g.x1),y:rand(g.y0,g.y1),tx:0,ty:0,speed:rand(22,42),phase:rand(0,6),rest:rand(0,2.5),moving:false,face:'front',mirror:Math.random()<.5};
    pickTarget(w);paint(w);return w;
  }

  function pickTarget(w){
    const g=ground();
    for(let i=0;i<8;i++){
      const a=rand(0,Math.PI*2),d=rand(50,Math.max(90,area.w*.22));
      const tx=w.x+Math.cos(a)*d,ty=w.y+Math.sin(a)*d*.7;
      if(tx>=g.x0&&tx<=g.x1&&ty>=g.y0&&ty<=g.y1){w.tx=tx;w.ty=ty;return;}
    }
    w.tx=rand(g.x0,g.x1);w.ty=rand(g.y0,g.y1);
  }

  // Direction visible : haut = dos, côtés et bas = face, miroir selon le sens horizontal.
  function orient(w,vx,vy){
    const len=Math.hypot(vx,vy)||1,ny=vy/len;
    if(ny<-.38){w.face='back';if(Math.abs(vx)>.15*len)w.mirror=vx<0;}
    else{w.face='front';if(Math.abs(vx)>.15*len)w.mirror=vx>0;}
    if(w.face==='back'&&!w.backOk)w.face='front';
  }

  function paint(w,hop=0){
    const s=sizeAt(w.y);
    w.el.style.width=w.el.style.height=s+'px';
    w.el.style.transform=`translate(${(w.x-s/2).toFixed(1)}px,${(w.y-s).toFixed(1)}px)`;
    w.el.style.zIndex=Math.round(w.y);
    w.body.style.transform=`translateY(${hop.toFixed(1)}px) scaleX(${w.mirror?-1:1})`;
    w.front.style.visibility=w.face==='front'?'visible':'hidden';
    w.back.style.visibility=w.face==='back'?'visible':'hidden';
  }

  function frame(t){
    if(document.hidden){raf=0;return;}
    const interval=quality==='high'?1000/60:1000/30;
    if(t-lastPaint<interval-1){raf=requestAnimationFrame(frame);return;}lastPaint=t;
    const dt=Math.min(.1,(t-last)/1000||0);last=t;
    for(const w of walkers){
      let hop=0;
      if(w.rest>0){w.rest-=dt;w.moving=false;if(w.rest<=0){pickTarget(w);w.moving=true;}}
      else{
        const dx=w.tx-w.x,dy=w.ty-w.y,dist=Math.hypot(dx,dy);
        if(dist<3){w.rest=rand(1,4);w.moving=false;}
        else{
          const sp=w.speed*(.7+.6*depth(w.y)),step=Math.min(dist,sp*dt);
          w.x+=dx/dist*step;w.y+=dy/dist*step;
          orient(w,dx,dy);
          w.phase+=dt*sp*.2;
          hop=-Math.abs(Math.sin(w.phase))*sizeAt(w.y)*.14;
        }
      }
      paint(w,hop);
    }
    raf=requestAnimationFrame(frame);
  }

  function start(){cancelAnimationFrame(raf);if(document.hidden||reduced||!walkers.length||quality==='eco')return;last=performance.now();lastPaint=0;raf=requestAnimationFrame(frame);}
  function measure(){const r=container.getBoundingClientRect();area={w:r.width,h:r.height};}
  function populate(){
    walkers.forEach(w=>w.el.remove());walkers=[];
    if(!zoneId||!area.w)return;
    const entries=zonePool(zoneId),count=quality==='eco'?0:quality==='standard'?5:area.w<520?5:area.w<900?7:10,used=new Set();
    for(let i=0;i<count;i++){
      let p=draw(entries);
      for(let k=0;k<4&&used.has(p.id);k++)p=draw(entries);
      used.add(p.id);walkers.push(makeWalker(p.id));
    }
    start();
  }

  new ResizeObserver(()=>{
    const before=area.w;measure();
    if(!before&&area.w)populate();
    else for(const w of walkers){const g=ground();w.x=clamp(w.x,g.x0,g.x1);w.y=clamp(w.y,g.y0,g.y1);pickTarget(w);paint(w);}
  }).observe(container);
  measure();
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(raf);else start();});

  return{
    setQuality(value){if(value===quality)return;quality=['eco','standard','high'].includes(value)?value:'standard';populate();},
    setZone(id,reduceMotion=false){reduced=reduceMotion;if(id===zoneId&&walkers.length){start();return;}zoneId=id;measure();populate();},
    setReduced(value){reduced=value;if(value){cancelAnimationFrame(raf);walkers.forEach(w=>{w.face='front';paint(w);});}else start();}
  };
}
