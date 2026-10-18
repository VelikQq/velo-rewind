import {routeTileSegments} from './route-tiles.js';
import {tileColorPixels} from './route-color.js';
export function paintRouteTile(canvas,index,field,coords,{size=256,dpr=1,makeCanvas=()=>document.createElement('canvas')}={}){
 canvas.width=canvas.height=size*dpr;const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);ctx.lineCap=ctx.lineJoin='round';
 if(!index)return;const groups=routeTileSegments(index,coords,size);if(!groups.length)return;
 ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();
 for(const {segments} of groups)for(const [a,b] of segments){ctx.moveTo(...a);ctx.lineTo(...b);}ctx.stroke();
 const color=tileColorPixels(field,coords,size),texture=makeCanvas();texture.width=texture.height=color.width;
 const tc=texture.getContext('2d'),data=tc.createImageData(color.width,color.width);data.data.set(color.pixels);tc.putImageData(data,0,0);
 ctx.globalCompositeOperation='source-in';ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.drawImage(texture,-color.pad,-color.pad,color.extent,color.extent);ctx.globalCompositeOperation='source-over';
}
