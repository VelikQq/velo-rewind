import {mediaReferences} from './media.js';
// No network or storage. All data stays in memory until the tab closes.
export function number(v) {
 if(v===null||v===undefined||String(v).trim()==='') return null;
 const n=Number(String(v).replace(/[\s\u00a0]/g,'').replace(',','.'));
 return Number.isFinite(n)&&n>=0?n:null;
}
export function duration(v){if(v==null||v==='')return null;if(String(v).includes(':'))return String(v).split(':').reduce((a,b)=>a*60+Number(b),0);return number(v);}
export function parseCSV(text){
 text=text.replace(/^\uFEFF/,''); const line=text.split(/\r?\n/)[0];
 const delimiter=(line.match(/;/g)||[]).length>(line.match(/,/g)||[]).length?';':',';
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
 else if(c===delimiter&&!quoted){row.push(cell);cell='';}
 else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)throw Error('В CSV не закрыта кавычка. Проверьте файл.'); row.push(cell);if(row.some(x=>x.trim()))rows.push(row);return rows;
}
const months={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11,'янв':0,'фев':1,'мар':2,'апр':3,'май':4,'мая':4,'июн':5,'июл':6,'авг':7,'сен':8,'окт':9,'ноя':10,'дек':11};
export function dateKey(value){
 if(!value)return null;const s=String(value).trim();let m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
 if(m)return `${m[1]}-${m[2]}-${m[3]}`;
 m=s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})/);if(m)return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
 m=s.toLowerCase().match(/([a-zа-яё]+)\.?\s+(\d{1,2}),?\s+(\d{4})/i);
 if(m&&months[m[1].slice(0,3)]!==undefined)return `${m[3]}-${String(months[m[1].slice(0,3)]+1).padStart(2,'0')}-${m[2].padStart(2,'0')}`;
 m=s.toLowerCase().match(/(\d{1,2})\s+([a-zа-яё]+)\.?[,]?\s+(\d{4})/i);
 if(m&&months[m[2].slice(0,3)]!==undefined)return `${m[3]}-${String(months[m[2].slice(0,3)]+1).padStart(2,'0')}-${m[1].padStart(2,'0')}`;
 return null;
}
export function parseHour(value){const match=String(value).match(/(?:T|\s)(\d{1,2}):\d{2}/);if(!match)return 12;let hour=Number(match[1]);if(/\bPM\b/i.test(value)&&hour<12)hour+=12;if(/\bAM\b/i.test(value)&&hour===12)hour=0;return Math.min(23,hour);}
export const fileKey=s=>String(s||'').replace(/\\/g,'/').split('/').pop().toLowerCase().replace(/\.(gz|fit|tcx|gpx)$/g,'').replace(/\.(fit|tcx|gpx)$/,'');
export function csvActivities(text,units='auto'){
 const rows=parseCSV(text);if(rows.length<2)throw Error('CSV пуст или не содержит тренировок.');
 const aliases={'id физической активности':'activity id','дата тренировки':'activity date','название тренировки':'activity name','тип активности':'activity type','название файла':'filename','общее время':'elapsed time','расстояние':'distance','дистанция':'distance','время в движении':'moving time','набор высоты':'elevation gain','макс. пульс':'max heart rate','средний пульс':'average heart rate','макс. мощность (ватт)':'max watts','средняя мощность (ватт)':'average watts','средний каденс':'average cadence','макс. скорость':'max speed','средняя скорость':'average speed'};
 const headers=rows[0].map(x=>{const h=x.trim().toLowerCase();return aliases[h]||h;});const inds=(...names)=>headers.map((h,i)=>names.includes(h)?i:-1).filter(i=>i>=0);
 const idx=(...names)=>inds(...names).at(-1);const at=(r,...n)=>r[idx(...n)];let skipped=0;
 const activities=rows.slice(1).map((r,i)=>{
 const date=dateKey(at(r,'activity date','date','дата занятия','дата тренировки','дата'));if(!date){skipped++;return null;}
 const di=inds('distance','расстояние','дистанция');const raw=number(r[di.at(-1)]);const metric=units==='m'||(units==='auto'&&di.length>1);
 const start=at(r,'activity date','date','дата занятия','дата тренировки','дата')||'';
 return {stravaId:at(r,'activity id','идентификатор занятия')?.trim()||null,id:at(r,'activity id','id','идентификатор занятия')||`csv-${i}`,date,hour:parseHour(start),name:at(r,'activity name','name','название занятия','название')||'Велотренировка',type:at(r,'activity type','sport_type','type','тип занятия','тип тренировки')||'Unknown',distance:raw===null?null:raw*(metric?1:1000),moving:duration(at(r,'moving time','время в движении')),elapsed:duration(at(r,'elapsed time','время')),elevation:number(at(r,'elevation gain','набор высоты')),power:number(at(r,'average watts','average power','средняя мощность')),maxSpeed:number(at(r,'max speed','maximum speed','максимальная скорость')),avgSpeed:number(at(r,'average speed','средняя скорость')),maxPower:number(at(r,'max watts','max power','максимальная мощность')),hr:number(at(r,'average heart rate','average heartrate','средняя частота пульса')),maxHr:number(at(r,'max heart rate','max heartrate','максимальная частота пульса')),cadence:number(at(r,'average cadence','средний каденс')),energy:number(at(r,'total work','kilojoules','общая работа')),calories:number(at(r,'calories','калории')),file:fileKey(at(r,'filename','имя файла')),media:mediaReferences(at(r,'media','media file','media files','медиафайл','медиафайлы')),source:'CSV',records:[]};
 }).filter(Boolean);return {activities,skipped,unitNote:units==='auto'?(inds('distance','расстояние','дистанция').length>1?'Повторные столбцы Distance: использован последний, в метрах.':'Один столбец Distance: принят за километры. При необходимости измените единицы и загрузите файл заново.'):`Расстояние в CSV: ${units==='m'?'метры':'километры'}.`};
}
const readText=(e,name)=>{const a=Array.from(e.getElementsByTagName('*')).find(n=>n.localName.toLowerCase()===name.toLowerCase());return a?.textContent;};
export function xmlActivity(text,filename){
 const xml=new DOMParser().parseFromString(text,'application/xml');if(xml.querySelector('parsererror'))throw Error('Некорректный XML: '+filename);
 const tcx=xml.documentElement.localName==='TrainingCenterDatabase';
 const points=Array.from(xml.getElementsByTagName('*')).filter(e=>e.localName===(tcx?'Trackpoint':'trkpt'));
 const records=points.map(p=>({t:Date.parse(readText(p,'Time')||readText(p,'time'))/1000,hr:number(readText(p,'Value')||readText(p,'hr')),power:number(readText(p,'Watts')||readText(p,'power')),cadence:number(readText(p,'Cadence')||readText(p,'cad')),speed:number(readText(p,'Speed')),distance:number(readText(p,'DistanceMeters')),altitude:number(readText(p,'AltitudeMeters')||readText(p,'ele')),lat:numberSigned(tcx?readText(p,'LatitudeDegrees'):p.getAttribute('lat')),lon:numberSigned(tcx?readText(p,'LongitudeDegrees'):p.getAttribute('lon'))})).filter(r=>Number.isFinite(r.t));
 const activity=Array.from(xml.getElementsByTagName('*')).find(e=>e.localName==='Activity');
 const laps=Array.from(xml.getElementsByTagName('*')).filter(e=>e.localName==='Lap');
 const a=fromRecords(records,filename);a.name=readText(xml,'name')||readText(xml,'Notes')||filename;a.type=activity?.getAttribute('Sport')==='Biking'?'Ride':tcx?(activity?.getAttribute('Sport')||'Unknown'):'Unknown';
 if(laps.length){a.distance=laps.reduce((s,l)=>s+(number(readText(l,'DistanceMeters'))||0),0)||a.distance;a.moving=laps.reduce((s,l)=>s+(number(readText(l,'TotalTimeSeconds'))||0),0)||a.moving;}
 const speeds=laps.map(l=>number(readText(l,'MaximumSpeed'))).filter(Number.isFinite);if(speeds.length)a.maxSpeed=Math.max(...speeds,...(a.maxSpeed===null?[]:[a.maxSpeed]));
 const calories=laps.map(l=>number(readText(l,'Calories'))).filter(Number.isFinite);a.calories=calories.length?calories.reduce((a,b)=>a+b,0):null;
 a.source=tcx?'TCX':'GPX';return a;
}
function numberSigned(x){if(x===null||x===undefined||x==='')return null;const n=Number(x);return Number.isFinite(n)?n:null;}
export function fromRecords(records,filename){
 records.sort((a,b)=>a.t-b.t);let distance=records.at(-1)?.distance??null;
 if(distance===null&&records.some(r=>r.lat!==null&&r.lon!==null)){distance=0;for(let i=1;i<records.length;i++){const a=records[i-1],b=records[i];if([a.lat,a.lon,b.lat,b.lon].some(v=>v==null))continue;const rad=Math.PI/180,dlat=(b.lat-a.lat)*rad,dlon=(b.lon-a.lon)*rad;distance+=6371000*2*Math.asin(Math.min(1,Math.sqrt(Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlon/2)**2)));}}
 const t=records[0]?.t;const d=t?new Date(t*1000):null;
 return {id:fileKey(filename),file:fileKey(filename),name:filename,type:'Unknown',date:d?d.toISOString().slice(0,10):null,hour:d?.getUTCHours()??12,distance,moving:null,elapsed:records.length>1?records.at(-1).t-t:null,elevation:null,power:streamAverage(records,'power'),hr:streamAverage(records,'hr'),maxSpeed:maxField(records,'speed'),avgSpeed:null,maxPower:maxField(records,'power'),maxHr:maxField(records,'hr'),cadence:streamAverage(records,'cadence'),energy:null,calories:null,records,source:'FIT'};
}
export function maxField(records,k){const v=records.map(r=>r[k]).filter(x=>Number.isFinite(x));return v.length?v.reduce((a,b)=>Math.max(a,b),-Infinity):null;}
export function streamAverage(records,k){let total=0,time=0;for(let i=1;i<records.length;i++){const dt=records[i].t-records[i-1].t;if(dt>0&&dt<=10&&Number.isFinite(records[i-1][k])){total+=records[i-1][k]*dt;time+=dt;}}return time?total/time:null;}
// FIT binary reader: standard record/session messages, both endian modes,
// compressed timestamps and developer field skipping. Unknown fields are ignored.
export function fitActivity(buffer,filename){
 const v=new DataView(buffer);if(v.byteLength<14||String.fromCharCode(...new Uint8Array(buffer,8,4))!=='.FIT')throw Error('Некорректный FIT: '+filename);
 const header=v.getUint8(0),end=header+v.getUint32(4,true);if(end>v.byteLength)throw Error('Обрезанный FIT: '+filename);
 let p=header,lastTime=null;const defs={},records=[],sessions=[];
 const sizes={0:1,1:1,2:1,3:2,4:2,5:4,6:4,7:1,8:4,9:8,10:1,11:2,12:4,13:1,14:8,15:8,16:8};
 function val(pos,size,type,little){const b=type&31;let x;try{if(b===7)return new TextDecoder().decode(new Uint8Array(buffer,pos,size)).replace(/\0.*$/,'');if(size<(sizes[b]||1))return null;
 const funcs={0:'getUint8',1:'getInt8',2:'getUint8',3:'getInt16',4:'getUint16',5:'getInt32',6:'getUint32',8:'getFloat32',9:'getFloat64',10:'getUint8',11:'getUint16',12:'getUint32',13:'getUint8'};if(!funcs[b])return null;x=v[funcs[b]](pos,little);
 const invalid={0:255,1:127,2:255,3:32767,4:65535,5:2147483647,6:4294967295,10:0,11:0,12:0,13:255};return x===invalid[b]||!Number.isFinite(x)?null:x;}catch{return null;}}
 while(p<end){const h=v.getUint8(p++),compressed=!!(h&128),local=compressed?(h>>5)&3:h&15;
 if(!compressed&&(h&64)){p++;const little=v.getUint8(p++)===0;const global=v.getUint16(p,little);p+=2;const n=v.getUint8(p++),fields=[];for(let i=0;i<n;i++){fields.push({n:v.getUint8(p),s:v.getUint8(p+1),b:v.getUint8(p+2)});p+=3;}let dev=0;if(h&32){const count=v.getUint8(p++);for(let i=0;i<count;i++){dev+=v.getUint8(p+1);p+=3;}}defs[local]={little,global,fields,dev};continue;}
 const def=defs[local];if(!def)throw Error('Нет определения сообщения FIT: '+filename);const values={};
 for(const f of def.fields){if(compressed&&f.n===253)continue;if(p+f.s>end)throw Error('Обрезанная запись FIT');values[f.n]=val(p,f.s,f.b,def.little);p+=f.s;}p+=def.dev;
 if(compressed){if(lastTime===null)throw Error('Нет времени для сжатой записи FIT');let t=(lastTime&~31)+(h&31);if(t<lastTime)t+=32;values[253]=t;}
 if(values[253]!=null)lastTime=values[253];
 if(def.global===20&&values[253]!=null){const x=values;records.push({t:x[253]+631065600,speed:(x[73]??x[6])!=null?(x[73]??x[6])/1000:null,power:x[7]??null,hr:x[3]??null,cadence:x[4]??null,distance:x[5]!=null?x[5]/100:null,altitude:(x[78]??x[2])!=null?(x[78]??x[2])/5-500:null,lat:x[0]!=null?x[0]*180/2147483648:null,lon:x[1]!=null?x[1]*180/2147483648:null});}
 if(def.global===18)sessions.push(values);
 }
 if(sessions.length>1)throw Error('Мультиспорт FIT: разделите файл на отдельные тренировки.');
 const a=fromRecords(records,filename),s=sessions[0];if(s){const start=s[2]!=null?new Date((s[2]+631065600)*1000):null;a.date=start?.toISOString().slice(0,10)||a.date;a.hour=start?.getUTCHours()??a.hour;a.type=s[5]===2?([6,58].includes(s[6])?'VirtualRide':'Ride'):'Unknown';a.distance=s[9]!=null?s[9]/100:a.distance;a.moving=s[8]!=null?s[8]/1000:a.moving;a.elapsed=s[7]!=null?s[7]/1000:a.elapsed;a.elevation=s[22]??null;a.calories=s[11]??a.calories;a.avgSpeed=(s[124]??s[14])!=null?(s[124]??s[14])/1000:null;a.maxSpeed=(s[125]??s[15])!=null?(s[125]??s[15])/1000:a.maxSpeed;a.power=s[20]??a.power;a.maxPower=s[21]??a.maxPower;a.hr=s[16]??a.hr;a.maxHr=s[17]??a.maxHr;a.cadence=s[18]??a.cadence;}
 if(!a.date)throw Error('В FIT не найдено время тренировки: '+filename);return a;
}
export function isCycling(type){return /ride|cycling|biking|вел|заезд|поездка/i.test(type);}
export function mergeActivities(summaries,details){
 const used=new Set();const out=summaries.map(a=>{const i=details.findIndex((b,i)=>!used.has(i)&&a.file&&a.file===b.file);if(i<0)return a;used.add(i);const b=details[i],combined={...b,...a,records:b.records};for(const k of ['distance','moving','elapsed','elevation','power','hr','maxPower','maxHr','maxSpeed','avgSpeed','cadence','energy','calories'])if(combined[k]==null)combined[k]=b[k];combined.source=`CSV + ${b.source}`;return combined;});
 details.forEach((a,i)=>{if(!used.has(i))out.push(a);});const keys=new Set();return out.filter(a=>{const key=a.file||a.id||`${a.date}:${a.name}`;if(keys.has(key))return false;keys.add(key);return true;});
}
