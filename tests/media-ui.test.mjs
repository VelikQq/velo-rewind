import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('folder import renders season media, paginates and revokes URLs on filters and clear',async()=>{
 const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8'),nodes=new Map();
 for(const [,id] of html.matchAll(/\bid="([^"]+)"/g))nodes.set(id,{value:'',checked:false,hidden:false,innerHTML:'',textContent:'',handlers:{},classList:{toggle(){}},addEventListener(event,fn){this.handlers[event]=fn;},insertAdjacentHTML(where,text){this.innerHTML+=text;},scrollIntoView(){}});
 const year=nodes.get('year');Object.defineProperty(year,'innerHTML',{get(){return this.html;},set(v){this.html=v;this.value=v.match(/<option>(.*?)<\/option>/)?.[1]||'';}});
 nodes.get('csv-units').value='auto';nodes.get('ftp-method').value='estimate';
 const file=(path,content='',type='image/jpeg')=>Object.assign(new Blob([content],{type}),{name:path.split('/').pop(),webkitRelativePath:'export/'+path});
 const media=Array.from({length:25},(_,i)=>file('media/'+String(i).padStart(2,'0')+'.jpg'));media.push(file('media/z.mp4','','video/mp4'),file('media/old.jpg'));
 const refs=media.slice(0,26).map(f=>f.webkitRelativePath.replace('export/','')).join('|');
 const csv=file('activities.csv',`Activity ID,Activity Date,Activity Type,Activity Name,Distance,Media\n1,2026-05-01,Ride,Current ride,10,${refs}\n2,2025-05-01,Ride,Old ride,20,media/old.jpg`,'text/csv');
 const create=URL.createObjectURL,revoke=URL.revokeObjectURL;let created=0,revoked=[];
 URL.createObjectURL=()=>`blob:test-${++created}`;URL.revokeObjectURL=url=>revoked.push(url);
 globalThis.document={getElementById:id=>{assert.ok(nodes.has(id),id);return nodes.get(id);}};globalThis.window={scrollTo(){}};
 try{
  await import('../site/app.js');await nodes.get('folder').handlers.change({target:{files:[csv,...media]}});
  assert.match(html, /class="button primary" for="folder"/);assert.match(html,/media-src blob:/);
  assert.match(nodes.get('media-count').textContent,/25 фото · 1 видео/);assert.equal(created,24);assert.equal(nodes.get('media-more').hidden,false);assert.match(nodes.get('media-grid').innerHTML,/Current ride/);assert.ok(!nodes.get('media-grid').innerHTML.includes('Old ride'));
  nodes.get('media-more').handlers.click();assert.equal(created,26);assert.equal(nodes.get('media-more').hidden,true);assert.match(nodes.get('media-grid').innerHTML,/<video[^>]*controls preload="none"/);
  nodes.get('year').value='2025';nodes.get('year').handlers.change();assert.equal(revoked.length,26);assert.match(nodes.get('media-count').textContent,/1 фото · 0 видео/);assert.match(nodes.get('media-grid').innerHTML,/Old ride/);
  nodes.get('clear').handlers.click();assert.equal(revoked.length,27);assert.equal(nodes.get('media-grid').innerHTML,'');
 }finally{URL.createObjectURL=create;URL.revokeObjectURL=revoke;delete globalThis.document;delete globalThis.window;}
});
