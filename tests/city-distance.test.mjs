import {test} from 'node:test';import assert from 'node:assert/strict';
import {cities,moscow} from '../site/city-catalog.js';import {reachedCity,cityDistances,cityComparison,greatCircle} from '../site/city-distance.js';
test('only actually reached cities qualify, including an exact threshold and tiny shortfall',()=>{
 const catalog=[{id:3,name:'Far',km:200},{id:1,name:'Near',km:100},{id:2,name:'Almost',km:150}];assert.equal(reachedCity(149.999999,catalog).name,'Near');assert.equal(reachedCity(150,catalog).name,'Almost');assert.equal(reachedCity(205,catalog).extra,5);assert.equal(reachedCity(99,catalog),null);for(const km of [-1,NaN,Infinity])assert.equal(reachedCity(km,catalog),null);
});
test('curated recognizable cities are attributed, finite, unique and worldwide',()=>{
 assert.equal(cities.length,85);assert.ok(!cities.some(c=>c.id===1169825));assert.ok(cities.every(c=>/^[А-ЯЁа-яё -]+$/.test(c.name)));assert.ok(cities.some(c=>c.name==='Владивосток'));assert.equal(new Set(cities.map(c=>c.id)).size,cities.length);assert.ok(cities.some(c=>c.name==='Париж'));assert.ok(cities.some(c=>c.name==='Лиссабон'));for(const c of cities){assert.ok(Number.isFinite(c.lat)&&Math.abs(c.lat)<=90);assert.ok(Number.isFinite(c.lon)&&Math.abs(c.lon)<=180);assert.notEqual(c.id,moscow.id);}
 for(const km of [1000,3889.796,7500,15000,25000]){const selected=reachedCity(km);assert.ok(selected.km<=km);assert.equal(selected.km,Math.max(...cityDistances.filter(c=>c.km<=km).map(c=>c.km)));assert.ok(selected.extra>=0);}
 const card=cityComparison(3889.796);assert.notEqual(card.city.name,'Париж');assert.match(card.unit,/сверх/);assert.match(card.formula,/по большому кругу/);assert.ok(card.sources.includes(`https://www.geonames.org/${card.city.id}/`));assert.equal(cityComparison(0),null);
});
test('small surplus remains visible in meters and distance below the first city stays at start',()=>{
 const first=cityDistances[0],card=cityComparison(first.km+.5);assert.equal(card.unit,'м сверх расстояния до города');assert.equal(card.value,'+ 500');assert.equal(cityComparison(first.km/2).title,'Старт — Москва');assert.ok(greatCircle([moscow.lat,moscow.lon],[48.85341,2.3488])>2400);
});
