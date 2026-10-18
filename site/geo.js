// Web Mercator cells: each ride contributes at most once to each cell.
const WORLD=256*2**16,CELL=8;
export function project(lat,lon){const y=Math.max(-85.05112878,Math.min(85.05112878,lat))*Math.PI/180;return [(lon+180)/360*WORLD,(1-Math.log(Math.tan(y)+1/Math.cos(y))/Math.PI)/2*WORLD];}
export function unproject(x,y){return [Math.atan(Math.sinh(Math.PI*(1-2*y/WORLD)))*180/Math.PI,x/WORLD*360-180];}
export function validGPS(r){return Number.isFinite(r?.lat)&&Number.isFinite(r?.lon)&&Math.abs(r.lat)<=85.05112878&&Math.abs(r.lon)<=180;}
// Split exactly at grid boundaries, so colouring and ride counts use identical cells.
function cellPieces(a,b){
 const dx=b[0]-a[0],dy=b[1]-a[1],cuts=[0,1];
 for(let axis=0;axis<2;axis++){
  const delta=b[axis]-a[axis];if(!delta)continue;
  for(let k=Math.floor(Math.min(a[axis],b[axis])/CELL)+1;k*CELL<Math.max(a[axis],b[axis]);k++)cuts.push((k*CELL-a[axis])/delta);
 }
 cuts.sort((a,b)=>a-b);const pieces=[];
 for(let i=1;i<cuts.length;i++){
  const from=cuts[i-1],to=cuts[i];if(to-from<1e-12)continue;const mid=(from+to)/2;
  pieces.push({from,to,key:Math.floor((a[0]+dx*mid)/CELL)+','+Math.floor((a[1]+dy*mid)/CELL)});
 }
 return pieces;
}
export function routeHeat(activities){const cells=new Map();let rides=0,points=0,breaks=0;for(const a of activities){if(/virtual|indoor|тренаж|виртуал/i.test(a.type))continue;let previous=null,accepted=0;const visited=new Set();for(const r of a.records){if(!validGPS(r)){previous=null;continue;}const p=project(r.lat,r.lon);accepted++;points++;if(previous){const dx=p[0]-previous.p[0],dy=p[1]-previous.p[1],meters=Math.hypot(dx,dy)*40075016.686/WORLD*Math.cos(r.lat*Math.PI/180),dt=r.t-previous.t;
 // No invented links across pauses, teleports or the antimeridian.
 if(meters<=2000&&(!Number.isFinite(dt)||dt>=0&&dt<=120)){for(const piece of cellPieces(previous.p,p))visited.add(piece.key);}else breaks++;}
 visited.add(Math.floor(p[0]/CELL)+','+Math.floor(p[1]/CELL));previous={p,t:r.t};}if(accepted<2)continue;rides++;for(const key of visited)cells.set(key,(cells.get(key)||0)+1);}
 const entries=[];let max=0,minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(const [key,count]of cells){const [gx,gy]=key.split(',').map(Number),x=(gx+.5)*CELL,y=(gy+.5)*CELL;entries.push({x,y,count});minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);max=Math.max(max,count);}
 return {cells:entries,max,rides,points,breaks,bounds:entries.length?[unproject(minX,maxY),unproject(maxX,minY)]:null};}
export const referenceZoom=16;

// Keep the recorded geometry; cells affect colour, never snap the track to a grid.
export function routePaths(activities,heat=routeHeat(activities)){
 const counts=new Map(heat.cells.map(c=>[Math.floor(c.x/CELL)+','+Math.floor(c.y/CELL),c.count]));
 const groups=new Map();
 for(const a of activities){
  if(/virtual|indoor|тренаж|виртуал/i.test(a.type))continue;
  let previous=null,path=null,lastCount=null;
  for(const r of a.records){
   if(!validGPS(r)){previous=null;path=null;continue;}
   const p=project(r.lat,r.lon);
   if(previous){
    const dx=p[0]-previous.p[0],dy=p[1]-previous.p[1];
    const meters=Math.hypot(dx,dy)*40075016.686/WORLD*Math.cos(r.lat*Math.PI/180),dt=r.t-previous.t;
    if(meters<=2000&&(!Number.isFinite(dt)||dt>=0&&dt<=120)){
     for(const {from,to,key} of cellPieces(previous.p,p)){
      const count=counts.get(key)||1;
      const end=unproject(previous.p[0]+dx*to,previous.p[1]+dy*to);
      if(!path||count!==lastCount){
       path=[unproject(previous.p[0]+dx*from,previous.p[1]+dy*from)];
       if(!groups.has(count))groups.set(count,[]);
       groups.get(count).push(path);lastCount=count;
      }
      path.push(end);
     }
    }else path=null;
   }
   previous={p,t:r.t};
  }
 }
 return [...groups].sort((a,b)=>a[0]-b[0]).map(([count,paths])=>({count,paths}));
}
