import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
type Entry={code:string;label:string;group?:string;parent?:string};
type Data={version:string;overrides:Record<string,boolean>;roleDefaults:Record<string,boolean>;effective:Record<string,boolean>;sections:Entry[];pages:Entry[];children:Entry[]};
export function EmployeePermissionDialog({storeId,employee,onClose}:{storeId:string;employee:{employee_id:number;first_name:string;last_name:string};onClose:()=>void}){
 const client=useQueryClient();const path=`/access/stores/${encodeURIComponent(storeId)}/employee-access/${employee.employee_id}/permissions`;
 const query=useQuery({queryKey:['employee-permissions',storeId,employee.employee_id],queryFn:()=>request<Data>(path)});
 const [draft,setDraft]=useState<Record<string,boolean>|null>(null),[version,setVersion]=useState<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const choices=draft??query.data?.overrides??{};
 function change(code:string,value:string){setVersion(old=>old??query.data!.version);setDraft(old=>{const next={...(old??query.data!.overrides)};if(value==='inherit')delete next[code];else next[code]=value==='allow';return next;});}
 async function save(){if(!query.data)return;setBusy(true);setError('');try{
  await request(path,{method:'PUT',body:JSON.stringify({overrides:choices,version:version??query.data.version})});
  await Promise.all([client.invalidateQueries({queryKey:['employee-permissions',storeId,employee.employee_id]}),client.invalidateQueries({queryKey:['store-access',storeId]})]);onClose();
 }catch(e){setError(e instanceof Error?e.message:'Could not save permissions');}finally{setBusy(false);}}
 function row(e:Entry,indent=false){return <div key={e.code} className={`flex items-center justify-between gap-4 border-b py-3 ${indent?'pl-6':''}`}><div><label htmlFor={`permission-${e.code}`} className="text-sm font-medium">{e.label}</label><p className="text-xs text-muted-foreground">Role default: {query.data?.roleDefaults[e.code]?'Allowed':'No access'}</p></div><select id={`permission-${e.code}`} className="border rounded-md bg-background p-2 text-sm" disabled={busy} value={Object.prototype.hasOwnProperty.call(choices,e.code)?choices[e.code]?'allow':'deny':'inherit'} onChange={event=>change(e.code,event.target.value)}><option value="inherit">Use role default</option><option value="allow">Allow</option><option value="deny">Deny</option></select></div>;}
 return <Dialog open onOpenChange={open=>{if(!open&&!busy)onClose();}}><DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Permissions: {employee.first_name} {employee.last_name}</DialogTitle><DialogDescription>Only this employee in store {storeId}. Allow or deny overrides their role default. A denied module blocks its pages; allowing a child does not enable its parent. Approval and admin-only restrictions still apply.</DialogDescription></DialogHeader>
 {query.isPending&&<p>Loading permissions…</p>}{query.error&&<p role="alert">{query.error.message}<Button onClick={()=>query.refetch()}>Retry</Button></p>}
 {query.data&&<><h3 className="font-semibold">Modules</h3>{query.data.sections.map(e=>row(e))}{[...new Set(query.data.pages.map(p=>p.group!))].map(group=><section key={group}><h3 className="font-semibold mt-4">{group}</h3>{query.data!.pages.filter(p=>p.group===group).map(p=><div key={p.code}>{row(p)}{query.data!.children.filter(c=>c.parent===p.code).map(c=>row(c,true))}</div>)}</section>)}<p className="text-sm text-muted-foreground">Use role default removes the exception. Other employees and other stores are unchanged.</p></>}
 {error&&<p role="alert" className="text-destructive">{error}</p>}<div className="flex gap-2"><Button disabled={busy||!query.data} onClick={save}>{busy?'Saving…':'Save Permissions'}</Button><Button variant="outline" disabled={busy} onClick={onClose}>Cancel</Button></div>
 </DialogContent></Dialog>;
}
