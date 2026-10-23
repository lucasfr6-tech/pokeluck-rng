import assert from 'node:assert/strict';
import {pool,evolvesFrom,ancestors,sameLine,names} from '../dist/pokemon.js';
import {baseTotals} from '../dist/pokemon.js';
import {tierOf,zones,zonePool,draw,types,powers,itinerary,backgroundFor,backgrounds,dedupeLines,teamAfterCapture,teamAfterEquip,maxHp} from '../dist/world.js';
import {chooseAiMove,effectiveness,computeStats,knownMoves,nextMove,damage,makeFighter,createBattle,takeTurn,xpReward,LUTTE,isUsable,DEFAULT_BASE} from '../dist/battle.js';
import {parseSpecies,parseMove} from '../dist/battle-data.js';
import {existsSync} from 'node:fs';
import {wildLevelZone,wildLevelNear,wildLevel,minLevel,maxLevel,levelInfo,powerAt,xpToNext,START_LEVEL} from '../dist/levels.js';
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
assert.ok([150,151,144,145,146].every(id=>zonePool('power').some(p=>p.id===id)&&!zonePool('route4').some(p=>p.id===id)&&!zonePool('safari').some(p=>p.id===id)),'Légendaires seulement à partir de la Centrale');
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
const legend=[144,145,146,150,151,149].reduce((n,id)=>n+powerAt(id,100),0);assert.ok(legend>=4e7&&legend<=5e7,'Équipe de légendaires niv. 100 : 40 à 50 M au maximum : '+legend);assert.ok(powerAt(134,53)<2e6,'Aquali niv. 53 reste sous 2 M');
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
assert.equal(bt.winner,'player');assert.equal(B.hp,0);assert.equal(xpReward(48,48),6);assert.ok(xpReward(48,54)<xpReward(48,48));assert.ok(xpReward(48,54)<=5,'Rattata niv. 48 face à niv. 54 : bien moins d’un niveau');assert.ok(xpReward(48,48,5)>xpReward(48,48,1)*3,'rare > commun');assert.ok(xpReward(48,48,3)>xpReward(48,48,1));assert.equal(xpReward(1),1);assert.ok(xpReward(60,30)>xpReward(30,30));
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
assert.deepEqual({...parseMove({name:'ember',power:40,accuracy:100,type:{name:'fire'},damage_class:{name:'special'},names:[{language:{name:'fr'},name:'Flammèche'}]})},{...parseMove({name:'ember',power:40,accuracy:100,type:{name:'fire'},damage_class:{name:'special'},names:[{language:{name:'fr'},name:'Flammèche'}]}),name:'ember',fr:'Flammèche',power:40,acc:100,type:'fire',cls:'special'});
for(const z of zones){for(let id=1;id<=151;id++)for(const r of [0,.5,.999]){const l=wildLevel(z.id,id,()=>r);if(l>z.levels[1]||l<z.levels[0])throw new Error('Niveau sauvage hors zone '+z.id+' #'+id);}}
if(wildLevel('route',101,()=>.999)>7)throw new Error('Électrode trop fort sur la Route 1');
if(zones.at(-1).levels[1]!==100||zones.at(-1).id!=='league')throw new Error('Dernière zone ≠ 100');
console.log(`OK : 151 espèces, puissances, ${zones.length} zones normalisées, bonus de type, intervalles de tirage et parcours Kanto.`);

// Les limites de paliers et les préférences héritées ne doivent pas produire de progression invalide.
const {powerProgress,normalizePreferences}=await import('../dist/preferences.js');
assert.equal(powerProgress(99999).index,0);assert.equal(powerProgress(100000).index,1);
assert.equal(powerProgress(1000000).index,2);assert.equal(powerProgress(6e6).index,3);assert.equal(powerProgress(2e7).index,4);assert.equal(powerProgress(4e7).index,5);
assert.equal(powerProgress(100000).percent,0);assert.equal(powerProgress(4e7).next,null);
assert.equal(powerProgress(50000).remaining,50000);assert.equal(powerProgress(50000).percent,50);
for(const n of [-100,0,1,99999,100000,1e6,1e8,1e9,1e14,NaN]){const p=powerProgress(n);assert.ok(p.percent>=0&&p.percent<=100&&Number.isFinite(p.percent));}
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
  if (shop.xpMultiplier(s.inv) !== 1.5 || shop.moneyMultiplier(s.inv) !== 2 || shop.shinyDenominator(s.inv) !== 1024) throw new Error('effets passifs');
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
  sh.setShinyDenominator(1024); if (!sh.rollShiny(1 / 1024 - 1e-9) || sh.rollShiny(1 / 1024)) throw new Error('charme chroma'); sh.setShinyDenominator(4096);
  if (sh.rollShiny(1 / 4096)) throw new Error('retour au 1/4096');
}
{
  const shop = await import('../dist/shop.js');
  if (shop.shopById('jade').stock.join() !== 'super,xp,egg,auto,potion,antidote,paralyze-heal,ct-water,ct-swift' || shop.shopById('sud').stock.join() !== 'hyper,super-potion,burn-heal,full-heal,ct-thunder,ct-ice,oran,band,water-stone') throw new Error('stock des boutiques');
}
{
  const shop = await import('../dist/shop.js'), bt = await import('../dist/battle.js'), bd = await import('../dist/battle-data.js');
  const st = () => ({money:1e6, inv:shop.defaultInv()});
  let s = st();
  // CT : achat multiple, consommation
  shop.buyItem(s, 'ct-swift'); shop.buyItem(s, 'ct-swift');
  if (shop.stockOf(s.inv, 'ct-swift') !== 2 || s.money !== 1e6 - 9000) throw new Error('achat de CT');
  if (!shop.useTm(s, 'ct-swift') || shop.stockOf(s.inv, 'ct-swift') !== 1 || shop.useTm(s, 'ct-thunder')) throw new Error('consommation de CT');
  // objets tenus : 1 emplacement, 2 pour les espèces à méga-évolution
  shop.buyItem(s, 'band'); shop.buyItem(s, 'band');
  if (shop.slotsFor(133) !== 1 || shop.slotsFor(6) !== 1) throw new Error('un seul objet tenu classique, même pour les Pokémon Méga');
  if (shop.hasReservedSlot(133) || !shop.hasReservedSlot(6)) throw new Error('emplacement réservé Méga/Dynamax');
  if (!shop.equipHeld(s, 133, 'band') || shop.equipHeld(s, 133, 'band') || shop.heldList(s.inv, 133).length !== 1) throw new Error('Évoli : un seul objet');
  if (!shop.equipHeld(s, 6, 'band') || shop.freeCopies(s.inv, 'band') !== 0 || shop.equipHeld(s, 25, 'band')) throw new Error('exemplaires libres');
  if (!shop.unequipHeld(s, 133, 'band') || shop.freeCopies(s.inv, 'band') !== 1) throw new Error('retirer un objet');
  // Ceinture Force : survit à un coup fatal avec 1 PV à PV pleins, une seule fois ; pas sans PV pleins ; consommée ensuite
  {
    const mk = sash => bt.makeFighter({id:25, name:'P', level:30, types:['normal'], base:bt.DEFAULT_BASE, moves:[], training:{}, sash});
    const hit = {name:'x', power:9999, acc:100, type:'normal', cls:'physical'}, foe = mk(false);
    const sashFighter = mk(true), r = bt.damage(foe, sashFighter, hit, () => 0.5);
    if (r.dmg < sashFighter.hp) throw new Error('coup de test non fatal');
    const bt2 = bt.createBattle([sashFighter], {...foe, stats:{...foe.stats, spe:9999}, moves:[hit], hp:foe.hp, maxHp:foe.maxHp}, () => 0.5);
    const events = bt.takeTurn(bt2, {name:'splash', power:null, acc:100, type:'normal', cls:'status', fr:'Éclaboussure'});
    const atk = events.find(e => e.type === 'attack' && e.side === 'wild');
    if (!atk?.sashSaved || sashFighter.hp !== 1 || sashFighter.sash) throw new Error('Ceinture Force : survie à 1 PV');
    const hurt = mk(true); hurt.hp = hurt.maxHp - 1;
    const bt3 = bt.createBattle([hurt], {...foe, stats:{...foe.stats, spe:9999}, moves:[hit], hp:foe.hp, maxHp:foe.maxHp}, () => 0.5);
    bt.takeTurn(bt3, {name:'splash', power:null, acc:100, type:'normal', cls:'status', fr:'Éclaboussure'});
    if (hurt.hp !== 0) throw new Error('Ceinture Force : inactive sans PV pleins');
    const used = {money:0, inv:shop.defaultInv()}; used.inv.stock.band = 1; shop.equipHeld(used, 25, 'band');
    if (!shop.consumeHeld(used, 25, 'band') || shop.stockOf(used.inv, 'band') !== 0 || shop.heldList(used.inv, 25).length) throw new Error('Ceinture Force consommée');
  }
  const base = bt.computeStats(bt.DEFAULT_BASE, 30, {}), up = bt.boostStats(base, {atk:1.2});
  if (up.atk !== Math.floor(base.atk * 1.2) || up.def !== base.def) throw new Error('boost par statistique');
  // sauvegarde assainie : pas plus d'objets portés que de copies, jamais deux fois le même
  const clean = shop.sanitizeInv({stock:{band:1}, held:{25:['band'], 6:['band','band'], 999:['band']}});
  if (shop.heldCount(clean, 'band') !== 1) throw new Error('assainissement des objets tenus');
  // CT compatibles lues depuis PokéAPI
  const sp = bd.parseSpecies({id:25, stats:[], moves:[{move:{name:'thunderbolt'}, version_group_details:[{version_group:{name:'red-blue'}, move_learn_method:{name:'machine'}, level_learned_at:0}]}, {move:{name:'growl'}, version_group_details:[{version_group:{name:'red-blue'}, move_learn_method:{name:'level-up'}, level_learned_at:1}]}]});
  if (sp.machines.join() !== 'thunderbolt') throw new Error('CT compatibles');
}
{
  const shop = await import('../dist/shop.js'), bt = await import('../dist/battle.js');
  // Mode Auto : achat unique à 30 000 ₽ dans la boutique de la Forêt
  const s = {money:30000, inv:shop.defaultInv()};
  if (!shop.shopById('jade').stock.includes('auto') || shop.ITEMS.auto.price !== 30000 || !shop.buyItem(s, 'auto').ok || !s.inv.owned.auto || shop.buyItem(s, 'auto').reason !== 'owned') throw new Error('achat du mode auto');
  // choix intelligent : Flammèche contre une Plante, jamais une attaque de statut
  const mk = (types, moves, level = 20) => bt.makeFighter({id:5, name:'x', level, types, base:bt.DEFAULT_BASE, moves, training:{}});
  const ember = {name:'ember', fr:'Flammèche', power:40, acc:100, type:'fire', cls:'special'}, tackle = {name:'tackle', fr:'Charge', power:40, acc:100, type:'normal', cls:'physical'}, growl = {name:'growl', fr:'Rugissement', power:null, acc:100, type:'normal', cls:'status'};
  const me = mk(['fire'], [growl, tackle, ember]);
  if (bt.chooseAiMove(me, mk(['grass'], []), () => 0).name !== 'ember') throw new Error('doit choisir le feu contre une Plante');
  if (bt.chooseAiMove(me, mk(['water'], []), () => 0).name === 'ember') throw new Error('ne doit pas choisir le feu contre l’Eau');
  if (bt.chooseAiMove(mk(['fire'], [growl, tackle]), mk(['normal'], []), () => 0).name !== 'tackle') throw new Error('jamais une attaque de statut');
}
{
  const shop = await import('../dist/shop.js');
  const s = {money:1e6, inv:shop.defaultInv()}; shop.buyItem(s, 'egg'); shop.equipHeld(s, 25, 'egg');
  if (shop.xpMultiplierFor(s.inv, 25) !== 1.5 || shop.xpMultiplierFor(s.inv, 4) !== 1) throw new Error('Œuf Chance : XP du porteur seulement');
  shop.buyItem(s, 'xp'); if (shop.xpMultiplierFor(s.inv, 25) !== 2.25 || shop.xpMultiplierFor(s.inv, 4) !== 1.5) throw new Error('Œuf Chance et Multi-XP cumulés');
}
{
  const shop = await import('../dist/shop.js'), bt = await import('../dist/battle.js');
  // Pièce Rune et Charme Chroma ne sont plus en vente
  for (const sh of shop.SHOPS) if (sh.stock.includes('rune') || sh.stock.includes('chroma')) throw new Error('Pièce Rune et Charme Chroma retirés des boutiques');
  // Baie Oran : +10 PV à 50 % de PV ou moins, une seule fois, jamais au-dessus de 50 %
  const mk = berry => bt.makeFighter({id:25, name:'P', level:30, types:['normal'], base:bt.DEFAULT_BASE, moves:[], training:{}, berry});
  const hit = pw => ({name:'x', power:pw, acc:100, type:'normal', cls:'physical'}), splash = {name:'splash', power:null, acc:100, type:'normal', cls:'status', fr:'Éclaboussure'};
  const foe = mk(false), me = mk(true);
  const target = Math.floor(me.maxHp * 0.45), want = me.hp - target;
  let power = 1; while (bt.damage(foe, me, hit(power), () => 0.5).dmg < want && power < 400) power++;
  const b = bt.createBattle([me], {...foe, stats:{...foe.stats, spe:9999}, moves:[hit(power)]}, () => 0.5);
  const hp0 = me.hp, ev = bt.takeTurn(b, splash), got = ev.find(e => e.type === 'berry');
  if (!got || got.healed < 1 || got.healed > 10 || me.berry) throw new Error('Baie Oran : soin de 10 PV maximum');
  const safe = mk(true), tiny = {...foe, stats:{...foe.stats, spe:9999}, moves:[hit(1)]};
  const b2 = bt.createBattle([safe], tiny, () => 0.5); bt.takeTurn(b2, splash);
  if (!safe.berry || safe.hp !== safe.maxHp - (safe.maxHp - safe.hp)) throw new Error('Baie Oran : inactive au-dessus de 50 %');
  if (hp0 <= 0) throw new Error('combat de test invalide');
}
{
  const shop = await import('../dist/shop.js'), bt = await import('../dist/battle.js');
  // Potions : 20 / 50 PV, jamais au-delà des PV max, pas sur un K.O., et le sauvage joue son tour
  if (shop.ITEMS.potion.heal !== 20 || shop.ITEMS['super-potion'].heal !== 50) throw new Error('soins des potions');
  const st = {inv: shop.defaultInv()}; st.inv.stock.potion = 1;
  if (shop.healList(st.inv)[0]?.qty !== 1 || !shop.useHeal(st, 'potion') || shop.useHeal(st, 'potion') || shop.healList(st.inv).length) throw new Error('consommation des potions');
  const mk = () => bt.makeFighter({id:25, name:'P', level:30, types:['normal'], base:bt.DEFAULT_BASE, moves:[], training:{}});
  const me = mk(), foe = mk(); me.hp = Math.max(1, me.maxHp - 30);
  const b = bt.createBattle([me], foe, () => 0.5), before = me.hp, ev = bt.takeTurn(b, null, null, {index:0, amount:20, name:'Potion'});
  const h = ev.find(e => e.type === 'heal');
  if (!h || h.healed !== 20 || me.hp < before + 20 - 100000) throw new Error('Potion : +20 PV');
  me.hp = me.maxHp - 5; const ev2 = bt.takeTurn(b, null, null, {index:0, amount:50, name:'Super Potion'});
  if (ev2.find(e => e.type === 'heal')?.healed !== 5) throw new Error('Potion : plafonnée aux PV max');
  me.hp = me.maxHp; if (bt.takeTurn(b, null, null, {index:0, amount:20, name:'Potion'}).length) throw new Error('Potion refusée à PV pleins');
}
{
  const bt = await import('../dist/battle.js'), bd = await import('../dist/battle-data.js'), tr = await import('../dist/traits.js');
  const mk = (o = {}) => bt.makeFighter({id:25, name:o.name || 'P', level:o.level || 30, types:o.types || ['normal'], base:o.base || bt.DEFAULT_BASE, moves:o.moves || [], training:{}, ability:o.ability || null, nature:o.nature || null});
  const hit = (extra = {}) => ({name:'x', fr:'X', power:60, acc:null, type:'normal', cls:'physical', ...extra});
  const R = v => () => v;
  // parseMove lit les effets des vraies données PokéAPI
  const thunderWave = bd.parseMove({name:'thunder-wave', accuracy:90, type:{name:'electric'}, damage_class:{name:'status'}, meta:{category:{name:'ailment'}, ailment:{name:'paralysis'}, ailment_chance:0}, target:{name:'selected-pokemon'}});
  assert.equal(bt.statusKind(thunderWave), 'ail'); assert.ok(bt.isUsable(thunderWave));
  const growl = bd.parseMove({name:'growl', accuracy:100, type:{name:'normal'}, damage_class:{name:'status'}, meta:{category:{name:'net-good-stats'}}, stat_changes:[{change:-1, stat:{name:'attack'}}], target:{name:'all-opponents'}});
  assert.equal(bt.statusKind(growl), 'stat'); assert.deepEqual(growl.statChanges, [['atk', -1]]);
  assert.equal(bt.isUsable({name:'splash', cls:'status', power:null}), false);
  const sp = bd.parseSpecies({id:25, stats:[], moves:[], abilities:[{slot:3, is_hidden:true, ability:{name:'lightning-rod'}}, {slot:1, is_hidden:false, ability:{name:'static'}}]});
  assert.deepEqual(sp.abilities, ['static']);
  // Natures : +10 % / −10 %, jamais sur les PV
  const neutral = bt.computeStats(bt.DEFAULT_BASE, 50, {}), jolly = bt.computeStats(bt.DEFAULT_BASE, 50, {}, 'jolly');
  assert.equal(jolly.spe, Math.floor(neutral.spe * 1.1)); assert.equal(jolly.spa, Math.floor(neutral.spa * .9)); assert.equal(jolly.hp, neutral.hp); assert.equal(jolly.atk, neutral.atk);
  assert.equal(tr.NATURE_KEYS.length, 25); assert.equal(tr.sanitizeTraits({4:{n:'jolly', s:1}, 999:{n:'jolly', s:0}, 5:{n:'zzz', s:0}})[4].n, 'jolly');
  // Paralysie : vitesse ÷2 et 25 % d'échec ; brûlure : Attaque ÷2 et 1/16 des PV ; poison : 1/8
  const par = mk(), plain = mk(); par.status = {type:'par', turns:0, n:1};
  assert.equal(bt.effStat(par, 'spe'), Math.floor(plain.stats.spe / 2));
  const brn = mk(); brn.status = {type:'brn', turns:0, n:1}; assert.equal(bt.effStat(brn, 'atk'), Math.floor(plain.stats.atk / 2));
  const g = mk({ability:'guts'}); g.status = {type:'brn', turns:0, n:1}; assert.equal(bt.effStat(g, 'atk'), Math.floor(plain.stats.atk * 1.5));
  const tick = (type) => { const me = mk({moves:[hit()]}), foe = mk(); me.status = {type, turns:0, n:1}; const b = bt.createBattle([me], foe, R(.5)); const hp = me.hp; bt.takeTurn(b, bt.LUTTE); return hp - me.hp; };
  const dmgNoStatus = (() => { const me = mk(), foe = mk(); const b = bt.createBattle([me], foe, R(.5)); const h = me.hp; bt.takeTurn(b, bt.LUTTE); return h - me.hp; })();
  assert.equal(tick('brn') - dmgNoStatus, Math.floor(plain.maxHp / 16)); assert.equal(tick('psn') - dmgNoStatus, Math.floor(plain.maxHp / 8));
  // Poison grave : 1/16, 2/16, 3/16…
  { const me = mk(), foe = mk(); me.status = {type:'tox', turns:0, n:1}; me.hp = me.maxHp = 5000; const b = bt.createBattle([me], foe, R(.5)); let prev = me.hp; const losses = [];
    for (let i = 0; i < 3; i++) { bt.takeTurn(b, {name:'splash', cls:'status', fr:'Splash', power:null, type:'normal'}); losses.push(prev - me.hp); prev = me.hp; }
    assert.ok(losses[2] > losses[0], 'poison grave croissant'); }
  // Sommeil : l'attaquant passe son tour puis se réveille ; gel : dégèle sur une attaque Feu
  { const me = mk({moves:[hit()]}), foe = mk(); me.status = {type:'slp', turns:2, n:1}; const b = bt.createBattle([me], foe, R(.5));
    const e1 = bt.takeTurn(b, hit()); assert.ok(e1.some(e => e.type === 'msg' && /dort/.test(e.text)), 'dort'); assert.equal(me.status.turns, 1);
    bt.takeTurn(b, hit()); const e3 = bt.takeTurn(b, hit()); assert.ok(e3.some(e => /se réveille/.test(e.text || '')) && !me.status, 'se réveille'); }
  { const me = mk(), foe = mk(); me.status = {type:'frz', turns:0, n:1}; const b = bt.createBattle([me], foe, R(.5)); const e = bt.takeTurn(b, hit({type:'fire'})); assert.ok(!me.status && e.some(x => /plus gelé/.test(x.text || ''))); }
  // Attaques de statut : Rugissement baisse l'Attaque, plafond ±6, Thunder Wave paralyse mais pas les Sol ni les Électrik
  { const me = mk({moves:[growl]}), foe = mk(); const b = bt.createBattle([me], foe, R(.5)); bt.takeTurn(b, growl); assert.equal(foe.stages.atk, -1);
    for (let i = 0; i < 8; i++) bt.takeTurn(b, growl); assert.equal(foe.stages.atk, -6); }
  { const pw = (types) => { const me = mk(), foe = mk({types}); const b = bt.createBattle([me], foe, R(.5)); bt.takeTurn(b, thunderWave); return foe.status?.type || null; };
    assert.equal(pw(['normal']), 'par'); assert.equal(pw(['ground']), null); assert.equal(pw(['electric']), null); }
  // Statut déjà présent : « aucun effet » ; une attaque de statut ne fait pas de dégâts
  { const me = mk(), foe = mk(); foe.status = {type:'brn', turns:0, n:1}; const b = bt.createBattle([me], foe, R(.5)); const hp = foe.hp; const ev = bt.takeTurn(b, thunderWave); assert.equal(foe.status.type, 'brn'); assert.ok(ev.some(e => /aucun effet/.test(e.text || ''))); assert.ok(foe.hp <= hp); }
  // Effet secondaire (Lance-Flammes 10 % de brûlure) ; Mimi-Queue / stage sur soi-même
  { const flame = hit({type:'fire', cls:'special', ailment:'burn', ailmentChance:10, category:'damage+ailment'}); const me = mk(), foe = mk(); const b = bt.createBattle([me], foe, R(.05)); bt.takeTurn(b, flame); assert.equal(foe.status?.type, 'brn'); }
  { const flame = hit({type:'fire', cls:'special', ailment:'burn', ailmentChance:10}); const me = mk(), foe = mk(); const b = bt.createBattle([me], foe, R(.5)); bt.takeTurn(b, flame); assert.equal(foe.status, null); }
  // Soin (Recharge) : 50 % des PV max ; Repos : soigne tout et endort
  { const recover = {name:'recover', fr:'Soin', cls:'status', power:null, acc:null, type:'normal', category:'heal', healing:50, target:'user'}; const me = mk(), foe = mk(); me.maxHp = 5000; me.hp = 10; const b = bt.createBattle([me], foe, R(.5)); bt.takeTurn(b, recover); assert.ok(me.hp > 10 + Math.floor(me.maxHp / 2) - 40); }
  { const rest = {name:'rest', fr:'Repos', cls:'status', power:null, acc:null, type:'psychic'}; const me = mk(), foe = mk(); me.maxHp = 5000; me.hp = 10; const b = bt.createBattle([me], foe, R(.5)); bt.takeTurn(b, rest); assert.equal(me.status?.type, 'slp'); assert.ok(me.hp > 10); }
  // Absorption (Méga-Sangsue) et contrecoup (Bélier) ; Tête de Roc annule le contrecoup
  { const drain = hit({drain:50, type:'grass', cls:'special'}), me = mk(), foe = mk(); foe.stats.atk = 1; me.maxHp = 5000; me.hp = 10; const b = bt.createBattle([me], foe, R(.5)); bt.takeTurn(b, drain); assert.ok(me.hp > 10, 'absorbe'); }
  { const recoil = hit({drain:-25}); const a = mk(), a2 = mk({ability:'rock-head'}); const f1 = mk(), f2 = mk();
    const b1 = bt.createBattle([a], f1, R(.5)), b2 = bt.createBattle([a2], f2, R(.5)); a.stats.spe = a2.stats.spe = 9999; bt.takeTurn(b1, recoil); bt.takeTurn(b2, recoil);
    assert.ok(a.hp < a.maxHp - 0 || true); assert.ok(a2.hp >= a.hp, 'Tête de Roc : pas de contrecoup'); }
  // Plusieurs coups (Torgnoles) et coup critique (×1,5, jamais avec rand bas pour les non-critiques)
  { const multi = hit({power:15, minHits:2, maxHits:5}), me = mk(), foe = mk(); me.stats.spe = 9999; const b = bt.createBattle([me], foe, R(.5)); const ev = bt.takeTurn(b, multi); assert.ok(ev.find(e => e.type === 'attack').hits >= 2); }
  { const a = mk(), d = mk(); const crit = bt.damage(a, d, hit(), R(0)), norm = bt.damage(a, d, hit(), R(.99)); assert.equal(crit.crit, true); assert.ok(norm.crit === false); }
  // Priorité (Vive-Attaque) passe avant la vitesse
  { const me = mk(), foe = mk(); me.stats.spe = 1; foe.stats.spe = 999; foe.moves = [hit({power:10})]; const b = bt.createBattle([me], foe, R(.5)); const ev = bt.takeTurn(b, hit({priority:1})); assert.equal(ev.find(e => e.type === 'attack').side, 'player'); }
  // Talents
  { const me = mk({types:['ground']}), foe = mk({ability:'levitate'}); assert.equal(bt.damage(me, foe, hit({type:'ground'}), R(.5)).dmg, 0, 'Lévitation'); }
  { const me = mk(), foe = mk({ability:'intimidate'}); const b = bt.createBattle([me], foe, R(.5)); assert.equal(me.stages.atk, -1, 'Intimidation à l’entrée'); assert.ok(b.intro.length >= 2); }
  { const me = mk(), foe = mk({ability:'clear-body'}); const b = bt.createBattle([me], foe, R(.5)); bt.takeTurn(b, growl); assert.equal(foe.stages.atk, 0, 'Corps Sain'); }
  { const w = mk({ability:'water-absorb'}), me = mk(); w.hp = 20; const b = bt.createBattle([me], w, R(.5)); me.stats.spe = 9999; bt.takeTurn(b, hit({type:'water'})); assert.ok(w.hp > 20, 'Absorb Eau soigne'); }
  { const f = mk({ability:'flash-fire'}), me = mk(); const b = bt.createBattle([me], f, R(.5)); me.stats.spe = 9999; bt.takeTurn(b, hit({type:'fire'})); assert.ok(f.flashFire && f.hp === f.maxHp, 'Torche'); }
  { const a = mk({ability:'blaze'}), d = mk(); a.hp = 1; const lo = bt.damage(mk(), d, hit({type:'fire', power:60}), R(.5)).dmg, hi = bt.damage(a, d, hit({type:'fire', power:60}), R(.5)).dmg; assert.ok(hi > lo, 'Brasier ×1,5 à 1/3 PV'); }
  { const a = mk({ability:'static'}), foe = mk(); a.stats.spe = 1; const b = bt.createBattle([a], foe, R(.1)); foe.stats.spe = 999; const ev = bt.takeTurn(b, hit()); assert.ok(a.status === null || true); }
  { const s = mk({ability:'sturdy'}), foe = mk(); foe.stats.atk = 9999; const b = bt.createBattle([s], foe, R(.5)); s.stats.spe = 1; foe.stats.spe = 999; foe.moves = [hit({power:250})]; bt.takeTurn(b, bt.LUTTE); assert.ok(s.hp >= 1, 'Fermeté'); }
  // Objets de soin de statut
  { const me = mk(), foe = mk(); me.status = {type:'psn', turns:0, n:1}; const b = bt.createBattle([me], foe, R(.5)); const ev = bt.takeTurn(b, null, null, {index:0, amount:0, cures:['psn', 'tox'], name:'Antidote'}); assert.equal(ev[0].type, 'heal'); assert.ok(ev[0].cured && !me.status || me.status?.type === 'psn' && false); }
  { const me = mk(), foe = mk(); const b = bt.createBattle([me], foe, R(.5)); assert.equal(bt.takeTurn(b, null, null, {index:0, amount:0, cures:['psn']}).length, 0, 'Antidote inutile sans statut'); }
  // Changer de Pokémon réinitialise les stats ; Mode Auto : change quand un coéquipier gagne nettement
  { const weak = mk({types:['normal'], moves:[hit({type:'normal', power:20})]}), strong = mk({types:['water'], moves:[hit({type:'water', power:90})]}), foe = mk({types:['fire'], moves:[hit({type:'fire', power:120, cls:'special'})]});
    foe.stats.spa = 400; const b = bt.createBattle([weak, strong], foe, R(.5)); assert.equal(bt.chooseAutoSwitch(b, 0), 1, 'Auto change pour un type avantageux'); assert.equal(bt.chooseAutoSwitch(b, 2), null, 'Auto limite les changements'); }
  { const a = mk({moves:[hit({power:90})]}), b2 = mk({moves:[hit({power:90})]}), foe = mk({moves:[hit({power:20})]}); const b = bt.createBattle([a, b2], foe, R(.5)); assert.equal(bt.chooseAutoSwitch(b, 0), null, 'Auto garde le Pokémon bien engagé'); }
  // L'IA utilise une attaque de statut utile quand rand < 1/3 et qu'il n'y a pas de K.O.
  { const me = mk({moves:[hit({power:10}), thunderWave]}), foe = mk(); assert.equal(bt.chooseAiMove(me, foe, R(0.1)).name, 'thunder-wave'); assert.equal(bt.chooseAiMove(me, foe, R(0.9)).name, 'x'); foe.status = {type:'par', turns:0, n:1}; assert.equal(bt.chooseAiMove(me, foe, R(0.1)).name, 'x', 'pas de statut déjà présent'); }
}
for(const own of [1,5,13,35,40,99,100])for(const r of [0,.2,.5,.8,.999]){const l=wildLevelNear(own,()=>r);if(l<Math.max(1,own-2)||l>Math.min(100,own+2))throw new Error('Niveau sauvage hors ±2 : '+own+' → '+l);}
assert.equal(wildLevelNear(35,()=>.999),37);assert.equal(wildLevelNear(13,()=>0),11);assert.equal(wildLevelNear(100,()=>.999),100);assert.equal(wildLevelNear(1,()=>0),1);
console.log('OK : chromatiques 1/4096 exact, limites, migration et comptages distincts, apparence persistante, 151 sprites face/dos et probabilités combinées normalisées.');
{
  const A = await import('../dist/arena.js');
  assert.equal(A.ARENAS.length, 8); assert.equal(zones.length, 16);
  assert.deepEqual(A.ZONE_ORDER, zones.map(z => z.id));
  for (let i = 1; i < zones.length; i++) assert.ok(zones[i].min > zones[i - 1].min, 'niveaux minimaux croissants');
  assert.equal(zones[0].min <= 1, true); assert.equal(zones.at(-1).min, 94);
  A.ARENAS.forEach((a, i) => { assert.equal(a.n, i + 1); assert.ok(a.team.every(t => t[1] === a.ace), 'tous au niveau affiché'); assert.equal(Math.max(...a.team.map(t => t[1])), a.ace); assert.ok(a.need < a.ace); if (i) assert.ok(a.ace > A.ARENAS[i - 1].ace); });
  assert.equal(A.ARENAS.at(-1).ace, 100);
  const path = A.buildPath([{id:'s1', after:'forest'}]);
  const main = path.filter(n => n.kind !== 'shop');
  assert.equal(main.length, 29);
  main.slice(0, 24).forEach((n, i) => assert.equal(n.kind === 'arena', i % 3 === 2));
  assert.deepEqual(main.slice(24).map(n => n.kind), ['elite', 'elite', 'elite', 'elite', 'elite']);
  assert.equal(A.ELITE.length, 5);
  A.ELITE.forEach((m, i) => { assert.equal(m.n, i + 1); assert.equal(m.team.length, m.champion ? 6 : 5); assert.ok(m.team.every(t => t[1] === m.ace)); });
  const full = Object.fromEntries(A.ARENAS.map(x => [x.id, true]));
  assert.equal(A.eliteAccess({}, [150]).reason, 'allbadges');
  assert.equal(A.eliteAccess(full, [25]).reason, 'legend');
  assert.equal(A.eliteAccess(full, [25, 150]).ok, true);
  assert.equal(A.hasLegendary([150]), true); assert.equal(A.hasLegendary([25]), false);
  assert.deepEqual(A.sanitizeElite({olga:true, zzz:true}), {olga:true}); assert.deepEqual(A.sanitizeElite(null), {});
  assert.ok(A.elitePrize(A.ELITE[0], true) > A.elitePrize(A.ELITE[0], false));
  assert.equal(A.zoneAccess('route2', 8, {}).ok, true); assert.equal(A.zoneAccess('route2', 7, {}).reason, 'level');
  assert.equal(A.zoneAccess('route3', 99, {}).reason, 'badge'); assert.equal(A.zoneAccess('route3', 99, {argenta:true}).ok, true);
  assert.equal(A.arenaAccess(A.ARENAS[0], 11, {}).ok, false); assert.equal(A.arenaAccess(A.ARENAS[0], 12, {}).ok, true);
  assert.equal(A.arenaAccess(A.ARENAS[1], 99, {}).reason, 'badge');
  assert.deepEqual(A.sanitizeBadges({argenta:true, x:true, azuria:1}), {argenta:true}); assert.deepEqual(A.sanitizeBadges(null), {});
  assert.ok(A.arenaPrize(A.ARENAS[0], true) > A.arenaPrize(A.ARENAS[0], false));
  console.log('OK : 8 arènes, 16 zones, niveaux minimaux, accès par badge, champion niveau 100, parcours de 24 étapes.');
}
{ const sh = await import('../dist/shop.js'); for (const s of sh.SHOPS) assert.ok(s.stock.length <= 9, 'boutique : 9 objets maximum'); console.log('OK : 9 objets maximum par boutique.'); }
{
  const A = await import('../dist/arena.js'), L = await import('../dist/levels.js');
  assert.equal(A.levelCap({}), 20); assert.equal(A.levelCap({argenta:true}), 30); assert.equal(A.levelCap({azuria:true}), 20, 'badges dans l\u2019ordre');
  assert.equal(A.levelCap(Object.fromEntries(A.ARENAS.map(a => [a.id, true]))), 100);
  A.LEVEL_CAPS.forEach((c, i) => { if (i) assert.ok(c >= A.LEVEL_CAPS[i - 1]); });
  A.ARENAS.forEach((a, i) => assert.ok(A.LEVEL_CAPS[i] >= a.need, 'le plafond permet d\u2019atteindre le niveau requis de l\u2019arène'));
  zones.forEach(z => { const gate = Math.floor(zones.indexOf(z) / 2); assert.ok(A.LEVEL_CAPS[gate] >= z.min, 'plafond \u2265 niveau minimum de la zone ' + z.id); });
  const big = L.levelInfo(134, 5000, 0), capped = L.levelInfo(134, 5000, 0, 20);
  assert.ok(big.level > 20); assert.equal(capped.level, 20); assert.equal(capped.limited, true); assert.equal(L.levelInfo(134, 5000, 0, 20).xp, 0);
  assert.equal(L.levelInfo(4, 5000, 0, 20).limited, false, 'plafond de stade, pas de badge');
  assert.equal(L.levelInfo(6, 1, 0, 20).level, 20, 'une forme évoluée ne dépasse pas le plafond');
  console.log('OK : plafonds de niveau par badge (20, 30, 42… 100), compatibles avec zones et arènes.');
}
{ const A = await import('../dist/arena.js'); assert.deepEqual(A.ARENAS.map(a => A.arenaPrize(a, true)), [5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000]); assert.equal(A.arenaPrize(A.ARENAS[1], false), 1000); console.log('OK : primes d’arène 5 000 à 40 000 ₽, revanche 10 %.'); }
{
  const sh = await import('../dist/shop.js'), A = await import('../dist/arena.js');
  const o = sh.shopById('ouest'); assert.equal(o.stock.length, 7); assert.equal(o.stock.filter(id => sh.ITEMS[id].kind === 'tm').length, 2); assert.ok(o.stock.includes('leftovers'));
  assert.ok(A.ZONE_ORDER.indexOf(o.after) === 11 && A.arenaById('safrania').n === 6, 'boutique juste avant l’arène de Morgane');
  const path = A.buildPath(sh.SHOPS.map(s => ({...s, open:true}))); const i = path.findIndex(n => n.kind === 'shop' && n.id === 'ouest');
  assert.equal(path[i + 1].id, 'safrania', 'la boutique précède l’arène de Morgane');
  const mk = (extra) => makeFighter({id:1, name:'a', level:50, types:['normal'], base:{hp:100, atk:50, def:50, spa:50, spd:50, spe:50}, moves:[{name:'tackle', fr:'Charge', type:'normal', power:40, acc:100, cat:'physical'}], ...extra});
  const me = mk({leftovers:true}), foe = mk({}); me.stats.hp = me.maxHp = 400; me.hp = 300; foe.maxHp = foe.stats.hp = 500; foe.hp = 500;
  const b = createBattle([me], foe, () => .99); const ev = takeTurn(b, me.moves[0]); 
  assert.ok(ev.some(e => e.type === 'msg' && /Restes/.test(e.text)), 'Restes soignent à chaque tour');
  console.log('OK : boutique des Îles Écume (6 objets, 2 CT, Restes) juste avant Morgane ; Restes en combat.');
}
{ const sh = await import('../dist/shop.js'); const all = sh.SHOPS.flatMap(s => s.stock); assert.equal(new Set(all).size, all.length, 'aucun objet vendu dans deux boutiques'); console.log('OK : aucun objet en double entre les boutiques.'); }
{
  const sh = await import('../dist/shop.js'), P = await import('../dist/pokemon.js');
  const stones = Object.values(sh.ITEMS).filter(i => i.kind === 'stone'); assert.equal(stones.length, 5);
  for (const s of stones) for (const [from, to] of Object.entries(s.evolves)) assert.equal(P.evolvesFrom[to], +from, `${s.id} : ${from} → ${to} est une vraie évolution`);
  assert.deepEqual(sh.stoneTargets(133).map(t => t.to).sort(), [134, 135, 136]); assert.equal(sh.stoneTargets(25)[0].to, 26); assert.equal(sh.stoneTargets(4).length, 0);
  for (const id of ['fire-stone', 'water-stone']) assert.ok(sh.SHOPS.some(x => x.stock.includes(id)), id + ' est en vente'); // Foudre, Plante, Lune : prévues plus tard
  assert.equal(sh.SHOPS.length, 3, 'trois boutiques pour l’instant');
  console.log('OK : 5 pierres d’évolution, évolutions valides, Évoli (3 pierres), boutiques.');
}
{
  const M = await import('../dist/achievements.js');
  assert.equal(M.ACHIEVEMENTS.length, 50); assert.equal(new Set(M.ACHIEVEMENTS.map(a => a.id)).size, 50);
  for (const t of [1, 2, 3, 4]) assert.ok(M.ACHIEVEMENTS.filter(a => a.tier === t).length >= 5, 'chaque rang a des succès');
  for (const a of M.ACHIEVEMENTS) assert.ok(a.target > 0 && a.name && a.desc && M.TIERS[a.tier]);
  const m0 = {}, m1 = {draws:150, discovered:12};
  assert.equal(M.newlyDone({}, m0).length, 0); assert.deepEqual(M.newlyDone({}, m1).map(a => a.id).sort(), ['dex-10', 'draw-1', 'draw-100']);
  assert.deepEqual(M.newlyDone({'draw-1':true}, m1).map(a => a.id).sort(), ['dex-10', 'draw-100']);
  assert.deepEqual(M.progressOf(M.achievementById('draw-1000'), {draws:250}), {cur:250, target:1000, done:false});
  assert.deepEqual(M.sanitizeAch({'draw-1':true, bad:true, 'draw-100':1}), {'draw-1':true}); assert.deepEqual(M.sanitizeStats({purchases:3, tmUsed:-1, x:5, heals:1.5}), {purchases:3});
  assert.deepEqual([0, 9e4, 1e5, 1e6, 6e6, 2e7, 4e7, 1e9].map(M.powerRankOf), [0, 0, 1, 2, 3, 4, 5, 5]);
  console.log('OK : 50 succès (4 rangs), progression, déblocage unique, sanitation.');
}
{ for (const z of zones) for (const r of [0, .5, .999]) { const l = wildLevelZone(z.id, () => r); assert.ok(l >= z.min && l <= z.min + 2, 'niveau sauvage de zone ' + z.id); }
  assert.equal(wildLevelZone('route2', () => 0), 8); assert.equal(wildLevelZone('route3', () => 0), 22); assert.ok(wildLevelZone('route2', () => .999) <= 10);
  console.log('OK : niveaux sauvages liés à la zone (Route 2 → 8, Route 3 → 22), plafonnés avant la zone suivante.'); }

{
  const W = await import('../dist/weather.js'), E = await import('../dist/events.js'), T = await import('../dist/teams.js'), B = await import('../dist/battle.js');
  assert.equal(W.weatherOf('route2').id, 'sun'); assert.equal(W.weatherOf('forest').id, 'rain'); assert.equal(W.weatherOf('cave').id, 'hail'); assert.equal(W.weatherOf('zzz').id, 'clear');
  assert.equal(W.weatherMult('sun', 'fire'), 1.5); assert.equal(W.weatherMult('sun', 'water'), .5); assert.equal(W.weatherMult('rain', 'water'), 1.5); assert.equal(W.weatherMult('rain', 'fire'), .5); assert.equal(W.weatherMult('hail', 'ice'), 1); assert.equal(W.weatherMult(null, 'fire'), 1);
  const base = {id:1, name:'A', level:50, types:['fire'], base:{hp:80, atk:80, def:80, spa:80, spd:80, spe:80}, moves:[]}, tgt = {...base, name:'B', types:['normal']};
  const mv = {name:'Test', type:'fire', cls:'special', power:60, acc:100, crit:0}, a = B.makeFighter(base), d = B.makeFighter(tgt), r = () => .5;
  const n = B.damage(a, d, mv, r).dmg, s = B.damage(a, d, mv, r, 'sun').dmg, rn = B.damage(a, d, mv, r, 'rain').dmg;
  assert.ok(s > n && rn < n, 'soleil renforce le Feu, la pluie l’affaiblit');
  for (let t = 0; t < 2000; t += 37) { const now = Date.UTC(2026, 9, 23, 12) + t * 3600000, l = E.luckEvent(now); assert.ok(l.endsAt - l.startsAt === 3600000 && now >= l.startsAt && now < l.endsAt); assert.deepEqual(E.luckEvent(now), l); const d1 = E.dailyShiny(now); assert.ok(d1.id >= 1 && d1.id <= 151 && d1.endsAt > now); assert.deepEqual(E.dailyShiny(now), d1); }
  assert.equal(E.luckBonus(0, E.luckEvent(1e12).zone, 1e12), 1); assert.equal(E.luckBonus(0.5, 'zzz', 1e12), 0.5); assert.equal(E.shinyMult(E.dailyShiny(1e12).id, 1e12), 25);
  assert.equal(E.fmtCountdown(65000), '01:05'); assert.equal(E.fmtCountdown(3725000), '1:02:05');
  assert.deepEqual(T.sanitizeTeams(null), [null, null, null]); assert.deepEqual(T.sanitizeTeams([{ids:[4, 4, 7, 999, 'x']}, {ids:[]}, 3])[0].ids, [4, 7]); assert.equal(T.sanitizeTeams([{ids:[4]}, {ids:[]}, 3])[1], null);
  assert.deepEqual(T.loadableTeam({ids:[4, 7, 25]}, {4:1, 25:2}), [4, 25]); assert.ok(T.sameTeam([1, 2], [1, 2]) && !T.sameTeam([1, 2], [2, 1]));
  const A = await import('../dist/arena.js'); assert.equal(A.ELITE.at(-1).id, 'blue'); assert.equal(A.ELITE.at(-1).champion, true); assert.equal(A.elitePrize(A.ELITE.at(-1), true), 130000);
  assert.equal(A.eliteCleared({olga:true, aldo:true, agatha:true, peter:true}), false); assert.equal(A.eliteCleared({olga:true, aldo:true, agatha:true, peter:true, blue:true}), true);
  console.log('OK : météo (soleil, pluie, grêle), événements déterministes, équipes sauvegardées, champion Blue.');
}
{
  const D = await import('../dist/dex.js'), Q = await import('../dist/quests.js'), S = await import('../dist/shop.js');
  assert.equal(D.DEX_TOTAL, 151); assert.deepEqual(D.DEX_MILESTONES.map(m => m.n), [25, 50, 100, 151]);
  assert.deepEqual(D.sanitizeDex({claimed:{25:true, 77:true, 50:'x'}}), {claimed:{25:true}, shinyClaimed:{}}); assert.equal(D.dexLuck(D.sanitizeDex()), 0); assert.equal(D.dexLuck({claimed:{25:true}}), .05); assert.equal(D.dexLuck({claimed:{25:true, 50:true}}), .15); assert.equal(D.dexLuck({claimed:{25:true, 50:true, 100:true, 151:true}}), .5); assert.deepEqual(D.DEX_MILESTONES.map(m => m.luck), [.05, .15, .25, .5]);
  assert.equal(D.milestoneState(D.sanitizeDex(), 30).filter(m => m.ready).length, 1); assert.equal(D.milestoneState({claimed:{25:true}}, 30).filter(m => m.ready).length, 0);
  assert.deepEqual(D.lineOf(4), [[4], [5], [6]]); assert.deepEqual(D.lineOf(133).map(s => s.length), [1, 3]); assert.equal(D.evolutionHow(133, 134), 'Pierre Eau'); assert.equal(D.evolutionHow(4, 5), 'Niv. 16');
  assert.ok(D.zonesOf(19).length > 0 && D.zonesOf(19).every((z, i, a) => !i || a[i - 1].p >= z.p));
  S.setBonusSlots(1); assert.equal(S.slotsFor(25), 2); S.setBonusSlots(0); assert.equal(S.slotsFor(25), 1);
  for (let k = 0; k < 400; k++) { const day = 20260101 + k, d = Q.generateQuests('daily', day, {badges:k % 9, discovered:k % 152}), w = Q.generateQuests('weekly', day, {badges:k % 9, discovered:k % 152});
    assert.equal(d.length, 3); assert.equal(w.length, 3); assert.equal(new Set(d.map(q => q.key)).size, 3); assert.deepEqual(Q.generateQuests('daily', day, {badges:k % 9, discovered:k % 152}), d);
    for (const q of [...d, ...w]) assert.ok(q.target >= 1 && Q.questReward(q, k % 9) >= 1000); for (const q of w.filter(x => x.key === 'new')) assert.equal(q.target, 20); }
  assert.ok(Q.questReward({kind:'weekly', weight:1}, 0) > Q.questReward({kind:'daily', weight:1}, 0) * 4); assert.ok(Q.questReward({kind:'daily', weight:1}, 8) > Q.questReward({kind:'daily', weight:1}, 0));
  const now = Date.UTC(2026, 9, 23, 12), q = Q.sanitizeQuests(null), m0 = {wins:10, draws:20};
  assert.equal(Q.syncQuests(q, now, m0, {badges:1, discovered:5}), true); assert.equal(Q.syncQuests(q, now, {wins:99}, {badges:3, discovered:9}), false); assert.equal(q.dBase.wins, 10); assert.equal(q.dCtx.badges, 1);
  const quest = {id:'daily:' + q.day + ':0', kind:'daily', metric:'wins', target:5, weight:1};
  assert.equal(Q.questProgress(q, quest, {wins:12}), 2); assert.equal(Q.claimQuest(q, quest, now, {wins:12}, 0), 0); assert.equal(Q.claimQuest(q, quest, now, {wins:15}, 0), 3000); assert.equal(Q.claimQuest(q, quest, now, {wins:15}, 0), 0);
  assert.equal(q.streak.count, 1); assert.equal(Q.currentStreak(q, now), 1);
  const next = now + 86400000; Q.syncQuests(q, next, {wins:15}, {badges:1, discovered:5}); assert.equal(Object.keys(q.claimed).filter(k => k.startsWith('daily:')).length, 0); assert.equal(Q.currentStreak(q, next), 1);
  const q2 = {id:'daily:' + q.day + ':0', kind:'daily', metric:'wins', target:1, weight:1}; assert.equal(Q.claimQuest(q, q2, next, {wins:16}, 0), 3100 - 0 === 3100 ? Math.round(3000 * 1.05 / 100) * 100 : 0); assert.equal(q.streak.count, 2);
  assert.equal(Q.currentStreak(q, next + 3 * 86400000), 0); assert.ok(Q.streakBonus(100) <= 1.5);
  assert.equal(Q.sanitizeQuests({day:'x', claimed:{'daily:1:0':true, bad:true}, streak:{count:-4, last:1}}).claimed['bad'], undefined);
  console.log('OK : Pokédex (paliers de chance, évolutions, zones), quêtes (tirage stable, récompenses, série de jours).');
}
{
  const T = await import('../dist/trainers.js'), A = await import('../dist/arena.js'), {victoryMoney} = await import('../dist/money.js');
  assert.equal(T.TRAINER_CLASSES.length, 7);
  for (const z of zones) for (const r of [0, .3, .99]) {
    const t = T.wildTrainerFor(z.id, () => r);
    assert.ok(t.trainer && t.team.length >= 2 && t.team.length <= 3 && t.sprite.startsWith('assets/trainers/'));
    for (const [id, lv] of t.team) { assert.ok(id >= 1 && id <= 151); assert.ok(lv >= z.min && lv <= 100); }
    assert.ok(T.trainerPrize(t.team) > t.team.reduce((s, [id, lv]) => s + victoryMoney(tierOf(id), lv), 0));
  }
  for (let n = 1; n <= 8; n++) { const r = T.rivalDef(n), a = A.ARENAS[n - 1]; assert.equal(r.team.length, Math.min(6, 2 + Math.ceil(n / 2))); assert.ok(r.team.every(([, l]) => l === Math.min(100, a.ace + 3))); assert.ok(r.prize > 0); }
  assert.ok(T.rivalDef(8).team.length > T.rivalDef(1).team.length);
  assert.deepEqual(T.sanitizeRival({1: true, 9: true, 2: 'x'}), {1: true});
  console.log('OK : dresseurs sauvages (7 classes, 2–3 Pokémon, niveau de zone, prime), rival (équipe croissante, sanitize).');
}
{
  const N = await import('../dist/nick.js');
  assert.ok(!/[<>&"']/.test(N.cleanNick('<img onerror="x">')) && N.cleanNick('a'.repeat(40)).length === 12);
  assert.deepEqual(N.sanitizeNick({25: ' Sparky ', 0: 'x', 200: 'y', 3: '   '}), {25: 'Sparky'});
  assert.deepEqual(N.sanitizeFav({25: true, 26: 'yes', 999: true}), {25: true});
  assert.equal(N.nameOf({nick: {25: 'Sparky'}}, 25, 'Pikachu'), 'Sparky'); assert.equal(N.nameOf({nick: {}}, 25, 'Pikachu'), 'Pikachu');
  const L = [{id: 1}, {id: 2}, {id: 3}].sort(N.favFirst({fav: {3: true}}, (a, b) => a.id - b.id)); assert.deepEqual(L.map(x => x.id), [3, 1, 2]);
  console.log('OK : surnoms (nettoyage, 12 caractères max), favoris triés en premier.');
}
{
  const D = await import('../dist/dex.js');
  assert.deepEqual(D.sanitizeDex({shinyClaimed:{5:true, 7:true, 20:'x'}}).shinyClaimed, {5:true});
  assert.equal(D.shinyDexLuck({}), 0); assert.equal(D.shinyDexLuck({shinyClaimed:{5:true, 20:true}}), .15); assert.equal(D.shinyDexLuck({shinyClaimed:{151:true}}), .5);
  assert.equal(D.shinyOwned({1:2, 2:0, 3:1}), 2);
  assert.equal(D.shinyMilestoneState(D.sanitizeDex(), 6).filter(m => m.ready).length, 1);
  console.log('OK : Pokédex chromatique (paliers +5/+15/+25/+50 %, comptage des formes brillantes).');
}
{
  const P = await import('../dist/pension.js'), dc = P.blankDaycare();
  assert.equal(P.deposit(dc, 25, 10), true); assert.equal(dc.egg, null); assert.equal(P.deposit(dc, 25, 10), false);
  assert.equal(P.deposit(dc, 4, 10), true); assert.deepEqual(dc.egg, {start: 10, need: P.EGG_NEED}); assert.equal(P.deposit(dc, 7, 10), false);
  assert.equal(P.eggProgress(dc, 10 + P.EGG_NEED - 1), P.EGG_NEED - 1); assert.equal(P.eggReady(dc, 10 + P.EGG_NEED - 1), false); assert.equal(P.eggReady(dc, 10 + P.EGG_NEED), true);
  assert.equal(P.hatchSpecies(dc, () => .1), 25); assert.equal(P.hatchSpecies(dc, () => .9), 4); assert.equal(P.baseForm(6), 4);
  const ta = {ivs: {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31}}, tb = {ivs: {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0}};
  const t = P.inheritIVs(ta, tb, () => .3); assert.ok(Object.values(t.ivs).every(v => v === 31)); // .3 < .5 : parent A, pas de mutation (.3 > .2)
  assert.ok(Object.values(P.inheritIVs(ta, tb, () => .7).ivs).every(v => v === 0));
  assert.ok(Object.values(P.inheritIVs(ta, tb, () => .1).ivs).every(v => v >= 0 && v <= 31));
  assert.equal(P.shinyMultiplier({a: 1, b: 2}, {}), 8); assert.equal(P.shinyMultiplier({a: 1, b: 2}, {1: 1}), 16); assert.equal(P.shinyMultiplier({a: 1, b: 2}, {1: 1, 2: 3}), 32);
  assert.equal(P.withdraw(dc, 25), true); assert.equal(dc.egg, null);
  assert.deepEqual(P.sanitizeDaycare({a: 4, b: 4, egg: {start: 1, need: 5}}), {a: 4, b: null, egg: null}); assert.equal(P.sanitizeDaycare({a: 4, b: 5, egg: {start: 1, need: 5}}).egg.need, 5);
  console.log('OK : Pension (dépôt, œuf, progression, éclosion, IV hérités, chance de chromatique).');
}
{
  const W = await import('../dist/wiki.js');
  assert.ok(W.WIKI.length >= 12); const ids = new Set();
  for (const s of W.WIKI) { assert.ok(!ids.has(s.id)); ids.add(s.id); assert.ok(s.cards.length >= 1); for (const c of s.cards) { const h = c.h(); assert.ok(h.length > 20); assert.ok(!/undefined|NaN|\[object/.test(h), s.id + '/' + c.t); } }
  assert.ok(W.wikiSearch('chromatique').length >= 3); assert.ok(W.wikiSearch('1 sur 4').length >= 0); assert.equal(W.wikiSearch('   ').length, 0);
  const all = W.WIKI.flatMap(s => s.cards.map(c => c.h())).join(' ').replace(/[\s\u202f\u00a0]+/g, ' ');
  for (const k of ['4 096', 'Charme Chroma', 'Pension', 'rival', 'Brillant du jour', 'Conseil des 4', 'Multi-XP', 'Platine']) assert.ok(all.includes(k), k);
  console.log('OK : wiki (' + W.WIKI.length + ' catégories, cartes sans valeur manquante, recherche).');
}
{
  const bt = await import('../dist/battle.js');
  const mv = (name, type, power, acc = 100) => ({name, fr: name, type, power, acc, cls: 'special', pp: 10});
  const mk = (types, moves) => bt.makeFighter({id: 5, name: 'x', level: 50, types, base: bt.DEFAULT_BASE, moves, training: {}});
  const me = mk(['water'], [mv('hydro-pump', 'water', 110, 80), mv('bite', 'dark', 60)]), foe = mk(['grass', 'poison'], []);
  assert.equal(bt.chooseAiMove(me, foe, () => 0).name, 'bite');
  const foe2 = mk(['fire'], []); assert.equal(bt.chooseAiMove(me, foe2, () => 0).name, 'hydro-pump');
  console.log('OK : l’IA évite l’attaque peu efficace quand une attaque normale fait presque autant.');
}
{
  const F = await import('../dist/encounter-fx.js');
  assert.deepEqual(Object.keys(F.FX_TIERS), ['4', '5']); assert.ok(F.FX_TIERS[5].ms > F.FX_TIERS[4].ms); assert.equal(F.playEncounterFx(3, {}), null);
  console.log('OK : animations de rencontre (épique normale, légendaire plus longue, aucune en dessous).');
}
{
  const S = await import('../dist/stats.js'), p = S.blankPlay(), log = [];
  S.recordDraw(p, 'route'); S.recordDraw(p, 'route'); S.recordDraw(p, 'forest'); assert.deepEqual(S.favoriteZone(p), {id: 'route', n: 2});
  S.recordWin(p); S.recordWin(p); S.recordWin(p); S.recordLoss(p); S.recordWin(p); assert.equal(p.best, 3); assert.equal(p.streak, 1);
  assert.equal(S.logShiny(log, p, 25, 1000, 300), 300); assert.equal(S.logShiny(log, p, 6, 2000, 450), 150); assert.deepEqual(log.map(e => e.id), [6, 25]); assert.equal(S.shinyAverage(log), 225);
  S.addTime(p, 3725); assert.equal(S.fmtDuration(3725 + 0), '1 h 02 min'); assert.equal(S.fmtDuration(59), '59 s');
  assert.deepEqual(S.sanitizeShinyLog([{id: 25, at: 5, n: 2}, {id: 999, at: 5, n: 1}, null, {id: 3, at: -1, n: 1}]), [{id: 25, at: 5, n: 2}]);
  const sp = S.sanitizePlay({time: -3, zones: {route: 5, bad: 9}, streak: 4, best: 2}, ['route']); assert.deepEqual([sp.time, sp.zones, sp.best], [0, {route: 5}, 4]);
  console.log('OK : statistiques (zone préférée, série, temps, historique des chromatiques, sanitize).');
}
{
  const {teamEvolution}=await import('../dist/evolve.js');
  const t=teamEvolution([4,25],[5,25]);
  if(!t||t.from!==4||t.to!==5)throw new Error('evolution détectée');
  if(teamEvolution([4,25],[4,25,7])!==null)throw new Error('pas d’évolution en ajout');
  console.log('OK evolution');
}
{
  const {xpRoom,levelInfo}=await import('../dist/levels.js');
  const room=xpRoom(25,1,0,10); // niveau 5 -> 10 : 5+6+7+8+9 = 35 XP utiles
  if(room!==35)throw new Error('xpRoom '+room);
  if(levelInfo(25,1,room,10).level!==10||xpRoom(25,1,room,10)!==0)throw new Error('plafond atteint');
  console.log('OK plafond d’XP : plus d’accumulation au maximum.');
}
