/**
 * Loads product/day report rows, including the prior comparison period. This detailed-report
 * endpoint is separate from sales-statistics, which returns dashboard summaries.
 */
import {useQuery} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import {format} from 'date-fns';
export type SalesSource={id:string;name:string;scanCode:string;category:string;department:string;date:string;unitsSold:number;netSales:number;tax:number;discounts:number;transactions:number};
export function useSalesReports(store:string,start?:Date,end?:Date){
 const params=new URLSearchParams();if(start)params.set('start',format(start,'yyyy-MM-dd'));if(end)params.set('end',format(end,'yyyy-MM-dd'));
 return useQuery({queryKey:['grocery-sales',store,params.toString()],queryFn:()=>request<{rows:SalesSource[];start:string;end:string;days:number}>('/access/stores/'+encodeURIComponent(store)+'/grocery-reports/sales?'+params),enabled:!!store});
}
