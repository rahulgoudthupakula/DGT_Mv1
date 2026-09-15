export type SaleLine={id:string;saleId:string;productId:string;date:string;hour:number;name:string;unit:string;department:string;category:string;direction:number;quantity:number;gross:number;discount:number};
export type StatisticsSource={start:string;end:string;previousStart:string;days:number;today:string;latest:string;timezone:string;rows:SaleLine[]};
const palette=['hsl(232, 44%, 56%)','hsl(142, 71%, 45%)','hsl(38, 92%, 50%)','hsl(0, 84%, 60%)','hsl(280, 65%, 60%)','hsl(190, 65%, 40%)'];
const kind=(r:SaleLine)=>['fuel','gas'].includes(r.department.trim().toLowerCase())?'fuel':r.department.trim().toLowerCase().startsWith('lottery')?'nonMerch':'merch';
const netCents=(r:SaleLine)=>r.direction*(Math.round(Number(r.gross)*100)-Math.round(Number(r.discount)*100));
const money=(rows:SaleLine[])=>rows.reduce((sum,r)=>sum+netCents(r),0)/100;
const qty=(rows:SaleLine[])=>Math.round(rows.reduce((sum,r)=>sum+r.direction*Number(r.quantity),0)*10000)/10000;
const groups=(rows:SaleLine[],key:(r:SaleLine)=>string)=>{const map=new Map<string,SaleLine[]>();for(const r of rows){const k=key(r);const list=map.get(k)??[];list.push(r);map.set(k,list);}return [...map.entries()];};
const summary=(rows:SaleLine[])=>{const sales=money(rows),transactions=new Set(rows.filter(r=>r.direction===1).map(r=>r.saleId)).size;return{sales,transactions,avg:transactions?sales/transactions:null,items:qty(rows)};};
export const change=(now:number|null,before:number|null)=>now==null||before==null||before<=0?null:(now-before)/before*100;
export const fraction=(value:number,total:number):number|null=>total>0?value/total:null;
export const dollars=(value:number|null)=>value==null?'—':value.toLocaleString('en-US',{style:'currency',currency:'USD'});
export const pct=(value:number|null)=>value==null?'—':(value*100).toFixed(1)+'%';
export function statisticsData(source:StatisticsSource){
 const rows=source.rows.filter(r=>r.date>=source.start&&r.date<=source.end),previous=source.rows.filter(r=>r.date>=source.previousStart&&r.date<source.start);
 const merch=rows.filter(r=>kind(r)==='merch'),oldMerch=previous.filter(r=>kind(r)==='merch');
 const totals=summary(merch),prior=summary(oldMerch);
 const currentGroups=groups(rows.filter(r=>kind(r)==='fuel'),r=>r.productId).sort(([,a],[,b])=>a[0].name.localeCompare(b[0].name)||a[0].productId.localeCompare(b[0].productId));
 const grades=currentGroups.map(([id,rs],i)=>({id,key:'fuel_'+id,name:rs[0].name,color:palette[(i+2)%palette.length]}));
 const keys=[{key:'merch',name:'Merchandise',color:palette[0]},{key:'nonMerch',name:'Non-Merch',color:palette[1]},...grades];
 const dates:string[]=[];for(let d=new Date(source.start+'T12:00:00Z');d.toISOString().slice(0,10)<=source.end;d.setUTCDate(d.getUTCDate()+1))dates.push(d.toISOString().slice(0,10));
 const byDate=new Map(groups(rows,r=>r.date)),merchByDate=new Map(groups(merch,r=>r.date));
 const data=dates.map(date=>{
  const ls=byDate.get(date)??[];const amounts:Record<string,number>={merch:money(ls.filter(r=>kind(r)==='merch')),nonMerch:money(ls.filter(r=>kind(r)==='nonMerch'))};
  for(const grade of grades)amounts[grade.key]=money(ls.filter(r=>kind(r)==='fuel'&&r.productId===grade.id));
  const total=money(ls);return {date,...amounts,total,merchPct:fraction(amounts.merch,total),nonMerchPct:fraction(amounts.nonMerch,total)};
 });
 const allTotal=money(rows);
 const statisticsTotals=Object.fromEntries(keys.map(k=>[k.key,Math.round(data.reduce((sum,d)=>sum+Math.round(Number(d[k.key])*100),0))/100]));
 const mix=keys.map(k=>({...k,value:statisticsTotals[k.key],pct:fraction(statisticsTotals[k.key],allTotal)}));
 const categoryData=groups(merch,r=>r.department+'\u0000'+r.category).map(([,rs],i)=>({name:rs[0].category,value:money(rs),color:palette[i%palette.length]})).sort((a,b)=>b.value-a.value);
 const topSellingItems=groups(merch,r=>r.productId).map(([id,rs])=>({id,name:rs[0].name,category:rs[0].category,qty:qty(rs),revenue:money(rs)})).filter(r=>r.qty>0).sort((a,b)=>b.qty-a.qty||b.revenue-a.revenue||a.name.localeCompare(b.name)).slice(0,5).map((r,i)=>({...r,rank:i+1}));
 return {totals,prior,data,grades,mix,keys,allTotal,statisticsTotals,categoryData,topSellingItems,
  dailySalesData:dates.map(day=>({day,sales:money(merchByDate.get(day)??[])})),
  hourlyTrend:Array.from({length:24},(_,h)=>({hour:`${h%12||12}${h<12?'AM':'PM'}`,sales:money(merch.filter(r=>r.hour===h))})),
  hasSales:rows.length>0,hasGrocery:merch.length>0,
  categoryPieValid:categoryData.some(r=>r.value>0)&&categoryData.every(r=>r.value>=0),
  mixPieValid:mix.some(r=>r.value>0)&&mix.every(r=>r.value>=0),
  unassigned:rows.filter(r=>r.department==='Unassigned').length};
}
