import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseCSV,csvActivities,fitActivity,mergeActivities,dateKey,fileKey,streamAverage} from '../site/data.js';
import {bestInterval,distribution,summarize} from '../site/stats.js';
test('CSV parses quotes, embedded newlines, BOM, semicolons and decimal commas',()=>{assert.deepEqual(parseCSV('\uFEFFname;distance\r\n"a; b";"12,5"\r\n"multi\nline";3'),[['name','distance'],['a; b','12,5'],['multi\nline','3']]);assert.throws(()=>parseCSV('x\n"oops'));});
test('Strava duplicate distance columns use numeric meters; no missing-to-zero conversion',()=>{const {activities:a}=csvActivities('Activity ID,Activity Date,Activity Name,Activity Type,Distance,Distance,Moving Time,Average Watts,Average Heart Rate\n42,"Oct 3, 2026, 7:30:00 AM",Test,Ride,30.5,30500,3600,,145');assert.equal(a[0].distance,30500);assert.equal(a[0].power,null);assert.equal(a[0].hr,145);assert.equal(a[0].date,'2026-10-03');});
test('single distance column can be overridden to meters',()=>{assert.equal(csvActivities('date,distance\n2026-10-03,1500','m').activities[0].distance,1500);assert.equal(csvActivities('date,distance\n2026-10-03,15').activities[0].distance,15000);});
test('local dates retain day independently of browser timezone',()=>{assert.equal(dateKey('2026-10-03T00:10:00+04:00'),'2026-10-03');assert.equal(dateKey('3 окт. 2026 г., 07:00:00'),'2026-10-03');});
test('FIT gzip filename matching merges summary and streams without duplicate activities',()=>{assert.equal(fileKey('activities/123.fit.gz'),'123');const a={id:'42',file:'123',date:'2026-10-03',power:200,hr:null,records:[]};const b={id:'123',file:'123',power:199,hr:140,records:[{t:1,power:100}],source:'FIT'};const merged=mergeActivities([a],[b]);assert.equal(merged.length,1);assert.equal(merged[0].power,200);assert.equal(merged[0].hr,140);assert.equal(merged[0].records.length,1);});
test('best intervals integrate irregular sample duration and zero watts',()=>{const r=[{t:0,power:0},{t:2,power:200},{t:5,power:100},{t:10,power:0}];assert.equal(bestInterval(r,5),160);assert.equal(bestInterval(r,10),110);assert.equal(bestInterval(r,11),null);assert.equal(streamAverage(r,'power'),110);});
test('missing data and gaps cannot produce a fabricated continuous record',()=>{assert.equal(bestInterval([{t:0,power:500},{t:20,power:500}],5),null);assert.equal(bestInterval([{t:0,power:500},{t:5,power:null},{t:10,power:500}],10),null);assert.deepEqual(distribution([{records:[{t:0,power:0},{t:5,power:200},{t:25,power:300}]}],'power',[100,200]),[5,0,0]);});
test('weighted summary excludes missing values; active-day streak handles year boundary',()=>{const a=[{date:'2025-12-31',distance:10000,moving:1000,power:100,hr:140,records:[],type:'Ride'},{date:'2026-01-01',distance:20000,moving:3000,power:200,hr:null,records:[],type:'Ride'},{date:'2026-01-03',distance:5000,moving:1000,power:null,hr:null,records:[],type:'Ride'}];const s=summarize(a);assert.equal(s.avgPower,175);assert.equal(s.avgHr,140);assert.equal(s.longestStreak,2);assert.equal(s.withPower,2);assert.equal(s.distance,35000);assert.equal(s.avgSpeed,25.2);});
function fitFixture(){const b=new ArrayBuffer(200),v=new DataView(b);let p=14;v.setUint8(0,14);[...'.FIT'].forEach((x,i)=>v.setUint8(8+i,x.charCodeAt(0)));
 // local 0, standard record definition, little endian
 [0x40,0,0,20,0,3,253,4,0x86,7,2,0x84,3,1,2].forEach(x=>v.setUint8(p++,x));
 v.setUint8(p++,0);v.setUint32(p,1000000000,true);p+=4;v.setUint16(p,200,true);p+=2;v.setUint8(p++,140);
 // compressed timestamp: low bits +5 from previous record
 v.setUint8(p++,0x80|5);v.setUint16(p,250,true);p+=2;v.setUint8(p++,150);
 v.setUint32(4,p-14,true);return b.slice(0,p);}
test('FIT standard records and compressed timestamps parse power and pulse',()=>{const a=fitActivity(fitFixture(),'test.fit');assert.equal(a.records.length,2);assert.equal(a.records[1].t-a.records[0].t,5);assert.equal(a.records[0].power,200);assert.equal(a.records[1].hr,150);assert.equal(a.power,200);assert.equal(a.maxPower,250);});
test('malformed FIT fails explicitly',()=>{assert.throws(()=>fitActivity(new ArrayBuffer(14),'bad.fit'));});
test('Strava AM and PM start hours are distinguished',()=>{const a=csvActivities('date,distance\n"Oct 3, 2026, 7:30:00 PM",10\n"Oct 4, 2026, 12:30:00 AM",20').activities;assert.equal(a[0].hour,19);assert.equal(a[1].hour,0);});
test('big endian FIT session summary and invalid missing values are respected',()=>{
 const b=new ArrayBuffer(100),v=new DataView(b);let p=14;v.setUint8(0,14);[...'.FIT'].forEach((x,i)=>v.setUint8(8+i,x.charCodeAt(0)));
 [0x40,0,1,0,18,7,2,4,0x86,5,1,0,8,4,0x86,9,4,0x86,20,2,0x84,16,1,2,22,2,0x84].forEach(x=>v.setUint8(p++,x));v.setUint8(p++,0);v.setUint32(p,1000000000,false);p+=4;v.setUint8(p++,2);v.setUint32(p,3600000,false);p+=4;v.setUint32(p,4000000,false);p+=4;v.setUint16(p,220,false);p+=2;v.setUint8(p++,255);v.setUint16(p,700,false);p+=2;v.setUint32(4,p-14,true);
 const a=fitActivity(b.slice(0,p),'session.fit');assert.equal(a.distance,40000);assert.equal(a.moving,3600);assert.equal(a.power,220);assert.equal(a.hr,null);assert.equal(a.elevation,700);assert.equal(a.type,'Ride');
});
