import assert from 'node:assert/strict';
import {pool} from '../dist/pokemon.js';
import {zones,zonePool,draw,types,powers,itinerary,backgroundFor,backgrounds} from '../dist/world.js';
import {existsSync} from 'node:fs';
assert.equal(pool.length,31);
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
console.log(`OK : 31 espèces, puissances, ${zones.length} zones normalisées, bonus de type, intervalles de tirage et parcours Kanto.`);
