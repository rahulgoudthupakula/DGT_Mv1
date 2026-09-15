import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/backend";
import { useStoreAccess } from "@/lib/store-access";
import { Card,CardHeader,CardTitle,CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table,TableHeader,TableHead,TableBody,TableRow,TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
type Data={actions:{code:string;label:string;group:string;implemented:boolean}[];roles:{role_type_id:number;role_type_name:string}[];permissions:{role_type_id:number;permission_code:string;allowed:boolean;version:string}[]};
type Change={roleTypeId:number;code:string;allowed:boolean;version:string};
export function StoreRoleMatrix({storeId}:{storeId:string}){
 const access=useStoreAccess(storeId),client=useQueryClient();const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const [editing,setEditing]=useState<string|null>(null);const [draft,setDraft]=useState<Change[]>([]);
 const path=`/access/stores/${encodeURIComponent(storeId)}/role-permissions`;
 const query=useQuery({queryKey:['role-permissions',storeId],queryFn:()=>request<Data>(path),enabled:!!storeId&&access.data?.admin===true});
 function start(group:string){const data=query.data!;setDraft(data.actions.filter(a=>a.group===group).flatMap(a=>data.roles.filter(r=>!["PRICE_BOOK_ACCESS","GROCERY_APPROVE_PO","GROCERY_SETTINGS","GAS_SETTINGS"].includes(a.code)||r.role_type_name==="MANAGER").map(r=>{const p=data.permissions.find(p=>p.role_type_id===r.role_type_id&&p.permission_code===a.code);return {roleTypeId:r.role_type_id,code:a.code,allowed:p?.allowed??false,version:p?.version??'0'};})));setEditing(group);setError('');}
 function change(roleTypeId:number,code:string,allowed:boolean){setDraft(old=>old.map(c=>{if(c.roleTypeId!==roleTypeId)return c;if(c.code===code)return {...c,allowed};if(code.endsWith('_EDIT')&&allowed&&c.code===code.replace('_EDIT','_VIEW'))return {...c,allowed:true};if(code.endsWith('_VIEW')&&!allowed&&c.code===code.replace('_VIEW','_EDIT'))return {...c,allowed:false};return c;}));}
 async function save(){setBusy(true);setError('');try{const data=await request<Data>(path+'/batch',{method:'PUT',body:JSON.stringify({changes:draft})});client.setQueryData(['role-permissions',storeId],data);setEditing(null);setDraft([]);await client.invalidateQueries({queryKey:['store-access',storeId]});}catch(e){setError(e instanceof Error?e.message:'Could not save');}finally{setBusy(false);}}
 function cancel(){setEditing(null);setDraft([]);setError('');void query.refetch();}
 if(!access.data?.admin)return null;
 return <>{query.isPending&&<p>Loading role permissions…</p>}{query.error&&<p role="alert">{query.error.message}<Button onClick={()=>query.refetch()}>Retry</Button></p>}{error&&<p role="alert" className="text-destructive">{error}</p>}
 {query.data&&['Store Permissions','Price Book Permissions','Grocery Permissions','Gas Permissions','Lottery Permissions'].map(group=><Card key={group}><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-lg">{group}</CardTitle>{editing!==group&&<Button variant="outline" disabled={editing!==null||busy} onClick={()=>start(group)}>Edit</Button>}</CardHeader><CardContent>
 <Table><TableHeader><TableRow><TableHead>Permission</TableHead><TableHead className="text-center">Admin</TableHead>{query.data!.roles.map(r=><TableHead key={r.role_type_id} className="text-center">{r.role_type_name.charAt(0)+r.role_type_name.slice(1).toLowerCase()}</TableHead>)}</TableRow></TableHeader><TableBody>
 {query.data!.actions.filter(a=>a.group===group).map(a=><TableRow key={a.code}><TableCell>{a.label}</TableCell><TableCell className="text-center"><Checkbox checked disabled aria-label={`Admin ${a.label}`}/></TableCell>{query.data!.roles.map(r=>{const p=query.data!.permissions.find(p=>p.role_type_id===r.role_type_id&&p.permission_code===a.code);if(["PRICE_BOOK_ACCESS","GROCERY_APPROVE_PO","GROCERY_SETTINGS","GAS_SETTINGS"].includes(a.code)&&r.role_type_name!=="MANAGER")return <TableCell key={r.role_type_id} className="text-center">No access</TableCell>;return <TableCell key={r.role_type_id} className="text-center"><Checkbox aria-label={`${r.role_type_name} ${a.label}`} checked={editing===group?(draft.find(c=>c.roleTypeId===r.role_type_id&&c.code===a.code)?.allowed??false):(p?.allowed??false)} disabled={busy||editing!==group} onCheckedChange={v=>change(r.role_type_id,a.code,v===true)}/></TableCell>;})}</TableRow>)}
 </TableBody></Table><p className="mt-3 text-xs text-muted-foreground">Saved preferences apply to everyone with that role in this store, including new users. Admin has full access.</p>
 {group!=='Store Permissions'&&group!=='Price Book Permissions'&&group!=='Gas Permissions'&&<p className="mt-2 text-xs text-muted-foreground">These settings are saved for this store. {group.split(' ')[0]} actions are not implemented in this preview yet; selecting them does not enable those screens.</p>}
 {editing===group&&<div className="flex gap-2 mt-4"><Button disabled={busy} onClick={save}>{busy?'Saving…':'Save Preferences'}</Button><Button variant="outline" disabled={busy} onClick={cancel}>Cancel</Button></div>}
 </CardContent></Card>)}</>;
}
