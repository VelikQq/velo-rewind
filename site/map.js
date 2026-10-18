import {routeHeat,routePaths} from './geo.js';
let map,layer,tiles,current,renderer;
export function renderRouteMap(activities){
 const host=document.getElementById('route-map');if(!host||!globalThis.L)return;
 const heat=routeHeat(activities);current=heat;
 document.getElementById('map-info').textContent=heat.rides?`${heat.rides} тренировок с GPS · ${heat.points.toLocaleString('ru-RU')} точек · максимум ${heat.max} тренировок на участке`:'Нет маршрутов с GPS. Загрузите папку с исходными FIT/TCX/GPX. Один CSV не содержит треков; виртуальные поездки исключены.';
 document.getElementById('map-panel').hidden=false;host.hidden=!heat.rides;document.getElementById('map-controls').hidden=!heat.rides;
 if(layer)layer.clearLayers();if(!heat.rides)return;
 if(!map){
  // Native Canvas paths share Leaflet's projection, clipping and map events.
  // Disable raster zoom animation for tiles AND paths to avoid scaled pixels.
  map=L.map(host,{preferCanvas:true,zoomAnimation:false,fadeAnimation:false,scrollWheelZoom:false,minZoom:2,maxZoom:18,attributionControl:false});
  L.control.attribution({prefix:false}).addTo(map);
  map.attributionControl.addAttribution('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
  layer=L.layerGroup().addTo(map);
  document.getElementById('map-fit').addEventListener('click',()=>{if(current?.bounds)map.fitBounds(current.bounds,{padding:[30,30],maxZoom:15,animate:false});});
  document.getElementById('map-basemap').addEventListener('change',e=>{
   if(e.target.checked){if(!tiles)tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,updateWhenZooming:false,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>'});tiles.addTo(map);}
   else if(tiles)map.removeLayer(tiles);
  });
 }
 map.invalidateSize({pan:false});map.fitBounds(heat.bounds,{padding:[30,30],maxZoom:15,animate:false});
 renderer ||= L.canvas({padding:.3});
 for(const {count,paths} of routePaths(activities,heat)){
  const t=heat.max>1?Math.log(count)/Math.log(heat.max):0;
  L.polyline(paths,{renderer,interactive:false,smoothFactor:1,weight:2.5+t,opacity:.8,color:`hsl(${174-150*t},85%,${65-2*t}%)`,lineCap:'round',lineJoin:'round'}).addTo(layer);
 }
}
export function clearRouteMap(){current=null;if(layer)layer.clearLayers();if(map&&tiles)map.removeLayer(tiles);const checkbox=document.getElementById('map-basemap');if(checkbox)checkbox.checked=false;const info=document.getElementById('map-info');if(info)info.textContent='';}
