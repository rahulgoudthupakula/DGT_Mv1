import {fmt,type BatchRow,type BalanceRow} from './tenderReportData';
const Lines=({values}:{values:[string,string|number][]})=><div className="space-y-1.5 text-xs">{values.map(([label,value])=><div key={label} className="flex justify-between gap-4"><span>{label}</span><span className="text-right break-words">{value}</span></div>)}</div>;
export function SettlementDetails({row:r}:{row:BatchRow}){return <div className="mt-6 space-y-5">
 <section><h4 className="text-xs font-semibold text-muted-foreground mb-2">Sales Breakdown</h4><Lines values={[
 ['Gross Sales',fmt(r.salesAmount)],['Refunds',fmt(r.refunds)],['Net Amount',fmt(r.netAmount)],['Transactions',r.transactionCount]]}/></section>
 <section><h4 className="text-xs font-semibold text-muted-foreground mb-2">Settlement</h4><Lines values={[
 ...(r.kind==='card'?[["Processor Net Sales",fmt(r.processorAmount)],["Chargebacks",fmt(r.chargebacks)]] as [string,string][]:[]),
 ...(r.kind==='ebt'?[["Adjustment",fmt(r.adjustment)]] as [string,string][]:[]),
 ...(r.kind==='fleet'?[["Statement Discount",fmt(r.statementDiscount)]] as [string,string][]:[]),
 [r.estimatedFee?'Processing Fees (Estimated)':'Processing Fees',fmt(r.fees)],['Expected Net',fmt(r.expectedNet)],['Net Deposit / Credit',fmt(r.netDeposit)],['Variance (Received − Expected)',r.netDeposit==null?'—':fmt(r.variance)],['Settlement Date',r.settlementDate||'—'],['Settlement Reference',r.settlementReference||'—']]}/></section>
 <section><h4 className="text-xs font-semibold text-muted-foreground mb-2">Info</h4><Lines values={[[r.kind==='card'?'Processor':'Tender Type',r.processor],['Date',r.date],['Status',r.status],...(r.destination?[["Destination",r.destination]] as [string,string][]:[]),['Notes',r.notes||'—']]}/></section>
 </div>;}
export function BalanceDetails({row:r}:{row:BalanceRow}){return <div className="mt-6 space-y-5">
 <section><h4 className="text-xs font-semibold text-muted-foreground mb-2">Summary</h4><Lines values={[
 ['Total Batches',r.totalBatches],['Net Sales (After Refunds)',fmt(r.totalSales)],['Fees'+(r.estimatedFees?' (Includes Estimates)':''),fmt(r.totalFees)],
 ...(r.kind==='card'?[["Processor Difference",fmt(r.processorDifference)],["Chargebacks",fmt(r.chargebacks)]] as [string,string][]:[]),
 ...(r.kind==='ebt'?[["Adjustment",fmt(r.adjustment)]] as [string,string][]:[]),
 ...(r.kind==='fleet'?[["Statement Discount",fmt(r.statementDiscount)]] as [string,string][]:[]),['Expected Net',fmt(r.expectedNet)]]}/></section>
 <section><h4 className="text-xs font-semibold text-muted-foreground mb-2">Deposit Status</h4><Lines values={[
 ['Deposited / Credited',fmt(r.totalDeposited)],['Pending',fmt(r.pendingDeposit)],['Variance (Received − Expected)',fmt(r.variance)]]}/></section>
 </div>;}
