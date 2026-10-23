export function drawScenery(canvas,type,night=false){
 const c=canvas.getContext('2d'),W=480,H=375;let seed=42;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const rect=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 const poly=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fill();};
 const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,night?'#071631':'#142d49');sky.addColorStop(.6,night?'#354b6c':'#3e6b7c');sky.addColorStop(1,'#112c34');c.fillStyle=sky;c.fillRect(0,0,W,H);
 for(let i=0;i<95;i++)rect(rand()*W,rand()*155,rand()>.85?2:1,1,rand()>.5?'#b2d4e1':'#668cb8');
 c.fillStyle=night?'#f9e4ae':'#d9e6ca';c.beginPath();c.arc(353,80,night?20:13,0,Math.PI*2);c.fill();
 for(let layer=0;layer<3;layer++){const y=130+layer*25;let points=[[0,H],[0,y]];for(let x=0;x<=W;x+=20)points.push([x,y-30-rand()*40]);points.push([W,H]);poly(points,['#233d50','#274b53','#2f5c55'][layer]);}
 rect(0,203,W,172,night?'#183a42':'#255844');
 const tree=(x,y,s,layer=0)=>{rect(x-3*s,y-3*s,7*s,30*s,'#443b38');const colors=layer?['#0c3237','#11454a','#1f5d57']:['#174a41','#23634a','#337b54'];poly([[x,y-58*s],[x-21*s,y-25*s],[x-12*s,y-25*s],[x-30*s,y-3*s],[x-18*s,y-3*s],[x-36*s,y+18*s],[x+34*s,y+18*s],[x+20*s,y-3*s],[x+28*s,y-3*s],[x+13*s,y-25*s],[x+19*s,y-25*s]],colors[0]);poly([[x,y-55*s],[x-18*s,y-25*s],[x-8*s,y-25*s],[x-23*s,y],[x-13*s,y],[x-30*s,y+13*s],[x+5*s,y+13*s],[x+1*s,y-10*s],[x+5*s,y-10*s]],colors[1]);rect(x-5*s,y-25*s,5*s,7*s,colors[2]);rect(x-17*s,y,7*s,4*s,colors[2]);};
 if(type==='forest'){
  for(let i=0;i<22;i++)tree(i*25-20,145+rand()*70,.65+rand()*.25,1);
  poly([[173,375],[310,375],[282,300],[270,240],[250,204],[225,204],[211,260],[191,312]],night?'#60727b':'#647e63');
  for(let i=0;i<10;i++){tree(i<5?i*28-10:365+(i-5)*30,190+rand()*120,1.05+rand()*.4);}
  for(let i=0;i<8;i++){const x=i<4?i*42-15:360+(i-4)*45;tree(x,365,1.5);}
  for(let i=0;i<25;i++)rect(rand()*W,170+rand()*150,1,2,'#d5e68c');
 }else if(type==='route'){
  poly([[120,375],[330,375],[285,298],[260,248],[254,212],[225,212],[210,255],[176,300]],night?'#9a9388':'#b0ac7d');
  for(let i=0;i<17;i++)tree(i*35-25,190+rand()*35,.55+rand()*.15,1);
  for(let i=0;i<7;i++)tree(i<4?i*36-15:377+(i-4)*40,270+rand()*20,1.0);
  for(let i=0;i<260;i++){let x=rand()*W,y=239+rand()*136;if(x<150||x>310){rect(x,y,2,4,rand()>.5?'#3e7750':'#4f8d59');if(i%18===0)rect(x,y-2,2,2,'#bdb4dc');}}
  rect(86,225,3,31,'#5a5149');rect(70,223,34,16,'#ad9870');rect(75,228,22,2,'#4f5142');rect(75,233,14,2,'#4f5142');
 }else if(type==='power'){
  rect(0,198,W,177,'#3d515d');
  rect(65,106,350,134,'#53637a');rect(65,106,350,12,'#8790a0');
  for(let x=80;x<410;x+=40){rect(x,131,22,31,'#c5b776');rect(x+2,133,18,27,'#7d987c');rect(x,145,22,3,'#435263');}
  rect(204,178,70,62,'#222c43');rect(214,186,50,54,'#111e31');
  rect(80,76,15,30,'#758295');rect(83,65,9,12,'#a8b3c5');
  for(let i=0;i<5;i++){const x=24+i*105;rect(x,237,3,55,'#7b8d99');rect(x-12,248,28,3,'#bac2aa');}
  poly([[195,375],[288,375],[265,240],[218,240]],'#738285');
  for(let x=10;x<W;x+=35){rect(x,320,13,3,'#a4a98b');rect(x+3,333,4,2,'#798d77');}
 }else{
  rect(0,0,W,H,'#17233b');poly([[0,375],[0,35],[68,0],[125,0],[172,92],[150,185],[105,230],[97,375]],'#3a3c59');poly([[480,375],[480,0],[405,0],[353,70],[330,165],[364,228],[375,375]],'#353b54');poly([[100,375],[380,375],[350,220],[284,171],[203,180],[142,240]],'#596078');poly([[0,0],[480,0],[480,44],[379,76],[320,54],[243,15],[169,56],[95,73],[0,51]],'#2b304a');
  for(let i=0;i<40;i++){const x=rand()*W,y=rand()*H;if(x<110||x>365)rect(x,y,15+rand()*24,8,'#464c66');}
  const crystal=(x,y,s)=>{poly([[x,y-25*s],[x-9*s,y],[x-6*s,y+20*s],[x+8*s,y+15*s],[x+10*s,y-1*s]],'#8e9bcc');poly([[x,y-25*s],[x-3*s,y],[x,y+15*s],[x+8*s,y+15*s],[x+10*s,y-1*s]],'#c7bdeb');rect(x-2*s,y-12*s,2*s,14*s,'#e1dfff');};
  crystal(85,276,1.1);crystal(387,219,.8);crystal(37,147,.6);crystal(431,318,1.5);c.fillStyle='#83add51a';c.beginPath();c.ellipse(240,286,115,42,0,0,Math.PI*2);c.fill();
 }
 for(let i=0;i<70;i++){const x=rand()*W,y=315+rand()*60;rect(x,y,2+rand()*4,1,type==='cave'?'#8a8a9f':'#5a9066');}
}
