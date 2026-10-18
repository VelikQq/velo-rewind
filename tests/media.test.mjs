import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mediaReferences,buildMediaCatalog,seasonMedia} from '../site/media.js';
import {csvActivities,mergeActivities} from '../site/data.js';
const file=path=>({name:path.split('/').pop(),webkitRelativePath:path,size:999});
test('Russian and English CSV media headers preserve pipe-separated references through merge',()=>{
 for(const header of ['Медиафайл','Media','Media File']){
  const parsed=csvActivities(`Activity ID,Activity Date,Activity Type,Filename,${header}\n123,2026-05-01,Ride,activities/123.fit,media/photo.JPG|media/video.mp4`).activities;
  assert.deepEqual(parsed[0].media,['media/photo.jpg','media/video.mp4']);
  const merged=mergeActivities(parsed,[{id:'123',file:'123',records:[],date:'2026-05-01'}]);assert.deepEqual(merged[0].media,parsed[0].media);
 }
});
test('media paths cannot point to remote resources or traverse folders',()=>{
 assert.deepEqual(mediaReferences('https://example.test/a.jpg|//host/a.jpg|../a.jpg|%2e%2e/a.jpg|media/A%20B.jpg|media/A%20B.jpg'),['media/a b.jpg']);
});
test('folder media follows activity dates and selected sport filters, never file timestamps',()=>{
 const a={id:'1',date:'2026-05-01',type:'Ride',media:['media/a.jpg','media/v.mp4']},b={id:'2',date:'2025-05-01',type:'Ride',media:['media/b.jpg']};
 const files=[file('some-export/media/A.JPG'),file('some-export/media/v.mp4'),file('some-export/media/b.jpg'),file('some-export/media/unlinked.jpg')];
 const catalog=buildMediaCatalog(files,[a,b]);const season=seasonMedia(catalog,[a]);
 assert.equal(season.photos,1);assert.equal(season.videos,1);assert.equal(season.rides,1);assert.equal(season.unlinked,1);assert.ok(season.items.every(x=>x.activity===a));assert.equal(seasonMedia(catalog,[]).items.length,0);
});
test('missing files and ambiguous filenames remain explicit, shared media is not duplicated',()=>{
 const a={date:'2026-01-01',media:['media/shared.jpg','media/gone.jpg','duplicate.jpg']},b={date:'2026-02-01',media:['media/shared.jpg']};
 const catalog=buildMediaCatalog([file('export/media/shared.jpg'),file('export/one/duplicate.jpg'),file('export/two/duplicate.jpg')],[a,b]);
 const result=seasonMedia(catalog,[a,b]);assert.equal(result.items.length,1);assert.equal(result.rides,2);assert.equal(result.missing,2);assert.equal(result.items[0].activity,b);
});
test('CSV-only import reports missing references instead of inventing media',()=>{
 const a={date:'2026-01-01',media:['media/a.jpg']};const result=seasonMedia(buildMediaCatalog([],[a]),[a]);assert.equal(result.items.length,0);assert.equal(result.missing,1);
});
