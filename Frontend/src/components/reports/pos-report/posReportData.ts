import {format,parseISO,differenceInCalendarDays,eachDayOfInterval} from 'date-fns';
export type PosLine={id:string;saleId:string;productId:string;date:string;hour:number;name:string;sku:string;unit:string;barcode:string;department:string;category:string;direction:number;quantity:number;gross:number;discount:number;taxable:number;tax:number;price:number};
export type PosPayment={saleId:string;code:string;name:string;brand:string|null;amount:number};
export type PosReport={start:string;end:string;today:string;timezone:string;rows:PosLine[];payments:PosPayment[];closing:any;closingMeta:{id?:string;reviewer?:string;updated?:string}};
const groups=(rows:PosLine[],key:(r:PosLine)=>string)=>{const result=new Map<string,PosLine[]>();for(const r of rows){const k=key(r);const list=result.get(k)??[];list.push(r);result.set(k,list);}return [...result.entries()];};
const sum=(rows:PosLine[],fn:(r:PosLine)=>number)=>rows.reduce((s,r)=>s+fn(r),0);
const net=(r:PosLine)=>r.direction*(r.gross-r.discount);
const qty=(r:PosLine)=>r.direction*r.quantity;
const txns=(rows:PosLine[])=>new Set(rows.map(r=>r.saleId)).size;
const fuel=(r:PosLine)=>['gas','fuel'].includes(r.department.trim().toLowerCase());
const gallons=(r:PosLine)=>['gal','gallon','gallons'].includes(r.unit.trim().toLowerCase());
const weekday=(date:string)=>format(parseISO(date),'EEEE');
const displayDate=(date:string)=>format(parseISO(date),'MM/dd/yyyy');
const hour=(h:number)=>`${h%12||12} ${h<12?'AM':'PM'}`;
export function posTables(report:PosReport,merchandise=false,timeView='by-hour',scanned=false){
 const all=report.rows,rows=merchandise?all.filter(r=>!fuel(r)&&!r.department.toLowerCase().startsWith('lottery')):all;
 const fuelRows=all.filter(fuel),calendar=eachDayOfInterval({start:parseISO(report.start),end:parseISO(report.end)}),days=differenceInCalendarDays(parseISO(report.end),parseISO(report.start))+1;
 const deptSummaryData=groups(rows,r=>r.department).map(([dept,rs])=>({dept,gross:sum(rs,r=>r.direction===1?r.gross:0),discount:sum(rs,r=>r.direction===1?r.discount:0),promotions:null,refund:sum(rs,r=>r.direction===-1?r.gross-r.discount:0),net:sum(rs,net)}));
 const dated=(rs:PosLine[],mode:string,isFuel=false)=>groups(rs,r=>[mode==='date'?r.date:mode==='week'?weekday(r.date):r.date.slice(0,7),isFuel?r.name:r.department].join('|')).map(([,ls])=>{const r=ls[0],sales=sum(ls,net);return {date:displayDate(r.date),day:weekday(r.date),month:format(parseISO(r.date),'MMMM'),year:Number(r.date.slice(0,4)),count:calendar.filter(d=>format(d,'EEEE')===weekday(r.date)).length,dept:r.department,grade:r.name,qty:sum(ls,qty),sales,total:sales,volume:ls.every(gallons)?sum(ls,qty):null,gross:sum(ls,r=>r.direction*r.gross),discount:sum(ls,r=>r.direction*r.discount),net:sales};});
 const vatByDeptData=groups(rows,r=>r.department).map(([dept,rs])=>{const taxable=sum(rs,r=>r.direction*r.taxable),tax=sum(rs,r=>r.direction*r.tax),sales=sum(rs,net);return {dept,taxableSales:taxable+tax,nonTaxableSales:sales-taxable,totalSales:sales+tax,taxCollected:tax,taxableSalesExVat:taxable,totalSalesExTax:sales,totalCost:null,grossProfit:null,profitMargin:null};});
 const gasSalesSummaryData=groups(fuelRows,r=>r.productId).map(([,rs])=>{const volume=rs.every(gallons)?sum(rs,qty):null,sales=sum(rs,net);return {id:rs[0].productId,grade:rs[0].name,gradeId:rs[0].sku||rs[0].productId,gallons:volume,gross:sum(rs,r=>r.direction*r.gross),discount:sum(rs,r=>r.direction*r.discount),net:sales,avgPrice:volume?sales/volume:null};});
 const gasSalesByHourData=groups(fuelRows,r=>String(r.hour).padStart(2,'0')).sort(([a],[b])=>a.localeCompare(b)).map(([,rs])=>{const volume=rs.every(gallons)?sum(rs,qty):null,amount=sum(rs,net),count=txns(rs);return {hour:hour(rs[0].hour),days,txns:count,gallons:volume,amount,avgPerGal:volume?amount/volume:null,avgSales:amount/days,avgTicket:count?amount/count:null};});
 const itemSalesData=groups(all,r=>r.productId).map(([,rs])=>{const quantity=sum(rs,qty),sales=sum(rs,net);return {id:rs[0].productId,upc:rs[0].barcode||rs[0].sku||rs[0].productId,desc:rs[0].name,dept:rs[0].department,qty:quantity,sales,avgPrice:quantity?sales/quantity:null};});
 const itemSalesByHourData=groups(all,r=>timeView==='by-date'?r.date:String(r.hour).padStart(2,'0')).sort(([a],[b])=>a.localeCompare(b)).map(([,rs])=>({hour:timeView==='by-date'?displayDate(rs[0].date):hour(rs[0].hour),txns:txns(rs),items:sum(rs,qty),sales:sum(rs,net)}));
 const fuelCards=new Map<string,PosLine[]>();let unallocatedFuelReceipts=0;
 for(const [saleId,rs] of groups(fuelRows,r=>r.saleId)){const payments=report.payments.filter(p=>p.saleId===saleId);const brands=new Set(payments.map(p=>`${p.code}|${p.brand??p.name}`));
  if(brands.size!==1){unallocatedFuelReceipts++;continue;}
  const p=payments[0];if(!['CREDIT_CARD','DEBIT_CARD','FLEET','FLEET_CARD','MOBILE_PAY'].includes(p.code))continue;
  const card=p.brand?`${p.name} — ${p.brand}`:p.name;fuelCards.set(card,[...(fuelCards.get(card)??[]),...rs]);
 }
 const fuelByCCData=[...fuelCards].map(([card,rs])=>({card,gallons:rs.every(gallons)?sum(rs,qty):null,amount:sum(rs,net),txns:txns(rs),avgTxn:sum(rs,net)/txns(rs)}));
 const taxSalesData=groups(all,r=>r.department).map(([category,rs])=>{const taxableAmt=sum(rs,r=>r.direction*r.taxable),taxCollected=sum(rs,r=>r.direction*r.tax);return {category,taxableAmt,taxCollected,rate:taxableAmt?`${(taxCollected/taxableAmt*100).toFixed(3)}% effective`:'—'};});
 const profitData=scanned?[]:deptSummaryData.map(r=>({dept:r.dept,sales:r.net,cost:null,profit:null,margin:null}));
 const itemSalesHistoryData=groups(all,r=>r.productId).map(([,rs])=>{const r=rs[rs.length-1],lastSale=rs.filter(r=>r.direction===1).pop();return {scanCode:r.sku||'—',upc:r.barcode||'—',description:r.name,department:r.department,vendor:'—',price:lastSale?.price??null,cost:null,salesCount:sum(rs,qty),lastSoldDate:lastSale?displayDate(lastSale.date):'—'};});
 return {deptSummaryData,deptByDateData:dated(rows,'date'),deptByWeekData:dated(rows,'week'),deptByMonthData:dated(rows,'month'),vatByDeptData,gasSalesSummaryData,gasSalesByDateData:dated(fuelRows,'date',true),gasSalesByWeekData:dated(fuelRows,'week',true),gasSalesByMonthData:dated(fuelRows,'month',true),gasSalesByHourData,itemSalesData,itemSalesByHourData,fuelByCCData,taxSalesData,profitData,itemSalesHistoryData,manualRingupData:[] as {time:string;register:string;cashier:string;dept:string;amount:number;reason:string}[],unallocatedFuelReceipts};
}
export function exportReportTable(button:HTMLElement){
 const card=button.closest('[data-pos-card]')??button.closest('[role=tabpanel]');
 const tables=card?.querySelectorAll('table');if(!tables?.length)return;
 const lines=[...tables].flatMap(table=>[...table.querySelectorAll('tr')].map(row=>[...row.querySelectorAll('th,td')].map(cell=>'"'+cell.textContent?.trim().replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"').join(',')));
 const url=URL.createObjectURL(new Blob([lines.join('\r\n')],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='pos-report.csv';a.click();URL.revokeObjectURL(url);
}
