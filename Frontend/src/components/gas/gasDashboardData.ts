import type {PriceRow} from './price/gasPriceData';
export type DashboardTank={id:string;number:string;gradeName:string;capacity:number;threshold:number|null;currentGallons:number|null;measuredGallons:number|null;measuredAt:string|null;lowEnabled:boolean;missingEnabled:boolean;missingToday:boolean};
export type GasDashboardData={prices:PriceRow[];tanks:DashboardTank[];timezone:string;today:string;asOf:string};
export const tankPercent=(t:DashboardTank)=>t.currentGallons==null||t.capacity<=0?null:t.currentGallons/t.capacity*100;
export const tankLow=(t:DashboardTank)=>t.lowEnabled&&t.threshold!=null&&tankPercent(t)!=null&&tankPercent(t)!<=t.threshold;
export function tankAlerts(tanks:DashboardTank[]){return tanks.flatMap(t=>{
 const alerts:{id:string;message:string;severity:'error'|'warning'}[]=[];
 if(t.missingEnabled&&t.missingToday)alerts.push({id:t.id+'-reading',message:`No reading today — ${t.gradeName} (${t.number})`,severity:'warning'});
 if(tankLow(t))alerts.push({id:t.id+'-low',message:`Low recorded level — ${t.number}: ${tankPercent(t)!.toFixed(1)}% (threshold ${t.threshold}%)`,severity:'warning'});
 if(t.currentGallons!=null&&(t.currentGallons<0||t.currentGallons>t.capacity))alerts.push({id:t.id+'-range',message:`Recorded gallons outside tank capacity — ${t.number}. Review readings and movements.`,severity:'error'});
 return alerts;
 });}
