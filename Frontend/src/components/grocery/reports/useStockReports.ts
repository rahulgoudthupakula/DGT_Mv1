/**
 * Loads current stock and recorded movements. Category aggregation tracks missing values
 * explicitly so partial data does not become a misleading complete valuation.
 */
import {useQuery} from '@tanstack/react-query';
import {request} from '@/lib/backend';
export type StockRow={id:string;name:string;category:string;department:string;brand:string;unit:string;qty:number|null;cost:number|null;retail:number|null};
export type StockMovement={id:string;productId:string;qty:number;type:string;date:string;cost:number|null};
export function useStockReports(store:string){
 return useQuery({queryKey:['grocery-stock',store],queryFn:()=>request<{items:StockRow[];movements:StockMovement[]}>('/access/stores/'+encodeURIComponent(store)+'/grocery-reports/stock'),enabled:!!store});
}
