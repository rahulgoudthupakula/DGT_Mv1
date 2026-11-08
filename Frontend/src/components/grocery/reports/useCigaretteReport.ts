import {useReportSummary} from './useReportSummary';
/** Backend reconstructs ledger counts; physical counts remain unavailable. */
export function useCigaretteReport(storeId:string,start?:Date,end?:Date,latest=false){
 const query=useReportSummary(storeId,'cigarette-summary',start,end,{latest:String(latest)});
 return {totals:{},rows:[],summary:[],packs:0,cartons:0,cost:null,retail:null,missingUnits:false,...query.data,pending:query.isPending,error:query.error};
}
