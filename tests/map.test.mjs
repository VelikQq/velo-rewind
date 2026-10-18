import {test} from 'node:test';
import assert from 'node:assert/strict';
import {project} from '../site/geo.js';
test('wheel zoom and asynchronous route tiles survive replacement and clearing',async()=>{
 const nodes=new Map(['route-map','map-info','map-panel','map-controls','map-fit','map-expand'].map(id=>[id,{hidden:false,checked:false,handlers:{},classList:{toggle(name,value){this[name]=value;}},setAttribute(name,value){this[name]=value;},addEventListener(event,fn){this.handlers[event]=fn;}}]));
 let options,overlay,baseAdded=false;
 const map={attributionControl:{addAttribution(){}},invalidateSize(){},fitBounds(){},removeLayer(){baseAdded=false;},hasLayer(){return baseAdded;}};
 let images=0;
 const ctx={scale(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};},putImageData(){},drawImage(){images++;}};
 class GridLayer{static extend(methods){class Routes extends GridLayer{}Object.assign(Routes.prototype,methods);return Routes;}constructor(opts){this.options=opts;overlay=this;this.events={};}addTo(m){this._map=m;return this;}redraw(){}getTileSize(){return{x:256,y:256};}on(event,fn){this.events[event]=fn;}}
 const documentEvents={};globalThis.document={body:{style:{overflow:'scroll'}},addEventListener(event,fn){documentEvents[event]=fn;},getElementById:id=>nodes.get(id)};
 globalThis.L={map(host,opts){options=opts;return map;},control:{attribution:()=>({addTo(){}})},GridLayer,DomUtil:{create:()=>({style:{},setAttribute(){},getContext:()=>ctx})},tileLayer:()=>({addTo(){baseAdded=true;}})};
 try{
 const {renderRouteMap,clearRouteMap}=await import('../site/map.js');
 renderRouteMap([{type:'Ride',records:[{lat:54.3,lon:48.4,t:0},{lat:54.301,lon:48.401,t:10}]}]);
 assert.equal(baseAdded,true);assert.equal(options.scrollWheelZoom,true);assert.equal(options.zoomAnimation,true);assert.ok(overlay.index.segments>0);
 const [px,py]=project(54.3,48.4),coords={x:Math.floor(px*4/256),y:Math.floor(py*4/256),z:18};
 let completed=false;overlay.createTile(coords,(error)=>{assert.ifError(error);completed=true;});assert.equal(completed,false);
 await new Promise(resolve=>setTimeout(resolve,10));assert.equal(completed,true);assert.equal(images,1);assert.equal(ctx.globalCompositeOperation,'source-over');
 let cancelledCallback=false;const tile=overlay.createTile({x:0,y:0,z:2},()=>{cancelledCallback=true;});overlay.events.tileunload({tile});
 await new Promise(resolve=>setTimeout(resolve,10));assert.equal(cancelledCallback,false);
 await nodes.get('map-expand').handlers.click();assert.equal(nodes.get('map-panel').classList['map-expanded'],true);assert.equal(document.body.style.overflow,'hidden');assert.equal(nodes.get('map-expand')['aria-pressed'],'true');documentEvents.keydown({key:'Escape',preventDefault(){}});assert.equal(nodes.get('map-panel').classList['map-expanded'],false);assert.equal(document.body.style.overflow,'scroll');await nodes.get('map-expand').handlers.click();await nodes.get('map-expand').handlers.click();assert.equal(document.body.style.overflow,'scroll');
 const panel=nodes.get('map-panel');panel.requestFullscreen=async()=>{document.fullscreenElement=panel;documentEvents.fullscreenchange();};document.exitFullscreen=async()=>{document.fullscreenElement=null;documentEvents.fullscreenchange();};await nodes.get('map-expand').handlers.click();assert.equal(document.fullscreenElement,panel);await nodes.get('map-expand').handlers.click();assert.equal(document.fullscreenElement,null);assert.equal(document.body.style.overflow,'scroll');await nodes.get('map-expand').handlers.click();await document.exitFullscreen();assert.equal(nodes.get('map-expand')['aria-pressed'],'false');
 assert.equal(baseAdded,true);
 clearRouteMap();assert.equal(overlay.index.segments,0);assert.equal(baseAdded,false);
 }finally{delete globalThis.L;delete globalThis.document;}
});
