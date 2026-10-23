// Centrage sur les pixels visibles, commun aux sprites de face et de dos.
export function opaqueBounds(data,width,height){let left=width,top=height,right=-1,bottom=-1;for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}return right<0?null:{left,top,width:right-left+1,height:bottom-top+1};}
export function centeredOffset(bounds,width,height){return {x:(width-bounds.width)/2-bounds.left,y:(height-bounds.height)/2-bounds.top};}
export function combatPositions(width,height,strip,wildHud,allyHud){
 const available=Math.max(0,height-strip),gap=12;
 const make=(cx,top,bottom)=>{const space=Math.max(0,available-top-bottom),size=Math.max(0,Math.min(width*.35,space));return {left:Math.max(0,Math.min(width-size,cx-size/2)),top:Math.max(0,top+(space-size)/2),size};};
 return {ally:make(width*.24,Math.min(wildHud+28,available*.42),gap),wild:make(width*.77,gap,Math.min(allyHud+28,available*.42))};
}
export function initializeSpriteCentering(){
 const cache=new Map(),requested=new WeakMap();
 const isSprite=src=>/^https:\/\/raw\.githubusercontent\.com\/PokeAPI\/sprites\/master\/sprites\/pokemon\/(?:back\/)?(?:shiny\/)?(?:[1-9]|[1-9]\d|1[0-4]\d|15[01])\.png$/.test(src);
 function normalized(src){if(cache.has(src))return cache.get(src);const promise=new Promise(resolve=>{const image=new Image();image.crossOrigin='anonymous';image.onload=()=>{try{const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const bounds=opaqueBounds(ctx.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height);if(!bounds){resolve(src);return;}const offset=centeredOffset(bounds,canvas.width,canvas.height);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=false;ctx.drawImage(image,offset.x,offset.y);resolve(canvas.toDataURL());}catch{resolve(src);}};image.onerror=()=>resolve(src);image.src=src;});cache.set(src,promise);return promise;}
 function center(img){const src=img.getAttribute('src')||'';if(!isSprite(src)||requested.get(img)===src)return;requested.set(img,src);normalized(src).then(result=>{if(requested.get(img)===src)requested.delete(img);if(img.isConnected&&img.getAttribute('src')===src&&result!==src)img.src=result;});}
 function scan(node){if(node instanceof HTMLImageElement)center(node);node.querySelectorAll?.('img').forEach(center);}
 const scene=document.querySelector('.scene'),stage=document.querySelector('#stage'),ally=document.querySelector('#ally'),wild=document.querySelector('#result');let frame=0;
 function layout(){frame=0;if(!stage.classList.contains('fighting'))return;const strip=document.querySelector('#battle').offsetHeight;const positions=combatPositions(scene.clientWidth,scene.clientHeight,strip,document.querySelector('#hp').offsetHeight,document.querySelector('#fighter').offsetHeight);for(const [element,pos] of [[ally,positions.ally],[wild,positions.wild]]){element.style.width=pos.size+'px';element.style.height=pos.size+'px';element.style.left=pos.left+'px';element.style.top=pos.top+'px';element.style.right='auto';element.style.bottom='auto';}}
 function schedule(){if(!frame)frame=requestAnimationFrame(layout);}
 function reset(){for(const element of [ally,wild])for(const property of ['width','height','left','top','right','bottom'])element.style.removeProperty(property);}
 new MutationObserver(records=>{for(const r of records){if(r.type==='childList')r.addedNodes.forEach(scan);else if(r.target instanceof HTMLImageElement)center(r.target);if(r.target===stage){if(stage.classList.contains('fighting'))schedule();else reset();}}}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['src','class']});
 if(window.ResizeObserver){const observer=new ResizeObserver(schedule);for(const element of [scene,document.querySelector('#battle'),document.querySelector('#hp'),document.querySelector('#fighter')])observer.observe(element);}
 scan(document.body);schedule();
}
