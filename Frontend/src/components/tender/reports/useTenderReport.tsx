import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import {Input} from '@/components/ui/input';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {batchRows,balanceRows,type SavedBatch} from './tenderReportData';
interface Report {today:string;latest:string;start:string;end:string;rows:SavedBatch[]}
const shift=(date:string,days:number)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);};
export function useTenderReport(storeId:string,family:'card'|'tender',balance=false){
 const [period,setPeriod]=useState('latest');const [range,setRange]=useState<{start?:string;end?:string;asOf?:string}>({});
 const valid=(!range.start||!range.end||range.start<=range.end);
 const params=new URLSearchParams({family,...range});
 // Initial balances use the server's store-local current date, obtained from the metadata request.
 const meta=useQuery({queryKey:['tender-report-meta',storeId,family],queryFn:()=>request<Report>(`/access/stores/${encodeURIComponent(storeId)}/tender-reports?family=${family}`),enabled:!!storeId,retry:false});
 if(balance&&!range.asOf&&meta.data)params.set('asOf',meta.data.today);
 const query=useQuery({queryKey:['tender-reports',storeId,params.toString()],queryFn:()=>request<Report>(`/access/stores/${encodeURIComponent(storeId)}/tender-reports?${params}`),enabled:!!storeId&&valid&&(!balance||!!meta.data),retry:false});
 const data=query.data;const rows=batchRows(data?.rows??[],balance?data?.end:undefined);
 const choose=(v:string)=>{setPeriod(v);const today=meta.data?.today;if(!today)return;
  if(v==='latest'){setRange({});return;}if(v==='custom'){setRange(balance?{asOf:data?.end??today}:{start:data?.start??today,end:data?.end??today});return;}
  if(balance){setRange({asOf:v==='today'?today:shift(today,v==='yesterday'?-1:v==='last-week'?-7:-30)});return;}
  const first=today.slice(0,8)+'01',previous=shift(first,-1);
  setRange(v==='today'?{start:today,end:today}:v==='this-week'?{start:shift(today,-((new Date(today+'T12:00:00Z').getUTCDay()+6)%7)),end:today}:v==='last-month'?{start:previous.slice(0,8)+'01',end:previous}:{start:first,end:today});
 };
 const controls=<>
  <Select value={period} onValueChange={choose} disabled={!meta.data}>
   <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue/></SelectTrigger>
   <SelectContent>
    <SelectItem value="latest">{balance?'As of Today':'Latest Batch Month'}</SelectItem>
    <SelectItem value="today">{balance?'As of Today':'Today'}</SelectItem>
    {balance?<><SelectItem value="yesterday">As of Yesterday</SelectItem><SelectItem value="last-week">7 Days Ago</SelectItem><SelectItem value="last-month">30 Days Ago</SelectItem></>:<><SelectItem value="this-week">This Week</SelectItem><SelectItem value="this-month">This Month</SelectItem><SelectItem value="last-month">Last Month</SelectItem></>}
    <SelectItem value="custom">Custom Date{balance?'':' Range'}</SelectItem>
   </SelectContent>
  </Select>
  {balance?<label className="text-xs">As of<Input aria-label="As of date" type="date" className="h-8 w-[150px] text-xs" max={meta.data?.today} value={range.asOf??data?.end??''} onChange={e=>{if(e.target.value){setPeriod('custom');setRange({asOf:e.target.value});}}}/></label>:<>
   <label className="text-xs">From<Input aria-label="From date" type="date" className="h-8 w-[150px] text-xs" max={meta.data?.today} value={range.start??data?.start??''} onChange={e=>{if(e.target.value){setPeriod('custom');setRange({start:e.target.value,end:range.end??data?.end});}}}/></label>
   <label className="text-xs">To<Input aria-label="To date" type="date" className="h-8 w-[150px] text-xs" max={meta.data?.today} value={range.end??data?.end??''} onChange={e=>{if(e.target.value){setPeriod('custom');setRange({start:range.start??data?.start,end:e.target.value});}}}/></label>
  </>}
 </>;
 const error=query.error??meta.error;
 const notice=<div className="text-xs text-muted-foreground space-y-1">
  {!valid?<p role="alert">From date must be on or before To date.</p>:error?<p role="alert">{error.message}</p>:query.isFetching?<p role="status">Loading saved batches…</p>:!rows.length?<p>No saved batches for this selection.</p>:null}
  <p>{balance?'Balances include batches through the selected date and deposits dated on or before it. Fees and corrections use the latest saved batch values; this is not a historical audit snapshot.':'Amounts are net of refunds. Net Deposit shows recorded settlements; open batches have no recorded deposit.'}</p>
  <p>{family==='card'?'Unconfirmed card fees use the rate saved with the batch. Deposits include bank receipts and jobber credits.':'EBT SNAP/Cash stay together because they share batch fees and deposits. Customer account settlement records are not connected.'} — means the amount has not been recorded. {balance?'Variance = received minus expected for settled batches; unsettled amounts stay pending.':''}</p>
 </div>;
 return {rows:valid&&!error?rows:[],balances:valid&&!error?balanceRows(rows):[],controls,notice,loading:query.isPending||query.isFetching||!valid||!!error,data};
}
