import {useSalesReports} from './useSalesReports';
import {usePurchaseReports} from './usePurchaseReports';
export function useRatioReports(storeId:string,start?:Date,end?:Date){
 const sales=useSalesReports(storeId,start,end),purchases=usePurchaseReports(storeId,start,end);
 const rows=(sales.data?.rows??[]).filter(r=>r.date>=sales.data!.start);
 const totalSales=rows.reduce((s,r)=>s+r.netSales,0);
 const invoices=(purchases.data?.invoices??[]).filter(r=>!sales.data?.end||(r as any).dateKey<=sales.data.end);
 const totalPurchases=invoices.reduce((s,r)=>s+r.purchaseAmount,0);
 const dates=[...new Set([...rows.map(r=>r.date),...invoices.map(r=>(r as any).dateKey)])].sort();
 return {pending:sales.isPending||purchases.isPending,error:sales.error||purchases.error,totalSales,totalPurchases,ratio:totalPurchases?totalSales/totalPurchases:null,
 trend:dates.map(date=>{const s=rows.filter(r=>r.date===date).reduce((s,r)=>s+r.netSales,0),p=invoices.filter(r=>(r as any).dateKey===date).reduce((s,r)=>s+r.purchaseAmount,0);return {date,ratio:p?s/p:null};})};
}
