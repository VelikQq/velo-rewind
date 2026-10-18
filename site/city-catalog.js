import part1 from './cities-1.js';
import part2 from './cities-2.js';
import part3 from './cities-3.js';
export const moscow={"id":524901,"name":"Москва","lat":55.75204,"lon":37.61781};
export const cities=[...part1,...part2,...part3].map(([id,name,country,lat,lon])=>({id,name,country,lat,lon}));
