import {project,referenceZoom} from './geo.js';
const BIN=4096;
const key=(x,y)=>x+','+y;
// Remove interpolation points on straight sections once, rather than at every zoom.
function simplify(points,tolerance=.25){
 if(points.length<=2)return points;
 const keep=new Uint8Array(points.length);keep[0]=keep[points.length-1]=1;
 const stack=[[0,points.length-1]],limit=tolerance*tolerance;
 while(stack.length){const [first,last]=stack.pop(),a=points[first],b=points[last],dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;let furthest=-1,max=limit;
  for(let i=first+1;i<last;i++){const p=points[i],t=length?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length)):0;const distance=(p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2;if(distance>max){max=distance;furthest=i;}}
  if(furthest!==-1){keep[furthest]=1;stack.push([first,furthest],[furthest,last]);}
 }
 return points.filter((_,i)=>keep[i]);
}
export function buildRouteIndex(groups){
 const projected=groups.map(({count,paths})=>({count,paths:paths.map(path=>simplify(path.map(p=>project(p[0],p[1])),.125))}));
 const levels=new Map();
 for(const zoom of [6,10,14,18])levels.set(zoom,buildLevel(projected,.5*2**(referenceZoom-zoom)));
 return {...levels.get(18),levels};
}
function buildLevel(groups,tolerance){
 const bins=new Map(),unique=new Set();let segments=0;
 for(const {count,paths} of groups)for(const path of paths){
  const points=simplify(path,tolerance);
  for(let i=1;i<points.length;i++){
   const [x1,y1]=points[i-1],[x2,y2]=points[i];if(x1===x2&&y1===y2)continue;
   const a=key(x1,y1),b=key(x2,y2),id=count+':'+(a<b?a+':'+b:b+':'+a);if(unique.has(id))continue;unique.add(id);
   const segment={x1,y1,x2,y2,count};segments++;
   for(let x=Math.floor(Math.min(x1,x2)/BIN);x<=Math.floor(Math.max(x1,x2)/BIN);x++)for(let y=Math.floor(Math.min(y1,y2)/BIN);y<=Math.floor(Math.max(y1,y2)/BIN);y++){
    const k=key(x,y);if(!bins.has(k))bins.set(k,{x,y,segments:[]});bins.get(k).segments.push(segment);
   }
  }
 }
 return {bins,segments};
}
// Tile-local coordinates: no LatLng objects or Mercator logarithms during interaction.
export function routeTileSegments(index,{x,y,z},size=256){
 if(index.levels)index=index.levels.get([6,10,14,18].find(level=>level>=z)||18);
 const scale=2**(z-referenceZoom),margin=4,ox=x*size,oy=y*size;
 const minX=(ox-margin)/scale,minY=(oy-margin)/scale,maxX=(ox+size+margin)/scale,maxY=(oy+size+margin)/scale;
 const bx1=Math.floor(minX/BIN),by1=Math.floor(minY/BIN),bx2=Math.floor(maxX/BIN),by2=Math.floor(maxY/BIN),candidates=[];
 if((bx2-bx1+1)*(by2-by1+1)>index.bins.size){for(const bin of index.bins.values())if(bin.x>=bx1&&bin.x<=bx2&&bin.y>=by1&&bin.y<=by2)candidates.push(bin);}
 else for(let bx=bx1;bx<=bx2;bx++)for(let by=by1;by<=by2;by++){const bin=index.bins.get(key(bx,by));if(bin)candidates.push(bin);}
 const seen=new Set(),pixels=new Set(),groups=new Map();
 for(const bin of candidates)for(const s of bin.segments){
  if(seen.has(s))continue;seen.add(s);
  if(Math.max(s.x1,s.x2)<minX||Math.min(s.x1,s.x2)>maxX||Math.max(s.y1,s.y2)<minY||Math.min(s.y1,s.y2)>maxY)continue;
  const a=[Math.round((s.x1*scale-ox)*4)/4,Math.round((s.y1*scale-oy)*4)/4],b=[Math.round((s.x2*scale-ox)*4)/4,Math.round((s.y2*scale-oy)*4)/4];
  if(a[0]===b[0]&&a[1]===b[1])continue;
  const ak=key(...a),bk=key(...b),pixel=s.count+':'+(ak<bk?ak+':'+bk:bk+':'+ak);if(pixels.has(pixel))continue;pixels.add(pixel);
  if(!groups.has(s.count))groups.set(s.count,[]);groups.get(s.count).push([a,b]);
 }
 return [...groups].sort((a,b)=>a[0]-b[0]).map(([count,segments])=>({count,segments}));
}
