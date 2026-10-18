import {test} from 'node:test';
import assert from 'node:assert/strict';
import {routeColorField,tileColorPixels,frequencyRGB} from '../site/route-color.js';
test('frequency is continuous at cell boundaries instead of rectangular steps',()=>{
 const heat={max:20,cells:[{x:4,y:4,count:1},{x:12,y:4,count:20}]},before=JSON.stringify(heat),field=routeColorField(heat);
 assert.ok(Math.abs(field.sample(8-1e-6,4)-field.sample(8+1e-6,4))<1e-4);
 assert.ok(field.sample(8,4)>1);assert.equal(JSON.stringify(heat),before);
});
test('neighbouring colour tiles share identical overlap samples at large zoom',()=>{
 const field=routeColorField({max:10,cells:[{x:68,y:44,count:10},{x:60,y:44,count:1}]}),a=tileColorPixels(field,{x:0,y:0,z:18}),b=tileColorPixels(field,{x:1,y:0,z:18});
 for(let y=0;y<a.width;y++)for(let x=0;x<2;x++){
  const ai=(y*a.width+a.width-2+x)*4,bi=(y*b.width+x)*4;
  assert.deepEqual(a.pixels.slice(ai,ai+4),b.pixels.slice(bi,bi+4));
 }
});
test('colour scale clamps missing/zero values and uses finite RGB channels',()=>{
 for(const count of [0,1,2,20,100])assert.ok(frequencyRGB(count,20).every(v=>Number.isInteger(v)&&v>=0&&v<=255));
 assert.deepEqual(frequencyRGB(1,1),[128,214,206]);
});

test('wide zoom preserves narrow hot routes in the display frequency',()=>{
 const field=routeColorField({max:50,cells:[{x:4004,y:4004,count:50}]});
 assert.ok(field.sample(4004,4004,10)>1);assert.ok(field.sample(4004,4004,18)>1);
});
