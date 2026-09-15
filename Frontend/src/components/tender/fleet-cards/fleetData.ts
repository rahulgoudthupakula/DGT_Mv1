import {useState,useRef} from 'react';
import {useQuery,keepPreviousData} from '@tanstack/react-query';
import {request} from '@/lib/backend';

export type FleetBatch={receipt_ids_json:string;batch_id:number;provider_name:string;batch_reference:string;business_date:string;source_kind:string;
 status:'OPEN'|'SETTLED'|'RECONCILED';fleet_sales:number;gallons_sold:number|null;fuel_sales:number|null;volume_note:string|null;
 transaction_count:number;processor_fee:number|null;statement_discount:number|null;
 actual_deposit:number|null;settlement_date:string|null;settlement_reference:string|null;
 variance_review_note:string|null;notes:string|null;version:string};
export type FleetData={today:string;latest:string;start:string;end:string;batches:FleetBatch[]};
export type FleetPayment={sale_payment_id:number;sale_id:number;receipt_no:string;amount:number;version:string};
export type FleetDetails={payments:{sale_payment_id:number;receipt_no:string;payment_amount_snapshot:number}[];
 audit:{event_id:number;event_type:string;created_at:string;actor:string}[]};
export const amount=(v:number|string|null|undefined)=>Number(v??0);
export const expected=(b:FleetBatch)=>b.processor_fee==null||b.statement_discount==null?null:Math.round((amount(b.fleet_sales)-amount(b.statement_discount)-amount(b.processor_fee))*100)/100;
export const variance=(b:FleetBatch)=>b.actual_deposit==null||expected(b)==null?null:Math.round((amount(b.actual_deposit)-expected(b)!)*100)/100;
export const fmt=(n:number|null)=>n==null?'—':n.toLocaleString('en-US',{style:'currency',currency:'USD'});
export function useFleet(store:string){
 const base=`/access/stores/${encodeURIComponent(store)}/fleet`;
 const [range,setRange]=useState({start:'',end:''}),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const q=useQuery({queryKey:['fleet',store,range],queryFn:()=>request<FleetData>(base+(range.start&&range.end?`?start=${range.start}&end=${range.end}`:'')),placeholderData:keepPreviousData,refetchOnWindowFocus:false});
 const last=useRef<FleetData|undefined>(undefined);if(q.data)last.current=q.data;
 const busy=saving||q.isFetching;
 async function mutate(path:string,body:unknown,method='POST'){
  setSaving(true);setError('');
  try{const result=await request(base+path,{method,body:JSON.stringify(body)});await q.refetch();return result;}
  catch(e){setError((e as Error).message);throw e;}finally{setSaving(false);}
 }
 return {base,range,setRange,q:{...q,data:q.data??last.current},busy,error,setError,mutate};
}
