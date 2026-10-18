import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mapExportViewport,renderExportMap} from '../site/map-export.js';
import {paintShareCard} from '../site/share-card.js';
import {project,routeHeat,routePaths} from '../site/geo.js';
import {buildRouteIndex} from '../site/route-tiles.js';
import {routeColorField} from '../site/route-color.js';
function canvasFactory(log=[]){return ()=>({width:0,height:0,getContext(){return new Proxy({createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};}},{get(target,key){return target[key]||((...args)=>log.push([key,...args]));},set(target,key,value){target[key]=value;return true;}});}});}
test('share viewport includes every bounds corner independently of interactive map zoom',()=>{
 const bounds=[[54.1,48.1],[54.5,48.8]],v=mapExportViewport(bounds,960,600);
 for(const lat of [54.1,54.5])for(const lon of [48.1,48.8]){const [x,y]=project(lat,lon);assert.ok(x*v.scale-v.originX>=34&&x*v.scale-v.originX<=926);assert.ok(y*v.scale-v.originY>=34&&y*v.scale-v.originY<=566);}
 assert.ok(v.tiles.length>0&&v.tiles.length<=24);assert.ok(v.tiles.every(t=>t.z===v.zoom));
});
test('export draws basemap and heat overlays with bounded concurrency',async()=>{
 const activities=[{type:'Ride',records:[{lat:54.3,lon:48.4,t:0},{lat:54.301,lon:48.401,t:10}]}],heat=routeHeat(activities),index=buildRouteIndex(routePaths(activities,heat)),field=routeColorField(heat),log=[];let active=0,max=0,loaded=0;
 const canvas=await renderExportMap({heat,index,field},960,600,{makeCanvas:canvasFactory(log),loadImage:async()=>{active++;max=Math.max(max,active);await new Promise(r=>setTimeout(r,1));active--;loaded++;return {basemap:true};}});
 assert.equal(canvas.width,960);assert.ok(max<=4);assert.equal(loaded,mapExportViewport(heat.bounds,960,600).tiles.length);assert.ok(log.some(r=>r[0]==='putImageData'));
});
test('missing GPS does not fetch tiles and a failed map cannot silently export',async()=>{
 let calls=0;assert.equal(await renderExportMap({heat:{rides:0,bounds:null}},960,600,{loadImage:()=>{calls++;}}),null);assert.equal(calls,0);
 await assert.rejects(renderExportMap({heat:{rides:1,bounds:[[54,48],[54.1,48.1]]}},960,600,{makeCanvas:canvasFactory(),loadImage:async()=>{throw Error('Offline');}}),/Offline/);
});
test('social card contains exactly the requested metrics and map beneath them',()=>{
 const log=[],c=canvasFactory(log)(),map={map:true};paintShareCard(c,{count:123,distance:3889796,withDistance:123,time:542107,withMoving:123},'2026-01-01','2026-10-18',{mapCanvas:map});
 const texts=log.filter(r=>r[0]==='fillText').map(r=>r[1]);assert.ok(texts.includes('Сезон 2026'));assert.ok(!texts.some(x=>/МОЙ ВЕЛОСЕЗОН|2026-01-01|По загруженным данным/.test(x)));assert.ok(texts.some(x=>x.includes('© OpenStreetMap contributors')));assert.ok(texts.includes('ТРЕНИРОВОК'));assert.ok(texts.includes('В ДВИЖЕНИИ'));assert.ok(texts.includes('КИЛОМЕТРОВ'));assert.ok(texts.includes('150 ч 35 мин'));assert.ok(!texts.some(x=>/пульс|мощность|набора/i.test(x)));
 assert.ok(log.some(r=>r[0]==='drawImage'&&r[1]===map&&r[3]===650));assert.equal(c.width,1080);assert.equal(c.height,1350);
});
test('transparent overlay never fetches basemap tiles or paints an opaque background',async()=>{
 const activities=[{type:'Ride',records:[{lat:54.3,lon:48.4,t:0},{lat:54.301,lon:48.401,t:10}]}],heat=routeHeat(activities),index=buildRouteIndex(routePaths(activities,heat)),field=routeColorField(heat),log=[];let loads=0;
 const map=await renderExportMap({heat,index,field},960,600,{transparent:true,makeCanvas:canvasFactory(log),loadImage:()=>{loads++;throw Error('Unexpected basemap request');}});assert.equal(loads,0);assert.equal(map.width,960);assert.ok(log.some(r=>r[0]==='putImageData'));
 const cardLog=[],c=canvasFactory(cardLog)();paintShareCard(c,{count:4,distance:42000,withDistance:4,withMoving:4,time:7200},'2026-01-01','2026-10-18',{transparent:true,mapCanvas:map});assert.ok(!cardLog.some(r=>r[0]==='fillRect'));assert.ok(!cardLog.some(r=>r[0]==='fillText'&&/OpenStreetMap|Готовлю/.test(r[1])));
});
test('constructor exports only selected fields, can omit routes and grows to fit all rows',async()=>{
 const {cardFields,cardLayout}=await import('../site/card-fields.js'),log=[],c=canvasFactory(log)();const stats={count:4,elevation:1234,withElevation:4};
 paintShareCard(c,stats,'2026-01-01','2026-10-18',{fields:['elevation'],showMap:false});const texts=log.filter(x=>x[0]==='fillText').map(x=>x[1]);assert.ok(texts.includes('МЕТРОВ НАБОРА'));assert.ok(!texts.includes('КИЛОМЕТРОВ'));assert.ok(!texts.includes('ТРЕНИРОВОК'));assert.ok(!log.some(x=>x[0]==='drawImage'));assert.equal(c.height,650);
 const layout=cardLayout(cardFields.length,true);assert.ok(layout.height>=layout.mapY+632+60);assert.ok(layout.height>1350);
});
