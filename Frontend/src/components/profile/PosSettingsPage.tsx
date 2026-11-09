import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import {useStoreAccess} from '@/lib/store-access';
import {Button} from '@/components/ui/button';
import {Card,CardContent,CardHeader,CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Badge} from '@/components/ui/badge';
import {Switch} from '@/components/ui/switch';
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from '@/components/ui/table';
import {Wifi,ArrowRightLeft,ShieldAlert,Fuel,FileText,AlertTriangle} from 'lucide-react';
type Connector={connector_id:string;active:boolean;schedule_minutes:number;heartbeat_at:string|null;reachable:boolean};
type History={ingestion_id:string;source_transaction_id:string;status:string;reason:string|null;attempts:number;updated_at:string;sale_id:number|null};
type Mapping={connector_id:string;kind:string;source_code:string;target_id:number};
type Data={simulatorEnabled:boolean;connectors:Connector[];mappings:Mapping[];history:History[];events:{event_id:number;result:string;detail:string|null;created_at:string}[]};
type Targets=Record<string,{id:number;label:string}[]>;
const selectStyle='border rounded-md bg-background p-2';
export function PosSettingsPage({storeId}:{storeId:string}){
 const access=useStoreAccess(storeId),[error,setError]=useState(''),[secret,setSecret]=useState(''),[busy,setBusy]=useState(false),[connector,setConnector]=useState(''),[kind,setKind]=useState('REGISTER'),[code,setCode]=useState(''),[target,setTarget]=useState(''),[detail,setDetail]=useState<unknown>(null);
 const base=`/access/stores/${encodeURIComponent(storeId)}/pos`;
 const q=useQuery({queryKey:['pos-settings',storeId],queryFn:()=>request<Data>(base,{signal:AbortSignal.timeout(15000)}),retry:false,enabled:!!storeId&&access.data?.admin===true,refetchInterval:15000});
 const targets=useQuery({queryKey:['pos-targets',storeId],queryFn:()=>request<Targets>(base+'/targets',{signal:AbortSignal.timeout(15000)}),retry:false,enabled:!!storeId&&access.data?.admin===true});
 async function act(path:string,body?:unknown,method='POST'){setBusy(true);setError('');try{const result=await request<{credential?:string}>(base+path,{method,...(body===undefined?{}:{body:JSON.stringify(body)})});if(result.credential)setSecret(result.credential);await q.refetch();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 if(!storeId)return <p>Select a store to configure POS integration.</p>;
 if(access.error)return <p role="alert">{access.error.message} <Button onClick={()=>access.refetch()}>Retry</Button></p>;
 if(access.isPending)return <p>Loading access…</p>;
 if(!access.data?.admin)return <p>Only store administrators can configure POS integration.</p>;
 if(q.isPending)return <p>Loading POS settings…</p>;
 if(q.error)return <p role="alert">{q.error.message} <Button onClick={()=>q.refetch()}>Retry</Button></p>;
 const data=q.data!;
 async function inspect(id:string){try{setDetail(await request(base+'/history/'+id));}catch(e){setError((e as Error).message);}}
 return <div className="space-y-6"><h1 className="text-2xl font-bold">POS Settings</h1>
 <p>Verifone Ruby2 with Commander — <strong>Simulator</strong>. Real Commander connection is not available. This phase imports sales only; inventory is unchanged.</p>
 {!data.simulatorEnabled&&<p className="p-4 bg-muted rounded">Simulator disabled. Enable it only in development or testing.</p>}
 {error&&<p role="alert" className="text-red-600">{error}</p>}
 <Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><Wifi className="w-5 h-5"/>Connection Settings</CardTitle></CardHeader><CardContent className="space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5"><Label>POS Type</Label><Input readOnly value="Verifone Ruby2 with Commander — Simulator" className="bg-muted"/></div>
 <div className="space-y-1.5"><Label>Connection Type</Label><p className="text-sm">Local DGT connector</p><Badge variant="secondary">Real Commander not configured</Badge></div>
 <div className="space-y-1.5"><Label>Last Accepted Import</Label><Input readOnly className="bg-muted" value={data.history.filter(h=>h.status==='ACCEPTED').sort((a,b)=>b.updated_at.localeCompare(a.updated_at))[0]?.updated_at ? new Date(data.history.filter(h=>h.status==='ACCEPTED').sort((a,b)=>b.updated_at.localeCompare(a.updated_at))[0].updated_at).toLocaleString() : 'No accepted imports in recent history'}/></div>
 <div className="space-y-1.5"><Label>Sync Frequency</Label><p className="text-sm text-muted-foreground">Set the schedule for each connector below. New connectors start in manual mode.</p></div>
 </div>
 <Button disabled={busy||!data.simulatorEnabled} onClick={()=>act('/connectors')}>Create simulator connector</Button>
 {secret&&<div><label>New connector credential — copy once to the connector’s private configuration<Input readOnly type="password" value={secret}/></label><Button onClick={()=>navigator.clipboard.writeText(secret).catch(()=>setError('Clipboard unavailable; select and copy the credential.'))}>Copy credential</Button><Button variant="outline" onClick={()=>setSecret('')}>Dismiss</Button></div>}
 {data.connectors.length===0&&<p>No connectors configured.</p>}
 {data.connectors.map(c=><div key={c.connector_id} className="border rounded p-3 space-y-2"><p className="break-all">{c.connector_id}</p><p>{!c.active?'Revoked':c.reachable?'Connector reachable':'Connector offline / never seen'} · Last heartbeat: {c.heartbeat_at?new Date(c.heartbeat_at).toLocaleString():'Never'}</p>
 <label>Sync schedule <select aria-label="Sync schedule" className={selectStyle} value={c.schedule_minutes} disabled={busy||!c.active||!data.simulatorEnabled} onChange={e=>act(`/connectors/${c.connector_id}`,{scheduleMinutes:Number(e.target.value)},'PUT')}>{[0,5,15,30,60].map(n=><option key={n} value={n}>{n?`Every ${n} minutes`:'Manual'}</option>)}</select></label> <Button variant="outline" disabled={busy||!c.active} onClick={()=>act(`/connectors/${c.connector_id}/revoke`)}>Revoke credential</Button></div>)}
 </CardContent></Card>
 <Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><ArrowRightLeft className="w-5 h-5"/>Data Mapping</CardTitle></CardHeader><CardContent className="space-y-3"><p>Store: {storeId}. Map simulator codes to existing records. Unknown items are held, never silently dropped.</p>
 {targets.error&&<p role="alert">{targets.error.message}</p>}
 <form className="flex flex-wrap gap-2" onSubmit={e=>{e.preventDefault();void act(`/connectors/${connector}/mapping`,{kind,sourceCode:code,targetId:Number(target)},'PUT');}}>
 <select aria-label="Connector" required className={selectStyle} value={connector} onChange={e=>setConnector(e.target.value)}><option value="">Select connector</option>{data.connectors.filter(c=>c.active).map(c=><option key={c.connector_id}>{c.connector_id}</option>)}</select>
 <select aria-label="Mapping type" className={selectStyle} value={kind} onChange={e=>{setKind(e.target.value);setTarget('');}}>{['REGISTER','CASHIER','PRODUCT','TENDER'].map(k=><option key={k}>{k}</option>)}</select>
 <Input aria-label="Source code" placeholder="Simulator source code" required maxLength={100} value={code} onChange={e=>setCode(e.target.value)} className="w-48"/>
 <select aria-label="Target record" required className={selectStyle} value={target} onChange={e=>setTarget(e.target.value)}><option value="">Select DGT record</option>{(targets.data?.[kind]??[]).map(t=><option key={t.id} value={t.id}>{t.label} (#{t.id})</option>)}</select>
 <Button disabled={busy||!data.simulatorEnabled}>Save mapping</Button></form>
 <div><h4 className="font-medium text-sm mb-2">POS Department → System Department</h4><p className="text-xs text-muted-foreground mb-2">Not implemented yet. Department mappings are not sent to the POS.</p><Table><TableHeader><TableRow><TableHead>POS Code</TableHead><TableHead>System Department</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell colSpan={3} className="text-muted-foreground">No department mappings configured.</TableCell></TableRow></TableBody></Table></div>
 {['REGISTER','CASHIER','PRODUCT','TENDER'].map(mappingKind=><div key={mappingKind}><h4 className="font-medium text-sm mb-2">{{REGISTER:'Register Mapping',CASHIER:'Cashier Mapping',PRODUCT:'Product Mapping',TENDER:'Tender Mapping'}[mappingKind]}</h4><Table><TableHeader><TableRow><TableHead>POS Code</TableHead><TableHead>DGT Record</TableHead><TableHead>Connector</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{data.mappings.filter(m=>m.kind===mappingKind).map(m=><TableRow key={`${m.connector_id}-${m.source_code}`}><TableCell className="font-mono text-xs">{m.source_code}</TableCell><TableCell>{targets.data?.[m.kind]?.find(t=>t.id===m.target_id)?.label??m.target_id}</TableCell><TableCell className="text-xs break-all">{m.connector_id}</TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" disabled={!data.simulatorEnabled||!data.connectors.some(c=>c.connector_id===m.connector_id&&c.active)} onClick={()=>{setConnector(m.connector_id);setKind(m.kind);setCode(m.source_code);setTarget(String(m.target_id));}}>Edit</Button></TableCell></TableRow>)}{!data.mappings.some(m=>m.kind===mappingKind)&&<TableRow><TableCell colSpan={4} className="text-muted-foreground">No mappings configured.</TableCell></TableRow>}</TableBody></Table></div>)}
 </CardContent></Card>
      {/* Age Restriction Cards */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> Age Restriction Cards</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Configure age verification requirements for restricted items at POS.</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Category</TableHead>
                <TableHead>Minimum Age</TableHead>
                <TableHead>Require ID Scan</TableHead>
                <TableHead>Manager Bypass</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow><TableCell colSpan={5} className="text-muted-foreground">Not implemented yet. No age restrictions configured through this integration.</TableCell></TableRow>
            </TableBody>
          </Table>
          <Button disabled variant="outline" size="sm" className="text-xs">+ Add Restriction</Button>
        </CardContent>
      </Card>

      {/* Gas Grade Mapping */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Fuel className="w-5 h-5" /> Gas Grade Mapping</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Map POS fuel grade codes to system fuel grades for accurate reporting and reconciliation.</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>POS Code</TableHead>
                <TableHead>POS Name</TableHead>
                <TableHead>System Grade</TableHead>
                <TableHead>Octane</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow><TableCell colSpan={5} className="text-muted-foreground">Not implemented yet. Fuel integration is unavailable.</TableCell></TableRow>
            </TableBody>
          </Table>
          <Button disabled variant="outline" size="sm" className="text-xs">+ Add Grade Mapping</Button>
        </CardContent>
      </Card>

      {/* Z-Reading Configuration */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5" /> Z-Reading Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div><Label>Auto-import Z Reading</Label><p className="text-xs text-muted-foreground">Not implemented yet. Z-Reading imports are unavailable.</p></div>
            <Switch disabled checked={false} />
          </div>
          <div className="flex items-center justify-between">
            <div><Label>Manual Override Allowed?</Label><p className="text-xs text-muted-foreground">Unavailable until Z-Reading integration is implemented</p></div>
            <Switch disabled checked={false} />
          </div>
          <div className="flex items-center justify-between">
            <div><Label>Require Approval?</Label><p className="text-xs text-muted-foreground">Unavailable until Z-Reading integration is implemented</p></div>
            <Switch disabled checked={false} />
          </div>
        </CardContent>
      </Card>

 <Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5"/>Import History</CardTitle></CardHeader><CardContent><p>Latest 100 transactions. Held: {data.history.filter(h=>h.status==='HELD').length}. Last accepted: {data.history.filter(h=>h.status==='ACCEPTED').sort((a,b)=>b.updated_at.localeCompare(a.updated_at))[0]?.updated_at??'Never'}</p>
 <div className="overflow-auto"><Table><TableHeader><TableRow><TableHead>Source transaction</TableHead><TableHead>Status</TableHead><TableHead>Details</TableHead><TableHead>Attempts</TableHead><TableHead>Updated</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{data.history.map(h=><TableRow key={h.ingestion_id}><TableCell>{h.source_transaction_id}</TableCell><TableCell>{h.status}</TableCell><TableCell>{h.reason??`Sale ${h.sale_id}`}</TableCell><TableCell>{h.attempts}</TableCell><TableCell>{new Date(h.updated_at).toLocaleString()}</TableCell><TableCell><Button variant="outline" onClick={()=>inspect(h.ingestion_id)}>Details</Button>{h.status==='HELD'&&<Button disabled={busy||!data.simulatorEnabled} onClick={()=>act(`/history/${h.ingestion_id}/reprocess`)}>Reprocess</Button>}</TableCell></TableRow>)}</TableBody></Table></div>{!data.history.length&&<p>No imports yet.</p>}{detail!==null&&<div><Button variant="outline" onClick={()=>setDetail(null)}>Close details</Button><pre className="overflow-auto text-xs">{JSON.stringify(detail,null,2)}</pre></div>}
 </CardContent></Card>
 <Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5"/>Error Logs</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Date &amp; Time</TableHead><TableHead>Type</TableHead><TableHead>Message</TableHead></TableRow></TableHeader><TableBody>{data.events.filter(e=>!['ACCEPTED','DUPLICATE'].includes(e.result)).map(e=><TableRow key={e.event_id}><TableCell className="text-xs">{new Date(e.created_at).toLocaleString()}</TableCell><TableCell><Badge variant="secondary">{e.result}</Badge></TableCell><TableCell>{e.detail??'No additional details'}</TableCell></TableRow>)}{!data.events.some(e=>!['ACCEPTED','DUPLICATE'].includes(e.result))&&<TableRow><TableCell colSpan={3} className="text-muted-foreground">No errors in recent sync history.</TableCell></TableRow>}</TableBody></Table></CardContent></Card>
 <Card><CardHeader><CardTitle className="text-lg">Sync Events</CardTitle></CardHeader><CardContent>{!data.events.length&&<p className="text-sm text-muted-foreground">No events yet.</p>}{data.events.map(e=><p key={e.event_id} className="text-sm">{new Date(e.created_at).toLocaleString()} · {e.result}{e.detail?` — ${e.detail}`:''}</p>)}</CardContent></Card>
 </div>;
}
