import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {type FleetBatch,type FleetPayment,type useFleet,amount,fmt,expected,variance} from './fleetData';
type Connection=ReturnType<typeof useFleet>;
const validMoney=(s:string,negative=false)=>new RegExp(negative?'^-?\\d+(\\.\\d{1,2})?$':'^\\d+(\\.\\d{1,2})?$').test(s)&&Math.abs(Number(s))<=9999999999.99;

export function FleetCreate({c,onClose}:{c:Connection;onClose:()=>void}){
 const [date,setDate]=useState(c.q.data!.latest),[reference,setReference]=useState(''),[provider,setProvider]=useState(''),[selected,setSelected]=useState<Record<number,string>>({}),[key]=useState(crypto.randomUUID());
 const q=useQuery({queryKey:['fleet-payments',c.base,date],queryFn:()=>request<FleetPayment[]>(c.base+'/payments?date='+date),enabled:!!date});
 const chosen=(q.data??[]).filter(p=>selected[p.sale_payment_id]);
 return <Dialog open onOpenChange={open=>{if(!open&&!c.busy)onClose();}}><DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Create Fleet Batch</DialogTitle><DialogDescription>Group recorded Fleet payments. The reference identifies this manual group until POS batch imports are connected.</DialogDescription></DialogHeader>
 <label>Fleet provider<Input aria-label="Fleet provider" list="fleet-provider-names" maxLength={120} value={provider} onChange={e=>setProvider(e.target.value)}/><datalist id="fleet-provider-names">{Array.from(new Set(['WEX','Voyager','Comdata',...c.q.data!.batches.map(b=>b.provider_name)])).map(p=><option key={p} value={p}/>)}</datalist></label>
 <label>Business date<Input aria-label="Fleet batch date" type="date" max={c.q.data!.today} value={date} onChange={e=>{setDate(e.target.value);setSelected({});}}/></label>
 <label>Batch reference<Input aria-label="Fleet batch reference" maxLength={100} value={reference} onChange={e=>setReference(e.target.value)}/></label>
 {q.isFetching&&<p>Loading available payments…</p>}{q.error&&<p role="alert">{q.error.message}</p>}
 <div className="border rounded-md max-h-64 overflow-y-auto">{q.data?.map(p=><label key={p.sale_payment_id} className="flex items-center gap-3 p-2 border-b text-sm"><input type="checkbox" aria-label={`Select Fleet payment ${p.sale_payment_id}`} checked={!!selected[p.sale_payment_id]} onChange={e=>setSelected(old=>{const next={...old};if(e.target.checked)next[p.sale_payment_id]=p.version;else delete next[p.sale_payment_id];return next;})}/><span>{p.receipt_no}</span><span className="ml-auto">{fmt(amount(p.amount))}</span></label>)}{q.data?.length===0&&<p className="p-3 text-sm">No unassigned Fleet payments for this date.</p>}</div>
 <p className="text-sm">{chosen.length} payments · {new Set(chosen.map(p=>p.sale_id)).size} transactions · {fmt(chosen.reduce((s,p)=>s+amount(p.amount),0))}</p>
 {c.error&&<p role="alert" className="text-destructive">{c.error}</p>}<DialogFooter><Button variant="outline" disabled={c.busy} onClick={onClose}>Cancel</Button><Button disabled={c.busy||q.isFetching||!!q.error||!date||!provider.trim()||!reference.trim()||chosen.length===0} onClick={()=>void c.mutate('/batches',{date,provider,reference,requestKey:key,payments:selected}).then(onClose).catch(()=>{})}>Create Batch</Button></DialogFooter>
 </DialogContent></Dialog>;
}

export function FleetSettlement({c,batch,onClose}:{c:Connection;batch:FleetBatch;onClose:()=>void}){
 const [fees,setFees]=useState(batch.processor_fee==null?'':String(batch.processor_fee)),[discount,setDiscount]=useState(batch.statement_discount==null?'':String(batch.statement_discount)),[received,setReceived]=useState(batch.actual_deposit==null?'':String(batch.actual_deposit)),[date,setDate]=useState(batch.settlement_date??c.q.data!.today),[reference,setReference]=useState(batch.settlement_reference??''),[notes,setNotes]=useState(batch.notes??'');
 const net=validMoney(fees)&&validMoney(discount)?amount(batch.fleet_sales)-Number(discount)-Number(fees):null;
 const valid=validMoney(fees)&&validMoney(discount)&&validMoney(received,true)&&!!date&&!!reference.trim();
 return <Dialog open onOpenChange={open=>{if(!open&&!c.busy)onClose();}}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>{batch.status==='OPEN'?'Record':'Edit'} Fleet Settlement</DialogTitle><DialogDescription>{batch.batch_reference} · Enter the statement details and amount received. This records settlement; it does not transfer funds.</DialogDescription></DialogHeader>
 <label>Actual fees<Input aria-label="Fleet fees" inputMode="decimal" value={fees} onChange={e=>setFees(e.target.value)}/></label>
 <label>Additional statement discount<Input aria-label="Fleet discount" inputMode="decimal" value={discount} onChange={e=>setDiscount(e.target.value)}/></label>
 <p className="text-sm">Expected deposit: {fmt(net)}. Enter only a discount deducted on the statement, not a discount already applied at the register.</p>
 <label>Amount received<Input aria-label="Fleet amount received" inputMode="decimal" value={received} onChange={e=>setReceived(e.target.value)}/></label>
 <label>Settlement date<Input aria-label="Fleet settlement date" type="date" min={batch.business_date} max={c.q.data!.today} value={date} onChange={e=>setDate(e.target.value)}/></label>
 <label>Settlement reference<Input aria-label="Fleet settlement reference" maxLength={160} value={reference} onChange={e=>setReference(e.target.value)}/></label>
 <label>Notes<Input aria-label="Fleet settlement notes" maxLength={2000} value={notes} onChange={e=>setNotes(e.target.value)}/></label>
 {c.error&&<p role="alert" className="text-destructive">{c.error}</p>}<DialogFooter><Button variant="outline" disabled={c.busy} onClick={onClose}>Cancel</Button><Button disabled={c.busy||!valid} onClick={()=>void c.mutate(`/batches/${batch.batch_id}/settlement`,{version:batch.version,fees:Number(fees),discount:Number(discount),actualDeposit:Number(received),date,reference,notes},'PUT').then(onClose).catch(()=>{})}>Save Settlement</Button></DialogFooter>
 </DialogContent></Dialog>;
}

export function FleetReconcile({c,batch,onClose}:{c:Connection;batch:FleetBatch;onClose:()=>void}){
 const [note,setNote]=useState('');const diff=variance(batch);
 return <Dialog open onOpenChange={open=>{if(!open&&!c.busy)onClose();}}><DialogContent><DialogHeader><DialogTitle>Reconcile Fleet Batch</DialogTitle><DialogDescription>{batch.batch_reference} · Reconciliation locks this batch against further edits.</DialogDescription></DialogHeader>
 <p>Expected: {fmt(expected(batch))} · Received: {fmt(batch.actual_deposit==null?null:amount(batch.actual_deposit))} · Difference: {fmt(diff)}</p>
 <label>Review note{diff!==0?' (required for this difference)':''}<Input aria-label="Fleet review note" maxLength={1000} value={note} onChange={e=>setNote(e.target.value)}/></label>
 {c.error&&<p role="alert" className="text-destructive">{c.error}</p>}<DialogFooter><Button variant="outline" disabled={c.busy} onClick={onClose}>Cancel</Button><Button disabled={c.busy||diff!==0&&!note.trim()} onClick={()=>void c.mutate(`/batches/${batch.batch_id}/reconcile`,{version:batch.version,note}).then(onClose).catch(()=>{})}>Confirm Reconciliation</Button></DialogFooter>
 </DialogContent></Dialog>;
}
