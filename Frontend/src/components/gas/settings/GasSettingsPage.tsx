import {useEffect,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { GeneralGasConfig } from "./GeneralGasConfig";
import { TankConfiguration } from "./TankConfiguration";
import { VarianceRules } from "./VarianceRules";
import { AlertsNotifications } from "./AlertsNotifications";
import { AuditLocking } from "./AuditLocking";
import { toast } from "sonner";
import {GasSettingsContext,emptyGasSettings,gasBooleanFields,gasNumberFields,tankNumberFields,type GasTank,type Grade,type GasAudit} from './gasSettingsState';
type Data={version:string;settings:Record<string,string|number|boolean|null>|null;tanks:GasTank[];grades:Grade[];audit:GasAudit[]};
export const GasSettingsPage = ({storeId}:{storeId:string}) => {
 const path=`/access/stores/${encodeURIComponent(storeId)}/gas-settings`;
 const query=useQuery({queryKey:['gas-settings',storeId],queryFn:()=>request<Data>(path),refetchOnWindowFocus:false});
 const [draft,setDraft]=useState(emptyGasSettings),[tanks,setTanks]=useState<GasTank[]>([]),[grades,setGrades]=useState<Grade[]>([]);
 const [editing,setEditing]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const hydrate=(data=query.data)=>{if(!data)return;const defaults=emptyGasSettings();Object.keys(defaults).forEach(k=>defaults[k]=gasBooleanFields.includes(k)?Boolean(data.settings?.[k]??false):String(data.settings?.[k]??''));setDraft(defaults);setGrades(data.grades);setTanks(data.tanks.map(t=>({...t,key:t.id!,number:t.number??'',name:t.name??'',gradeId:t.gradeId??'',posMapping:t.posMapping??'',...Object.fromEntries(tankNumberFields.map(k=>[k,t[k]==null?'':String(t[k])]))})));};
 useEffect(()=>{if(!editing)hydrate();},[query.data]);
 const set=(key:string,value:string|boolean)=>setDraft(old=>({...old,[key]:value}));
 const handleSave=async()=>{setError('');setBusy(true);try{
  const numeric=(value:string)=>{if(value.trim()==='')return null;const n=Number(value);if(!Number.isFinite(n))throw Error('Enter valid numeric values.');return n;};
  const settings=Object.fromEntries(Object.entries(draft).map(([k,v])=>[k,gasNumberFields.includes(k)?numeric(String(v)):typeof v==='string'&&v.trim()===''?null:v]));
  const rows=tanks.map(t=>({id:t.id,version:t.version,number:t.number,name:t.name,gradeId:t.gradeId,posMapping:t.posMapping||null,...Object.fromEntries(tankNumberFields.map(k=>[k,numeric(t[k])]))}));
  await request(path,{method:'PUT',headers:{'If-Match':query.data?.version??'0'},body:JSON.stringify({settings,tanks:rows})});const fresh=await query.refetch();if(fresh.data)hydrate(fresh.data);setEditing(false);toast.success('Gas settings saved');
 }catch(e){setError(e instanceof Error?e.message:'Could not save settings');}finally{setBusy(false);}};
 const addGrade=async(grade:{name:string;type:string;octane:number})=>{const result=await request<Grade[]>(path+'/grades',{method:'POST',body:JSON.stringify(grade)});setGrades(result);};
 const exportAudit=async()=>{try{const rows=await request<GasAudit[]>(path+'/audit');const cell=(v:unknown)=>{let text=String(v??'');if(/^[\s]*[=+@-]/.test(text))text="'"+text;return '"'+text.split('"').join('""')+'"';};const csv=[['Timestamp','User','Event','Changes'],...rows.map(r=>[r.timestamp,r.actor,r.event,r.changes])].map(row=>row.map(cell).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=`gas-settings-audit-${storeId}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){setError(e instanceof Error?e.message:'Could not export audit');}};
 if(query.isLoading)return <p>Loading gas settings…</p>;
 if(query.isError)return <div role="alert"><p>{query.error.message}</p><Button onClick={()=>query.refetch()}>Retry</Button></div>;
 return <GasSettingsContext.Provider value={{draft,set,editable:editing&&!busy,tanks,setTanks,grades,addGrade,audit:query.data?.audit??[],exportAudit}}><div className="space-y-6">
  <div className="flex items-center justify-between"><div><h1 className="text-lg font-bold text-foreground">Gas Settings</h1><p className="text-xs text-muted-foreground">Define rules, tolerances, and controls for gas operations.</p></div><div className="flex gap-2">{editing?<><Button size="sm" disabled={busy} onClick={handleSave}><Save className="h-3.5 w-3.5 mr-1.5"/>{busy?'Saving…':'Save Settings'}</Button><Button size="sm" variant="outline" disabled={busy} onClick={()=>{hydrate();setEditing(false);setError('');}}>Cancel</Button></>:<Button size="sm" onClick={()=>setEditing(true)}>Edit Settings</Button>}</div></div>
  {!query.data?.settings&&<p className="text-xs text-muted-foreground">No gas settings saved for this store. Enter its configuration before saving.</p>}
  {error&&<div role="alert" className="text-destructive text-sm">{error}<Button variant="link" onClick={async()=>{const fresh=await query.refetch();if(fresh.data)hydrate(fresh.data);setError('');}}>Reload saved values</Button></div>}
  <GeneralGasConfig/><TankConfiguration/><VarianceRules/><AlertsNotifications/><AuditLocking/>
 </div></GasSettingsContext.Provider>;
};
