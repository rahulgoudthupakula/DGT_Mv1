export type PriceRow={id:string;gradeId:string;gradeName:string;cash:number;credit:number;oldCash:number|null;oldCredit:number|null;effectiveFrom:string;effectiveTo:string|null;version:string;actor:string;source:string;reason:string|null;notes:string|null;current:boolean;status:"SCHEDULED"|"CANCELLED"|"CURRENT"|"PREVIOUS"};
export type PriceData={history:PriceRow[];grades:{id:string;name:string}[];assignedGrades:string[];timezone:string};
export const reasons:Record<string,string>={market:'Market change',competitor:'Competitor adjustment',cost:'Cost increase',promotion:'Promotion'};
export const priceText=(n:number|null|undefined)=>n==null?'—':`$${Number(n).toFixed(3)}`;
export const localDateTime=(s:string,timezone:string)=>new Date(s).toLocaleString('en-US',{timeZone:timezone});
export const priceDay=(s:string,timezone:string)=>new Date(s).toLocaleDateString('en-CA',{timeZone:timezone});
export function exportPrices(data:PriceData){
 const rows:unknown[][]=[['Fuel grade','Effective from','Effective to','Old cash','Cash','Old credit','Credit','Status','Changed by','Source','Reason','Notes','Reference']];
 for(const p of data.history)rows.push([p.gradeName,localDateTime(p.effectiveFrom,data.timezone),p.effectiveTo?localDateTime(p.effectiveTo,data.timezone):'',p.oldCash,p.cash,p.oldCredit,p.credit,p.status,p.actor,p.source,reasons[p.reason??'']||p.reason||'',p.notes,'PRICE-'+p.id]);
 const csv=rows.map(row=>row.map(v=>{let s=String(v??'');if(/^\s*[=+@-]/.test(s))s="'"+s;return '"'+s.split('"').join('""')+'"';}).join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='gas-price-history.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
