import {test} from 'node:test';import assert from 'node:assert/strict';
import {activityUrl,activityLink,activityValue} from '../site/activity-links.js';
import {csvActivities,mergeActivities} from '../site/data.js';
import {summarize} from '../site/stats.js';import {comparisonRows} from '../site/compare.js';
test('only explicit CSV Strava IDs produce safe links, not filenames, generic IDs or demo IDs',()=>{
 for(const header of ['Activity ID','ID физической активности']){const a=csvActivities(`${header},date,Filename\n123456789012,2026-05-01,987.fit`).activities[0];assert.equal(activityUrl(a),'https://www.strava.com/activities/123456789012');assert.equal(activityUrl(mergeActivities([a],[{file:'987',records:[],source:'FIT'}])[0]),activityUrl(a));}
 for(const a of [{id:'123',file:'123',source:'FIT'},{stravaId:'1',source:'DEMO'},{stravaId:'https://evil.test'},{stravaId:'1" onclick="bad'},{stravaId:'0'},{stravaId:null}])assert.equal(activityUrl(a),null);
 assert.equal(activityUrl(csvActivities('id,date\n123,2026-05-01').activities[0]),null);
 assert.match(activityLink({stravaId:'123'},'<script>'),/&lt;script&gt;/);assert.match(activityLink({stravaId:'123'}),/target="_blank" rel="noopener noreferrer"/);assert.equal(activityLink({}), '');assert.equal(activityValue({},'—'),'—');assert.match(activityValue({stravaId:'123'},'42,0'),/class="activity-value"[^>]*>42,0<svg[^>]*class="strava-mark"/);
});
test('each comparison record links its actual winner in its own period, including interval and estimated FTP',()=>{
 const ride=(stravaId,date,extra={})=>({stravaId,date,distance:30000,moving:3600,maxSpeed:15,maxPower:500,maxHr:170,records:[],...extra});
 const records=Array.from({length:241},(_,i)=>({t:i*5,power:300}));
 const a=ride('101','2026-06-01',{distance:60000,moving:7200,maxPower:800,maxHr:190}),b=ride('102','2026-06-02',{distance:40000,maxSpeed:20,records}),c=ride('201','2025-06-01',{records});
 const rows=comparisonRows(summarize([a,b]),summarize([c]),{method:'estimate'});
 for(const label of ['Самая длинная поездка','Самая долгая поездка','Максимальная мощность в файлах','Максимальный пульс в файлах'])assert.equal(rows.find(r=>r.label===label).currentActivity,a);
 for(const label of ['Максимальная скорость','Максимальная средняя скорость','Лучшая мощность за 20 мин'])assert.equal(rows.find(r=>r.label===label).currentActivity,b);
 assert.equal(rows.find(r=>r.group==='FTP').currentActivity,b);assert.equal(rows.find(r=>r.group==='FTP').previousActivity,c);
 assert.equal(rows.find(r=>r.label==='Максимальная средняя скорость').previousActivity,c);assert.equal(rows.find(r=>r.label==='Дистанция').currentActivity,undefined);
 assert.equal(comparisonRows(summarize([b]),summarize([]),{method:'manual',currentFTP:240}).find(r=>r.group==='FTP').currentActivity,null);
});
