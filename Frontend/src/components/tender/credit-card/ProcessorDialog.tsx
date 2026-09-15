import {useState} from 'react';
import {useCards,type Processor} from './creditCardData';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
export function ProcessorDialog({processor,onClose}:{processor:Processor|null;onClose:()=>void}){
 const c=useCards();const [name,setName]=useState(processor?.processor_name??''),[active,setActive]=useState(processor?.is_active??true),[frequency,setFrequency]=useState(processor?.settlement_frequency??'DAILY'),[delay,setDelay]=useState(String(processor?.deposit_delay_days??1)),[destination,setDestination]=useState(processor?.settlement_destination??'BANK'),[label,setLabel]=useState(processor?.destination_label??'');
 return <Dialog open onOpenChange={open=>{if(!open&&!c.busy)onClose();}}><DialogContent><DialogHeader><DialogTitle>{processor?'Edit Processor':'Add Processor'}</DialogTitle><DialogDescription>Save the processor and its settlement destination for this store.</DialogDescription></DialogHeader>
 <label>Processor name<Input aria-label="Processor name" value={name} maxLength={120} onChange={e=>setName(e.target.value)}/></label><label className="flex gap-2"><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)}/>Active</label>
 <label>Settlement frequency<select aria-label="Settlement frequency" className="block border rounded-md bg-background w-full p-2" value={frequency} onChange={e=>setFrequency(e.target.value)}>{['DAILY','WEEKLY','MONTHLY'].map(v=><option key={v}>{v}</option>)}</select></label>
 <label>Deposit delay (days)<Input aria-label="Deposit delay" type="number" min="0" max="90" value={delay} onChange={e=>setDelay(e.target.value)}/></label>
 <label>Destination<select aria-label="Destination" className="block border rounded-md bg-background w-full p-2" value={destination} onChange={e=>setDestination(e.target.value)}><option value="BANK">Bank</option><option value="JOBBER">Jobber invoice credit</option></select></label>
 <label>Destination name<Input aria-label="Destination name" value={label} maxLength={160} onChange={e=>setLabel(e.target.value)}/></label>
 {c.error&&<p role="alert" className="text-destructive">{c.error}</p>}<DialogFooter><Button variant="outline" disabled={c.busy} onClick={onClose}>Cancel</Button><Button disabled={c.busy||!name.trim()||!label.trim()||!/^\d+$/.test(delay)||Number(delay)>90} onClick={()=>void c.mutate('/processors'+(processor?'/'+processor.processor_id:''),{version:processor?.version,name,active,frequency,delayDays:Number(delay),destination,destinationLabel:label},processor?'PUT':'POST').then(onClose).catch(()=>{})}>Save Processor</Button></DialogFooter></DialogContent></Dialog>;
}
