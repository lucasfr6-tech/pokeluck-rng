import assert from 'node:assert/strict';
import {pool} from '../dist/pokemon.js';
import {zones,zonePool,draw,types,powers,itinerary,sceneryFor} from '../dist/world.js';
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
assert.equal(sceneryFor('route4'),'route');
assert.equal(sceneryFor('cave'),'cave');
console.log(`OK : 31 espèces, puissances, ${zones.length} zones normalisées, bonus de type, intervalles de tirage et parcours Kanto.`);
