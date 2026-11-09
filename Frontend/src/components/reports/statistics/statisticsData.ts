export type Summary={sales:number;transactions:number;avg:number|null;items:number};
type Series={key:string;name:string};
export type StatisticsSummary={
 totals:Summary;prior:Summary;
 data:({date:string;total:number;merch:number;nonMerch:number;merchPct:number|null;nonMerchPct:number|null}&Record<string,string|number|null>)[];
 grades:(Series&{id:string})[];keys:Series[];mix:(Series&{value:number;pct:number|null})[];
 allTotal:number;statisticsTotals:Record<string,number>;
 categoryData:{name:string;value:number}[];
 topSellingItems:{id:string;name:string;category:string;qty:number;revenue:number;rank:number}[];
 dailySalesData:{day:string;sales:number}[];hourlyTrend:{hour:string;sales:number}[];
 hasSales:boolean;hasGrocery:boolean;categoryPieValid:boolean;mixPieValid:boolean;unassigned:number;
};
export type StatisticsSource={schemaVersion:2;storeId:string;start:string;end:string;previousStart:string;days:number;today:string;latest:string;timezone:string;stats:StatisticsSummary};
const palette=['hsl(232, 44%, 56%)','hsl(142, 71%, 45%)','hsl(38, 92%, 50%)','hsl(0, 84%, 60%)','hsl(280, 65%, 60%)','hsl(190, 65%, 40%)'];
export const emptyStatistics:StatisticsSummary={totals:{sales:0,transactions:0,avg:null,items:0},prior:{sales:0,transactions:0,avg:null,items:0},data:[],grades:[],keys:[],mix:[],allTotal:0,statisticsTotals:{},categoryData:[],topSellingItems:[],dailySalesData:[],hourlyTrend:[],hasSales:false,hasGrocery:false,categoryPieValid:false,mixPieValid:false,unassigned:0};
export const change=(now:number|null,before:number|null)=>now==null||before==null||before<=0?null:(now-before)/before*100;
export const fraction=(value:number,total:number):number|null=>total>0?value/total:null;
export const dollars=(value:number|null)=>value==null?'—':value.toLocaleString('en-US',{style:'currency',currency:'USD'});
export const pct=(value:number|null)=>value==null?'—':(value*100).toFixed(1)+'%';
// Calculations live in PostgreSQL; the browser only adds presentation colors.
export function statisticsData(stats:StatisticsSummary){
 const colors=new Map(stats.keys.map((k,i)=>[k.key,palette[i%palette.length]]));
 return {...stats,
  grades:stats.grades.map(g=>({...g,color:colors.get(g.key)!})),
  keys:stats.keys.map(k=>({...k,color:colors.get(k.key)!})),
  mix:stats.mix.map(k=>({...k,color:colors.get(k.key)!})),
  categoryData:stats.categoryData.map((c,i)=>({...c,color:palette[i%palette.length]}))};
}
