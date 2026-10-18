import {project,referenceZoom} from './geo.js';
import {paintRouteTile} from './route-render.js';
export function mapExportViewport(bounds,width,height,padding=35){
 const a=project(...bounds[0]),b=project(...bounds[1]),minX=Math.min(a[0],b[0]),maxX=Math.max(a[0],b[0]),minY=Math.min(a[1],b[1]),maxY=Math.max(a[1],b[1]);
 const fit=Math.min((width-2*padding)/Math.max(1,maxX-minX),(height-2*padding)/Math.max(1,maxY-minY));
 const zoom=Math.max(0,Math.min(18,referenceZoom+Math.floor(Math.log2(fit)))),scale=2**(zoom-referenceZoom),originX=(minX+maxX)/2*scale-width/2,originY=(minY+maxY)/2*scale-height/2;
 const tiles=[];for(let x=Math.floor(originX/256);x<=Math.floor((originX+width-1)/256);x++)for(let y=Math.floor(originY/256);y<=Math.floor((originY+height-1)/256);y++)if(x>=0&&x<2**zoom&&y>=0&&y<2**zoom)tiles.push({x,y,z:zoom,dx:x*256-originX,dy:y*256-originY});
 return {zoom,scale,originX,originY,tiles};
}
export function loadMapImage(url){return new Promise((resolve,reject)=>{
 const img=new Image(),timer=setTimeout(()=>{img.onload=img.onerror=null;reject(Error('Карта не ответила вовремя. Проверьте сеть и повторите скачивание.'));},12000);
 img.crossOrigin='anonymous';img.onload=()=>{clearTimeout(timer);resolve(img);};img.onerror=()=>{clearTimeout(timer);reject(Error('Не удалось загрузить подложку карты. Проверьте сеть и повторите скачивание.'));};img.src=url;
});}
export async function renderExportMap({heat,index,field},width,height,{makeCanvas=()=>document.createElement('canvas'),loadImage=loadMapImage,onProgress=()=>{},transparent=false}={}){
 if(!heat?.bounds||!heat.rides)return null;
 const canvas=makeCanvas();canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d'),view=mapExportViewport(heat.bounds,width,height);
 if(!transparent){ctx.fillStyle='#20232b';ctx.fillRect(0,0,width,height);}let next=0,completed=0,failed;
 // A single, user-visible card view only; no other areas or zoom levels are fetched.
 const images=new Array(view.tiles.length);
 if(!transparent)await Promise.all(Array.from({length:Math.min(4,view.tiles.length)},async()=>{while(next<view.tiles.length&&!failed){const i=next++,tile=view.tiles[i];try{images[i]=await loadImage(`https://tile.openstreetmap.org/${tile.z}/${tile.x}/${tile.y}.png`);onProgress(++completed,view.tiles.length);}catch(error){failed=error;}}}));
 if(failed)throw failed;
 if(!transparent){ctx.save();ctx.filter='grayscale(1) brightness(.7)';for(let i=0;i<view.tiles.length;i++){const tile=view.tiles[i];ctx.drawImage(images[i],tile.dx,tile.dy,256,256);}ctx.restore();ctx.filter='none';}
 for(const tile of view.tiles){const overlay=makeCanvas();paintRouteTile(overlay,index,field,tile,{makeCanvas});ctx.drawImage(overlay,tile.dx,tile.dy);}
 // The share card places required OSM attribution below the map.
 return canvas;
}
