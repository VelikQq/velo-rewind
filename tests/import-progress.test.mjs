import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('import progress waits for reads, deduplicates files, completes with warnings, resets and stops on fatal errors',async()=>{
 const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8'),nodes=new Map();for(const [,id]of html.matchAll(/\bid="([^"]+)"/g))nodes.set(id,{value:'',checked:false,hidden:false,innerHTML:'',textContent:'',handlers:{},classList:{toggle(){}},addEventListener(e,fn){this.handlers[e]=fn;},insertAdjacentHTML(where,s){this.innerHTML+=s;},scrollIntoView(){},close(){this.open=false;}});
 Object.defineProperty(nodes.get('year'),'innerHTML',{set(v){this.html=v;this.value=v.match(/<option>(.*?)<\/option>/)?.[1]||'';},get(){return this.html;}});nodes.get('csv-units').value='auto';nodes.get('ftp-method').value='estimate';nodes.get('share-canvas').getContext=()=>new Proxy({},{get:()=>()=>{},set:()=>true});

 for(const node of nodes.values())Object.defineProperty(node,'textContent',{get(){return this._text||'';},set(value){this._text=value;this.innerHTML='';}});
 globalThis.document={getElementById:id=>{assert.ok(nodes.has(id),id);return nodes.get(id);}};globalThis.window={scrollTo(){}};
 const file=(name,text)=>Object.assign(new Blob([text]),{name});
 let release,started;const ready=new Promise(resolve=>{started=resolve;}),gate=new Promise(resolve=>{release=resolve;});
 const text='Activity ID,date,Activity Type,Distance\n100,2026-06-01,Ride,50',csv={name:'activities.csv',size:text.length,arrayBuffer(){started();return gate;}};
 try{await import('../site/app.js');const loading=nodes.get('folder').handlers.change({target:{files:[csv,file('broken.fit','bad'),file('broken.fit','duplicate')]}});await ready;
  assert.equal(nodes.get('folder').disabled,true);assert.equal(nodes.get('clear').disabled,true);assert.match(nodes.get('import-status').innerHTML,/<progress max="4" value="0"/);assert.doesNotMatch(nodes.get('import-status').innerHTML,/100%/);
  release(new TextEncoder().encode(text).buffer);await loading;
  assert.match(nodes.get('import-status').innerHTML,/<progress max="4" value="4"/);assert.match(nodes.get('import-status').innerHTML,/Готово · есть ошибки файлов/);assert.match(nodes.get('import-status').textContent,/Ошибок файлов: 1/);assert.equal(nodes.get('folder').disabled,false);assert.equal(nodes.get('clear').disabled,false);
  await nodes.get('folder').handlers.change({target:{files:[file('activities.csv',text)]}});assert.match(nodes.get('import-status').innerHTML,/<progress max="3" value="3"/);assert.doesNotMatch(nodes.get('import-status').textContent,/Ошибок файлов/);
  await nodes.get('folder').handlers.change({target:{files:[file('broken.fit','bad')]}});assert.match(nodes.get('import-status').innerHTML,/Загрузка остановлена/);assert.doesNotMatch(nodes.get('import-status').innerHTML,/100%/);assert.equal(nodes.get('folder').disabled,false);
  nodes.get('clear').handlers.click();assert.equal(nodes.get('import-status').hidden,true);
 }finally{delete globalThis.document;delete globalThis.window;}
});
