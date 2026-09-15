import {useQuery} from '@tanstack/react-query';
import {request} from '@/lib/backend';
export type StockRow={id:string;name:string;category:string;department:string;brand:string;unit:string;qty:number|null;cost:number|null;retail:number|null};
export type StockMovement={id:string;productId:string;qty:number;type:string;date:string;cost:number|null};
export function useStockReports(store:string){
 return useQuery({queryKey:['grocery-stock',store],queryFn:()=>request<{items:StockRow[];movements:StockMovement[]}>('/access/stores/'+encodeURIComponent(store)+'/grocery-reports/stock'),enabled:!!store});
}
export function stockCategories(items:StockRow[]){
 const groups=new Map<string,{category:string;onHandQty:number;inventoryValue:number;inventoryValueRetail:number;missingQty:boolean;missingCost:boolean;missingRetail:boolean}>();
 for(const i of items){const g=groups.get(i.category)??{category:i.category,onHandQty:0,inventoryValue:0,inventoryValueRetail:0,missingQty:false,missingCost:false,missingRetail:false};
 g.onHandQty+=i.qty??0;g.inventoryValue+=(i.qty??0)*(i.cost??0);g.inventoryValueRetail+=(i.qty??0)*(i.retail??0);
 g.missingQty ||= i.qty===null;g.missingCost ||= i.qty===null||i.cost===null;g.missingRetail ||= i.qty===null||i.retail===null;groups.set(i.category,g);}
 const total=[...groups.values()].reduce((s,g)=>s+g.inventoryValue,0),missing=[...groups.values()].some(g=>g.missingCost);
 return [...groups.values()].map(g=>({...g,onHandQty:g.missingQty?null:g.onHandQty,inventoryValue:g.missingCost?null:g.inventoryValue,inventoryValueRetail:g.missingRetail?null:g.inventoryValueRetail,
 avgCost:g.missingCost||!g.onHandQty?null:g.inventoryValue/g.onHandQty,avgRetail:g.missingRetail||!g.onHandQty?null:g.inventoryValueRetail/g.onHandQty,
 potentialMargin:g.missingCost||g.missingRetail||!g.inventoryValueRetail?null:(g.inventoryValueRetail-g.inventoryValue)/g.inventoryValueRetail*100,
 pctOfTotal:missing||!total?null:g.inventoryValue/total*100,actualInventory:null,variation:null}));
}
