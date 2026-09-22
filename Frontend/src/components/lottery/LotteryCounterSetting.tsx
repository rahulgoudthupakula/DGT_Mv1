import {useQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import {Card,CardHeader,CardTitle,CardContent} from '@/components/ui/card';
import {Switch} from '@/components/ui/switch';
import {Button} from '@/components/ui/button';
import {toast} from '@/hooks/use-toast';
interface Setting {separateCounter:boolean|null;version:string;}
export function LotteryCounterSetting({storeId}:{storeId:string}){
 const client=useQueryClient(),key=['lottery-counter-setting',storeId],path=`/access/stores/${encodeURIComponent(storeId)}/lottery-closing/settings`;
 const q=useQuery({queryKey:key,queryFn:()=>request<Setting>(path),enabled:!!storeId,retry:false});
 const m=useMutation({mutationFn:(separateCounter:boolean)=>request<Setting>(path,{method:'PUT',body:JSON.stringify({separateCounter,version:q.data?.version})}),onSuccess:d=>{client.setQueryData(key,d);void client.invalidateQueries({queryKey:['lottery-closing',storeId]});toast({title:'Counter setting saved'});},onError:e=>toast({title:'Not saved',description:e.message,variant:'destructive'})});
 return <Card><CardHeader><CardTitle>Lottery Counter</CardTitle></CardHeader><CardContent className="space-y-3">{q.isPending?<p>Loading…</p>:q.error?<p role="alert">{q.error.message}<Button onClick={()=>void q.refetch()}>Retry</Button></p>:<><label className="flex items-center gap-3"><Switch checked={q.data.separateCounter===true} disabled={m.isPending} onCheckedChange={v=>m.mutate(v)}/>Separate lottery cash counter</label>{q.data.separateCounter===null?<p>Not configured. <Button disabled={m.isPending} onClick={()=>m.mutate(false)}>Use Shared Store Counter</Button></p>:<p>{q.data.separateCounter?'Separate: ticket positions and counted cash are required; differences require a note.':'Shared: compare last-ticket counts with linked sales. No separate lottery cash count is required.'}</p>}<p className="text-sm text-muted-foreground">Applies to new lottery closings. Existing drafts and closed records keep their original mode.</p></>}</CardContent></Card>;
}
