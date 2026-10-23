import assert from 'node:assert/strict';
import {pool,evolvesFrom,ancestors,sameLine,names} from '../dist/pokemon.js';
import {baseTotals} from '../dist/pokemon.js';
import {tierOf,zones,zonePool,draw,types,powers,itinerary,backgroundFor,backgrounds,dedupeLines,teamAfterCapture,teamAfterEquip,maxHp} from '../dist/world.js';
import {chooseAiMove,effectiveness,computeStats,knownMoves,nextMove,damage,makeFighter,createBattle,takeTurn,xpReward,LUTTE,isUsable,DEFAULT_BASE} from '../dist/battle.js';
import {parseSpecies,parseMove} from '../dist/battle-data.js';
import {existsSync} from 'node:fs';
import {wildLevel,minLevel,maxLevel,levelInfo,powerAt,xpToNext,START_LEVEL} from '../dist/levels.js';
assert.equal(pool.length,151);
assert.equal(names.length,151);
assert.equal(powers.length,151);
assert.equal(names[0],'Bulbizarre');assert.equal(names[149],'Mewtwo');assert.equal(names[150],'Mew');
for(const p of pool)assert.ok(types[p.id]?.length>=1&&types[p.id].length<=2,'Types manquants : '+p.name);
assert.ok(Math.abs(pool.reduce((s,p)=>s+p.probability,0)-1)<1e-9);
assert.ok(powers.every(n=>Number.isInteger(n)&&n>=1));
for(const zone of zones){
  const entries=zonePool(zone.id);
  assert.ok(Math.abs(entries.reduce((s,p)=>s+p.probability,0)-1)<1e-12);
  assert.ok(entries.every(p=>p.probability>0));
  let start=0;
  for(const p of entries){assert.equal(draw(entries,start+p.probability/2).id,p.id);start+=p.probability;}
  assert.ok(Math.abs(zone.shares.reduce((x,y)=>x+y,0)-1)<1e-12,'Paliers de '+zone.id+' ≠ 100 %');
  const ratio=p=>p.probability/pool[p.id-1].probability;
  zone.shares.forEach((share,i)=>{const grp=entries.filter(p=>tierOf(p.id)===i+1);
    assert.ok(Math.abs(grp.reduce((x,p)=>x+p.probability,0)-share)<1e-12,'Part du palier '+(i+1)+' de '+zone.id);
    const base=grp.find(p=>!types[p.id].some(t=>zone.bonus.includes(t)));
    if(base)for(const p of grp)assert.ok(Math.abs(ratio(p)/ratio(base)-(types[p.id].some(t=>zone.bonus.includes(t))?3:1))<1e-10);});
}
// Paliers de rareté : chaque zone n'offre que les espèces de son palier ou des paliers inférieurs.
for(const z of zones)for(const p of zonePool(z.id))assert.ok(tierOf(p.id)<=z.tier,'Palier dépassé '+z.id+' #'+p.id);
assert.ok(zonePool('route').length<zonePool('route2').length&&zonePool('cave').length<zonePool('power').length);assert.ok(zonePool('route').every(p=>tierOf(p.id)===1));const sh=id=>zones.find(z=>z.id===id).shares;assert.ok(sh('route2')[0]<sh('route')[0]&&sh('forest')[0]<sh('route2')[0]&&sh('cave')[3]>0&&sh('route4')[4]===undefined);
assert.ok(!zonePool('route').some(p=>[150,151,144,6,101].includes(p.id)),'Pas de rare ni de légendaire sur la Route 1');
assert.ok([150,151,144,145,146].every(id=>zonePool('power').some(p=>p.id===id)&&!zonePool('route4').some(p=>p.id===id)),'Légendaires uniquement à la Centrale');
assert.equal(zones.find(z=>z.id==='power').tier,5);assert.equal(Math.max(...zones.map(z=>z.tier)),5);
assert.equal(tierOf(25),1);assert.equal(tierOf(4),1);assert.equal(tierOf(29),1);assert.equal(tierOf(6),4);assert.equal(tierOf(9),4);assert.equal(tierOf(150),5);
// Les chances dépendent des statistiques de base : Pikachu bien plus fréquent que Dracaufeu, Tortank ≈ Dracaufeu.
assert.ok(pool[24].probability>20*pool[5].probability);assert.ok(Math.abs(pool[8].probability/pool[5].probability-1)<0.1);
for(let i=1;i<151;i++)if(baseTotals[i]>baseTotals[i-1]+70)assert.ok(pool[i].probability<pool[i-1].probability);
for(const step of itinerary.filter(s=>s.zone))assert.ok(zones.some(z=>z.id===step.zone));
assert.deepEqual(itinerary.filter(s=>s.zone).map(s=>s.zone),['route','route2','forest','route3','cave','route4']);
for(const id of ['route','forest','cave','power'])assert.ok(zones.some(z=>z.id===id),'Ancienne zone préservée : '+id);
for(const zone of zones){assert.ok(backgrounds[zone.id],'Arrière-plan manquant : '+zone.id);assert.ok(existsSync(new URL('../dist/'+backgroundFor(zone.id),import.meta.url)),'Fichier de fond introuvable : '+zone.id);}
assert.match(backgroundFor('cave'),/echocave\.png$/);
assert.match(backgroundFor('inconnue'),/beauplains\.png$/);
// Évolutions : chaque évolution pointe vers une espèce précédente existante, sans boucle.
for(const [to,from] of Object.entries(evolvesFrom)){assert.ok(pool.some(p=>p.id===+to)&&pool.some(p=>p.id===from));assert.ok(!ancestors(+to).includes(+to));}
assert.deepEqual(ancestors(6),[5,4]);assert.deepEqual(ancestors(4),[]);
assert.ok(sameLine(4,6)&&sameLine(6,4)&&!sameLine(4,7)&&!sameLine(134,135));
// Une évolution prend la place de la forme précédente dans l'équipe.
assert.deepEqual(teamAfterCapture([4],5),[5]);
assert.deepEqual(teamAfterCapture([25,4,1],5),[25,5,1]);
assert.deepEqual(teamAfterCapture([5],6),[6]);
assert.deepEqual(teamAfterCapture([4],6),[6]);
assert.deepEqual(teamAfterCapture([5],4),[5]);
assert.deepEqual(teamAfterCapture([25],4),[25,4]);
assert.deepEqual(teamAfterCapture([1,2,3,7,8,9],4),[1,2,3,7,8,9]);
assert.deepEqual(teamAfterCapture([133],134),[134]);
assert.deepEqual(teamAfterCapture([134],135),[134,135]);
assert.deepEqual(dedupeLines([4,5,25]),[5,25]);
assert.deepEqual(teamAfterEquip([6],4),[4]);
assert.deepEqual(teamAfterEquip([1,2,3,7,8,9],4),[1,2,3,7,8,9]);
assert.equal(maxHp(46),460);
// Niveaux : départ à 5 (ou au niveau d'évolution), plafond par stade, expérience par doublon.
assert.equal(START_LEVEL,5);
assert.equal(minLevel(4),5);assert.equal(minLevel(5),16);assert.equal(minLevel(6),36);
assert.equal(maxLevel(4),15);assert.equal(maxLevel(5),35);assert.equal(maxLevel(6),100);
assert.equal(maxLevel(133),35);assert.equal(minLevel(134),36);
assert.equal(maxLevel(25),35);
for(const p of pool){assert.ok(minLevel(p.id)>=5&&maxLevel(p.id)>=minLevel(p.id),'Paliers incohérents : '+p.name);}
// Une évolution commence là où le palier de sa forme précédente s'arrête.
for(const [to,from] of Object.entries(evolvesFrom))assert.equal(minLevel(+to),maxLevel(from)+1,'Palier : '+names[to-1]);
assert.equal(levelInfo(4,1).level,5);
assert.deepEqual([levelInfo(4,5).level,levelInfo(4,6).level],[5,6]); // 5 points d'expérience : niveau 6
assert.equal(levelInfo(4,20).level,8);assert.equal(levelInfo(4,20).xp,1);assert.equal(levelInfo(4,20).need,xpToNext(8));
assert.equal(levelInfo(4,100000).level,15);assert.ok(levelInfo(4,100000).capped); // bloqué tant qu'on ne tire pas Reptincel
assert.equal(levelInfo(6,1).level,36);
assert.equal(powerAt(4,5),powers[3]);assert.ok(powerAt(4,10)>powerAt(4,5)&&powerAt(4,15)>powerAt(4,10));
assert.ok(powers[0]>=250&&powers[0]<=1500,'Bulbizarre démarre vers 500');
assert.ok(powerAt(5,35)<powerAt(6,36),'Une évolution est plus puissante que la forme précédente à son plafond');
const legend=[144,145,146,150,151,149].reduce((n,id)=>n+powerAt(id,100),0);assert.ok(legend>=1e9&&legend<1e11,'Équipe de légendaires niv. 100 en milliards : '+legend);
for(let id=1;id<=151;id++)assert.ok(powerAt(id,100)>=powerAt(id,50));
// Combat : types, attaques apprises, dégâts, déroulement et expérience.
assert.equal(effectiveness('fire',['grass']),2);assert.equal(effectiveness('electric',['ground']),0);assert.equal(effectiveness('water',['fire','rock']),4);
const ls=[['scratch',1],['growl',1],['ember',7],['smokescreen',13],['rage',19],['slash',25]];
assert.deepEqual(knownMoves(ls,5),['scratch','growl']);assert.deepEqual(knownMoves(ls,19),['growl','ember','smokescreen','rage']);assert.deepEqual(nextMove(ls,5),{name:'ember',level:7});assert.equal(nextMove(ls,25),null);
assert.equal(computeStats(DEFAULT_BASE,100).hp,2*45+110);
const mv={name:'ember',fr:'Flammèche',power:40,acc:100,type:'fire',cls:'special'};
const A=makeFighter({id:4,name:'Salamèche',level:10,types:['fire'],base:{hp:39,atk:52,def:43,spa:60,spd:50,spe:65},moves:[mv]});
const B=makeFighter({id:1,name:'Bulbizarre',level:10,types:['grass','poison'],base:{hp:45,atk:49,def:49,spa:65,spd:65,spe:45},moves:[{name:'tackle',fr:'Charge',power:40,acc:100,type:'normal',cls:'physical'}]});
const d=damage(A,B,mv,()=>0.5);assert.ok(d.hit&&d.stab&&d.eff===2&&d.dmg>0);
assert.equal(damage(A,B,{...mv,acc:50},()=>0.9).hit,false);
assert.equal(isUsable({power:null,cls:'status'}),false);
const bt=createBattle([A],B,()=>0.1);let guard=0;while(!bt.over&&guard++<50)takeTurn(bt,mv);
assert.equal(bt.winner,'player');assert.equal(B.hp,0);assert.ok(xpReward(10)===10&&xpReward(1)===1);assert.equal(xpReward(30,8),90);assert.ok(xpReward(30,8)>xpReward(5,5)*10);assert.equal(xpReward(5,5),5);assert.ok(xpReward(10,40)<xpReward(10,10));
// IA : Pikachu face à Carapuce choisit Éclair plutôt que Vive-Attaque ; il ne gaspille pas un coup sans effet.
const pika=makeFighter({id:25,name:'Pikachu',level:10,types:['electric'],base:{hp:35,atk:55,def:40,spa:50,spd:50,spe:90},moves:[{name:'quick-attack',fr:'Vive-Attaque',power:40,acc:100,type:'normal',cls:'physical'},{name:'thunder-shock',fr:'Éclair',power:40,acc:100,type:'electric',cls:'special'},{name:'growl',fr:'Rugissement',power:null,acc:100,type:'normal',cls:'status'}]});
const squirtle=makeFighter({id:7,name:'Carapuce',level:10,types:['water'],base:{hp:44,atk:48,def:65,spa:50,spd:64,spe:43},moves:[]});
assert.equal(chooseAiMove(pika,squirtle,()=>0).name,'thunder-shock');
const diglett=makeFighter({id:50,name:'Taupiqueur',level:10,types:['ground'],base:{hp:10,atk:55,def:25,spa:35,spd:45,spe:95},moves:[]});
assert.equal(chooseAiMove(pika,diglett,()=>0).name,'quick-attack');
// Changement de Pokémon : l'adversaire attaque le nouveau venu, sans perdre de tour pour lui.
{const a=makeFighter({id:4,name:'A',level:10,types:['fire'],base:DEFAULT_BASE,moves:[mv]}),c=makeFighter({id:7,name:'C',level:10,types:['water'],base:DEFAULT_BASE,moves:[mv]}),w=makeFighter({id:25,name:'W',level:10,types:['electric'],base:DEFAULT_BASE,moves:[{name:'t',fr:'T',power:40,acc:100,type:'electric',cls:'special'}]});
const b=createBattle([a,c],w,()=>0.5);const ev=takeTurn(b,null,1);
assert.equal(b.active,1);assert.equal(ev[0].type,'switch');assert.equal(ev[1].target,'player');assert.equal(ev[1].targetName,'C');assert.equal(a.hp,a.maxHp);assert.ok(c.hp<c.maxHp);
assert.deepEqual(takeTurn(b,null,1),[]);}
const sp=parseSpecies({stats:[{base_stat:39,stat:{name:'hp'}},{base_stat:65,stat:{name:'speed'}}],moves:[{move:{name:'ember'},version_group_details:[{level_learned_at:7,move_learn_method:{name:'level-up'},version_group:{name:'red-blue'}}]},{move:{name:'scratch'},version_group_details:[{level_learned_at:1,move_learn_method:{name:'level-up'},version_group:{name:'red-blue'}},{level_learned_at:0,move_learn_method:{name:'machine'},version_group:{name:'red-blue'}}]}]});
assert.deepEqual(sp.learnset,[['scratch',1],['ember',7]]);assert.equal(sp.stats.spe,65);
assert.deepEqual(parseMove({name:'ember',power:40,accuracy:100,type:{name:'fire'},damage_class:{name:'special'},names:[{language:{name:'fr'},name:'Flammèche'}]}),{name:'ember',fr:'Flammèche',power:40,acc:100,type:'fire',cls:'special'});
for(const z of zones){for(let id=1;id<=151;id++)for(const r of [0,.5,.999]){const l=wildLevel(z.id,id,()=>r);if(l>z.levels[1]||l<z.levels[0])throw new Error('Niveau sauvage hors zone '+z.id+' #'+id);}}
if(wildLevel('route',101,()=>.999)>7)throw new Error('Électrode trop fort sur la Route 1');
if(zones.find(z=>z.id==='power').levels[1]!==100)throw new Error('Dernière zone ≠ 100');
console.log(`OK : 151 espèces, puissances, ${zones.length} zones normalisées, bonus de type, intervalles de tirage et parcours Kanto.`);

// Les limites de paliers et les préférences héritées ne doivent pas produire de progression invalide.
const {powerProgress,normalizePreferences}=await import('../dist/preferences.js');
assert.equal(powerProgress(99999).index,0);assert.equal(powerProgress(100000).index,1);
assert.equal(powerProgress(100000000).index,2);assert.equal(powerProgress(1000000000).index,3);
assert.equal(powerProgress(100000).percent,0);assert.equal(powerProgress(1000000000).next,null);
assert.equal(powerProgress(50000).remaining,50000);assert.equal(powerProgress(50000).percent,50);
for(const n of [-100,0,1,99999,100000,1e8,1e9,1e14,NaN]){const p=powerProgress(n);assert.ok(p.percent>=0&&p.percent<=100&&Number.isFinite(p.percent));}
assert.equal(normalizePreferences({theme:'light',quality:'eco',volume:0,sound:false}).volume,0);
assert.equal(normalizePreferences({sound:false}).sound,false);
assert.equal(normalizePreferences({volume:999,quality:'invalid'}).volume,100);
assert.equal(normalizePreferences({quality:'invalid'}).quality,'standard');
const {renderRetroNoise}=await import('../dist/audio.js');
const scratch=renderRetroNoise('scratch'),ember=renderRetroNoise('ember');
assert.notEqual(scratch.length,ember.length);
for(const samples of [scratch,ember]){assert.ok(samples.length>2000&&samples.length<22050);assert.ok(samples.some(v=>v!==0));assert.ok(samples.every(v=>Number.isFinite(v)&&Math.abs(v)<=.300001));}
const {effectKind}=await import('../dist/effects.js');
assert.equal(effectKind({moveKey:'scratch',moveType:'normal'}),'scratch');
assert.equal(effectKind({moveKey:'ember',moveType:'fire'}),'ember');
console.log('OK : paliers, validation des préférences et synthèse audio des attaques.');

// Le recadrage couvre toujours le cadre et permet d’atteindre les quatre bords.
const {cropRect}=await import('../dist/avatar.js');
for(const [w,h] of [[1200,800],[800,1200],[800,800]])for(const zoom of [1,2,4])for(const x of [-1,0,1])for(const y of [-1,0,1]){const r=cropRect(w,h,zoom,x,y);assert.ok(r.side>0&&r.sx>=0&&r.sy>=0);assert.ok(r.sx+r.side<=w+1e-8&&r.sy+r.side<=h+1e-8);}
assert.deepEqual(cropRect(1200,800,1,-1,0),{sx:0,sy:0,side:800});
assert.deepEqual(cropRect(1200,800,2,1,1),{sx:800,sy:400,side:400});
console.log('OK : recadrage des photos en portrait, paysage et carré.');

const {teamAfterDrop,TIER_NAMES}=await import('../dist/world.js');
assert.deepEqual(teamAfterDrop([1,4,7],7,0),[7,4,1]);
assert.deepEqual(teamAfterDrop([1,4,7],25,5),[1,4,7,25]);
assert.deepEqual(teamAfterDrop([1,4,7,19,23,29],25,2),[1,4,25,19,23,29]);
assert.deepEqual(teamAfterDrop([1,4,7,19,23,29],5,0),[5,7,19,23,29]);
assert.deepEqual(teamAfterDrop([1,4],4,1),[1,4]);
assert.deepEqual(teamAfterDrop([1,4],25,-1),[1,4]);
assert.equal(TIER_NAMES[3],'Rares');
assert.equal(TIER_NAMES[4],'Épiques');
for(const id of [144,145,146,150,151])assert.ok(zonePool('power').some(p=>p.id===id&&p.tier===5));
assert.deepEqual([...new Set(zonePool('power').map(p=>p.tier))].sort(),[1,2,3,4,5]);
console.log('OK : dépôts, échanges, remplacement de lignée et cinq catégories à la Centrale.');

const {opaqueBounds,centeredOffset,combatPositions}=await import('../dist/sprite-centering.js');
const pixels=new Uint8ClampedArray(10*8*4);for(let y=1;y<5;y++)for(let x=6;x<9;x++)pixels[(y*10+x)*4+3]=255;
const bounds=opaqueBounds(pixels,10,8);assert.deepEqual(bounds,{left:6,top:1,width:3,height:4});
assert.deepEqual(centeredOffset(bounds,10,8),{x:-2.5,y:1});assert.equal(opaqueBounds(new Uint8Array(16),2,2),null);
for(const [w,h,strip,hp,card] of [[1766,495,110,60,110],[1280,400,118,60,96],[390,320,155,50,65],[740,230,100,45,65]])for(const p of Object.values(combatPositions(w,h,strip,hp,card))){assert.ok(p.left>=0&&p.top>=0&&p.size>=0);assert.ok(p.left+p.size<=w+.01);assert.ok(p.top+p.size<=h-strip+.01);}
console.log('OK : centrage des pixels visibles et combattants contenus dans l’arène.');

// IV/EV modernes : tirages, migration, plafonds et effets réels sur les stats.
const training=await import('../dist/training.js');
const zeroTraining=training.createTraining(()=>0),perfectTraining=training.createTraining(()=>.999999);
assert.ok(training.STAT_KEYS.every(k=>zeroTraining.ivs[k]===0&&perfectTraining.ivs[k]===31));
assert.equal(training.totalEVs(zeroTraining.evs),0);
const migrated=training.migrateTraining({4:10,25:2},{4:{ivs:{hp:31,atk:0},evs:{hp:999,atk:252,def:252,spe:NaN}},999:{ivs:{}}},()=>.5);
assert.deepEqual(Object.keys(migrated),['4','25']);assert.equal(migrated[4].ivs.hp,31);assert.equal(migrated[4].ivs.atk,0);assert.equal(migrated[4].ivs.def,16);
assert.deepEqual(migrated[4].evs,{hp:252,atk:252,def:6,spa:0,spd:0,spe:0});
assert.deepEqual(training.migrateTraining({4:10,25:2},JSON.parse(JSON.stringify(migrated)),()=>0),migrated);
assert.equal(training.totalEVs(training.normalizeEVs({hp:-5,atk:Infinity,def:'252',spa:12.9,spd:NaN})),12);
for(let id=1;id<=151;id++){const yieldStats=training.effortYield(id),sum=training.totalEVs(yieldStats);assert.ok(sum>=1&&sum<=3);}
assert.equal(training.effortYield(19).spe,1);assert.equal(training.effortYield(4).spe,1);assert.equal(training.effortYield(1).spa,1);
const baseTraining={ivs:{...perfectTraining.ivs},evs:{hp:252,atk:251,def:0,spa:0,spd:0,spe:6}};
const award=training.gainEVs(baseTraining,{hp:1,atk:3,spe:2});assert.equal(award.record.evs.atk,252);assert.equal(award.gained.atk,1);assert.equal(award.gained.spe,0);assert.equal(training.totalEVs(award.record.evs),510);assert.deepEqual(award.record.ivs,baseTraining.ivs);assert.equal(baseTraining.evs.atk,251);
let trained=training.createTraining(()=>0);for(let i=0;i<1000;i++)trained=training.gainEVs(trained,training.effortYield(19)).record;assert.equal(trained.evs.spe,252);assert.equal(training.totalEVs(trained.evs),252);
const perfectEV={ivs:perfectTraining.ivs,evs:{hp:252,atk:252,def:6,spa:0,spd:0,spe:0}};
const fullStats=computeStats(DEFAULT_BASE,100,perfectEV),plainStats=computeStats(DEFAULT_BASE,100,perfectTraining);
assert.equal(fullStats.hp,294);assert.equal(fullStats.atk,197);assert.equal(fullStats.def,135);assert.equal(fullStats.spa,134);assert.equal(fullStats.hp-plainStats.hp,63);
assert.equal(computeStats(DEFAULT_BASE,50,perfectEV).hp,152);assert.equal(computeStats(DEFAULT_BASE,50,perfectEV).atk,101);
assert.equal(makeFighter({id:1,name:'IV test',level:100,types:['grass'],base:DEFAULT_BASE,moves:[],training:perfectEV}).maxHp,294);
const parsedEffort=parseSpecies({id:4,stats:[{base_stat:65,effort:1,stat:{name:'speed'}}],moves:[]});assert.equal(parsedEffort.evYield.spe,1);
const {radarMarkup}=await import('../dist/training-ui.js');assert.ok(radarMarkup(zeroTraining.evs,252,'ev').includes('0 / 252'));assert.ok(!radarMarkup(perfectTraining.ivs,31,'iv').includes('NaN'));
console.log('OK : IV 0–31, migration stable, EV 252/510, gains des 151 espèces, stats et radar.');

const shiny=await import('../dist/shiny.js');
const {sprite:formSprite}=await import('../dist/pokemon.js');
assert.equal(shiny.SHINY_CHANCE,1/4096);
assert.equal(Array.from({length:4096},(_,i)=>shiny.rollShiny(i/4096)).filter(Boolean).length,1);
assert.equal(shiny.rollShiny(0),true);assert.equal(shiny.rollShiny(1/4096-Number.EPSILON),true);
assert.equal(shiny.rollShiny(1/4096),false);assert.equal(shiny.rollShiny(1),false);assert.equal(shiny.rollShiny(-1),false);
const legacyForms=shiny.migrateShinies({4:10,25:2});
assert.deepEqual(legacyForms,{shinyCounts:{},appearance:{}});
const savedForms=shiny.migrateShinies({4:10,25:2},{4:3,25:999,1:4,3:-1,5:'2'},{4:'shiny',25:'normal'});
assert.deepEqual(savedForms,{shinyCounts:{4:3,25:2},appearance:{4:'shiny',25:'shiny'}});
assert.deepEqual(shiny.migrateShinies({4:10,25:2},savedForms.shinyCounts,savedForms.appearance),savedForms);
const forms={counts:{4:10},...legacyForms};
assert.equal(shiny.formCount(forms,4),10);assert.equal(shiny.selectedShiny(forms,4),false);
shiny.recordForm(forms,4,true);assert.equal(forms.counts[4],11);assert.equal(shiny.formCount(forms,4),10);assert.equal(shiny.formCount(forms,4,true),1);assert.equal(shiny.selectedShiny(forms,4),true);
shiny.recordForm(forms,4,false);assert.equal(shiny.formCount(forms,4),11);assert.equal(shiny.formCount(forms,4,true),1);assert.equal(shiny.selectedShiny(forms,4),true);
forms.appearance[4]='normal';shiny.recordForm(forms,4,true);assert.equal(shiny.selectedShiny(forms,4),false);
shiny.recordForm(forms,25,true);assert.equal(shiny.formCount(forms,25),0);assert.equal(shiny.selectedShiny(forms,25),true);
for(const zone of zones){const entries=zonePool(zone.id);let formSum=0;for(const p of entries){assert.equal(shiny.formProbability(p.probability,true),p.probability/4096);formSum+=shiny.formProbability(p.probability,true)+shiny.formProbability(p.probability,false);}assert.ok(Math.abs(formSum-1)<1e-12);}
for(let id=1;id<=151;id++){assert.ok(formSprite(id,true).endsWith('/shiny/'+id+'.png'));assert.ok(formSprite(id,true,true).endsWith('/back/shiny/'+id+'.png'));assert.ok(formSprite(id).endsWith('/pokemon/'+id+'.png'));}
{const cur={ivs:{hp:7,atk:20,def:3,spa:31,spd:0,spe:15},evs:{hp:10,atk:0,def:0,spa:0,spd:0,spe:0}},got={ivs:{hp:9,atk:5,def:3,spa:30,spd:12,spe:15},evs:{hp:0,atk:0,def:0,spa:0,spd:0,spe:0}};
 const m=training.mergeBestIVs(cur,got);assert.deepEqual(m.record.ivs,{hp:9,atk:20,def:3,spa:31,spd:12,spe:15});assert.deepEqual(m.record.evs,cur.evs);
 assert.deepEqual(m.improved.map(x=>x.key+':'+x.from+'>'+x.to),['hp:7>9','spd:0>12']);assert.equal(training.mergeBestIVs(cur,{ivs:{hp:1}}).improved.length,0);assert.equal(cur.ivs.hp,7);}
{
  const {boostStats, SHINY_BOOST, computeStats: cs, DEFAULT_BASE} = await import('../dist/battle.js');
  const b = cs(DEFAULT_BASE, 20, {});
  const x = boostStats(b, SHINY_BOOST);
  for (const k of Object.keys(b)) if (x[k] !== Math.floor(b[k] * 1.5)) throw new Error('boost chromatique ' + k);
  if (boostStats(b, 1) !== b) throw new Error('boost 1 doit rester neutre');
}
{
  const {victoryMoney, captureMoney, FIRST_CATCH, SHINY_REWARD, sanitizeMoney} = await import('../dist/money.js');
  if (victoryMoney(1, 5) !== 80 || victoryMoney(5, 100) !== 9900) throw new Error('gains de combat');
  if (!(victoryMoney(2, 10) > victoryMoney(1, 10) && victoryMoney(4, 10) > victoryMoney(3, 10))) throw new Error('gains croissants selon la rareté');
  if (captureMoney(3, true, false) !== FIRST_CATCH[3] || captureMoney(3, false, false) !== 0) throw new Error('prime de première capture');
  if (captureMoney(1, false, true) !== SHINY_REWARD || captureMoney(1, true, true) !== FIRST_CATCH[1] + SHINY_REWARD) throw new Error('prime chromatique');
  if (sanitizeMoney(-5) !== 0 || sanitizeMoney('x') !== 0 || sanitizeMoney(120) !== 120) throw new Error('sauvegarde de l’argent');
}
{
  const shop = await import('../dist/shop.js'), world = await import('../dist/world.js'), sh = await import('../dist/shiny.js');
  const st = () => ({money:0, inv:shop.defaultInv(), kills:{}});
  // achats
  let s = st(); s.money = 7500;
  if (!shop.buyItem(s, 'super').ok || s.money !== 0 || s.inv.ball !== 'super') throw new Error('achat de la Super Ball');
  if (shop.buyItem(s, 'super').reason !== 'owned') throw new Error('doublon');
  if (shop.buyItem(s, 'hyper').reason !== 'money') throw new Error('argent insuffisant');
  s.money = 90000; shop.buyItem(s, 'hyper'); if (s.inv.ball !== 'hyper') throw new Error('Hyper Ball équipée');
  if (!shop.equipBall(s, 'super') || s.inv.ball !== 'super' || shop.equipBall(st(), 'hyper')) throw new Error('équipement des balls');
  // effets passifs actifs dès l'achat
  s = st(); s.money = 5e6; ['xp', 'rune', 'chroma'].forEach(id => shop.buyItem(s, id));
  if (shop.xpMultiplier(s.inv) !== 1.5 || shop.moneyMultiplier(s.inv) !== 2 || shop.shinyDenominator(s.inv) !== 2048) throw new Error('effets passifs');
  if (shop.xpMultiplier(shop.defaultInv()) !== 1 || shop.shinyDenominator(shop.defaultInv()) !== 4096) throw new Error('effets par défaut');
  // déblocage : 3 victoires dans la zone précédente
  const jade = shop.shopById('jade');
  if (shop.shopOpen({forest:2}, jade) || !shop.shopOpen({forest:3}, jade) || shop.shopOpen({route:9}, jade)) throw new Error('déblocage de la boutique');
  // sauvegarde assainie
  const clean = shop.sanitizeInv({owned:{super:true, bogus:true, poke:true}, ball:'hyper'});
  if (clean.owned.bogus || clean.ball !== 'poke' || !clean.owned.super) throw new Error('inventaire assaini');
  // bonus de rareté : total 100 %, Communs en baisse, rien à changer en Route 1
  const base = world.zonePool('forest'), boosted = world.zonePool('forest', .6), sum = a => a.reduce((x, p) => x + p.probability, 0);
  const tierSum = (a, t) => a.filter(p => p.tier === t).reduce((x, p) => x + p.probability, 0);
  if (Math.abs(sum(boosted) - 1) > 1e-9 || !(tierSum(boosted, 3) > tierSum(base, 3)) || !(tierSum(boosted, 1) < tierSum(base, 1))) throw new Error('bonus de rareté');
  if (Math.abs(tierSum(world.zonePool('route', .6), 1) - 1) > 1e-9) throw new Error('Route 1 inchangée');
  // charme chroma
  sh.setShinyDenominator(2048); if (!sh.rollShiny(1 / 2048 - 1e-9) || sh.rollShiny(1 / 2048)) throw new Error('charme chroma'); sh.setShinyDenominator(4096);
  if (sh.rollShiny(1 / 4096)) throw new Error('retour au 1/4096');
}
{
  const shop = await import('../dist/shop.js');
  if (shop.shopById('jade').stock.join() !== 'super,xp' || shop.shopById('sud').stock.join() !== 'hyper,rune,chroma') throw new Error('stock des boutiques');
}
console.log('OK : chromatiques 1/4096 exact, limites, migration et comptages distincts, apparence persistante, 151 sprites face/dos et probabilités combinées normalisées.');
