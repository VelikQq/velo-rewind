import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,mkdir,rm,readdir,access} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join,dirname,resolve} from 'node:path';
import {preparePages} from '../scripts/prepare-pages.mjs';
test('published module graph and CSS share a release version and every local URL resolves',async()=>{
 const temp=await mkdtemp(join(tmpdir(),'velo-pages-'));try{
 const source=resolve('site'),version=await preparePages(source,temp);let references=0;
 async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const path=join(dir,e.name);if(e.isDirectory())await walk(path);else if(/\.(html|js)$/.test(path)){const content=await readFile(path,'utf8');for(const m of content.matchAll(/(["'])(\.\.?\/[^"'\s]+\.(?:css|js))(\?[^"'\s]*)?\1/g)){assert.equal(m[3],`?v=${version}`,path);await access(resolve(dirname(path),m[2]));references++;}}}}await walk(temp);assert.ok(references>20);
 }finally{await rm(temp,{recursive:true,force:true});}
});
test('a changed dependency changes both the entry and transitive import URLs',async()=>{
 const temp=await mkdtemp(join(tmpdir(),'velo-version-'));try{const src=join(temp,'src'),out=join(temp,'out');await mkdir(src);await writeFile(join(src,'index.html'),'<script type="module" src="./app.js"></script>');await writeFile(join(src,'app.js'),"import {a} from './data.js';");await writeFile(join(src,'data.js'),'export const a=1;');const first=await preparePages(src,out);await writeFile(join(src,'data.js'),'export const a=2;');const second=await preparePages(src,out);assert.notEqual(first,second);assert.match(await readFile(join(out,'index.html'),'utf8'),new RegExp(second));assert.match(await readFile(join(out,'app.js'),'utf8'),new RegExp(second));}finally{await rm(temp,{recursive:true,force:true});}
});
