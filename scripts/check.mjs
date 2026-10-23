import assert from 'node:assert/strict';
import {pool} from '../dist/pokemon.js';
import {zones,zonePool,draw,types,powers} from '../dist/world.js';
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
console.log('OK : migration compatible des espèces, puissances, 4 zones normalisées, bonus de type et intervalles de tirage.');
