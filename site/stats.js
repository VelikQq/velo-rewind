const finite=x=>Number.isFinite(x);
const sum=(a,k)=>a.reduce((s,x)=>s+(finite(x[k])?x[k]:0),0);
export function weighted(a,k){const data=a.filter(x=>finite(x[k])&&x.moving>0);const time=sum(data,'moving');return time?data.reduce((s,x)=>s+x[k]*x.moving,0)/time:null;}
export function bestInterval(records,seconds,key='power'){
 // Piecewise constant sample values. Gaps >10 s or missing values break coverage.
 if(records.length<2)return null;
 let best=null,start=0;
 while(start<records.length-1){let end=start;while(end<records.length-1&&finite(records[end][key])&&records[end+1].t>records[end].t&&records[end+1].t-records[end].t<=10)end++;
 if(end>start&&records[end].t-records[start].t>=seconds){const r=records.slice(start,end+1),prefix=[0];for(let i=1;i<r.length;i++)prefix.push(prefix[i-1]+r[i-1][key]*(r[i].t-r[i-1].t));
 const integral=t=>{let lo=0,hi=r.length-1;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(r[mid].t<=t)lo=mid;else hi=mid-1;}return prefix[lo]+(t-r[lo].t)*(r[lo][key]??0);};
 // Both original and shifted boundaries cover extrema of the window integral.
 const candidates=r.flatMap(x=>[x.t,x.t+seconds]);for(const t of candidates){if(t<r[0].t+seconds||t>r.at(-1).t)continue;const value=(integral(t)-integral(t-seconds))/seconds;if(best===null||value>best)best=value;}}
 start=end>start?end+1:start+1;
 }return best;
}
export function distribution(a,key,edges){const bins=Array(edges.length+1).fill(0);for(const x of a)for(let i=1;i<x.records.length;i++){const p=x.records[i-1],dt=x.records[i].t-p.t;if(dt<=0||dt>10||!finite(p[key]))continue;let bin=edges.findIndex(edge=>p[key]<edge);if(bin<0)bin=edges.length;bins[bin]+=dt;}return bins;}
// Per-ride average uses moving time; summary speed is a fallback, never elapsed time.
export function activityAverageSpeed(a){return finite(a.distance)&&a.moving>0?a.distance/a.moving:finite(a.avgSpeed)?a.avgSpeed:null;}
export function summarize(activities){
 const a=[...activities].sort((a,b)=>a.date.localeCompare(b.date));const daily=new Map(),months=Array(12).fill(0),weekdays=Array(7).fill(0),hours=Array(24).fill(0),weeks=new Map();
 for(const x of a){daily.set(x.date,(daily.get(x.date)||0)+(x.distance||0));months[Number(x.date.slice(5,7))-1]+=(x.distance||0)/1000;const d=new Date(x.date+'T00:00:00Z'),day=(d.getUTCDay()+6)%7;weekdays[day]++;hours[Math.min(23,Math.max(0,x.hour||0))]++;d.setUTCDate(d.getUTCDate()-day);const w=d.toISOString().slice(0,10);weeks.set(w,(weeks.get(w)||0)+(x.distance||0));}
 let streak=0,longestStreak=0,previous=null;for(const day of [...daily.keys()].sort()){const stamp=Date.parse(day+'T00:00:00Z');streak=previous!==null&&stamp-previous===86400000?streak+1:1;longestStreak=Math.max(longestStreak,streak);previous=stamp;}
 const maxBy=k=>a.filter(x=>finite(x[k])).reduce((best,x)=>!best||x[k]>best[k]?x:best,null);
 const intervalResults=[5,60,300,1200].map(seconds=>{let power=null,activity=null;for(const x of a){const result=bestInterval(x.records,seconds);if(result!==null&&(power===null||result>power)){power=result;activity=x;}}return {seconds,power,activity};});
 const time=sum(a,'moving'),distance=sum(a,'distance'),speedData=a.filter(x=>finite(x.distance)&&x.moving>0),speedTime=sum(speedData,'moving');
 return {a,count:a.length,distance,time,calories:sum(a,'calories'),withCalories:a.filter(x=>finite(x.calories)).length,elevation:sum(a,'elevation'),days:daily.size,daily,months,weekdays,hours,weeks,longestStreak,avgSpeed:speedTime?sum(speedData,'distance')/speedTime*3.6:null,avgPower:weighted(a,'power'),avgHr:weighted(a,'hr'),avgCadence:weighted(a,'cadence'),longest:maxBy('distance'),longestTime:maxBy('moving'),climbing:maxBy('elevation'),maxSpeed:maxBy('maxSpeed'),bestAverageSpeed:a.reduce((best,x)=>{const v=activityAverageSpeed(x);return v!==null&&(best===null||v>best)?v:best;},null),maxPower:maxBy('maxPower'),maxHr:maxBy('maxHr'),intervalResults,powerBins:distribution(a,'power',[100,150,200,250,300]),hrBins:distribution(a,'hr',[100,120,140,160,180]),withPower:a.filter(x=>finite(x.power)).length,withHr:a.filter(x=>finite(x.hr)).length,withPowerStream:a.filter(x=>x.records.some(r=>finite(r.power))).length,withHrStream:a.filter(x=>x.records.some(r=>finite(r.hr))).length,withMoving:a.filter(x=>finite(x.moving)).length,withDistance:a.filter(x=>finite(x.distance)).length,withElevation:a.filter(x=>finite(x.elevation)).length,milestones:[50,100,150,200].map(km=>({km,count:a.filter(x=>x.distance>=km*1000).length})),indoor:a.filter(x=>/virtual|indoor|тренаж|виртуал/i.test(x.type)).length,outdoor:a.filter(x=>!/virtual|indoor|тренаж|виртуал/i.test(x.type)).length};
}
