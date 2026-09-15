import {useQuery} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import {Card,CardHeader,CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Table,TableHeader,TableHead,TableBody,TableRow,TableCell} from '@/components/ui/table';
import {Download} from 'lucide-react';
type Entry={id:string;action:string|null;details:string|null;actor:string|null;timestamp:string};
const title=(value:string|null)=>(value??'').replace(/_/g,' ').toLowerCase().replace(/^./,c=>c.toUpperCase());
function details(value:string|null){if(!value)return '';try{const p=JSON.parse(value);const labels:Record<string,string>={priceChangeAlerts:'Price alerts',alertThreshold:'Alert threshold (%)',approvalRequired:'Approval required',approvalThreshold:'Approval threshold (%)',autoPick:'Auto-pick vendor',fallback:'Fallback vendor',considerLeadTime:'Consider lead time'};return Object.entries(p).map(([k,v])=>`${labels[k]??k}: ${v===true?'On':v===false?'Off':v==null?'Not set':v}`).join('; ');}catch{return value;}}
export function VendorAudit({storeId}:{storeId:string}){
 const query=useQuery({queryKey:['vendor-audit',storeId],queryFn:()=>request<Entry[]>(`/access/stores/${encodeURIComponent(storeId)}/vendors/audit`)});
 const rows=query.data??[];
 function exportRows(){const cell=(v:string)=>'"'+(/^[\s]*[=+@-]/.test(v)?"'"+v:v).replace(/"/g,'""')+'"';const csv=[['Action','Details','User','Timestamp'],...rows.map(r=>[title(r.action),details(r.details),r.actor??'',r.timestamp])].map(r=>r.map(cell).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='vendor-audit.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 return <Card><CardHeader><div className="flex items-center justify-between"><CardTitle>Audit Trail</CardTitle><Button variant="outline" size="sm" disabled={!rows.length} onClick={exportRows}><Download className="h-4 w-4 mr-2"/>Export Log</Button></div></CardHeader>{query.isPending&&<p className="p-4">Loading audit log…</p>}{query.error&&<p className="p-4" role="alert">{query.error.message}</p>}
 <Table><TableHeader><TableRow>{['Action','Details','User','Timestamp'].map(h=><TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map(r=><TableRow key={r.id}><TableCell><Badge variant="outline">{title(r.action)}</Badge></TableCell><TableCell>{details(r.details)}</TableCell><TableCell>{r.actor}</TableCell><TableCell>{r.timestamp}</TableCell></TableRow>)}{query.data?.length===0&&<TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No vendor activity recorded for this store.</TableCell></TableRow>}</TableBody></Table><p className="p-4 text-xs text-muted-foreground">Latest 200 events. Export includes the displayed records.</p></Card>;
}
