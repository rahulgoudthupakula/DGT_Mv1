import { EmployeeAccessPanel } from "./EmployeeAccessPanel";
import { useState } from "react";
import { useQuery,useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/backend";
import { Card,CardHeader,CardTitle,CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table,TableBody,TableCell,TableHead,TableHeader,TableRow } from "@/components/ui/table";
import { useStoreAccess } from "@/lib/store-access";
type Assignment={user_id:number;role_type_id:number;user_role_id:number;email:string;role_type_name:string;is_active:boolean;version:string};
type Permission={user_role_id:number;module_id:number;can_view:boolean;can_edit:boolean;version:string};
type Module={module_id:number;module_name:string};
type Policy={module_id:number;manager_requires_admin:boolean;version:string};
type Data={users:{user_id:number;email:string}[];roles:{role_type_id:number;role_type_name:string}[];assignments:Assignment[];permissions:Permission[];modules:Module[];policies:Policy[]};
type Approval={target_name?:string|null;request_id:number;requester_email:string;operation_code:string;target_id:string|null;status:string;can_review:boolean;proposed_values:unknown;expected_versions:unknown;review_note:string|null};
const labels:Record<string,string>={store:"Store",store_name:"Store / DBA name",store_id:"Store ID",legal_business_name:"Legal business name",tax_id:"Tax ID",license_number:"License number",timezone:"Timezone",contact:"Contact",address:"Address",phone_number:"Phone",email:"Store Email ID",hours:"Business hours",day_of_week:"Day",status:"Schedule",open_time:"Opening time",close_time:"Closing time",name:"Department name",active:"Active"};
function ChangeValues({value}:{value:unknown}){
 if(value===null||value===undefined)return <span>Blank</span>;
 if(Array.isArray(value))return <ul className="space-y-2">{value.map((v,i)=><li key={i}><ChangeValues value={v}/></li>)}</ul>;
 if(typeof value==='object')return <dl className="space-y-1">{Object.entries(value).filter(([k])=>!['contactVersion','hoursVersions','_version'].includes(k)).map(([k,v])=><div key={k} className="pl-3"><dt className="font-medium">{labels[k]??k}</dt><dd><ChangeValues value={v}/></dd></div>)}</dl>;
 return <span>{typeof value==='boolean'?(value?'Yes':'No'):String(value)}</span>;
}
export function RolePermissionsPanel({storeId}:{storeId:string}){
 const client=useQueryClient();const context=useStoreAccess(storeId);const admin=context.data?.admin===true;
 const base=`/access/stores/${encodeURIComponent(storeId)}`;
 const query=useQuery({queryKey:["permissions",storeId],queryFn:()=>request<Data>(base+"/permissions"),enabled:!!storeId&&admin});
 const queue=useQuery({queryKey:["approvals",storeId],queryFn:()=>request<Approval[]>(base+"/approvals"),enabled:!!storeId});
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 async function perform(path:string,body:unknown,method="PUT"){
  setBusy(true);setError("");try{await request(base+path,{method,body:JSON.stringify(body)});await Promise.all([client.invalidateQueries({queryKey:["permissions",storeId]}),client.invalidateQueries({queryKey:["approvals",storeId]}),client.invalidateQueries({queryKey:["store-access",storeId]}),client.invalidateQueries({queryKey:["department-access",storeId]}),client.invalidateQueries({queryKey:["backend-store",storeId]})]);}
  catch(e){setError(e instanceof Error?e.message:"Could not save");await client.invalidateQueries({queryKey:["permissions",storeId]});}finally{setBusy(false);}
 }
 return <>
 <Card><CardHeader><CardTitle className="text-lg">Roles &amp; Permissions</CardTitle></CardHeader><CardContent className="space-y-4">
 {context.error&&<p role="alert">{context.error.message}</p>}
 {!admin&&<p>Only your company administrator can manage permissions. Your approval requests are listed below.</p>}
 {admin&&query.isPending&&<p>Loading permissions…</p>}
 {query.error&&<p role="alert">{query.error.message}<Button onClick={()=>query.refetch()}>Retry</Button></p>}
 {admin&&query.data&&<>
 <p className="text-sm text-muted-foreground">Admin has full access within their company. Users inherit permissions from their role in this store. Edit permissions in the role tables below. Accountants start read-only; cashier and accountant edits require approval.</p>
 <EmployeeAccessPanel key={storeId} storeId={storeId} roles={query.data.roles}/>
 <p className="font-medium">Manager approval settings</p>
 {query.data.modules.map(m=>{const policy=query.data!.policies.find(p=>p.module_id===m.module_id);return <label key={m.module_id} className="flex items-center gap-2 text-sm"><Checkbox aria-label={`${m.module_name} manager approval`} checked={policy?.manager_requires_admin??false} disabled={busy} onCheckedChange={v=>perform('/approval-policy',{moduleId:m.module_id,required:v===true,version:policy?.version??'0'})}/>{m.module_name==='STORE_SETTINGS'?'Store Account Overview':'Department Access'} requires admin approval for manager changes</label>;})}
 <p className="text-xs text-muted-foreground">Manager approval settings apply to all stores in this company. Changes save immediately.</p>
 </>}
 {error&&<p role="alert" className="text-destructive">{error}</p>}
 </CardContent></Card>
 <Card><CardHeader><CardTitle className="text-lg">Change Approvals</CardTitle></CardHeader><CardContent className="space-y-3">
 <Button variant="outline" onClick={()=>queue.refetch()}>Refresh requests</Button>
 {queue.isPending&&<p>Loading requests…</p>}{queue.error&&<p role="alert">{queue.error.message}</p>}
 {queue.data?.length===0&&<p>No requests.</p>}
 {queue.data?.map(a=><div key={a.request_id} className="border rounded p-3 space-y-2"><p>#{a.request_id} · {a.requester_email} · {a.operation_code==='STORE_SETTINGS'?'Store settings':a.operation_code==='DEPARTMENT_CREATE'?'Add department':'Department status'} · {a.status}</p>{a.target_name&&<p>Department: {a.target_name}</p>}<details><summary className="cursor-pointer">Review proposed changes</summary><div className="text-sm mt-2"><ChangeValues value={a.proposed_values}/></div></details>{a.review_note&&<p>{a.review_note}</p>}
 {a.status==='PENDING'&&<div className="flex gap-2">{a.can_review?<><Button disabled={busy} onClick={()=>perform(`/approvals/${a.request_id}/decision`,{decision:'APPROVED'},'POST')}>Approve</Button><Button variant="outline" disabled={busy} onClick={()=>perform(`/approvals/${a.request_id}/decision`,{decision:'REJECTED'},'POST')}>Reject</Button></>:<Button variant="outline" disabled={busy} onClick={()=>perform(`/approvals/${a.request_id}/decision`,{decision:'CANCELLED'},'POST')}>Cancel request</Button>}</div>}</div>)}
 </CardContent></Card>
 </>;
}
