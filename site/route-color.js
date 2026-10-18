import {referenceZoom} from './geo.js';
const CELL=8,key=(x,y)=>x+','+y;
export function routeColorField(heat){
 const levels=new Map();
 const level=zoom=>{
  const size=CELL*2**Math.max(0,referenceZoom-Math.floor(zoom));if(levels.has(size))return levels.get(size);
  const cells=new Map(),cache=new Map();
  for(const c of heat.cells){const k=key(Math.floor(c.x/size),Math.floor(c.y/size));cells.set(k,Math.max(cells.get(k)||0,c.count));}
  // Gaussian smoothing of the display frequency, not of the GPS geometry.
  const at=(x,y)=>{
   const k=key(x,y);if(cache.has(k))return cache.get(k);let sum=0;const weights=[1,2,1];
   for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)sum+=(cells.get(key(x+dx,y+dy))||0)*weights[dx+1]*weights[dy+1];
   const v=sum/16;if(v>0)cache.set(k,v);return v;
  };
  const result={size,at};levels.set(size,result);return result;
 };
 return {max:heat.max,sample(x,y,zoom=18){const {size,at}=level(zoom),gx=x/size-.5,gy=y/size-.5,ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy;
  return at(ix,iy)*(1-fx)*(1-fy)+at(ix+1,iy)*fx*(1-fy)+at(ix,iy+1)*(1-fx)*fy+at(ix+1,iy+1)*fx*fy;
 }};
}

export function frequencyRGB(count,max){
 const t=max>1?Math.max(0,Math.min(1,Math.log(Math.max(1,count))/Math.log(max))):0;
 // Smooth interpolation through the same cyan -> yellow -> mandarin scale.
 const stops=[[128,214,206],[255,220,120],[255,153,85]],i=t<.5?0:1,f=t<.5?t*2:(t-.5)*2;
 return stops[i].map((v,k)=>Math.round(v+(stops[i+1][k]-v)*f));
}
export function tileColorPixels(field,{x,y,z},size=256){
 const step=4,pad=4,width=Math.ceil((size+2*pad)/step),pixels=new Uint8ClampedArray(width*width*4),scale=2**(z-referenceZoom);
 for(let row=0;row<width;row++)for(let col=0;col<width;col++){
  const wx=(x*size-pad+(col+.5)*step)/scale,wy=(y*size-pad+(row+.5)*step)/scale;
  const rgb=frequencyRGB(field.sample(wx,wy,z),field.max),i=(row*width+col)*4;
  pixels[i]=rgb[0];pixels[i+1]=rgb[1];pixels[i+2]=rgb[2];pixels[i+3]=255;
 }
 return {pixels,width,pad,extent:width*step};
}
