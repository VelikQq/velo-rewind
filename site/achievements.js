import {parseCSV,dateKey} from './data.js';
const clean=s=>String(s??'').trim().replace(/\s+/g,' ');
const aliases={name:['сегмент','участок','название','название участка','segment','segment name','name'],date:['дата','дата результата','date','date achieved'],rank:['место','позиция','ранг','rank','place','position'],time:['время','результат','time','elapsed time'],url:['ссылка','url','link','segment url']};
export function achievementDate(value,order='dmy'){
 const s=clean(value);let date;
 if(order==='mdy'&&/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)){const [m,d,y]=s.split('/');date=`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;}else date=dateKey(s);
 if(!date||!/^(?:19|20)\d{2}-\d{2}-\d{2}$/.test(date))return null;
 const n=new Date(date+'T00:00:00Z');return Number.isFinite(n.getTime())&&n.toISOString().slice(0,10)===date?date:null;
}
export function achievementRank(value){const s=clean(value);if(/^(?:KOM|QOM|CR|КOM|КОМ|КР)$/i.test(s))return 1;const m=s.match(/^#?(10|[1-9])(?:[.)]|[- ]?(?:е|й)|st|nd|rd|th)?$/i);return m?Number(m[1]):null;}
export function segmentURL(value){try{const u=new URL(clean(value));if(!['http:','https:'].includes(u.protocol)||!['strava.com','www.strava.com','m.strava.com'].includes(u.hostname)||!/^\/segments\/\d+\/?$/.test(u.pathname))return null;return 'https://www.strava.com'+u.pathname.replace(/\/$/,'');}catch{return null;}}
export function achievementKey(entry){return [entry.url||entry.name.toLocaleLowerCase(),entry.date,entry.rank].join('|');}
export function mergeAchievements(previous,next){const map=new Map(previous.map(e=>[achievementKey(e),e]));for(const e of next)map.set(achievementKey(e),e);return [...map.values()];}
export function parseAchievements(text,{order='dmy',crowns=false}={}){
 if(text.length>2*1024*1024)throw Error('Список больше 2 МБ. Импортируйте его частями.');
 const first=text.replace(/^\uFEFF/,'').split(/\r?\n/).find(x=>x.trim())||'';
 const delimiter=first.includes('\t')?'\t':first.includes('|')?'|':undefined;
 const rows=parseCSV(text.trim(),delimiter);if(rows.length>5001)throw Error('За один раз можно импортировать до 5000 строк.');
 const errors=[],entries=[];let columns=null,start=0;
 for(let i=0;i<Math.min(10,rows.length);i++){
  const header=rows[i].map(x=>clean(x).toLowerCase()),found={};
  for(const [key,names]of Object.entries(aliases))found[key]=header.findIndex(x=>names.includes(x));
  if(found.name>=0&&found.date>=0){columns=found;start=i+1;break;}
 }
 for(let i=start;i<rows.length;i++){
  const cells=rows[i].map(clean);if(!cells.some(Boolean))continue;
  let name,date,rank,time='',url='',rawURL='';
  if(columns){name=cells[columns.name]||'';date=achievementDate(cells[columns.date],order);rank=columns.rank>=0?(crowns&&!cells[columns.rank]?1:achievementRank(cells[columns.rank])):crowns?1:null;time=columns.time>=0?cells[columns.time]||'':'';rawURL=columns.url>=0?cells[columns.url]||'':'';}
  else {
   const dates=cells.map((v,j)=>achievementDate(v,order)?j:-1).filter(j=>j>=0),ranks=cells.map((v,j)=>achievementRank(v)?j:-1).filter(j=>j>=0),urls=cells.map((v,j)=>segmentURL(v)?j:-1).filter(j=>j>=0);
   const used=new Set([...dates,...ranks,...urls]);const names=cells.filter((v,j)=>v&&!used.has(j)&&!/^\d+(?::\d+){1,2}(?:\.\d+)?$/.test(v)&&!/^[-+]?\d[\d\s.,]*\s*(?:km|км|m|м|%|km\/h|км\/ч|mph|mi)$/i.test(v));
   if(dates.length===1)date=achievementDate(cells[dates[0]],order);if(ranks.length===1)rank=achievementRank(cells[ranks[0]]);else if(!ranks.length&&crowns)rank=1;
   if(names.length===1)name=names[0];if(urls.length===1)rawURL=cells[urls[0]];time=cells.find(v=>/^\d+(?::\d+){1,2}(?:\.\d+)?$/.test(v))||'';
  }
  url=rawURL?segmentURL(rawURL):'';
  if(!name||name.length>500||!date||!rank||(rawURL&&!url)){errors.push({line:i+1,message:!name?'не удалось определить название участка':!date?'дата не распознана или некорректна':!rank?'укажите место от 1 до 10 или KOM/QOM/CR':rawURL&&!url?'ссылка должна вести на strava.com/segments/…':'слишком длинное название'});continue;}
  entries.push({name,date,rank,time:time.slice(0,100),url:url||''});
 }
 const unique=mergeAchievements([],entries);return {entries:unique,errors,duplicates:entries.length-unique.length};
}
export function seasonAchievements(entries,from,to){const rows=entries.filter(e=>e.date>=from&&e.date<=to).sort((a,b)=>a.rank-b.rank||b.date.localeCompare(a.date)||a.name.localeCompare(b.name));return {rows,crowns:rows.filter(e=>e.rank===1).length,top10:rows.filter(e=>e.rank>=2&&e.rank<=10).length};}
export function achievementsCSV(entries){const rows=[['Сегмент','Дата','Место','Время','Ссылка'],...entries.map(e=>[e.name,e.date,e.rank,e.time,e.url])];return '\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');}
