import {createContext,useContext} from 'react';
import {useReportSummary} from './useReportSummary';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Context=createContext<any>(null);
export const ProfitDataProvider=Context.Provider;
export const useProfitData=()=>useContext(Context);
/** Display backend profit summaries, including explicit nulls for unavailable historical costs. */
export function useProfitReport(store:string,start?:Date,end?:Date,search=''){
 const query=useReportSummary(store,'profit-summary',start,end,{search});
 return {items:[],categories:[],days:[],categoryNames:[],summary:{netSales:0,cogs:null,grossProfit:null,grossMargin:null},...query.data,pending:query.isPending,error:query.error};
}
