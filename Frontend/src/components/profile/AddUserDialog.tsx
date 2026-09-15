import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listStores, request } from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

type Props = {storeId:string; roles:{role_type_id:number;role_type_name:string}[]};
export function AddUserDialog({storeId,roles}:Props){
 const client=useQueryClient();
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [details,setDetails]=useState({firstName:"",lastName:"",employeeId:"",email:"",password:""});
 const [roleId,setRoleId]=useState("");
 const [extraStores,setExtraStores]=useState<string[]>([]);
 const stores=useQuery({queryKey:["add-user-stores"],queryFn:listStores,enabled:open});
 const manager=roles.find(r=>String(r.role_type_id)===roleId)?.role_type_name==='MANAGER';
 async function save(e:React.FormEvent){
  e.preventDefault();setBusy(true);setError("");
  try{
   await request(`/access/stores/${encodeURIComponent(storeId)}/users`,{method:"POST",body:JSON.stringify({...details,roleTypeId:Number(roleId),stores:[storeId,...(manager?extraStores:[])]})});
   setDetails({firstName:"",lastName:"",employeeId:"",email:"",password:""});setRoleId("");setExtraStores([]);setOpen(false);
   await client.invalidateQueries({queryKey:["permissions",storeId]});
  }catch(e){setError(e instanceof Error?e.message:"Could not create user");}finally{setBusy(false);}
 }
 return <Dialog open={open} onOpenChange={v=>{if(!busy){setOpen(v);setError("");if(!v)setDetails(d=>({...d,password:""}));}}}>
 <DialogTrigger asChild><Button>Add User</Button></DialogTrigger>
 <DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Add User</DialogTitle><DialogDescription>Create an account and choose its store role.</DialogDescription></DialogHeader>
 <form onSubmit={save} className="space-y-4"><fieldset disabled={busy} className="space-y-4">
 {([['firstName','First name',100],['lastName','Last name',100],['employeeId','Employee ID',50],['email','Email',255],['password','Password',72]] as const).map(([key,label,max])=><label key={key} className="block text-sm">{label}<Input required maxLength={max} minLength={key==='password'?12:undefined} autoComplete={key==='password'?'new-password':undefined} type={key==='password'?'password':key==='email'?'email':'text'} value={details[key]} onChange={e=>setDetails({...details,[key]:e.target.value})}/></label>)}
 <p className="text-xs text-muted-foreground">Use a password of at least 12 characters. The user signs in with their email and this password.</p>
 <label className="block text-sm">Role<select required className="block w-full border rounded p-2 bg-background" value={roleId} onChange={e=>{setRoleId(e.target.value);setExtraStores([]);}}><option value="">Select role</option>{roles.map(r=><option key={r.role_type_id} value={r.role_type_id}>{r.role_type_name}</option>)}</select></label>
 <p className="text-sm">Store: {stores.data?.find(s=>s.dgt_id===storeId)?.store_name??storeId} ({storeId})</p>
 {manager&&<div className="space-y-2"><p className="text-sm">Additional stores (each store’s role permissions apply)</p>{stores.isPending&&<p>Loading stores…</p>}{stores.error&&<p role="alert">{stores.error.message}</p>}{stores.data?.filter(s=>s.dgt_id!==storeId).map(s=><label key={s.dgt_id} className="flex items-center gap-2 text-sm"><Checkbox checked={extraStores.includes(s.dgt_id)} onCheckedChange={v=>setExtraStores(old=>v===true?[...old,s.dgt_id]:old.filter(id=>id!==s.dgt_id))}/>{s.store_name} ({s.dgt_id})</label>)}</div>}
 <p className="text-xs text-muted-foreground">This user inherits the permissions set for their role in each assigned store. Cashier and accountant changes require approval.</p>
 {error&&<p role="alert" className="text-destructive">{error}</p>}
 <Button type="submit" disabled={busy||!roleId}>{busy?'Creating…':'Create User'}</Button>
 </fieldset></form></DialogContent></Dialog>;
}
