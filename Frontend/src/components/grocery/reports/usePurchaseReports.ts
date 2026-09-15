import {useQuery} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import {format} from 'date-fns';
import type {PurchaseInvoice} from './PurchaseInvoiceSummaryTable';
import type {ItemPurchaseRow} from './SingleItemPurchaseTable';
export function usePurchaseReports(storeId:string,start?:Date,end?:Date){
 const params=new URLSearchParams();if(start)params.set('start',format(start,'yyyy-MM-dd'));if(end)params.set('end',format(end,'yyyy-MM-dd'));
 return useQuery({queryKey:['grocery-purchases',storeId,params.toString()],queryFn:()=>request<{invoices:PurchaseInvoice[];items:ItemPurchaseRow[]}>('/access/stores/'+encodeURIComponent(storeId)+'/grocery-reports/purchases?'+params),enabled:!!storeId});
}
