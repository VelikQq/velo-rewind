// Garmin FTP Ratings, RU manual v6, September 2026. Lower bounds are inclusive.
// https://www8.garmin.com/manuals/webhelp/GUID-2DA54DF8-8084-40ED-954F-EDA09C13B47F/RU-RU/GUID-1F58FA8E-09FF-4E51-B9B4-C4B83ED1D6CE.html
export const fitnessSource='https://www8.garmin.com/manuals/webhelp/GUID-2DA54DF8-8084-40ED-954F-EDA09C13B47F/RU-RU/GUID-1F58FA8E-09FF-4E51-B9B4-C4B83ED1D6CE.html';
export const fitnessLabels=['Подготовка отсутствует','Удовлетворительно','Хорошо','Отлично','Превосходно'];
export const fitnessThresholds={male:[0,2.23,2.79,3.93,5.05],female:[0,1.90,2.36,3.33,4.30]};
const number=value=>{if(value===null||value===undefined||String(value).trim()==='')return null;const n=Number(String(value).replace(',','.'));return Number.isFinite(n)?n:null;};
export function fitnessWeight(value){const n=number(value);return n!==null&&n>=20&&n<=300?n:null;}
export function fitnessRating(ftp,weight,scale){
 ftp=number(ftp);weight=number(weight);const bounds=fitnessThresholds[scale];
 if(ftp===null||ftp<=0||ftp>2500)return {valid:false,reason:'Для оценки нужен FTP: введи известное значение или загрузи непрерывные записи мощности за 20 минут.'};
 if(weight===null||weight<20||weight>300)return {valid:false,reason:'Укажи массу тела для оцениваемого периода: от 20 до 300 кг.'};
 if(!bounds)return {valid:false,reason:'Выбери мужскую или женскую шкалу сравнения.'};
 const wkg=ftp/weight;let level=0;for(let i=1;i<bounds.length;i++)if(wkg>=bounds[i])level=i;
 const next=level<bounds.length-1?{label:fitnessLabels[level+1],wkg:bounds[level+1],watts:bounds[level+1]*weight,gap:bounds[level+1]*weight-ftp}:null;
 return {valid:true,ftp,weight,wkg,scale,level,label:fitnessLabels[level],lower:bounds[level],upper:bounds[level+1]??null,next};
}
export function periodTraining(summary,from,to){
 const first=Date.parse(from+'T00:00:00Z'),last=Date.parse(to+'T00:00:00Z'),days=Number.isFinite(first)&&Number.isFinite(last)&&last>=first?(last-first)/86400000+1:null;
 return {calendarDays:days,ridesPerWeek:days?summary.count*7/days:null,hoursPerWeek:days&&summary.withMoving?summary.time/3600*7/days:null,activeDays:summary.days,longestKm:Number.isFinite(summary.longest?.distance)?summary.longest.distance/1000:null,longestSeconds:summary.longestTime?.moving??null};
}

export function suggestedWeight(summary,method='estimate'){
 const valid=a=>Number.isFinite(a?.athleteWeight)&&a.athleteWeight>=20&&a.athleteWeight<=300;
 const best=summary.intervalResults.find(x=>x.seconds===1200)?.activity;
 // Never combine the season's peak power with another ride's body mass.
 if(method==='estimate'&&best)return valid(best)?{value:best.athleteWeight,date:best.date,source:best.athleteWeightSource||best.source,exact:true}:null;
 const last=[...summary.a].filter(valid).sort((a,b)=>a.date.localeCompare(b.date)).at(-1);
 return last?{value:last.athleteWeight,date:last.date,source:last.athleteWeightSource||last.source,exact:false}:null;
}
