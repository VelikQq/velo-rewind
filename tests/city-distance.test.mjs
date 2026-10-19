import {test} from 'node:test';import assert from 'node:assert/strict';
import {cities,moscow} from '../site/city-catalog.js';import roadData from '../site/city-road-data.js';import {reachedCity,cityDistances,cityComparison,greatCircle} from '../site/city-distance.js';
test('only actually reached cities qualify, including an exact threshold and tiny shortfall',()=>{
 const catalog=[{id:3,name:'Far',km:200},{id:1,name:'Near',km:100},{id:2,name:'Almost',km:150}];assert.equal(reachedCity(149.999999,catalog).name,'Near');assert.equal(reachedCity(150,catalog).name,'Almost');assert.equal(reachedCity(205,catalog).name,'Far');assert.equal(reachedCity(99,catalog),null);for(const km of [-1,NaN,Infinity])assert.equal(reachedCity(km,catalog),null);
});
test('curated recognizable cities are attributed, finite, unique and worldwide',()=>{
 assert.equal(cities.length,85);assert.ok(!cities.some(c=>c.id===1169825));assert.ok(cities.every(c=>/^[А-ЯЁа-яё -]+$/.test(c.name)));assert.ok(cities.some(c=>c.name==='Владивосток'));assert.equal(new Set(cities.map(c=>c.id)).size,cities.length);assert.ok(cities.some(c=>c.name==='Париж'));assert.ok(cities.some(c=>c.name==='Лиссабон'));for(const c of cities){assert.ok(Number.isFinite(c.lat)&&Math.abs(c.lat)<=90);assert.ok(Number.isFinite(c.lon)&&Math.abs(c.lon)<=180);assert.notEqual(c.id,moscow.id);}
 for(const km of [1000,3889.796,7500,15000,25000]){const selected=reachedCity(km);assert.ok(selected.km<=km);assert.equal(selected.km,Math.max(...cityDistances.filter(c=>c.km<=km).map(c=>c.km)));assert.ok(selected.routeSource.startsWith('https://routing.openstreetmap.de/routed-bike/'));}
 const card=cityComparison(3889.796);assert.equal(card.value,card.city.name);assert.match(card.unit,/по велосипедному маршруту/);assert.ok(!card.value.includes('+'));assert.match(card.formula,/велосипедный профиль/);assert.ok(card.sources.includes(`https://www.geonames.org/${card.city.id}/`));assert.equal(cityComparison(0),null);
});
test('road distances are sourced, never replaced with straight lines, and the card omits surplus',()=>{
 assert.ok(cityDistances.length>0);assert.ok(cityDistances.length<=cities.length);
 for(const city of cityDistances){const direct=greatCircle([moscow.lat,moscow.lon],[city.lat,city.lon]);assert.ok(city.km>=direct*.98,city.name);assert.ok(Number.isFinite(city.km));}
 const first=cityDistances[0],card=cityComparison(first.km+.5);assert.equal(card.value,first.name);assert.ok(!card.unit.includes('сверх'));assert.ok(!card.text.includes('сверх'));assert.equal(cityComparison(first.km/2).title,'Старт — Москва');
});
test('every routing snapshot entry belongs to the allowlist and only confirmed routes qualify',()=>{
 assert.equal(roadData.results.length,cities.length);assert.equal(new Set(roadData.results.map(r=>r.id)).size,cities.length);
 const ids=new Set(cities.map(c=>c.id));for(const route of roadData.results){assert.ok(ids.has(route.id));assert.ok(route.url.startsWith('https://routing.openstreetmap.de/routed-bike/route/v1/driving/'));const eligible=route.code==='Ok'&&Number.isFinite(route.meters)&&route.meters>0&&route.snapDistances?.length===2&&route.snapDistances.every(d=>Number.isFinite(d)&&d<=1000);assert.equal(cityDistances.some(c=>c.id===route.id),eligible,route.name);}
 assert.ok(Number.isFinite(Date.parse(roadData.calculatedAt)));
});
