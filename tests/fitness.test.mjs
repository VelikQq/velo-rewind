import {test} from 'node:test';import assert from 'node:assert/strict';
import {fitnessRating,suggestedWeight,periodTraining,fitnessThresholds} from '../site/fitness.js';
import {fitnessMarkup} from '../site/fitness-ui.js';import {summarize} from '../site/stats.js';import {csvActivities,mergeActivities,fitActivity} from '../site/data.js';
const ride=(extra={})=>({date:'2026-06-01',distance:50000,moving:7200,type:'Ride',records:[],...extra});
test('Garmin FTP categories classify exact lower bounds, do not round up and differ by sex',()=>{
 for(const scale of ['male','female']){const bounds=fitnessThresholds[scale];for(let level=1;level<5;level++){assert.equal(fitnessRating(bounds[level]*100,100,scale).level,level);assert.equal(fitnessRating((bounds[level]-.00001)*100,100,scale).level,level-1);}}
 assert.equal(fitnessRating(240,80,'male').wkg,3);assert.equal(fitnessRating(320,80,'male').level,3);assert.equal(fitnessRating(320,80,'female').level,3);assert.equal(fitnessRating(360,80,'female').level,4);assert.equal(fitnessRating(360,80,'male').level,3);
});
test('missing, impossible or nonfinite inputs never yield a training label',()=>{
 for(const ftp of ['',null,0,-1,NaN,Infinity,2501])assert.equal(fitnessRating(ftp,80,'male').valid,false);
 for(const weight of ['',null,0,19,301,NaN,Infinity])assert.equal(fitnessRating(200,weight,'male').valid,false);
 assert.equal(fitnessRating(200,80,'').valid,false);assert.equal(fitnessRating('240','80,0','male').valid,true);
});
test('weight reads athlete-only CSV columns and falls back to FIT during merge',()=>{
 for(const header of ['Вес спортсмена','Athlete Weight']){
 const rows=csvActivities(`Activity ID,date,Filename,${header},Вес велосипеда\n1,2026-06-01,a.fit,77.5,9\n2,2026-06-02,b.fit,,8`).activities;assert.equal(rows[0].athleteWeight,77.5);assert.equal(rows[1].athleteWeight,null);
 const merged=mergeActivities(rows,[{file:'a',athleteWeight:80,athleteWeightSource:'FIT user_profile',records:[],source:'FIT'},{file:'b',athleteWeight:78,athleteWeightSource:'FIT user_profile',records:[],source:'FIT'}]);assert.equal(merged[0].athleteWeight,77.5);assert.equal(merged[1].athleteWeight,78);assert.equal(merged[1].athleteWeightSource,'FIT user_profile');
 }
});
test('FIT user_profile weight scales decikilograms and rejects invalid values',()=>{
 const buf=new ArrayBuffer(100),v=new DataView(buf);let p=14;v.setUint8(0,14);[...'.FIT'].forEach((s,i)=>v.setUint8(8+i,s.charCodeAt(0)));const bytes=a=>a.forEach(n=>v.setUint8(p++,n));
 bytes([0x40,0,0,3,0,1,4,2,0x84,0]);v.setUint16(p,775,true);p+=2;bytes([0x41,0,0,18,0,1,2,4,0x86,1]);v.setUint32(p,1000000000,true);p+=4;v.setUint32(4,p-14,true);
 assert.equal(fitActivity(buf.slice(0,p),'test.fit').athleteWeight,77.5);v.setUint16(24,0xffff,true);assert.equal(fitActivity(buf.slice(0,p),'test.fit').athleteWeight,null);
});
test('estimated FTP uses matching ride weight, never weight from another date',()=>{
 const a=ride({athleteWeight:80,athleteWeightSource:'CSV',records:Array.from({length:241},(_,i)=>({t:i*5,power:250}))}),b=ride({date:'2026-07-01',athleteWeight:75});let s=summarize([a,b]);assert.equal(suggestedWeight(s).value,80);assert.equal(suggestedWeight(s,'manual').value,75);
 s=summarize([{...a,athleteWeight:null},b]);assert.equal(suggestedWeight(s),null);
});
test('training frequency uses the full inclusive period with inactive weeks and missing moving data',()=>{
 const s=summarize([ride(),ride({date:'2026-06-02',moving:null})]),v=periodTraining(s,'2026-06-01','2026-06-28');assert.equal(v.ridesPerWeek,.5);assert.equal(v.hoursPerWeek,.5);assert.equal(v.calendarDays,28);assert.equal(v.longestKm,50);assert.equal(periodTraining(s,'2026-06-02','2026-06-01').ridesPerWeek,null);
});
test('UI labels estimated power, missing inputs and demo; records alone do not fabricate FTP',()=>{
 const s=summarize([ride({records:Array.from({length:241},(_,i)=>({t:i*5,power:250}))})]);const html=fitnessMarkup(s,'2026-01-01','2026-12-31',{weight:80,scale:'male',demo:true});assert.match(html,/Предварительная оценка/);assert.match(html,/ДЕМО/);assert.match(html,/237,5 Вт \/ 80 кг/);assert.match(html,/garmin.com/);
 const missing=fitnessMarkup(summarize([ride({power:300})]),'2026-01-01','2026-12-31',{weight:80,scale:'male'});assert.match(missing,/Недостаточно данных/);assert.doesNotMatch(missing,/class="fitness-result"/);
});
