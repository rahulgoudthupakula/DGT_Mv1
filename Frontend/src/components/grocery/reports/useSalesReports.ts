import {useQuery} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import {format} from 'date-fns';
export type SalesSource={id:string;name:string;scanCode:string;category:string;department:string;date:string;unitsSold:number;netSales:number;tax:number;discounts:number;transactions:number};
export function useSalesReports(store:string,start?:Date,end?:Date){
 const params=new URLSearchParams();if(start)params.set('start',format(start,'yyyy-MM-dd'));if(end)params.set('end',format(end,'yyyy-MM-dd'));
 return useQuery({queryKey:['grocery-sales',store,params.toString()],queryFn:()=>request<{rows:SalesSource[];start:string;end:string;days:number}>('/access/stores/'+encodeURIComponent(store)+'/grocery-reports/sales?'+params),enabled:!!store});
}
export function salesGroups(rows:SalesSource[],start:string,days:number,byCategory=false){
 const groups=new Map<string,any>();
 for(const row of rows){
  const key=byCategory?row.category:row.id;
  const group=groups.get(key)??{...row,name:byCategory?row.category:row.name,unitsSold:0,netSales:0,previousUnits:0,itemIds:new Set<string>(),dailySales:[]};
  group.itemIds.add(row.id);
  if(row.date>=start){group.unitsSold+=row.unitsSold;group.netSales+=row.netSales;group.dailySales.push({date:row.date,units:row.unitsSold,sales:row.netSales});}
  else group.previousUnits+=row.unitsSold;
  groups.set(key,group);
 }
 const total=[...groups.values()].reduce((s,r)=>s+r.netSales,0);
 return [...groups.values()].map(g=>({...g,itemCount:g.itemIds.size,percentOfTotal:total>0?Math.round(g.netSales/total*1000)/10:0,
 avgPrice:g.unitsSold!==0?g.netSales/g.unitsSold:0,velocity:g.unitsSold/days,prevVelocity:g.previousUnits/days,
 trend:g.unitsSold>g.previousUnits?'up':g.unitsSold<g.previousUnits?'down':'flat',adjustments:0}));
}
