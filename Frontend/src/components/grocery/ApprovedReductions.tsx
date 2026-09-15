import {useQuery} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import {Table,TableHeader,TableHead,TableRow,TableBody,TableCell} from '@/components/ui/table';
import {Card,CardHeader,CardTitle,CardContent} from '@/components/ui/card';
export function ApprovedReductions({storeId,route,title}:{storeId:string;route:string;title:string}){
 const q=useQuery({queryKey:['reductions',storeId],queryFn:()=>request<{requests:{reduction_request_id:number;route:string;status:string;product_name:string;product_sku:string;quantity:number;reason:string;destination_name?:string;updated_at:string}[]}>(`/access/stores/${encodeURIComponent(storeId)}/reductions`)});
 const rows=(q.data?.requests??[]).filter(r=>r.status==='APPROVED'&&r.route===route);
 return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent>{q.error&&<p role="alert">{String(q.error)}</p>}<Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>SKU</TableHead><TableHead>Quantity reduced</TableHead><TableHead>Reason</TableHead>{route==='transfers'&&<TableHead>Destination</TableHead>}<TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{rows.map(r=><TableRow key={r.reduction_request_id}><TableCell>{r.product_name}</TableCell><TableCell>{r.product_sku}</TableCell><TableCell>{r.quantity}</TableCell><TableCell>{r.reason.replace(/-/g,' ')}</TableCell>{route==='transfers'&&<TableCell>{r.destination_name}</TableCell>}<TableCell>Approved</TableCell></TableRow>)}</TableBody></Table>{!rows.length&&<p className="text-muted-foreground py-4">{q.isLoading?'Loading…':'No approved reductions yet.'}</p>}</CardContent></Card>;
}
