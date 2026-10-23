import assert from 'node:assert/strict';
import {pool,evolvesFrom,ancestors,sameLine,names} from '../dist/pokemon.js';
import {zones,zonePool,draw,types,powers,itinerary,backgroundFor,backgrounds,dedupeLines,teamAfterCapture,teamAfterEquip,maxHp} from '../dist/world.js';
import {chooseAiMove,effectiveness,computeStats,knownMoves,nextMove,damage,makeFighter,createBattle,takeTurn,xpReward,LUTTE,isUsable,DEFAULT_BASE} from '../dist/battle.js';
import {parseSpecies,parseMove} from '../dist/battle-data.js';
import {existsSync} from 'node:fs';
import {minLevel,maxLevel,levelInfo,powerAt,xpToNext,START_LEVEL} from '../dist/levels.js';
assert.equal(pool.length,151);
assert.equal(names.length,151);
assert.equal(powers.length,151);
assert.equal(names[0],'Bulbizarre');assert.equal(names[149],'Mewtwo');assert.equal(names[150],'Mew');
for(const p of pool)assert.ok(types[p.id]?.length>=1&&types[p.id].length<=2,'Types manquants : '+p.name);
assert.ok(Math.abs(pool.reduce((s,p)=>s+p.probability,0)-1)<1e-9);
assert.ok(powers.every(n=>Number.isInteger(n)&&n>=1));
assert.equal(powers[18],3);
assert.equal(powers[16],46);
for(const zone of zones){
  const entries=zonePool(zone.id);
  assert.ok(Math.abs(entries.reduce((s,p)=>s+p.probability,0)-1)<1e-12);
  assert.ok(entries.every(p=>p.probability>0));
  let start=0;
  for(const p of entries){assert.equal(draw(entries,start+p.probability/2).id,p.id);start+=p.probability;}
  const ratio=p=>p.probability/pool[p.id-1].probability;
  const baseline=entries.find(p=>!types[p.id].some(t=>zone.bonus.includes(t)));
  for(const p of entries){assert.ok(Math.abs(ratio(p)/ratio(baseline)-(types[p.id].some(t=>zone.bonus.includes(t))?3:1))<1e-10);}
}
assert.equal(zonePool('route')[28].probability,pool[28].probability/ pool.reduce((s,p)=>s+p.probability,0));
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
assert.equal(powerAt(4,5),powers[3]);assert.equal(powerAt(4,15),powers[3]*2);assert.equal(powerAt(6,36),powers[5]);
assert.ok(powerAt(4,10)>powerAt(4,5)&&powerAt(4,10)<powerAt(4,15));
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
assert.equal(bt.winner,'player');assert.equal(B.hp,0);assert.ok(xpReward(10)===5&&xpReward(1)===1);
// IA : Pikachu face à Carapuce choisit Éclair plutôt que Vive-Attaque ; il ne gaspille pas un coup sans effet.
const pika=makeFighter({id:25,name:'Pikachu',level:10,types:['electric'],base:{hp:35,atk:55,def:40,spa:50,spd:50,spe:90},moves:[{name:'quick-attack',fr:'Vive-Attaque',power:40,acc:100,type:'normal',cls:'physical'},{name:'thunder-shock',fr:'Éclair',power:40,acc:100,type:'electric',cls:'special'},{name:'growl',fr:'Rugissement',power:null,acc:100,type:'normal',cls:'status'}]});
const squirtle=makeFighter({id:7,name:'Carapuce',level:10,types:['water'],base:{hp:44,atk:48,def:65,spa:50,spd:64,spe:43},moves:[]});
assert.equal(chooseAiMove(pika,squirtle,()=>0).name,'thunder-shock');
const diglett=makeFighter({id:50,name:'Taupiqueur',level:10,types:['ground'],base:{hp:10,atk:55,def:25,spa:35,spd:45,spe:95},moves:[]});
assert.equal(chooseAiMove(pika,diglett,()=>0).name,'quick-attack');
const sp=parseSpecies({stats:[{base_stat:39,stat:{name:'hp'}},{base_stat:65,stat:{name:'speed'}}],moves:[{move:{name:'ember'},version_group_details:[{level_learned_at:7,move_learn_method:{name:'level-up'},version_group:{name:'red-blue'}}]},{move:{name:'scratch'},version_group_details:[{level_learned_at:1,move_learn_method:{name:'level-up'},version_group:{name:'red-blue'}},{level_learned_at:0,move_learn_method:{name:'machine'},version_group:{name:'red-blue'}}]}]});
assert.deepEqual(sp.learnset,[['scratch',1],['ember',7]]);assert.equal(sp.stats.spe,65);
assert.deepEqual(parseMove({name:'ember',power:40,accuracy:100,type:{name:'fire'},damage_class:{name:'special'},names:[{language:{name:'fr'},name:'Flammèche'}]}),{name:'ember',fr:'Flammèche',power:40,acc:100,type:'fire',cls:'special'});
console.log(`OK : 151 espèces, puissances, ${zones.length} zones normalisées, bonus de type, intervalles de tirage et parcours Kanto.`);
