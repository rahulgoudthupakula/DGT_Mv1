import {useReportSummary} from './useReportSummary';
/** Backend returns approved invoice details and totals for the selected filters. */
export function usePurchaseReports(storeId:string,start?:Date,end?:Date,filters:Record<string,string|readonly string[]>={}){
 return useReportSummary(storeId,'purchase-summary',start,end,filters);
}
