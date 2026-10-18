import {routeHeat,routePaths} from './geo.js';
import {buildRouteIndex,routeTileSegments} from './route-tiles.js';
let map,layer,tiles,current;
export function renderRouteMap(activities){
 const host=document.getElementById('route-map');if(!host||!globalThis.L)return;
 const heat=routeHeat(activities);current=heat;
 document.getElementById('map-info').textContent=heat.rides?`${heat.rides} тренировок с GPS · ${heat.points.toLocaleString('ru-RU')} точек · максимум ${heat.max} тренировок на участке`:'Нет маршрутов с GPS. Загрузите папку с исходными FIT/TCX/GPX. Один CSV не содержит треков; виртуальные поездки исключены.';
 document.getElementById('map-panel').hidden=false;host.hidden=!heat.rides;document.getElementById('map-controls').hidden=!heat.rides;
 if(!heat.rides){if(layer)layer.setRoutes([],0);return;}
 if(!map){
  // Both tile layers use the same native pan/zoom transform.
  map=L.map(host,{preferCanvas:true,zoomAnimation:true,fadeAnimation:false,scrollWheelZoom:true,wheelDebounceTime:100,wheelPxPerZoomLevel:120,minZoom:2,maxZoom:18,attributionControl:false});
  L.control.attribution({prefix:false}).addTo(map);
  map.attributionControl.addAttribution('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
  const RouteTiles=L.GridLayer.extend({
   setRoutes(groups,max){this.index=buildRouteIndex(groups);this.max=max;this.redraw();},
   createTile(coords,done){
    const canvas=L.DomUtil.create('canvas'),size=this.getTileSize().x,dpr=Math.min(globalThis.devicePixelRatio||1,2);
    canvas.width=canvas.height=size*dpr;canvas.style.width=canvas.style.height=size+'px';canvas.setAttribute('aria-hidden','true');
    const index=this.index,max=this.max;
    // Yield between tiles so wheel/pointer events can run during a redraw.
    setTimeout(()=>{
     if(canvas._routeCancelled||!this._map)return;
     try{
      const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);ctx.lineCap=ctx.lineJoin='round';
      if(index)for(const {count,segments} of routeTileSegments(index,coords,size)){
     const t=max>1?Math.log(count)/Math.log(max):0;
     ctx.strokeStyle=`hsl(${174-150*t},85%,${65-2*t}%)`;ctx.lineWidth=2.5+t;ctx.globalAlpha=.8;ctx.beginPath();
     for(const [a,b] of segments){ctx.moveTo(...a);ctx.lineTo(...b);}ctx.stroke();
    }
      done(null,canvas);
     }catch(error){done(error,canvas);}
    },0);
    return canvas;
   }
  });
  layer=new RouteTiles({pane:'overlayPane',tileSize:256,noWrap:true,minZoom:2,maxZoom:18,updateWhenIdle:true,updateWhenZooming:false,keepBuffer:2}).addTo(map);
  layer.on('tileunload',e=>{e.tile._routeCancelled=true;});
  document.getElementById('map-fit').addEventListener('click',()=>{if(current?.bounds)map.fitBounds(current.bounds,{padding:[30,30],maxZoom:15,animate:false});});
  document.getElementById('map-basemap').addEventListener('change',e=>{
   if(e.target.checked){if(!tiles)tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,updateWhenZooming:false,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>'});tiles.addTo(map);}
   else if(tiles)map.removeLayer(tiles);
  });
 }
 map.invalidateSize({pan:false});map.fitBounds(heat.bounds,{padding:[30,30],maxZoom:15,animate:false});
 layer.setRoutes(routePaths(activities,heat),heat.max);
}
export function clearRouteMap(){current=null;if(layer)layer.setRoutes([],0);if(map&&tiles)map.removeLayer(tiles);const checkbox=document.getElementById('map-basemap');if(checkbox)checkbox.checked=false;const info=document.getElementById('map-info');if(info)info.textContent='';}
