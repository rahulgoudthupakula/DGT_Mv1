import { Fragment, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/backend";
import { useStoreAccess } from "@/lib/store-access";
import { Card,CardHeader,CardTitle,CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table,TableHeader,TableHead,TableBody,TableRow,TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
type Action={code:string;label:string;group:string;implemented:boolean};
type Page=Action;
type Child={code:string;label:string;parent:string;tab:string|null;implemented:boolean};
type Data={sections:{code:string;label:string;defaultAllowed:boolean}[];actions:Action[];pages:Page[];children:Child[];roles:{role_type_id:number;role_type_name:string}[];permissions:{role_type_id:number;permission_code:string;allowed:boolean;version:string}[]};
type Change={roleTypeId:number;code:string;allowed:boolean;version:string};
const managerOnly=new Set(["PRICE_BOOK_ACCESS","GROCERY_APPROVE_PO","GROCERY_SETTINGS","GAS_SETTINGS","GAS_APPROVE_ADJUSTMENT"]);
import {sectionPermissions} from '@/lib/page-permissions';
const groups=['Store Permissions',...Object.keys(sectionPermissions).map(name=>name+' Permissions')];
export function StoreRoleMatrix({storeId}:{storeId:string}){
 const access=useStoreAccess(storeId),client=useQueryClient();const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const [editing,setEditing]=useState<string|null>(null);const [draft,setDraft]=useState<Change[]>([]);
 const path=`/access/stores/${encodeURIComponent(storeId)}/role-permissions`;
 const query=useQuery({queryKey:['role-permissions',storeId],queryFn:()=>request<Data>(path),enabled:!!storeId&&access.data?.admin===true});
 const isPage=(code:string)=>code.includes('_PAGE_');
 const defaultAllowed=(code:string)=>isPage(code)||(query.data?.sections.find(s=>s.code===code)?.defaultAllowed??false);
 function allowed(role:number,code:string){return draft.find(c=>c.roleTypeId===role&&c.code===code)?.allowed??query.data?.permissions.find(p=>p.role_type_id===role&&p.permission_code===code)?.allowed??defaultAllowed(code);}
 const groupModule:Record<string,string>=Object.fromEntries(Object.entries(sectionPermissions).map(([label,code])=>[label+' Permissions',code]));
 function start(group:string){
  const data=query.data!;
  const codes=new Set(data.actions.filter(a=>a.group===group).map(a=>a.code));
  data.pages.filter(p=>p.group===group).forEach(p=>data.children.filter(c=>c.parent===p.code).forEach(c=>codes.add(c.code)));
  setDraft([...codes].flatMap(code=>data.roles.filter(r=>!managerOnly.has(code)||r.role_type_name==='MANAGER').map(r=>{
   const p=data.permissions.find(p=>p.role_type_id===r.role_type_id&&p.permission_code===code);
   return {roleTypeId:r.role_type_id,code,allowed:p?.allowed??defaultAllowed(code),version:p?.version??'0'};
  })));setEditing(group);setError('');
 }
 function change(roleTypeId:number,code:string,allowed:boolean){setDraft(old=>old.map(c=>{
  if(c.roleTypeId!==roleTypeId)return c;if(c.code===code)return {...c,allowed};
  if(code.endsWith('_EDIT')&&allowed&&c.code===code.replace('_EDIT','_VIEW'))return {...c,allowed:true};
  if(code.endsWith('_VIEW')&&!allowed&&c.code===code.replace('_VIEW','_EDIT'))return {...c,allowed:false};return c;
 }));}
 async function save(){setBusy(true);setError('');try{
  const data=await request<Data>(path+'/batch',{method:'PUT',body:JSON.stringify({changes:draft})});
  client.setQueryData(['role-permissions',storeId],data);setEditing(null);setDraft([]);
  await client.invalidateQueries({queryKey:['store-access',storeId]});
 }catch(e){setError(e instanceof Error?e.message:'Could not save');}finally{setBusy(false);}}
 function cancel(){setEditing(null);setDraft([]);setError('');void query.refetch();}
 function cells(a:Action,group:string){return <><TableCell className="text-center"><Checkbox checked disabled aria-label={`Admin ${a.label}`}/></TableCell>{query.data!.roles.map(r=>{
  if(managerOnly.has(a.code)&&r.role_type_name!=='MANAGER')return <TableCell key={r.role_type_id} className="text-center">No access</TableCell>;
  const module=groupModule[group];
  const parent=query.data!.children.find(c=>c.code===a.code)?.parent;
  if((module&&!allowed(r.role_type_id,module))||(parent&&!allowed(r.role_type_id,parent)))return <TableCell key={r.role_type_id} className="text-center text-muted-foreground">No access</TableCell>;
  const p=query.data!.permissions.find(p=>p.role_type_id===r.role_type_id&&p.permission_code===a.code);
  return <TableCell key={r.role_type_id} className="text-center"><Checkbox aria-label={`${group} ${r.role_type_name} ${a.label}`} checked={editing===group?(draft.find(c=>c.roleTypeId===r.role_type_id&&c.code===a.code)?.allowed??false):(p?.allowed??defaultAllowed(a.code))} disabled={busy||editing!==group||(!isPage(a.code)&&!a.implemented)} onCheckedChange={v=>change(r.role_type_id,a.code,v===true)}/></TableCell>;
 })}</>;}
 if(!access.data?.admin)return null;
 return <>{query.isPending&&<p>Loading role permissions…</p>}{query.error&&<p role="alert">{query.error.message}<Button onClick={()=>query.refetch()}>Retry</Button></p>}{error&&<p role="alert" className="text-destructive">{error}</p>}
 {query.data&&groups.map(group=><Card key={group}><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-lg">{group}</CardTitle>{editing!==group&&<Button variant="outline" disabled={editing!==null||busy} onClick={()=>start(group)}>Edit</Button>}</CardHeader><CardContent>
 <Table><TableHeader><TableRow><TableHead>{query.data!.pages.some(p=>p.group===group)?'Subpage':'Permission'}</TableHead><TableHead className="text-center">Admin</TableHead>{query.data!.roles.map(r=><TableHead key={r.role_type_id} className="text-center">{r.role_type_name.charAt(0)+r.role_type_name.slice(1).toLowerCase()}</TableHead>)}</TableRow></TableHeader><TableBody>
 {query.data!.actions.filter(a=>a.group===group).map(a=>{
  const page=query.data!.pages.find(p=>p.code===a.code);
  return <Fragment key={a.code}><TableRow><TableCell><span className="font-medium">{a.label}</span>{page&&!a.implemented&&<span className="block text-xs text-muted-foreground">Not connected yet</span>}</TableCell>{cells(a,group)}</TableRow>
  {page&&query.data!.children.filter(c=>c.parent===page.code).map(child=><TableRow key={child.code} className="bg-muted/30"><TableCell className="pl-8 text-sm">{child.label}{!child.implemented&&<span className="block text-xs text-muted-foreground">Not connected yet</span>}</TableCell>{cells({...child,group,implemented:true},group)}</TableRow>)}</Fragment>;
 })}
 </TableBody></Table>
 <p className="mt-3 text-xs text-muted-foreground">Saved preferences apply to everyone with that role in this store, including new users. Admin has full access. Module switches apply to all subpages below; switching a module back on restores its saved subpage preferences.</p>
 {query.data!.pages.some(p=>p.group===group)&&<p className="mt-2 text-xs text-muted-foreground">Choose the subpages and nested pages each role can see. Turning off a parent hides its nested pages. Existing approval rules still apply. Pages marked “Not connected yet” remain unavailable to staff.</p>}
 {editing===group&&<div className="flex gap-2 mt-4"><Button disabled={busy} onClick={save}>{busy?'Saving…':'Save Preferences'}</Button><Button variant="outline" disabled={busy} onClick={cancel}>Cancel</Button></div>}
 </CardContent></Card>)}</>;
}
