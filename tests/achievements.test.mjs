import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseAchievements,achievementDate,achievementRank,segmentURL,mergeAchievements,seasonAchievements,achievementsCSV} from '../site/achievements.js';
test('manual TSV reads crowns, ranks, dates and optional Strava links',()=>{
 const p=parseAchievements('Сегмент\tДата\tМесто\tВремя\tСсылка\nПодъём\t18.10.2026\tKOM\t1:23\thttps://www.strava.com/segments/123\nСпринт\tOct 17, 2026\t3rd\t0:40\t');
 assert.equal(p.errors.length,0);assert.equal(p.entries[0].rank,1);assert.equal(p.entries[1].rank,3);assert.equal(p.entries[1].date,'2026-10-17');
});
test('numeric date locale is explicit and impossible calendar dates are rejected',()=>{
 assert.equal(achievementDate('05/06/2026','dmy'),'2026-06-05');assert.equal(achievementDate('05/06/2026','mdy'),'2026-05-06');
 assert.equal(achievementDate('31.02.2026'),null);assert.equal(achievementDate('2025-02-29'),null);assert.equal(achievementDate('29 февраля 2024'),'2024-02-29');
});
test('ranks outside top ten and misleading numbers do not become achievements',()=>{
 assert.equal(achievementRank('11'),null);assert.equal(achievementRank('1.5 km'),null);assert.equal(achievementRank('PR'),null);
 assert.equal(parseAchievements('Сегмент\tДата\tМесто\nПодъём\t2026-05-01\t').errors.length,1);
 assert.equal(parseAchievements('Сегмент\tДата\nПодъём\t2026-05-01',{crowns:true}).entries[0].rank,1);
 assert.equal(parseAchievements('Сегмент\tДата\tМесто\nПодъём\t2026-05-01\t',{crowns:true}).entries[0].rank,1);
});
test('headerless rows are accepted only when name, rank and date are unambiguous',()=>{
 assert.equal(parseAchievements('Подъём\t18.10.2026\t2\t1:20\t1.2 km').entries.length,1);
 assert.equal(parseAchievements('Подъём\t18.10.2026\t2\t5').errors.length,1);
});
test('segment links cannot execute code or point to an unrelated domain',()=>{
 assert.equal(segmentURL('javascript:alert(1)'),null);assert.equal(segmentURL('https://strava.com.evil.test/segments/123'),null);
 assert.equal(segmentURL('https://www.strava.com/segments/123?filter=overall'),'https://www.strava.com/segments/123');
 assert.equal(parseAchievements('Сегмент;Дата;Место;Ссылка\nПодъём;2026-05-01;1;https://example.test').errors.length,1);
});
test('repeat imports do not inflate counts and season follows the supplied dates',()=>{
 const entries=parseAchievements('Segment;Date;Rank\nClimb;2026-05-01;1\nSprint;2026-05-02;5\nOld;2025-01-01;1').entries;
 assert.equal(mergeAchievements(entries,entries).length,3);const s=seasonAchievements(entries,'2026-01-01','2026-12-31');assert.equal(s.crowns,1);assert.equal(s.top10,1);assert.equal(s.rows.length,2);
});
test('downloaded CSV roundtrips quoted segment names and optional fields',()=>{
 const entries=[{name:'Спринт; "у моста"',date:'2026-01-01',rank:4,time:'1:23',url:'https://www.strava.com/segments/123'}];assert.deepEqual(parseAchievements(achievementsCSV(entries)).entries,entries);
});
