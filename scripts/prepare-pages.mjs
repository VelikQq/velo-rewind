import {readdir,readFile,mkdir,writeFile} from 'node:fs/promises';
import {join,dirname,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
// Give the entire module graph one content version so cached imports cannot mix releases.
export async function preparePages(source,output){
 source=resolve(source);output=resolve(output);if(output===source||output.startsWith(source+'/'))throw Error('Output must be outside source');
 const files=[];async function walk(dir,prefix=''){for(const entry of await readdir(dir,{withFileTypes:true})){const path=join(prefix,entry.name);if(entry.isDirectory())await walk(join(dir,entry.name),path);else if(entry.isFile())files.push(path);}}await walk(source);files.sort();
 const contents=await Promise.all(files.map(path=>readFile(join(source,path))));const hash=createHash('sha256');files.forEach((path,i)=>hash.update(path).update(contents[i]));const version=hash.digest('hex').slice(0,16);
 for(let i=0;i<files.length;i++){const path=files[i];let content=contents[i];
 if(/\.(js|html)$/.test(path))content=content.toString().replace(/(["'])(\.\.?\/[^"'\s?]+\.(?:js|css))(?:\?[^"'\s]*)?\1/g,(match,quote,url)=>`${quote}${url}?v=${version}${quote}`);
 const target=join(output,path);await mkdir(dirname(target),{recursive:true});await writeFile(target,content);
 }return version;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const version=await preparePages('site','_site');console.log(`Prepared Pages assets ${version}`);}
