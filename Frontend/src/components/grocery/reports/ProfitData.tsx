import {createContext,useContext} from 'react';
import {useSalesReports,salesGroups} from './useSalesReports';
const Context=createContext<any>(null);
export const ProfitDataProvider=Context.Provider;
export const useProfitData=()=>useContext(Context);
export function useProfitReport(store:string,start?:Date,end?:Date,search=''){
 const sales=useSalesReports(store,start,end);
 // Historical sale costs are not recorded. Never substitute today’s item cost.
 const costs=new Map<string,number>();
 const rows=(sales.data?.rows??[]).filter(r=>r.date>=(sales.data?.start??'')&&(!search||r.name.toLowerCase().includes(search.toLowerCase())||r.scanCode.includes(search)));
 const items=salesGroups(rows,sales.data?.start??'',sales.data?.days??1).map(r=>{
  const cost=costs.get(r.id),cogs=cost==null?null:cost*r.unitsSold,profit=cogs==null?null:r.netSales-cogs;
  return {...r,avgCost:cost??null,cogs,grossProfit:profit,margin:profit==null||!r.netSales?null:profit/r.netSales*100,rebateImpact:null,trend:'flat'};
 });
 const categories=[...new Set(items.map(i=>i.category))].map(name=>{
  const selected=items.filter(i=>i.category===name),netSales=selected.reduce((s,i)=>s+i.netSales,0),cogs=selected.some(i=>i.cogs==null)?null:selected.reduce((s,i)=>s+i.cogs,0);
  return {name,itemCount:selected.length,unitsSold:selected.reduce((s,i)=>s+i.unitsSold,0),netSales,cogs,grossProfit:cogs==null?null:netSales-cogs,margin:cogs==null||!netSales?null:(netSales-cogs)/netSales*100,rebateImpact:null,trend:'flat'};
 });
 const days=[...new Set(rows.map(r=>r.date))].sort().map(date=>{
  const selected=rows.filter(r=>r.date===date),sales=selected.reduce((s,r)=>s+r.netSales,0),missing=selected.some(r=>costs.get(r.id)==null);
  const cogs=missing?null:selected.reduce((s,r)=>s+r.unitsSold*costs.get(r.id)!,0),byCategory:Record<string,number|null>={};
  for(const r of selected){const cost=costs.get(r.id);byCategory[r.category]=cost==null||byCategory[r.category]===null?null:(byCategory[r.category]??0)+r.netSales-r.unitsSold*cost;}
  return {date,day:new Date(date+'T12:00:00').toLocaleDateString('en-US',{weekday:'short'}),categories:byCategory,total:cogs==null?null:sales-cogs,totalTax:selected.reduce((s,r)=>s+r.tax,0),sales,purchases:cogs,netCashFlow:cogs==null?null:sales-cogs};
 });
 const netSales=items.reduce((s,i)=>s+i.netSales,0),cogs=items.some(i=>i.cogs==null)?null:items.reduce((s,i)=>s+i.cogs,0);
 return {pending:sales.isPending,error:sales.error,items,categories,days,categoryNames:categories.map(c=>c.name),summary:{netSales,cogs,grossProfit:cogs==null?null:netSales-cogs,grossMargin:cogs==null||!netSales?null:(netSales-cogs)/netSales*100}};
}
