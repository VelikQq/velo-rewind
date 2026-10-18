import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
// Integration harness checks application event wiring/render paths. This is not
// a browser, layout or Canvas test; those require manual browser verification.
test('demo, filters, story controls and clear work together without network',async()=>{
 const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');const nodes=new Map();
 for(const [,id]of html.matchAll(/\bid="([^"]+)"/g)){nodes.set(id,{id,value:'',checked:false,disabled:false,hidden:false,innerHTML:'',textContent:'',handlers:{},classList:{toggle(){}},addEventListener(type,fn){this.handlers[type]=fn;},insertAdjacentHTML(position,html){this.innerHTML+=html;},scrollIntoView(){},showModal(){this.open=true;},close(){this.open=false;}});}
 const year=nodes.get('year');Object.defineProperty(year,'innerHTML',{set(v){this._html=v;this.value=v.match(/<option>(.*?)<\/option>/)?.[1]||'';},get(){return this._html;}});
 nodes.get('kind').value='all';nodes.get('csv-units').value='auto';nodes.get('ftp-method').value='estimate';
 globalThis.document={getElementById:id=>{assert.ok(nodes.has(id),'Unknown element '+id);return nodes.get(id);}};globalThis.window={scrollTo(){}};
 await import('../site/app.js');nodes.get('demo').handlers.click();
 assert.equal(nodes.get('workspace').hidden,false);assert.match(nodes.get('dataset-label').textContent,/ДЕМО/);assert.match(nodes.get('summary').innerHTML,/91/);assert.match(nodes.get('power-curve').innerHTML,/20 мин/);assert.ok(!nodes.get('power-curve').innerHTML.includes('NaN'));assert.match(nodes.get('fun-cards').innerHTML,/Эверест/);assert.match(nodes.get('food-combos').innerHTML,/Вкусно — и точка/);assert.match(nodes.get('food-combos').innerHTML,/Додо Пицца/);assert.match(nodes.get('food-combos').innerHTML,/полных наборов/);assert.match(nodes.get('compare-rows').innerHTML,/Средняя мощность из сводок/);assert.match(nodes.get('compare-rows').innerHTML,/FTP/);assert.equal(nodes.get('ftp-method').value,'estimate');assert.match(nodes.get('compare-rows').innerHTML,/95%/);assert.equal(nodes.get('ftp-current-label').hidden,true);nodes.get('ftp-method').value='manual';nodes.get('ftp-current').value='240';nodes.get('ftp-method').handlers.change();assert.match(nodes.get('compare-rows').innerHTML,/240 Вт/);
 nodes.get('story').handlers.click();assert.equal(nodes.get('story-dialog').open,true);assert.match(nodes.get('story-counter').textContent,/^1 \/ \d+$/);nodes.get('next-story').handlers.click();assert.match(nodes.get('story-counter').textContent,/^2 \/ \d+$/);nodes.get('prev-story').handlers.click();assert.match(nodes.get('story-counter').textContent,/^1 \/ \d+$/);
 nodes.get('close-story').handlers.click();assert.equal(nodes.get('story-dialog').open,false);assert.match(nodes.get('media-count').textContent,/0 фото/);
 nodes.get('from').value='2027-01-01';nodes.get('to').value='2027-12-31';nodes.get('apply').handlers.click();assert.equal(nodes.get('empty').hidden,false);assert.equal(nodes.get('story').disabled,true);
 nodes.get('clear').handlers.click();assert.equal(nodes.get('workspace').hidden,true);
 delete globalThis.document;delete globalThis.window;
});
