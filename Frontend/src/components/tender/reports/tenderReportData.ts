export type Money = number | null;
export type SavedBatch = Record<string, unknown>;
export interface BatchRow {
  id:string; groupId:string; kind:string; date:string; batchId:string; processor:string; tenderType:string;
  salesAmount:number; refunds:number; netAmount:number; totalAmount:number; transactionCount:number;
  fees:Money; estimatedFee:boolean; adjustment:number; chargebacks:number; statementDiscount:Money;
  processorAmount:number; expectedNet:Money; netDeposit:Money; settlementDate:string; settlementReference:string;
  status:string; destination:string; notes:string; pending:Money; variance:number;
}
export interface BalanceRow {
  groupId:string;kind:string;processor:string;tenderType:string;totalBatches:number;
  totalSales:number;totalAmount:number;totalFees:Money;totalDeposited:number;pendingDeposit:Money;
  variance:number;expectedNet:Money;adjustment:number;chargebacks:number;statementDiscount:Money;
  processorDifference:number;estimatedFees:boolean;
}
const n=(v:unknown)=>Number(v??0);
const amount=(v:unknown):Money=>v==null?null:n(v);
const cents=(v:number)=>Math.round(v*100);
const rounded=(v:number)=>Math.round(v*100)/100;
export const sumMoney=(values:Money[]):Money=>values.some(v=>v==null)?null:values.reduce<number>((s,v)=>s+cents(v!),0)/100;
export const fmt=(v:Money)=>v==null?'—':v.toLocaleString('en-US',{style:'currency',currency:'USD'});
export function batchRows(rows:SavedBatch[],asOf?:string):BatchRow[]{
 return rows.map(b=>{
  const kind=String(b.kind),card=kind==='card',ebt=kind==='ebt';
  const net=card?n(b.pos_sales):ebt?rounded(n(b.snap_amount)+n(b.cash_amount)):n(b.fleet_sales);
  const fees=card?amount(b.actual_fee??b.expected_fee):amount(ebt?b.fees:b.processor_fee);
  const refund=n(b.refund_amount),processorAmount=card?n(b.processor_sales??b.pos_sales):net;
  const adjustment=ebt?n(b.adjustment_amount):0,chargebacks=card?n(b.chargebacks):0;
  const statementDiscount=kind==='fleet'?amount(b.statement_discount):0;
  const expectedNet=fees==null||statementDiscount==null?null:rounded(processorAmount+adjustment-fees-chargebacks-statementDiscount);
  const settlementDate=String(b.settlement_date??'');
  const recorded=amount(card?b.received_amount:b.actual_deposit);
  const settled=['SETTLED','RECONCILED'].includes(String(b.status))&&recorded!=null&&!!settlementDate&&(!asOf||settlementDate<=asOf);
  return {id:`${kind}:${b.batch_id}`,groupId:`${kind}:${b.group_id}`,kind,date:String(b.business_date),batchId:String(b.batch_reference),processor:String(b.group_name),tenderType:String(b.group_name),
    salesAmount:rounded(net+refund),refunds:refund,netAmount:net,totalAmount:net,transactionCount:n(b.transaction_count),fees,estimatedFee:card&&b.actual_fee==null,
    processorAmount,adjustment,chargebacks,statementDiscount,expectedNet,netDeposit:settled?recorded:null,settlementDate,settlementReference:String(b.settlement_reference??''),
    status:String(b.status).toLowerCase().replace(/^./,c=>c.toUpperCase()),destination:String(b.destination_label??''),notes:String(b.notes??''),
    pending:settled?0:expectedNet,variance:settled&&expectedNet!=null?rounded(recorded!-expectedNet):0};
 }).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
}
export function balanceRows(rows:BatchRow[]):BalanceRow[]{
 const groups=new Map<string,BatchRow[]>();for(const r of rows)groups.set(r.groupId,[...(groups.get(r.groupId)??[]),r]);
 return [...groups.entries()].map(([groupId,rs])=>({groupId,kind:rs[0].kind,processor:rs[0].processor,tenderType:rs[0].tenderType,totalBatches:rs.length,
  totalSales:sumMoney(rs.map(r=>r.netAmount))!,totalAmount:sumMoney(rs.map(r=>r.netAmount))!,totalFees:sumMoney(rs.map(r=>r.fees)),
  totalDeposited:sumMoney(rs.map(r=>r.netDeposit??0))!,pendingDeposit:sumMoney(rs.map(r=>r.pending)),variance:sumMoney(rs.map(r=>r.variance))!,expectedNet:sumMoney(rs.map(r=>r.expectedNet)),
  adjustment:sumMoney(rs.map(r=>r.adjustment))!,chargebacks:sumMoney(rs.map(r=>r.chargebacks))!,statementDiscount:sumMoney(rs.map(r=>r.statementDiscount)),processorDifference:sumMoney(rs.map(r=>rounded(r.processorAmount-r.netAmount)))!,estimatedFees:rs.some(r=>r.estimatedFee)
 }));
}
export function reportCsv(columns:[string,string][],rows:Record<string,unknown>[]){
 const cell=(v:unknown)=>{let s=v==null?'':String(v);if(/^[\s]*[=+@-]/.test(s)&&typeof v!=='number')s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 return [columns.map(([label])=>cell(label)).join(','),...rows.map(row=>columns.map(([,key])=>cell(row[key])).join(','))].join('\r\n');
}
export function exportTenderReport(name:string,columns:[string,string][],rows:object[]){
 const url=URL.createObjectURL(new Blob([reportCsv(columns,rows as Record<string,unknown>[])],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=`${name}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
