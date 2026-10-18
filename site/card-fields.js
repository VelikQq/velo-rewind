const fmt=(n,d=0)=>Number.isFinite(n)?n.toLocaleString('ru-RU',{maximumFractionDigits:d}):'—';
const duration=s=>Number.isFinite(s)?Math.floor(s/3600)+' ч '+String(Math.floor(s%3600/60)).padStart(2,'0')+' мин':'—';
export const defaultCardFields=['distance','count','time'];
export const cardFields=[
 {id:'distance',label:'Дистанция',caption:'КИЛОМЕТРОВ',value:s=>s.withDistance?fmt(s.distance/1000,1):'—'},
 {id:'count',label:'Количество тренировок',caption:'ТРЕНИРОВОК',value:s=>fmt(s.count)},
 {id:'time',label:'Время движения',caption:'В ДВИЖЕНИИ',value:s=>s.withMoving?duration(s.time):'—'},
 {id:'elevation',label:'Набор высоты',caption:'МЕТРОВ НАБОРА',value:s=>s.withElevation?fmt(s.elevation):'—'},
 {id:'avgSpeed',label:'Средняя скорость',caption:'КМ/Ч · СРЕДНЯЯ',value:s=>fmt(s.avgSpeed,1)},
 {id:'maxSpeed',label:'Максимальная скорость',caption:'КМ/Ч · МАКСИМУМ',value:s=>fmt(Number.isFinite(s.maxSpeed?.maxSpeed)?s.maxSpeed.maxSpeed*3.6:null,1)},
 {id:'bestAverageSpeed',label:'Лучшая средняя за тренировку',caption:'КМ/Ч · ЛУЧШАЯ СРЕДНЯЯ',value:s=>fmt(Number.isFinite(s.bestAverageSpeed)?s.bestAverageSpeed*3.6:null,1)},
 {id:'avgPower',label:'Средняя мощность',caption:'ВТ · СРЕДНЯЯ',value:s=>fmt(s.avgPower)},
 {id:'maxPower',label:'Максимальная мощность',caption:'ВТ · МАКСИМУМ',value:s=>fmt(s.maxPower?.maxPower)},
 {id:'avgHr',label:'Средний пульс',caption:'УД/МИН · СРЕДНИЙ',value:s=>fmt(s.avgHr)},
 {id:'maxHr',label:'Максимальный пульс',caption:'УД/МИН · МАКСИМУМ',value:s=>fmt(s.maxHr?.maxHr)},
 {id:'avgCadence',label:'Средний каденс',caption:'ОБ/МИН · СРЕДНИЙ',value:s=>fmt(s.avgCadence)},
 {id:'calories',label:'Калории',caption:'КИЛОКАЛОРИЙ',value:s=>s.withCalories?fmt(s.calories):'—'},
 {id:'days',label:'Дни с тренировками',caption:'АКТИВНЫХ ДНЕЙ',value:s=>fmt(s.days)},
 {id:'ftp',label:'Расчётный FTP',caption:'ВТ · ОЦЕНКА FTP (95% 20 МИН)',value:s=>{const p=s.intervalResults?.find(x=>x.seconds===1200)?.power;return p>0?fmt(p*.95):'—';}}
];
export function selectedCardFields(ids=defaultCardFields){return cardFields.filter(x=>ids.includes(x.id));}
export function cardLayout(count,showMap=true){const bottom=count>1?552+120*(Math.ceil((count-1)/2)-1):count===1?418:238;return {mapY:bottom+98,height:showMap?Math.max(1350,bottom+798):Math.max(650,bottom+100)};}
