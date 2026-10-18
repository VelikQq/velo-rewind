import {test} from 'node:test';
import assert from 'node:assert/strict';
test('wheel zoom and asynchronous route tiles survive replacement and clearing',async()=>{
 const nodes=new Map(['route-map','map-info','map-panel','map-controls','map-fit','map-basemap'].map(id=>[id,{hidden:false,checked:false,handlers:{},addEventListener(event,fn){this.handlers[event]=fn;}}]));
 let options,overlay,baseAdded=false;
 const map={attributionControl:{addAttribution(){}},invalidateSize(){},fitBounds(){},removeLayer(){baseAdded=false;}};
 const ctx={scale(){},beginPath(){},moveTo(){},lineTo(){},stroke(){}};
 class GridLayer{static extend(methods){class Routes extends GridLayer{}Object.assign(Routes.prototype,methods);return Routes;}constructor(opts){this.options=opts;overlay=this;this.events={};}addTo(m){this._map=m;return this;}redraw(){}getTileSize(){return{x:256,y:256};}on(event,fn){this.events[event]=fn;}}
 globalThis.document={getElementById:id=>nodes.get(id)};
 globalThis.L={map(host,opts){options=opts;return map;},control:{attribution:()=>({addTo(){}})},GridLayer,DomUtil:{create:()=>({style:{},setAttribute(){},getContext:()=>ctx})},tileLayer:()=>({addTo(){baseAdded=true;}})};
 try{
 const {renderRouteMap,clearRouteMap}=await import('../site/map.js');
 renderRouteMap([{type:'Ride',records:[{lat:54.3,lon:48.4,t:0},{lat:54.301,lon:48.401,t:10}]}]);
 assert.equal(options.scrollWheelZoom,true);assert.equal(options.zoomAnimation,true);assert.ok(overlay.index.segments>0);
 let completed=false;overlay.createTile({x:0,y:0,z:2},(error)=>{assert.ifError(error);completed=true;});assert.equal(completed,false);
 await new Promise(resolve=>setTimeout(resolve,10));assert.equal(completed,true);
 let cancelledCallback=false;const tile=overlay.createTile({x:0,y:0,z:2},()=>{cancelledCallback=true;});overlay.events.tileunload({tile});
 await new Promise(resolve=>setTimeout(resolve,10));assert.equal(cancelledCallback,false);
 nodes.get('map-basemap').handlers.change({target:{checked:true}});assert.equal(baseAdded,true);
 clearRouteMap();assert.equal(overlay.index.segments,0);assert.equal(baseAdded,false);
 }finally{delete globalThis.L;delete globalThis.document;}
});
