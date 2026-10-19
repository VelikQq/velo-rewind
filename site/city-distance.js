import {cities,moscow} from './city-catalog.js';
import roadData from './city-road-data.js';
export function greatCircle(a,b){const r=Math.PI/180,lat=(b[0]-a[0])*r,lon=(b[1]-a[1])*r,h=Math.sin(lat/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(lon/2)**2;return 6371*2*Math.asin(Math.sqrt(Math.min(1,h)));}
// Only successful bicycle routes with nearby snapped endpoints qualify; no straight-line fallback.
const routes=new Map(roadData.results.filter(r=>r.code==='Ok'&&Number.isFinite(r.meters)&&r.meters>0&&r.snapDistances?.length===2&&r.snapDistances.every(d=>Number.isFinite(d)&&d<=1000)).map(r=>[r.id,r]));
export const cityDistances=cities.filter(c=>routes.has(c.id)).map(c=>({...c,km:routes.get(c.id).meters/1000,routeSource:routes.get(c.id).url})).sort((a,b)=>a.km-b.km||a.id-b.id);
// Compare full precision: even a tiny shortfall means the city has not been reached.
export function reachedCity(km,catalog=cityDistances){if(!Number.isFinite(km)||km<0)return null;let city=null;for(const candidate of catalog)if(candidate.km<=km&&(!city||candidate.km>city.km||candidate.km===city.km&&candidate.id<city.id))city=candidate;return city?{...city}:null;}
export function cityComparison(km){
 if(!Number.isFinite(km)||km<=0)return null;
 const city=reachedCity(km),n=v=>Math.round(v).toLocaleString('ru-RU');
 const sources=['https://routing.openstreetmap.de/about.html','https://www.openstreetmap.org/copyright','https://github.com/fossgis-routing-server/cbf-routing-profiles/blob/master/bike.lua','https://www.openstreetmap.org/fixthemap','https://www.geonames.org/'+moscow.id+'/'];
 const method=`Берём сумму дистанций тренировок за выбранный период. Выбираем самый дальний по рассчитанному велосипедному маршруту город, расстояние до которого не превышает эту сумму; сравниваем до округления. Доступно ${cityDistances.length} городов из ${cities.length} выбранных. Обе точки рассчитанного маршрута должны находиться не дальше 1 км от заданных координат. Нет успешного расчёта — город не участвует, расстоянием по прямой его не заменяем. Расчёт ${roadData.calculatedAt.slice(0,10)}: OSRM, велосипедный профиль FOSSGIS, данные © OpenStreetMap contributors, координаты GeoNames (CC BY 4.0). Профиль допускает паромные переправы. Это сохранённый вариант маршрута, не обязательно кратчайший путь и не проверка доступности границ, виз или дорог на дату поездки.`;
 if(!city)return {category:'ТВОЯ ДАЛЬНЯЯ ТОЧКА',title:'Старт — Москва',value:n(km),unit:'км накоплено за период',text:'Пока дистанции не хватает до первого города с рассчитанным велосипедным маршрутом от Москвы.',formula:method,sources,icon:'route'};
 const country=typeof Intl.DisplayNames==='function'?new Intl.DisplayNames(['ru'],{type:'region'}).of(city.country):city.country;
 return {category:'ТВОЯ ДАЛЬНЯЯ ТОЧКА',title:'Дистанции хватило бы до',value:city.name,unit:`${n(city.km)} км по велосипедному маршруту`,text:`Москва → ${city.name} · ${country}. Твоих ${n(km)} км за выбранный период хватило бы на этот маршрут. Это условное сравнение суммы тренировок, а не запись поездки в город.`,formula:method,sources:[...sources,city.routeSource,`https://www.geonames.org/${city.id}/`],icon:'route',city};
}
