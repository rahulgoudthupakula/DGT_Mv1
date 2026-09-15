import {useEffect,useState} from 'react';
import {X,Lock} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {Drawer,DrawerContent,DrawerHeader,DrawerTitle,DrawerFooter} from '@/components/ui/drawer';
import {request} from '@/lib/backend';
import {type AdjustmentRecord,reasonLabel,statusLabel} from './gasAdjustmentData';
import {statusColors} from './AdjustmentListTable';
import {toast} from 'sonner';
export const AdjustmentDetailDrawer=({record,open,onOpenChange,path,onSaved,onEdit}:{record:AdjustmentRecord|null;open:boolean;onOpenChange:(v:boolean)=>void;path:string;onSaved:()=>void;onEdit:(r:AdjustmentRecord)=>void})=>{
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[reason,setReason]=useState(''),[reject,setReject]=useState(false);
 useEffect(()=>{setError('');setReason('');setReject(false);},[record?.id,open]);if(!record)return null;
 const locked=['POSTED','REJECTED'].includes(record.status);
 const decide=async(action:'approve'|'reject')=>{if(busy)return;if(action==='reject'&&!reason.trim()){setError('Enter a rejection reason.');return;}setBusy(true);setError('');try{await request(`${path}/${record.id}/${action}`,{method:'POST',headers:{'If-Match':record.version},body:JSON.stringify({reason})});toast.success(action==='approve'?'Approved and gallons recorded.':'Adjustment rejected.');onSaved();}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
 return <Drawer open={open} onOpenChange={v=>{if(!busy)onOpenChange(v);}}><DrawerContent className="max-h-[92vh]"><DrawerHeader className="flex items-center justify-between border-b pb-3"><div className="flex items-center gap-2"><DrawerTitle className="text-base">Adjustment ADJ-{record.id}</DrawerTitle><span className={`text-xs rounded-full px-2 py-1 ${statusColors[record.status]}`}>{statusLabel[record.status]}</span>{locked&&<Lock className="h-3.5 w-3.5"/>}</div><Button aria-label="Close details" variant="ghost" size="icon" disabled={busy} onClick={()=>onOpenChange(false)}><X className="h-4 w-4"/></Button></DrawerHeader>
 <div className="p-4 space-y-4 overflow-y-auto">{error&&<p role="alert" className="text-destructive text-sm">{error}</p>}<p className="text-xs">Date: {record.date} · Created by {record.createdBy}</p>
 {record.lines.map(l=><div key={l.id} className="rounded-lg border p-3 space-y-2 text-xs"><p className="font-semibold">Tank {l.tankNumber} · {l.gradeName}</p><p>System volume: {l.systemGallons.toLocaleString()} gal</p><p>Actual volume: {l.actualGallons.toLocaleString()} gal</p><p className={l.difference<0?'text-destructive':'text-emerald-600'}>Adjustment: {l.difference>0?'+':''}{l.difference.toLocaleString()} gal</p><p>Reason: {reasonLabel(l.reason)}</p></div>)}
 {record.notes&&<p className="text-xs whitespace-pre-wrap">Notes: {record.notes}</p>}{record.reviewedAt&&<p className="text-xs">Reviewed by {record.reviewedBy} · {new Date(record.reviewedAt).toLocaleString()}</p>}{record.rejectionReason&&<p className="text-xs text-destructive">Rejection reason: {record.rejectionReason}</p>}{record.status==='POSTED'&&<p className="text-xs">Approved gallons are recorded in inventory movements.</p>}
 {reject&&<label className="text-xs block">Rejection reason<Textarea aria-label="Rejection reason" maxLength={1000} value={reason} onChange={e=>setReason(e.target.value)}/></label>}</div>
 {!locked&&<DrawerFooter className="border-t"><div className="flex gap-2">{record.canEdit&&<Button variant="outline" disabled={busy} onClick={()=>onEdit(record)}>Edit Adjustment</Button>}{record.status==='PENDING'&&record.canApprove&&(reject?<><Button variant="outline" disabled={busy} onClick={()=>setReject(false)}>Cancel</Button><Button variant="destructive" disabled={busy} onClick={()=>decide('reject')}>Confirm Rejection</Button></>:<><Button variant="outline" disabled={busy} onClick={()=>setReject(true)}>Reject</Button><Button disabled={busy} onClick={()=>decide('approve')}>Approve</Button></>)}</div></DrawerFooter>}
 </DrawerContent></Drawer>;
};
