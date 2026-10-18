const types={jpg:['photo','image/jpeg'],jpeg:['photo','image/jpeg'],png:['photo','image/png'],webp:['photo','image/webp'],gif:['photo','image/gif'],avif:['photo','image/avif'],mp4:['video','video/mp4'],webm:['video','video/webm'],mov:['video','video/quicktime'],m4v:['video','video/mp4']};
export function mediaType(name){return types[String(name).split('.').pop().toLowerCase()]||null;}
export function mediaPath(value){
 let s=String(value||'').trim().replace(/\\/g,'/').replace(/^(\.\/)+/,'');
 if(/^[a-z][a-z\d+.-]*:|^\/|(?:^|\/)\.\.(?:\/|$)/i.test(s))return null;
 try{s=decodeURIComponent(s);}catch{}
 if(/^[a-z][a-z\d+.-]*:|^\/|(?:^|\/)\.\.(?:\/|$)/i.test(s))return null;
 return s.toLowerCase();
}
export function mediaReferences(value){return [...new Set(String(value||'').split('|').map(mediaPath).filter(Boolean))];}
export function buildMediaCatalog(files,activities){
 const candidates=new Map(),entries=[],missing=[];
 for(const file of files){const type=mediaType(file.name);if(!type)continue;const entry={file,kind:type[0],mime:type[1],activities:[]};entries.push(entry);
  const path=mediaPath(file.webkitRelativePath||file.name);if(!path)continue;
  const parts=path.split('/');for(let i=0;i<parts.length;i++){const suffix=parts.slice(i).join('/');if(!candidates.has(suffix))candidates.set(suffix,[]);candidates.get(suffix).push(entry);}
 }
 for(const activity of activities)for(const reference of activity.media||[]){
  const ref=mediaPath(reference);if(!ref)continue;
  const matches=candidates.get(ref)||candidates.get(ref.split('/').pop())||[];
  if(matches.length===1){if(!matches[0].activities.includes(activity))matches[0].activities.push(activity);}
  else missing.push({activity,reference:ref,reason:matches.length?'ambiguous':'missing'});
 }
 return {entries,missing,unlinked:entries.filter(e=>!e.activities.length).length};
}
export function seasonMedia(catalog,activities){
 const selected=new Set(activities);
 const items=catalog.entries.flatMap(entry=>{const matches=entry.activities.filter(a=>selected.has(a)).sort((a,b)=>b.date.localeCompare(a.date));return matches.length?[{...entry,activity:matches[0]}]:[];}).sort((a,b)=>b.activity.date.localeCompare(a.activity.date)||a.file.name.localeCompare(b.file.name));
 return {items,photos:items.filter(x=>x.kind==='photo').length,videos:items.filter(x=>x.kind==='video').length,rides:new Set(items.flatMap(x=>x.activities.filter(a=>selected.has(a)))).size,missing:catalog.missing.filter(x=>selected.has(x.activity)).length,unlinked:catalog.unlinked};
}
