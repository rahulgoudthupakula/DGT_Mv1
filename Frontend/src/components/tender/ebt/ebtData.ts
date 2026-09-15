import {useState} from 'react';
import {useQuery,keepPreviousData} from '@tanstack/react-query';
import {request} from '@/lib/backend';

export type EbtBatch={receipt_ids_json:string;has_snap:boolean;has_cash:boolean;batch_id:number;batch_reference:string;business_date:string;source_kind:string;
 status:'OPEN'|'SETTLED'|'RECONCILED';snap_amount:number;cash_amount:number;refund_amount:number;
 transaction_count:number;fees:number|null;adjustment_amount:number;adjustment_reason:string|null;
 actual_deposit:number|null;settlement_date:string|null;settlement_reference:string|null;
 variance_review_note:string|null;notes:string|null;version:string};
export type EbtData={today:string;latest:string;start:string;end:string;batches:EbtBatch[]};
export type EbtPayment={sale_payment_id:number;sale_id:number;receipt_no:string;benefit_type:'SNAP'|'CASH';amount:number;version:string};
export type EbtDetails={payments:{sale_payment_id:number;receipt_no:string;benefit_type:string;payment_amount_snapshot:number}[];
 audit:{event_id:number;event_type:string;created_at:string;actor:string}[]};
export const amount=(v:number|string|null|undefined)=>Number(v??0);
export const expected=(b:EbtBatch)=>b.fees==null?null:Math.round((amount(b.snap_amount)+amount(b.cash_amount)+amount(b.adjustment_amount)-amount(b.fees))*100)/100;
export const variance=(b:EbtBatch)=>b.actual_deposit==null||expected(b)==null?null:Math.round((amount(b.actual_deposit)-expected(b)!)*100)/100;
export const fmt=(n:number|null)=>n==null?'—':n.toLocaleString('en-US',{style:'currency',currency:'USD'});
export function useEbt(store:string){
 const base=`/access/stores/${encodeURIComponent(store)}/ebt`;
 const [range,setRange]=useState({start:'',end:''}),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const q=useQuery({queryKey:['ebt',store,range],queryFn:()=>request<EbtData>(base+(range.start&&range.end?`?start=${range.start}&end=${range.end}`:'')),placeholderData:keepPreviousData,refetchOnWindowFocus:false});
 const busy=saving||q.isFetching;
 async function mutate(path:string,body:unknown,method='POST'){
  setSaving(true);setError('');
  try{const result=await request(base+path,{method,body:JSON.stringify(body)});await q.refetch();return result;}
  catch(e){setError((e as Error).message);throw e;}finally{setSaving(false);}
 }
 return {base,range,setRange,q,busy,error,setError,mutate};
}
