import {routeHeat,routePaths} from './geo.js';
import {buildRouteIndex,routeTileSegments} from './route-tiles.js';
import {routeColorField,tileColorPixels} from './route-color.js';
let map,layer,tiles,current,expanded=false,previousOverflow="";
function resizeMap(){setTimeout(()=>map?.invalidateSize({pan:false}),0);}
function setExpanded(value){
 const panel=document.getElementById("map-panel"),button=document.getElementById("map-expand");
 if(value&&!expanded){previousOverflow=document.body.style.overflow;document.body.style.overflow="hidden";}
 if(!value&&expanded)document.body.style.overflow=previousOverflow;
 expanded=value;panel.classList.toggle("map-expanded",value);
 button.textContent=value?"Свернуть ✕":"На весь экран ⛶";button.setAttribute("aria-pressed",String(value));
 resizeMap();
}
async function collapseMap(){
 if(document.fullscreenElement===document.getElementById("map-panel")){try{await document.exitFullscreen();}catch{}}
 setExpanded(false);
}

export function renderRouteMap(activities){
 const host=document.getElementById('route-map');if(!host||!globalThis.L)return;
 const heat=routeHeat(activities);current=heat;
 document.getElementById('map-info').textContent=heat.rides?`${heat.rides} тренировок с GPS · ${heat.points.toLocaleString('ru-RU')} точек · максимум ${heat.max} тренировок на участке`:'Нет маршрутов с GPS. Загрузите папку с исходными FIT/TCX/GPX. Один CSV не содержит треков; виртуальные поездки исключены.';
 document.getElementById('map-panel').hidden=false;host.hidden=!heat.rides;document.getElementById('map-controls').hidden=!heat.rides;
 if(!heat.rides){if(expanded)collapseMap();if(layer)layer.setRoutes([],{cells:[],max:0});return;}
 if(!map){
  // Both tile layers use the same native pan/zoom transform.
  map=L.map(host,{preferCanvas:true,zoomAnimation:true,fadeAnimation:false,scrollWheelZoom:true,wheelDebounceTime:100,wheelPxPerZoomLevel:120,minZoom:2,maxZoom:18,attributionControl:false});
  L.control.attribution({prefix:false}).addTo(map);
  map.attributionControl.addAttribution('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
  const RouteTiles=L.GridLayer.extend({
   setRoutes(groups,heat){this.index=buildRouteIndex(groups);this.field=routeColorField(heat||{cells:[],max:0});this.redraw();},
   createTile(coords,done){
    const canvas=L.DomUtil.create('canvas'),size=this.getTileSize().x,dpr=Math.min(globalThis.devicePixelRatio||1,2);
    canvas.width=canvas.height=size*dpr;canvas.style.width=canvas.style.height=size+'px';canvas.setAttribute('aria-hidden','true');
    const index=this.index,field=this.field;
    // Yield between tiles so wheel/pointer events can run during a redraw.
    setTimeout(()=>{
     if(canvas._routeCancelled||!this._map)return;
     try{
      const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);ctx.lineCap=ctx.lineJoin='round';
      if(index){
       const groups=routeTileSegments(index,coords,size);
       if(groups.length){
        // One route mask: overlapping GPS samples cannot create opaque blocks.
        ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();
        for(const {segments} of groups)for(const [a,b] of segments){ctx.moveTo(...a);ctx.lineTo(...b);}ctx.stroke();
        // Apply a continuous colour field only inside the actual GPS lines.
        const color=tileColorPixels(field,coords,size),texture=L.DomUtil.create('canvas');
        texture.width=texture.height=color.width;const tc=texture.getContext('2d');
        const data=tc.createImageData(color.width,color.width);data.data.set(color.pixels);tc.putImageData(data,0,0);
        ctx.globalCompositeOperation='source-in';ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
        ctx.drawImage(texture,-color.pad,-color.pad,color.extent,color.extent);ctx.globalCompositeOperation='source-over';
       }
      }
      done(null,canvas);
     }catch(error){done(error,canvas);}
    },0);
    return canvas;
   }
  });
  layer=new RouteTiles({pane:'overlayPane',tileSize:256,noWrap:true,minZoom:2,maxZoom:18,updateWhenIdle:true,updateWhenZooming:false,keepBuffer:2}).addTo(map);
  layer.on('tileunload',e=>{e.tile._routeCancelled=true;});
  document.getElementById('map-expand').addEventListener('click',async()=>{
   const panel=document.getElementById('map-panel');
   if(expanded){await collapseMap();return;}
   setExpanded(true);
   if(panel.requestFullscreen){try{await panel.requestFullscreen();}catch{/* Expanded viewport remains available when fullscreen is denied. */}}
   resizeMap();
  });
  document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&expanded)setExpanded(false);else resizeMap();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&expanded){e.preventDefault();collapseMap();}});
  document.getElementById('map-fit').addEventListener('click',()=>{if(current?.bounds)map.fitBounds(current.bounds,{padding:[30,30],maxZoom:15,animate:false});});
  document.getElementById('map-basemap').addEventListener('change',e=>{
   if(e.target.checked){if(!tiles)tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,updateWhenZooming:false,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>'});tiles.addTo(map);}
   else if(tiles)map.removeLayer(tiles);
  });
 }
 map.invalidateSize({pan:false});map.fitBounds(heat.bounds,{padding:[30,30],maxZoom:15,animate:false});
 layer.setRoutes(routePaths(activities,heat),heat);
}
export function clearRouteMap(){if(expanded)collapseMap();current=null;if(layer)layer.setRoutes([],{cells:[],max:0});if(map&&tiles)map.removeLayer(tiles);const checkbox=document.getElementById('map-basemap');if(checkbox)checkbox.checked=false;const info=document.getElementById('map-info');if(info)info.textContent='';}
