import {useSalesReports} from './useSalesReports';
import {useStockReports} from './useStockReports';
import {usePurchaseReports} from './usePurchaseReports';
export function useCigaretteReport(storeId:string){
 const sales=useSalesReports(storeId),stock=useStockReports(storeId),purchases=usePurchaseReports(storeId);
 const items=(stock.data?.items??[]).filter(i=>i.department.trim().toLowerCase()==='cigarettes');
 const byId=new Map(items.map(i=>[i.id,i])),allSales=(sales.data?.rows??[]).filter(r=>r.date>=sales.data!.start&&byId.has(r.id));
 const movements=(stock.data?.movements??[]).filter(m=>byId.has(m.productId));
 const lines=(purchases.data?.items??[]).filter(r=>byId.has((r as any).productId));
 const dates=[...new Set([...allSales.map(r=>r.date),...movements.map(m=>m.date),...lines.map(r=>(r as any).dateKey)])].sort();
 const brands=[...new Set(items.map(i=>i.brand))];
 const rows=dates.flatMap(date=>brands.map(brand=>{
  const selected=items.filter(i=>i.brand===brand),ids=new Set(selected.map(i=>i.id)),sold=allSales.filter(r=>r.date===date&&ids.has(r.id));
  const units=(unit:string)=>sold.filter(r=>unit===byId.get(r.id)?.unit?.toLowerCase().replace(/s$/,'')).reduce((s,r)=>s+r.unitsSold,0);
  return {date:date.slice(5,7)+'/'+date.slice(8,10)+'/'+date.slice(0,4),dateKey:date,day:new Date(date+'T12:00:00').toLocaleDateString('en-US',{weekday:'short'}),brand,
   soldCarton:units('carton'),soldPack:units('pack'),
   purchase:lines.filter(r=>(r as any).dateKey===date&&ids.has((r as any).productId)).reduce((s,r)=>s+r.receivedQty,0),
   adjustments:movements.filter(m=>m.date===date&&ids.has(m.productId)&&!['PURCHASE','SALE','DELIVERY'].includes(m.type)).reduce((s,m)=>s+m.qty,0),
   systemCount:selected.some(i=>i.qty==null)?null:selected.reduce((s,i)=>s+i.qty!,0)-movements.filter(m=>m.date>date&&ids.has(m.productId)).reduce((s,m)=>s+m.qty,0),
   manualCount:null,missingExtra:null};
 }));
 const summary=dates.map(date=>{
  const group=rows.filter(r=>r.dateKey===date),sum=(key:string)=>group.reduce((s,r)=>s+(r as any)[key],0);
  return {...group[0],soldCarton:sum('soldCarton'),soldPack:sum('soldPack'),purchase:sum('purchase'),adjustments:sum('adjustments'),systemCount:group.some(r=>r.systemCount==null)?null:sum('systemCount'),manualCount:null,missingExtra:null};
 }).reverse();
 const value=(key:'cost'|'retail')=>items.some(i=>i.qty==null||i[key]==null)?null:items.reduce((s,i)=>s+i.qty!*i[key]!,0);
 return {pending:sales.isPending||stock.isPending||purchases.isPending,error:sales.error||stock.error||purchases.error,rows,summary,items,
 missingUnits:items.some(i=>!['pack','packs','carton','cartons'].includes(i.unit?.toLowerCase())),cost:value('cost'),retail:value('retail'),
 packs:items.filter(i=>['pack','packs'].includes(i.unit?.toLowerCase())).reduce((s,i)=>s+(i.qty??0),0),
 cartons:items.filter(i=>['carton','cartons'].includes(i.unit?.toLowerCase())).reduce((s,i)=>s+(i.qty??0),0)};
}
