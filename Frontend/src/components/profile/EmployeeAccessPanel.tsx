import {useState} from 'react';
import {Plus} from 'lucide-react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Table,TableHeader,TableRow,TableHead,TableBody,TableCell} from '@/components/ui/table';
type Employee={email:string|null;role_type_id:number|null;job_role:string;employee_id:number;user_id:number|null;first_name:string;last_name:string;admin:boolean;version:string};
export function EmployeeAccessPanel({storeId,roles}:{storeId:string;roles:{role_type_id:number;role_type_name:string}[]}){
 const client=useQueryClient(),path=`/access/stores/${encodeURIComponent(storeId)}/employee-access`;
 const query=useQuery({queryKey:['employee-access',storeId],queryFn:()=>request<Employee[]>(path)});
 const [selected,setSelected]=useState<Employee|null>(null),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[role,setRole]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const stores=client.getQueryData<{dgt_id:string;store_name:string}[]>(['backend-stores']);
 const storeName=stores?.find(s=>s.dgt_id===storeId)?.store_name;
 function open(e:Employee){if(e.admin)return;setSelected(e);setEmail(e.email??'');setPassword('');setRole(e.role_type_id?String(e.role_type_id):'');setError('');}
 async function save(){if(!selected)return;setBusy(true);setError('');try{await request(`${path}/${selected.employee_id}`,{method:'PUT',body:JSON.stringify({email,password:selected.user_id?null:password,roleTypeId:Number(role),active:true,version:selected.version})});setSelected(null);setPassword('');await Promise.all([client.invalidateQueries({queryKey:['employee-access']}),client.invalidateQueries({queryKey:['workweek-employees']}),client.invalidateQueries({queryKey:['permissions']}),client.invalidateQueries({queryKey:['store-access']})]);}catch(e){setError(e instanceof Error?e.message:'Could not create user');}finally{setBusy(false);}}
 return <div className="space-y-3"><p className="font-medium">Employee website access</p><p className="text-sm text-muted-foreground">Add a user account only for employees who need website access.</p>{query.isPending&&<p>Loading employees…</p>}{query.error&&<p role="alert">{query.error.message}</p>}
 <Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Employee Name</TableHead><TableHead>Job Roles</TableHead><TableHead>Add User</TableHead></TableRow></TableHeader><TableBody>{query.data?.map((e,index)=><TableRow key={e.employee_id}><TableCell>{index+1}</TableCell><TableCell>{e.first_name} {e.last_name}</TableCell><TableCell>{e.job_role}</TableCell><TableCell><Button variant={!e.admin&&!e.user_id?"default":"outline"} className={!e.admin&&!e.user_id?"rounded-xl px-5 gap-2":undefined} disabled={e.admin} onClick={()=>open(e)}>{!e.admin&&!e.user_id&&<Plus className="h-5 w-5" aria-hidden="true"/>}{e.admin?'Admin':e.user_id?'Edit User':'Add User'}</Button></TableCell></TableRow>)}</TableBody></Table>
 {query.data?.length===0&&<p>No employees assigned. Add employees in Workweek first.</p>}
 <Dialog open={!!selected} onOpenChange={v=>{if(!v&&!busy){setSelected(null);setPassword('');}}}><DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{selected?.user_id?'Edit User':'Add User'}</DialogTitle><DialogDescription>Create website access for {selected?.first_name} {selected?.last_name}.</DialogDescription></DialogHeader>
 <label>Employee ID<Input readOnly value={selected?.employee_id??''}/></label>
 <label>Email<Input type="email" disabled={busy||!!selected?.user_id} value={email} onChange={e=>setEmail(e.target.value)}/></label>
 <label>Password<Input type="password" autoComplete="new-password" value={password} placeholder={selected?.user_id?"Existing password unchanged":""} disabled={busy||!!selected?.user_id} onChange={e=>setPassword(e.target.value)}/></label>
 <p className="text-sm text-muted-foreground">{selected?.user_id?'This employee already has a login. This form sets their store role using that account; email and password stay unchanged.':'Use a password of at least 12 characters. The user signs in with their email and this password.'}</p>
 <label>Role<select className="border rounded p-2 w-full bg-background" disabled={busy} value={role} onChange={e=>setRole(e.target.value)}><option value="">Select role</option>{roles.map(r=><option key={r.role_type_id} value={r.role_type_id}>{r.role_type_name}</option>)}</select></label>
 <p>Store: {storeName?`${storeName} (${storeId})`:storeId}</p><p className="text-sm text-muted-foreground">This user inherits the permissions set for their website role in this store.</p>
 {error&&<p role="alert">{error}</p>}<div className="flex gap-2"><Button disabled={busy||!role||!email.trim()||(!selected?.user_id&&password.length<12)} onClick={save}>{selected?.user_id?'Save Changes':'Create User'}</Button><Button variant="outline" disabled={busy} onClick={()=>{setSelected(null);setPassword('');}}>Cancel</Button></div></DialogContent></Dialog></div>;
}
