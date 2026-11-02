import {test} from 'node:test';import assert from 'node:assert/strict';
import {buildRewind,rewindMonths} from '../site/rewind.js';
const ride=(date,distance=10000)=>({date,type:'Ride',name:'<Тренировка>',distance,moving:3600,elevation:100,records:[]});
test('month reports use only selected dates, preserve missing values and do not mix years',()=>{
 const rows=[ride('2025-10-01'),ride('2026-10-01',20000),ride('2026-10-01',30000),ride('2026-11-01',40000)];
 assert.deepEqual(rewindMonths(rows),['2025-10','2026-10','2026-11']);const report=buildRewind(rows,'2026-10');assert.equal(report.stats.count,2);assert.equal(report.stats.days,1);assert.equal(report.cards.find(c=>c.type==='distance').value,50);assert.equal(report.cards.find(c=>c.type==='power').value,null);assert.equal(report.cards.find(c=>c.type==='calendar').calendar[0].days.filter(d=>d.active).length,1);const bars=report.cards.find(c=>c.type==='distance').bars;assert.equal(bars.filter(b=>b.selected).length,1);assert.equal(bars.find(b=>b.key==='2025-10').km,10);assert.equal(bars.find(b=>b.key==='2026-10').km,50);
 const season=buildRewind(rows,'season',true);assert.equal(season.stats.count,4);assert.ok(season.cards.every(c=>c.demo));assert.equal(season.cards.at(-1).type,'summary');assert.equal(season.cards.filter(c=>c.type==='map').length,0);
});
test('GPS card keeps separate valid segments and excludes virtual rides',()=>{
 const points=(t)=>[{lat:54.3,lon:48.4,t},{lat:54.301,lon:48.401,t:t+30}];const a=ride('2026-10-01');a.records=points(0);const b={...ride('2026-10-02'),type:'VirtualRide',records:points(0)};const cards=buildRewind([a,b]).cards;const map=cards.find(c=>c.type==='map');assert.equal(map.value,1);assert.ok(map.paths.length>0);assert.ok(map.paths.flat().every(p=>p.every(Number.isFinite)));
});
