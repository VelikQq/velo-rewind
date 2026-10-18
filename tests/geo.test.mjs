import {test} from 'node:test';
import assert from 'node:assert/strict';
import {project,unproject,routeHeat,validGPS,routePaths} from '../site/geo.js';
const ride=records=>({type:'Ride',records});
test('Web Mercator roundtrip preserves coordinates',()=>{for(const point of [[0,0],[54.3,48.4],[-33.8,151.2]]){const result=unproject(...project(...point));assert.ok(Math.abs(result[0]-point[0])<1e-8);assert.ok(Math.abs(result[1]-point[1])<1e-8);}});
test('one ride counts once per cell regardless of repeated GPS samples',()=>{const a={lat:54.3,lon:48.4,t:0},b={lat:54.30005,lon:48.40005,t:5};const simple=routeHeat([ride([a,b])]);const dense=routeHeat([ride([a,a,a,b,b,b])]);assert.deepEqual(dense.cells,simple.cells);assert.equal(dense.max,1);assert.equal(routeHeat([ride([a,b]),ride([a,b])]).max,2);});
test('nearby recorded endpoints are joined; missing GPS and large jumps are not',()=>{const a={lat:54.3,lon:48.4,t:0},b={lat:54.301,lon:48.401,t:5};const continuous=routeHeat([ride([a,b])]),broken=routeHeat([ride([a,{lat:null,lon:null,t:2},b])]);assert.ok(continuous.cells.length>broken.cells.length);assert.equal(routeHeat([ride([a,{...b,t:200}])]).cells.length,broken.cells.length);const jump=routeHeat([ride([a,{lat:54.4,lon:48.5,t:10}])]);assert.equal(jump.cells.length,2);assert.equal(jump.breaks,1);});
test('invalid coordinates and virtual routes do not contribute',()=>{assert.equal(validGPS({lat:null,lon:0}),false);assert.equal(validGPS({lat:100,lon:0}),false);assert.equal(validGPS({lat:0,lon:0}),true);assert.equal(routeHeat([{type:'VirtualRide',records:[{lat:0,lon:0},{lat:1,lon:1}]}]).rides,0);assert.equal(routeHeat([ride([{lat:0,lon:0}])]).cells.length,0);});

test('route lines retain real GPS coordinates rather than cell centres',()=>{
 const a={lat:54.300013,lon:48.400017,t:0},b={lat:54.301013,lon:48.401017,t:30};
 const groups=routePaths([ride([a,b]),ride([a,b])]);assert.equal(groups.length,1);assert.equal(groups[0].count,2);
 for(const path of groups[0].paths){assert.ok(Math.abs(path[0][0]-a.lat)<1e-8);assert.ok(Math.abs(path[0][1]-a.lon)<1e-8);assert.ok(Math.abs(path.at(-1)[0]-b.lat)<1e-8);assert.ok(Math.abs(path.at(-1)[1]-b.lon)<1e-8);}
});
test('route geometry never joins separate rides, GPS gaps, time gaps or jumps',()=>{
 const a={lat:54.3,lon:48.4,t:0},b={lat:54.301,lon:48.401,t:30};
 assert.equal(routePaths([ride([a]),ride([b])]).length,0);
 for(const records of [[a,{lat:null,lon:null},b],[a,{...b,t:121}],[a,{...b,lat:54.4}],[a,{...b,t:-1}]])assert.equal(routePaths([ride(records)]).length,0);
 assert.equal(routePaths([{type:'VirtualRide',records:[a,b]}]).length,0);
});
test('frequency colours distinguish overlapping and unique sections',()=>{
 const a={lat:54.3,lon:48.4,t:0},b={lat:54.301,lon:48.401,t:30},c={lat:54.302,lon:48.402,t:60};
 const groups=routePaths([ride([a,b,c]),ride([a,b])]);assert.deepEqual(groups.map(g=>g.count),[1,2]);
});
