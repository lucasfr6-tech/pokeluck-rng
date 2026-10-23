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
assert.equal(powers[18],3);
assert.equal(powers[16],46);
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
for(const z of zones){for(let id=1;id<=151;id++)for(const r of [0,.5,.999]){const l=wildLevel(z.id,id,()=>r);if(l>z.levels[1]||l>maxLevel(id)||l<2)throw new Error('Niveau sauvage hors zone '+z.id+' #'+id);}}
if(wildLevel('route',101,()=>.999)>7)throw new Error('Électrode trop fort sur la Route 1');
if(zones.find(z=>z.id==='power').levels[1]!==100)throw new Error('Dernière zone ≠ 100');
console.log(`OK : 151 espèces, puissances, ${zones.length} zones normalisées, bonus de type, intervalles de tirage et parcours Kanto.`);
