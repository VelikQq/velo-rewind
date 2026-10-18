import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildRouteIndex,routeTileSegments} from '../site/route-tiles.js';
import {project,unproject} from '../site/geo.js';
const path=(...points)=>points.map(p=>unproject(...p));
test('index removes straight interpolation points and duplicate ride geometry',()=>{
 const p=path([100,100],[101,101],[102,102],[110,110]);
 const index=buildRouteIndex([{count:2,paths:[p,p,[...p].reverse()]}]);
 assert.equal(index.segments,1);assert.equal(routeTileSegments(index,{x:0,y:0,z:16})[0].count,2);
});
test('tile query skips offscreen geometry and preserves turns and frequency',()=>{
 const index=buildRouteIndex([{count:1,paths:[path([100,100],[110,120],[120,100]),path([8000,8000],[8100,8000])]},{count:8,paths:[path([130,130],[140,140])]}]);
 const visible=routeTileSegments(index,{x:0,y:0,z:16});
 assert.deepEqual(visible.map(g=>g.count),[1,8]);assert.equal(visible[0].segments.length,2);
 assert.deepEqual(routeTileSegments(index,{x:80,y:80,z:16}),[]);
});
test('neighbouring tiles have identical global line coordinates at maximum zoom',()=>{
 const index=buildRouteIndex([{count:1,paths:[path([63,40],[65,41])]}]);
 const left=routeTileSegments(index,{x:0,y:0,z:18})[0].segments[0];
 const right=routeTileSegments(index,{x:1,y:0,z:18})[0].segments[0];
 assert.deepEqual(left,right.map(([x,y])=>[x+256,y]));
 assert.deepEqual(left,[[252,160],[260,164]]);
});
test('separate paths are never connected during indexing',()=>{
 const index=buildRouteIndex([{count:1,paths:[path([10,10],[20,20]),path([80,80],[90,90])]}]);
 assert.deepEqual(routeTileSegments(index,{x:0,y:0,z:16})[0].segments,[[[10,10],[20,20]],[[80,80],[90,90]]]);
});
test('very distant zoom uses only occupied bins and finite coordinates',()=>{
 const [x,y]=project(54.3,48.4),index=buildRouteIndex([{count:1,paths:[path([x,y],[x+10000,y+10000])]}]);
 const result=routeTileSegments(index,{x:Math.floor(x/2**14/256),y:Math.floor(y/2**14/256),z:2});
 assert.ok(result.length);assert.ok(result[0].segments.flat(2).every(Number.isFinite));
});
