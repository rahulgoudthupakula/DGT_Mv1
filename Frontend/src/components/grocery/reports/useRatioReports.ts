import {useReportSummary} from './useReportSummary';
/** Ratios and daily trends are calculated against a consistent backend read snapshot. */
export function useRatioReports(storeId:string,start?:Date,end?:Date){
 const query=useReportSummary(storeId,'ratio-summary',start,end);
 return {totalSales:0,totalPurchases:0,ratio:null,trend:[],...query.data,pending:query.isPending,error:query.error};
}
