import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Droplets,Download} from 'lucide-react';
import {request} from '@/lib/backend';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {AdjustmentAlerts} from './AdjustmentAlerts';
import {AdjustmentListTable} from './AdjustmentListTable';
import {NewAdjustmentDrawer} from './NewAdjustmentDrawer';
import {AdjustmentDetailDrawer} from './AdjustmentDetailDrawer';
import {type AdjustmentData,type AdjustmentRecord,reasons,statusLabel,exportAdjustments} from './gasAdjustmentData';
export const GasInventoryAdjustmentPage=({storeId}:{storeId:string})=>{
 const path=`/access/stores/${encodeURIComponent(storeId)}/gas-adjustments`;
 const q=useQuery({queryKey:['gas-adjustments',storeId],queryFn:()=>request<AdjustmentData>(path),refetchOnWindowFocus:true});
 const [start,setStart]=useState(''),[end,setEnd]=useState(''),[fuel,setFuel]=useState('all'),[reason,setReason]=useState('all'),[status,setStatus]=useState('all');
 const [editing,setEditing]=useState<AdjustmentRecord|null>(null),[open,setOpen]=useState(false),[detail,setDetail]=useState<AdjustmentRecord|null>(null);
 if(q.isPending)return <p>Loading gas adjustments…</p>;
 if(q.error)return <p role="alert">{q.error.message} <Button onClick={()=>q.refetch()}>Retry</Button></p>;
 const data=q.data!;const invalid=!!(start&&end&&start>end);
 const filtered=data.records.filter(r=>(!start||r.date>=start)&&(!end||r.date<=end)&&(status==='all'||r.status===status)&&r.lines.some(l=>(fuel==='all'||l.gradeId===fuel)&&(reason==='all'||l.reason===reason)));
 const pending=data.records.filter(r=>r.status==='PENDING').length;
 const grades=new Map<string,string>();data.tanks.forEach(t=>{if(t.gradeId)grades.set(t.gradeId,t.gradeName!);});data.records.forEach(r=>r.lines.forEach(l=>grades.set(l.gradeId,l.gradeName)));
 const saved=()=>{setOpen(false);setDetail(null);void q.refetch();};
 return <div className="space-y-6">
 <div className="flex items-center justify-between"><h1 className="text-xl font-bold">Gas Inventory Adjustment</h1><div className="flex gap-2">
 {data.canEdit&&<Button size="sm" className="gap-1.5 text-xs" onClick={()=>{setEditing(null);setOpen(true);}}><Droplets className="h-3.5 w-3.5"/>New Adjustment</Button>}
 <Button size="sm" variant="outline" className="gap-1.5 text-xs" disabled={invalid||!filtered.length} onClick={()=>exportAdjustments(filtered)}><Download className="h-3.5 w-3.5"/>Export</Button></div></div>
 <div className="flex gap-3 flex-wrap pb-4 border-b border-border items-end">
 <label className="text-xs">From<Input type="date" aria-label="From date" className="h-8 w-40" value={start} onChange={e=>setStart(e.target.value)}/></label>
 <label className="text-xs">To<Input type="date" aria-label="To date" className="h-8 w-40" value={end} onChange={e=>setEnd(e.target.value)}/></label>
 <select aria-label="Fuel filter" className="border rounded-md bg-background h-8 px-2 text-xs" value={fuel} onChange={e=>setFuel(e.target.value)}><option value="all">All Fuels</option>{[...grades].map(([id,name])=><option key={id} value={id}>{name}</option>)}</select>
 <select aria-label="Reason filter" className="border rounded-md bg-background h-8 px-2 text-xs" value={reason} onChange={e=>setReason(e.target.value)}><option value="all">All Reasons</option>{reasons.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select>
 <select aria-label="Status filter" className="border rounded-md bg-background h-8 px-2 text-xs" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All Statuses</option>{Object.entries(statusLabel).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select>
 {(start||end||fuel!=='all'||reason!=='all'||status!=='all')&&<Button variant="ghost" size="sm" onClick={()=>{setStart('');setEnd('');setFuel('all');setReason('all');setStatus('all');}}>Clear filters</Button>}</div>
 {invalid&&<p role="alert">End date must be on or after the start date.</p>}
 <AdjustmentAlerts pending={pending}/>
 <p className="text-xs text-muted-foreground">Recorded gallons use measured tank readings and saved movements. POS sales are not connected yet.</p>
 <AdjustmentListTable records={invalid?[]:filtered} onViewRecord={setDetail}/>
 {open&&<NewAdjustmentDrawer open={open} onOpenChange={setOpen} path={path} record={editing} onSaved={saved}/>}
 <AdjustmentDetailDrawer record={detail} open={!!detail} onOpenChange={v=>{if(!v)setDetail(null);}} path={path} onSaved={saved} onEdit={r=>{setDetail(null);setEditing(r);setOpen(true);}}/>
 </div>;
};
