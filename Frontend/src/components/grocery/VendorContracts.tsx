import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import {Card,CardHeader,CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Badge} from '@/components/ui/badge';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Table,TableHeader,TableHead,TableBody,TableRow,TableCell} from '@/components/ui/table';
import {Plus,FileText,Pencil} from 'lucide-react';
type Contract={id:number;version:string;returnPolicy:string|null;vendorId:number;vendorName:string;contractType:string;contractNumber:string|null;startDate:string|null;endDate:string|null;volumeThreshold:number|null;discountValue:number|null;discountType:string|null;returnWindowDays:number|null;status:string};
const empty={vendorId:'',contractType:'',startDate:'',endDate:'',discountValue:'',discountType:'',returnWindowDays:'',returnPolicy:'',status:'Draft'};
function returnTerms(days:number|null,policy:string|null){
 const text=policy?.trim()??'';
 if(days==null)return text;
 // Older entries may already contain the window; display the saved numeric window once.
 const description=text.replace(/^\d+\s+days?\b\s*[,;:–—-]?\s*/i,'');
 return [`${days} ${days===1?'day':'days'}`,description].filter(Boolean).join(', ');
}
export function VendorContracts({storeId,vendors}:{storeId:string;vendors:{id:string;name:string;active?:boolean}[]}){
 const path=`/access/stores/${encodeURIComponent(storeId)}/vendors/contracts`,client=useQueryClient();
 const query=useQuery({queryKey:['vendor-contracts',storeId],queryFn:()=>request<{discountTypes:{value:string;label:string}[];types:string[];contracts:Contract[]}>(path)});
 const [open,setOpen]=useState(false),[form,setForm]=useState(empty),[editing,setEditing]=useState<Contract|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 function change(key:keyof typeof empty,value:string){setForm(f=>({...f,[key]:value}));}
 function show(c:Contract){setForm({vendorId:String(c.vendorId),contractType:c.contractType??'',startDate:c.startDate??'',endDate:c.endDate??'',discountValue:c.discountValue==null?'':String(c.discountValue),discountType:c.discountType??'',returnWindowDays:c.returnWindowDays==null?'':String(c.returnWindowDays),returnPolicy:c.returnPolicy??'',status:c.status??'Draft'});setEditing(c);setError('');setOpen(true);}
 async function save(){setBusy(true);setError('');try{await request(editing?`${path}/${editing.id}`:path,{method:editing?'PUT':'POST',headers:editing?{'If-Match':editing.version}:{},body:JSON.stringify({...form,vendorId:Number(form.vendorId),startDate:form.startDate||null,endDate:form.endDate||null,discountValue:form.discountValue===''?null:Number(form.discountValue),discountType:form.discountType||null,returnWindowDays:form.returnWindowDays===''?null:Number(form.returnWindowDays)})});await client.invalidateQueries({queryKey:['vendor-contracts',storeId]});setOpen(false);}catch(e){setError(e instanceof Error?e.message:'Could not save contract');}finally{setBusy(false);}}
 const selectClass='w-full border rounded-md p-2 bg-background';
 return <><Card><CardHeader><div className="flex items-center justify-between"><CardTitle>Vendor Contracts &amp; Terms</CardTitle><Button size="sm" disabled={!query.data} onClick={()=>{setForm(empty);setEditing(null);setError('');setOpen(true);}}><Plus className="h-4 w-4 mr-2"/>Add Contract</Button></div></CardHeader>
 {query.isPending&&<p className="p-4">Loading contracts…</p>}{query.error&&<p className="p-4" role="alert">{query.error.message}</p>}
 <Table><TableHeader><TableRow>{['Vendor','Contract Type','Start Date','End Date','Volume Discount','Rebate Linkage','Return Policy','Status','Actions'].map(h=><TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>
 {query.data?.contracts.map(c=><TableRow key={c.id}><TableCell className="font-medium">{c.vendorName}</TableCell><TableCell>{c.contractType}</TableCell><TableCell>{c.startDate}</TableCell><TableCell>{c.endDate}</TableCell><TableCell>{c.discountValue==null?'':c.discountType==='PERCENT'?`${c.discountValue}%`:`$${c.discountValue.toFixed(2)}`}</TableCell><TableCell/><TableCell>{returnTerms(c.returnWindowDays,c.returnPolicy)}</TableCell><TableCell><Badge variant="outline" className={c.status==='Active'?'border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300':c.status.startsWith('Pending')?'border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300':c.status==='Expired'?'border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300':''}>{c.status}</Badge></TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="sm" disabled title="Agreement document viewing is not enabled yet"><FileText className="h-4 w-4 mr-1"/>View</Button><Button variant="ghost" size="sm" onClick={()=>show(c)}><Pencil className="h-4 w-4 mr-1"/>Edit</Button></div></TableCell></TableRow>)}
 {query.data?.contracts.length===0&&<TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No contracts added for this store.</TableCell></TableRow>}
 </TableBody></Table></Card>
 <Dialog open={open} onOpenChange={v=>{if(!busy)setOpen(v);}}><DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editing?'Edit Contract':'Add Contract'}</DialogTitle><DialogDescription>Vendor contract details for this store.</DialogDescription></DialogHeader>
 <fieldset disabled={busy} className="space-y-4">
 <Label>Vendor<select className={selectClass} value={form.vendorId} onChange={e=>change('vendorId',e.target.value)}><option value="">Select vendor</option>{vendors.filter(v=>v.active||String(v.id)===form.vendorId).map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></Label>
 <Label>Contract Type<select className={selectClass} value={form.contractType} onChange={e=>change('contractType',e.target.value)}><option value="">Select contract type</option>{query.data?.types.map(t=><option key={t}>{t}</option>)}</select></Label>
 <div className="grid grid-cols-2 gap-4"><Label>Start Date<Input type="date" value={form.startDate} onChange={e=>change('startDate',e.target.value)}/></Label><Label>End Date<Input type="date" value={form.endDate} onChange={e=>change('endDate',e.target.value)}/></Label></div>
 <div className="grid grid-cols-2 gap-4"><Label>Discount Type<select className={selectClass} value={form.discountType} onChange={e=>change('discountType',e.target.value)}><option value="">None</option>{query.data?.discountTypes.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></Label><Label htmlFor="contract-volume-discount">Volume Discount<Input id="contract-volume-discount" type="number" min="0" step="0.01" value={form.discountValue} onChange={e=>change('discountValue',e.target.value)}/></Label></div>
 <Label>Return Window (days)<Input type="number" min="0" step="1" value={form.returnWindowDays} onChange={e=>change('returnWindowDays',e.target.value)}/></Label>
 <Label>Return Policy Type<Input maxLength={1000} placeholder="e.g. full refund, store credit, or no returns" value={form.returnPolicy} onChange={e=>change('returnPolicy',e.target.value)}/></Label>
 <Label>Rebate Linkage<Input disabled value=""/></Label>
 <Label>Vendor Contract Agreement Document<Input disabled type="file"/></Label>
 <Label>Status<select className={selectClass} value={form.status} onChange={e=>change('status',e.target.value)}>{['Draft','Active','Pending','Pending Renewal','Expired','Cancelled'].map(s=><option key={s}>{s}</option>)}</select></Label>
 </fieldset>{error&&<p role="alert">{error}</p>}<div className="flex gap-2">{<Button disabled={busy||!form.vendorId||!form.contractType} onClick={save}>{busy?'Saving…':editing?'Save Changes':'Save Contract'}</Button>}<Button variant="outline" disabled={busy} onClick={()=>setOpen(false)}>Cancel</Button></div>
 </DialogContent></Dialog></>;
}
