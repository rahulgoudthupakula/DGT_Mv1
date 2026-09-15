import {createContext,useContext,useState,useRef} from 'react';
import {useQuery} from '@tanstack/react-query';
import {request} from '@/lib/backend';
export type Processor={processor_id:number;processor_name:string;is_active:boolean;settlement_frequency:string;deposit_delay_days:number;settlement_destination:string;destination_label:string;version:string};
export type Batch={batch_id:number;processor_id:number;processor_name:string;batch_reference:string;business_date:string;status:'OPEN'|'SUBMITTED'|'SETTLED'|'RECONCILED';source_kind:string;pos_sales:number;transaction_count:number;fee_base:number;configured_fee_percent:number;per_transaction_fee:number;expected_fee:number;actual_fee:number|null;processor_sales:number|null;chargebacks:number;fee_reason:string|null;notes:string|null;received_amount:number|null;settlement_date:string|null;settlement_reference:string|null;settlement_destination:string;destination_label:string;version:string};
export type Payment={sale_payment_id:number;receipt_no:string;tender_code:string;amount:number;version:string};
export type CardData={settings:Record<string,string|number|boolean>;settingsLocked:boolean;processors:Processor[];batches:Batch[];audit:{event_id:number;created_at:string;event_type:string;actor:string;changes:unknown}[];today:string;latest:string;start:string;end:string};
export function useCardData(store:string){
 const [range,setRange]=useState({start:'',end:''});const base=`/access/stores/${encodeURIComponent(store)}/credit-card`;
 const q=useQuery({queryKey:['credit-card',store,range],queryFn:()=>request<CardData>(base+(range.start&&range.end?`?start=${range.start}&end=${range.end}`:'')),refetchOnWindowFocus:false});
 const last=useRef<CardData|undefined>(undefined);if(q.data)last.current=q.data;
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function mutate(path:string,body:unknown,method='POST'){setBusy(true);setError('');try{const result=await request(base+path,{method,body:JSON.stringify(body)});await q.refetch();return result;}catch(e){setError((e as Error).message);throw e;}finally{setBusy(false);}}
 return {q:{...q,data:q.data??last.current},range,setRange,base,busy,error:error||(q.error?.message??''),setError,mutate};
}
export const CardContext=createContext<ReturnType<typeof useCardData>|null>(null);
export const useCards=()=>{const ctx=useContext(CardContext);if(!ctx)throw Error('Credit card provider missing');return ctx;};
export const fmt=(n:number|null|undefined)=>n==null?'—':Number(n).toLocaleString('en-US',{style:'currency',currency:'USD'});
export const net=(b:Batch)=>b.processor_sales==null||b.actual_fee==null?null:Number(b.processor_sales)-Number(b.actual_fee)-Number(b.chargebacks);
export const difference=(b:Batch)=>b.received_amount==null||net(b)==null?null:Number(b.received_amount)-net(b)!;
export const statusName=(b:Batch):'Open'|'Submitted'|'Settled'|'Reconciled'=>({OPEN:'Open',SUBMITTED:'Submitted',SETTLED:'Settled',RECONCILED:'Reconciled'} as const)[b.status];
export function exportRows(name:string,rows:Record<string,unknown>[]){if(!rows.length)return;const keys=Object.keys(rows[0]);const esc=(v:unknown)=>'"'+String(v??'').replace(/^[=+@\t\r]/,"'$&").split('"').join('""')+'"';const blob=new Blob([[keys,...rows.map(r=>keys.map(k=>r[k]))].map(r=>r.map(esc).join(',')).join('\r\n')],{type:'text/csv'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function DateFilters(){const {q,range,setRange}=useCards();return <>{(['start','end'] as const).map(k=><div key={k} className="space-y-1"><label className="text-xs font-medium text-muted-foreground">{k==='start'?'From':'To'}<input aria-label={k==='start'?'From':'To'} type="date" max={q.data?.today} className="block border rounded-md bg-background w-36 h-9 px-3 text-xs" value={range[k]||q.data?.[k]||''} onChange={e=>setRange(r=>({start:r.start||q.data?.start||'',end:r.end||q.data?.end||'',[k]:e.target.value}))}/></label></div>)}</>}
