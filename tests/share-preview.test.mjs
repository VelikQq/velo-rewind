import {test} from 'node:test';import assert from 'node:assert/strict';
import {createSharePreview} from '../site/share-preview.js';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
test('card appears synchronously and becomes downloadable after its map, including no GPS',async()=>{
 const job=deferred(),paints=[],states=[];let loads=0;
 const preview=createSharePreview({paint:(...args)=>paints.push(args),renderMap:()=>{loads++;return job.promise;},onState:s=>states.push(s)}),input={year:2026};
 const pending=preview.prepare(input);assert.deepEqual(paints,[[input,undefined]]);assert.equal(preview.ready,false);assert.equal(states.at(-1).phase,'loading');job.resolve(null);assert.equal(await pending,true);assert.deepEqual(paints.at(-1),[input,null]);assert.equal(preview.ready,true);assert.equal(states.at(-1).phase,'ready');assert.equal(loads,1);
});
test('late progress and completion from an earlier period cannot overwrite the current card',async()=>{
 const jobs=[deferred(),deferred()],progress=[],paints=[],states=[];let i=0;
 const preview=createSharePreview({paint:(...args)=>paints.push(args),renderMap:callback=>{progress.push(callback);return jobs[i++].promise;},onState:s=>states.push(s)});
 const old=preview.prepare('old'),current=preview.prepare('new');jobs[1].resolve('new-map');await current;const count=states.length;progress[0](1,9);jobs[0].resolve('old-map');assert.equal(await old,false);assert.equal(states.length,count);assert.deepEqual(paints.at(-1),['new','new-map']);assert.equal(preview.ready,true);
});
test('reset invalidates in-flight export; map failure can be retried without enabling incomplete download',async()=>{
 const job=deferred(),states=[];let i=0;
 const preview=createSharePreview({paint(){},renderMap:()=>i++===0?job.promise:i===2?Promise.reject(Error('Offline')):Promise.resolve('map'),onState:s=>states.push(s)});
 const first=preview.prepare('first');preview.reset();job.resolve('late-map');assert.equal(await first,false);assert.equal(preview.ready,false);assert.equal(states.at(-1).phase,'empty');assert.equal(await preview.prepare('retry'),false);assert.equal(states.at(-1).phase,'error');assert.equal(preview.ready,false);assert.equal(await preview.prepare('retry'),true);assert.equal(preview.ready,true);
});
