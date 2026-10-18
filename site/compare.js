const finite=Number.isFinite;
const n=x=>Math.round(x).toLocaleString('ru-RU');
const speed=x=>x.toLocaleString('ru-RU',{minimumFractionDigits:1,maximumFractionDigits:1});
export function formatDuration(seconds){if(!finite(seconds))return '—';const minutes=Math.floor(Math.abs(seconds)/60),hours=Math.floor(minutes/60);return hours?`${hours} ч ${minutes%60} мин`:`${minutes} мин`;}
export function changeLabel(current,previous,kind='number',unit=''){
 if(!finite(current)||!finite(previous))return {text:'Нет сравнения',direction:'missing'};
 const delta=current-previous;if(Math.abs(delta)<(kind==='time'?60:kind==='speed'?0.05:0.5))return {text:'Без изменений'+(delta!==0?' ≈':''),direction:'same'};
 const absolute=kind==='time'?formatDuration(delta):(kind==='speed'?speed(Math.abs(delta)):n(Math.abs(delta)))+(unit?' '+unit:'');
 const sign=delta>0?'+':'−',percentage=previous>0?` · ${delta>0?'+':'−'}${n(Math.abs(delta/previous*100))}%`:'';
 return {text:sign+absolute+percentage,direction:delta>0?'up':'down'};
}
function averageWith(a,key){const list=a.filter(x=>finite(x[key]));return list.length?list.reduce((s,x)=>s+x[key],0)/list.length:null;}
function interval(s,seconds){return s?.intervalResults.find(x=>x.seconds===seconds)?.power??null;}
function measured(s,key,coverage){return s?.[coverage]>0?s[key]:null;}
export function ftpValue(summary,method,manual){if(method==='estimate'){const power=interval(summary,1200);return power>0?power*.95:null;}const value=manual===''||manual===null||manual===undefined?NaN:Number(manual);return finite(value)&&value>0&&value<=2500?value:null;}
export function comparisonRows(current,previous,options={}){
 const rows=[],p=previous;const add=(group,label,get,kind='number',unit='')=>{const now=get(current),before=p?.count?get(p):null;rows.push({group,label,current:now,previous:before,kind,unit,delta:changeLabel(now,before,kind,unit)});};
 add('Объём и регулярность','Дистанция',s=>measured(s,'distance','withDistance')===null?null:s.distance/1000,'number','км');
 add('Объём и регулярность','Время движения',s=>measured(s,'time','withMoving'),'time');
 add('Объём и регулярность','Набор высоты',s=>measured(s,'elevation','withElevation'),'number','м');
 add('Объём и регулярность','Тренировки',s=>s.count,'number','шт.');
 add('Объём и регулярность','Дни с тренировками',s=>s.days,'number','дн.');
 add('Объём и регулярность','Активные недели',s=>s.weeks.size,'number','нед.');
 add('Объём и регулярность','Лучшая серия дней подряд',s=>s.longestStreak,'number','дн.');
 add('Дистанции и время','Средняя дистанция поездки',s=>{const v=averageWith(s.a,'distance');return v===null?null:v/1000;},'number','км');
 add('Дистанции и время','Среднее время поездки',s=>averageWith(s.a,'moving'),'time');
 add('Дистанции и время','Самая длинная поездка',s=>finite(s.longest?.distance)?s.longest.distance/1000:null,'number','км');
 add('Дистанции и время','Самая долгая поездка',s=>s.longestTime?.moving??null,'time');
 add('Дистанции и время','Лучшая неделя по километрам',s=>s.withDistance?Math.max(0,...s.weeks.values())/1000:null,'number','км');
 for(const km of [50,100,150,200])add('Дистанции и время',`Поездки ${km}+ км`,s=>s.withDistance?s.milestones.find(x=>x.km===km)?.count??0:null,'number','шт.');
 add('Скорость','Максимальная скорость',s=>finite(s.maxSpeed?.maxSpeed)?s.maxSpeed.maxSpeed*3.6:null,'speed','км/ч');
 add('Скорость','Максимальная средняя скорость',s=>finite(s.bestAverageSpeed)?s.bestAverageSpeed*3.6:null,'speed','км/ч');
 add('Мощность','Средняя мощность из сводок',s=>s.avgPower,'number','Вт');
 add('Мощность','Максимальная мощность в файлах',s=>s.maxPower?.maxPower??null,'number','Вт');
 for(const seconds of [5,60,300,1200])add('Мощность',`Лучшая мощность за ${seconds===5?'5 секунд':seconds/60+' мин'}`,s=>interval(s,seconds),'number','Вт');
 add('Пульс и каденс','Средний пульс из сводок',s=>s.avgHr,'number','уд/мин');
 add('Пульс и каденс','Максимальный пульс в файлах',s=>s.maxHr?.maxHr??null,'number','уд/мин');
 add('Пульс и каденс','Средний каденс из сводок',s=>s.avgCadence,'number','об/мин');
 const now=ftpValue(current,options.method||'manual',options.currentFTP),before=ftpValue(p,options.method||'manual',options.previousFTP);
 rows.push({group:'FTP',label:options.method==='estimate'?'Ориентир FTP: 95% лучших 20 минут':'FTP, введённый пользователем',current:now,previous:before,kind:'number',unit:'Вт',delta:changeLabel(now,before,'number','Вт')});return rows;
}
export function displayValue(value,kind,unit){if(!finite(value))return '—';return kind==='time'?formatDuration(value):(kind==='speed'?speed(value):n(value))+(unit?' '+unit:'');}
