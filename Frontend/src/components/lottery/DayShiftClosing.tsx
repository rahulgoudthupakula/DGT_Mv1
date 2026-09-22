import {Badge} from '@/components/ui/badge';
import {Label} from '@/components/ui/label';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {Calendar, Clock, Store, User, Ticket, Save, Lock, AlertTriangle, DollarSign, FileText} from 'lucide-react';
import {useState} from 'react';
import {useQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import {Card,CardContent,CardHeader,CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Table,TableHeader,TableHead,TableRow,TableBody,TableCell} from '@/components/ui/table';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from '@/components/ui/dialog';
import {toast} from '@/hooks/use-toast';
interface Pack {id:number;gameName:string;packNumber:string;startTicket:number;opening:number;endTicket:number;lastSold?:number|null;price:number;rate:number;recordedTickets?:number;}
interface Closing {lottery_pack_inventory_id:number;version:string;sales_reviewed:boolean;sales_period_started_at:string|null;counter_separate:boolean;cash_counted:number|null;variance_note:string|null;closing_type:string;business_date:string;shift_opened_at:string;shift_closed_at:string|null;openedBy:string;closedBy:string;}
interface Data {store:{name:string;timezone:string;separateCounter:boolean|null;today:string};closing:Closing|null;packs:Pack[];history:{id:number;date:string;type:string}[];}
const money=(n:number)=>`$${n.toFixed(2)}`;
export const DayShiftClosing=({storeId}:{storeId:string})=>{
 const [historyId,setHistoryId]=useState('');const client=useQueryClient();
 const path=`/access/stores/${encodeURIComponent(storeId)}/lottery-closing`;
 const key=['lottery-closing',storeId,historyId];
 const q=useQuery({queryKey:key,queryFn:()=>request<Data>(path+(historyId?`?closingId=${historyId}`:'')),enabled:!!storeId,retry:false});
 if(!storeId)return <p>Select a store.</p>;
 if(q.isPending)return <p>Loading lottery closing…</p>;
 if(q.error)return <p role="alert">{q.error.message} <Button onClick={()=>void q.refetch()}>Retry</Button></p>;
 return <ClosingForm key={`${historyId}:${q.data.closing?.lottery_pack_inventory_id??'new'}:${q.data.closing?.version??''}`} data={q.data} path={path} historyId={historyId} onHistory={setHistoryId} onData={d=>{client.setQueryData(key,d);}} onRefresh={()=>void q.refetch()}/>;
};
function ClosingForm({data,path,historyId,onHistory,onData,onRefresh}:{data:Data;path:string;historyId:string;onHistory:(v:string)=>void;onData:(d:Data)=>void;onRefresh:()=>void}){
 const c=data.closing;const locked=!!c?.shift_closed_at;const separate=c?.counter_separate??data.store.separateCounter;
 const [reviewed,setReviewed]=useState(c?.sales_reviewed??false);const [salesOpen,setSalesOpen]=useState(false);
 const [type,setType]=useState('DAY');const [cash,setCash]=useState(c?.cash_counted==null?'':String(c.cash_counted));const [note,setNote]=useState(c?.variance_note??'');const [confirm,setConfirm]=useState(false);
 const [values,setValues]=useState<Record<number,string>>(Object.fromEntries(data.packs.map(p=>[p.id,p.lastSold==null?'':String(p.lastSold)])));
 const stats=(p:Pack)=>{const raw=values[p.id]??'';const last=raw===''?null:Number(raw);const valid=last!==null&&Number.isInteger(last)&&last>=p.opening-1&&last<=p.endTicket;const sold=valid?last-p.opening+1:0;const sales=Math.round(sold*p.price*100)/100;return {valid,sold,sales,remaining:p.endTicket-p.opening+1-sold,commission:Math.round(sales*p.rate)/100};};
 const gross=data.packs.reduce((n,p)=>n+Math.round(stats(p).sales*100),0)/100;const commission=data.packs.reduce((n,p)=>n+Math.round(stats(p).commission*100),0)/100;
 const validCash=cash!==''&&/^\d+(\.\d{1,2})?$/.test(cash);const variance=validCash?Math.round((Number(cash)-gross)*100)/100:0;
 const ticketVariance=data.packs.some(p=>stats(p).valid&&stats(p).sold!==(p.recordedTickets??0));
 const dirty=data.packs.some(p=>(values[p.id]??'')!==(p.lastSold==null?'':String(p.lastSold)))||cash!==(c?.cash_counted==null?'':String(c.cash_counted))||note!==(c?.variance_note??'');
 const canClose=reviewed&&(!ticketVariance||note.trim()!=='')&&!!c&&!locked&&data.packs.length>0&&data.packs.every(p=>stats(p).valid)&&(!separate||(validCash&&(variance===0||note.trim()!=='')));
 const mutation=useMutation({mutationFn:({endpoint,method,body}:{endpoint:string;method:string;body:unknown})=>request<Data>(path+endpoint,{method,body:JSON.stringify(body)}),onSuccess:d=>{onData(d);setConfirm(false);toast({title:'Lottery closing saved'});},onError:e=>toast({title:'Not saved',description:e.message,variant:'destructive'})});
 const save=(close:boolean)=>mutation.mutate({endpoint:`/${c!.lottery_pack_inventory_id}`,method:'PUT',body:{version:c!.version,close,cashCounted:separate&&cash!==''?Number(cash):null,varianceNote:note,salesReviewed:reviewed,packs:data.packs.map(p=>({id:p.id,recordedTickets:p.recordedTickets??0,lastSold:values[p.id]===''?null:Number(values[p.id])}))}});
 const time=(value:string)=>new Date(value).toLocaleString('en-US',{timeZone:data.store.timezone});
 const validationErrors:string[]=[];
 const missing=data.packs.filter(p=>values[p.id]==='').length;
 const invalid=data.packs.filter(p=>values[p.id]!==''&&!stats(p).valid).length;
 if(!reviewed)validationErrors.push('Review recorded sales and confirm all lottery receipt lines are linked');
 if(ticketVariance&&!note.trim())validationErrors.push('Explain the ticket variance in Variance Notes');
 if(separate===null)validationErrors.push('Choose the counter type in Lottery Settings');
 if(!c)validationErrors.push('Start the closing before entering ticket positions');
 if(missing)validationErrors.push(`${missing} pack(s) have no last sold ticket entered`);
 if(invalid)validationErrors.push(`${invalid} pack(s) have an invalid last sold ticket`);
 if(separate===true&&!validCash)validationErrors.push('Cash counted is required');
 if(separate===true&&validCash&&variance!==0&&!note.trim())validationErrors.push('A variance note is required');
 return <fieldset disabled={mutation.isPending} className="space-y-6 min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Day / Shift Closing</h1>
            <p className="text-muted-foreground text-sm">
              Close lottery sales for the shift or day
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!c&&<Button disabled={separate===null||!data.packs.length} onClick={()=>mutation.mutate({endpoint:"/open",method:"POST",body:{type}})}>Start Closing</Button>}
          {locked ? (
            <Badge variant="secondary" className="bg-muted">
              <Lock className="w-3 h-3 mr-1" />
              Shift Locked
            </Badge>
          ) : (
            <>
              <Button variant="outline" onClick={()=>save(false)} disabled={mutation.isPending||!c}>
                <Save className="w-4 h-4 mr-1" />
                Save Draft
              </Button>
              <Button
                onClick={() => setConfirm(true)}
                disabled={!canClose || mutation.isPending}
              >
                <Lock className="w-4 h-4 mr-1" />
                Submit & Close Shift
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Validation Errors Banner */}
      {validationErrors.length > 0 && !locked && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-sm text-destructive">Cannot close shift</p>
                <ul className="text-sm text-destructive/80 mt-1 space-y-0.5">
                  {validationErrors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shift Details */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Store className="w-5 h-5" />
            Shift Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Store</Label>
              <p className="font-medium text-sm">{data.store.name}</p>
              <p className="text-xs text-muted-foreground">#{decodeURIComponent(path.split("/")[3])}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Shift Type</Label>
              <Select value={c?.closing_type??type} onValueChange={setType} disabled={!!c}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  <SelectItem value="DAY">Day Closing</SelectItem>
                  <SelectItem value="SHIFT">Shift Closing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Opened By</Label>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <p className="font-medium text-sm">{c?.openedBy??'—'}</p>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Open Time</Label>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <p className="font-medium text-sm">
                  {c?time(c.shift_opened_at):'Not started'}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Close Time</Label>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <p className="font-medium text-sm">
                  {c?.shift_closed_at?time(c.shift_closed_at):'Pending...'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pack-wise Sales Summary */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Pack-wise Sales Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Game Name</TableHead>
                <TableHead>Pack #</TableHead>
                <TableHead className="text-center">Start</TableHead>
                <TableHead className="text-center">End</TableHead>
                <TableHead className="text-center">Opening</TableHead>
                <TableHead className="text-center">Last Sold</TableHead>
                <TableHead className="text-center">Sold</TableHead>
                <TableHead className="text-center">Remaining</TableHead>
                <TableHead className="text-right">Sales ($)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.packs.length===0&&<TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">No activated packs with remaining tickets.</TableCell></TableRow>}
              {data.packs.map((pack) => {
                const rowStats = stats(pack);
                return (
                  <TableRow
                    key={pack.id}
                    className={(values[pack.id]!==''&&!stats(pack).valid) ? "bg-destructive/5" : ""}
                  >
                    <TableCell className="font-medium">{pack.gameName}</TableCell>
                    <TableCell>{pack.packNumber}</TableCell>
                    <TableCell className="text-center">{pack.startTicket}</TableCell>
                    <TableCell className="text-center">{pack.endTicket}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{pack.opening}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Input
                          type="number"
                          min={pack.opening-1}
                          max={pack.endTicket}
                          value={values[pack.id]??''}
                          onChange={(e) => setValues(v=>({...v,[pack.id]:e.target.value}))}
                          disabled={locked||!c}
                          className={`w-20 h-8 text-center ${
                            (values[pack.id]!==''&&!stats(pack).valid) ? "border-destructive" : ""
                          }`}
                          title={`Enter ${pack.opening-1} for no sales`}
                          aria-label={`Last sold ticket for pack ${pack.packNumber}`}
                          placeholder="—"
                        />
                        {!locked&&<Button type="button" variant="ghost" size="sm" disabled={!c} onClick={()=>setValues(v=>({...v,[pack.id]:String(pack.opening-1)}))}>No sales</Button>}
                        {(values[pack.id]!==''&&!stats(pack).valid) && (
                          <span className="text-xs text-destructive">Enter {pack.opening-1}–{pack.endTicket}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={rowStats.sold > 0 ? "font-medium" : "text-muted-foreground"}>
                        {rowStats.sold}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-muted-foreground">{rowStats.remaining}</span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${rowStats.sales.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {/* Totals Row */}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell colSpan={6}>Totals</TableCell>
                <TableCell className="text-center">{data.packs.reduce((n,p)=>n+stats(p).sold,0)}</TableCell>
                <TableCell className="text-center">—</TableCell>
                <TableCell className="text-right">${gross.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
   <Card aria-disabled={separate!==true} className={separate!==true?'opacity-50':''}>
    <CardHeader className="pb-4"><CardTitle className="text-lg flex items-center gap-2"><DollarSign className="w-5 h-5"/>Cash &amp; Liability Summary</CardTitle></CardHeader>
    <CardContent className="space-y-4">
     <div className="space-y-3">
      <div className="flex justify-between items-center py-2 border-b"><span className="text-muted-foreground">Total Ticket Sales</span><span className="font-semibold text-lg">{money(gross)}</span></div>
      <div className="flex justify-between items-center py-2 border-b"><span className="text-muted-foreground">Commission</span><span className="font-medium text-primary">{money(commission)}</span></div>
      <div className="flex justify-between items-center py-2 border-b bg-muted/30 px-2 rounded"><span className="font-medium">Cash Expected</span><span className="font-bold text-lg">{separate===true?money(gross):'—'}</span></div>
      <div className="flex justify-between items-center py-2"><label htmlFor="cashCounted" className="text-muted-foreground">Cash Counted</label><Input id="cashCounted" className="w-32 text-right font-semibold" disabled={separate!==true||!c||locked} type="number" min="0" step="0.01" placeholder="0.00" value={separate===true?cash:''} onChange={e=>setCash(e.target.value)}/></div>
      <div className={`flex justify-between items-center py-3 px-3 rounded-lg ${separate===true&&validCash&&variance!==0?'bg-destructive/10 border border-destructive/30':'bg-primary/10'}`}><span className="font-medium">Over / Short</span><span className={`font-bold text-lg ${variance<0?'text-destructive':''}`}>{separate===true&&validCash?`${variance>=0?'+':''}${money(variance)}`:'—'}</span></div>
     </div>
     <p className="text-sm text-muted-foreground">{separate===false?'Disabled: lottery uses the shared store counter.':separate===null?'Choose a counter type in Lottery Settings.':'Enter the collected lottery cash. Commission is retained revenue and does not reduce cash collected from ticket sales.'}</p>
    </CardContent>
   </Card>
   <Card><CardHeader className="pb-4"><CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5"/>Variance Notes &amp; Audit</CardTitle></CardHeader><CardContent className="space-y-4">
    <div className="space-y-2"><label htmlFor="varianceNote">Variance Note {(ticketVariance||(separate===true&&validCash&&variance!==0))&&<span className="text-destructive">*</span>}</label><Textarea id="varianceNote" placeholder="Explain any cash variance or discrepancies..." rows={3} maxLength={2000} disabled={!c||locked} value={note} onChange={e=>setNote(e.target.value)}/></div>
    <div className="pt-4 border-t space-y-2 text-sm"><h4 className="font-medium mb-3">Audit Trail</h4><div className="flex justify-between"><span className="text-muted-foreground">Closed By</span><span>{locked?c?.closedBy:'—'}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Close Timestamp</span><span>{c?.shift_closed_at?time(c.shift_closed_at):'—'}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="secondary">{locked?'Closed':c?'Draft':'Not started'}</Badge></div></div>
   </CardContent></Card>
  </div>
  {data.history.length>0&&<div className="flex gap-3 items-center"><label className="text-sm text-muted-foreground">View closing <select className="border rounded p-2" value={historyId} onChange={e=>onHistory(e.target.value)}><option value="">Current / New closing</option>{data.history.map(h=><option key={h.id} value={h.id}>{h.date} · {h.type} · #{h.id}</option>)}</select></label>{locked&&!historyId&&<Button variant="outline" onClick={onRefresh}>Prepare Next Closing</Button>}</div>}
  <Dialog open={confirm} onOpenChange={v=>{if(!mutation.isPending)setConfirm(v);}}><DialogContent><DialogHeader><DialogTitle>Close lottery {c?.closing_type.toLowerCase()}?</DialogTitle><DialogDescription>This saves ticket sales and locks the closing. Total sales: {money(gross)}.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" disabled={mutation.isPending} onClick={()=>setConfirm(false)}>Cancel</Button><Button disabled={mutation.isPending||!canClose} onClick={()=>save(true)}>Confirm Close</Button></DialogFooter></DialogContent></Dialog>
 </fieldset>;
}

interface ReceiptLine {id:number;receipt:string;soldAt:string;product:string;quantity:number;packId:number|null;closingId:number|null;}
function SalesLinkDialog({open,onOpenChange,path,closingId,packs,onData}:{open:boolean;onOpenChange:(v:boolean)=>void;path:string;closingId?:number;packs:Pack[];onData:(d:Data)=>void}){
 const [receipt,setReceipt]=useState('');const [search,setSearch]=useState('');const [chosen,setChosen]=useState<Record<number,string>>({});
 const q=useQuery({queryKey:['lottery-sales-links',path,closingId,search,open],queryFn:()=>request<ReceiptLine[]>(`${path}/${closingId}/sales?receipt=${encodeURIComponent(search)}`),enabled:open&&!!closingId,retry:false});
 const mutation=useMutation({mutationFn:({line,remove}:{line:ReceiptLine;remove?:boolean})=>request<Data>(`${path}/${closingId}/sales${remove?`/${line.id}/unlink`:''}`,{method:remove?'POST':'PUT',body:remove?undefined:JSON.stringify({salesItemId:line.id,packId:Number(chosen[line.id]??line.packId)})}),onSuccess:d=>{onData(d);onOpenChange(false);},onError:e=>toast({title:'Sales link not saved',description:e.message,variant:'destructive'})});
 return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Link Recorded Sales</DialogTitle><DialogDescription>Search the exact POS receipt number. Link each lottery line to the pack it was sold from. The whole receipt-line quantity is used; split lines in the POS when tickets come from different packs.</DialogDescription></DialogHeader>
 <div className="flex gap-2"><Input aria-label="Receipt number" placeholder="Receipt number" value={receipt} onChange={e=>setReceipt(e.target.value)}/><Button onClick={()=>setSearch(receipt.trim())}>Search</Button></div>
 {q.error&&<p role="alert">{q.error.message}</p>}
 <div className="max-h-96 overflow-auto"><Table><TableHeader><TableRow><TableHead>Receipt / Item</TableHead><TableHead>Tickets</TableHead><TableHead>Pack</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>
 {q.isPending?<TableRow><TableCell colSpan={4}>Loading…</TableCell></TableRow>:!q.data?.length?<TableRow><TableCell colSpan={4}>No linked or matching completed sales.</TableCell></TableRow>:q.data.map(line=><TableRow key={line.id}><TableCell>{line.receipt}<br/>{line.product}</TableCell><TableCell>{line.quantity}</TableCell><TableCell><select aria-label={`Pack for sale item ${line.id}`} className="border rounded p-2" value={chosen[line.id]??line.packId??''} onChange={e=>setChosen(v=>({...v,[line.id]:e.target.value}))}><option value="">Select pack</option>{packs.map(p=><option key={p.id} value={p.id}>{p.gameName} · {p.packNumber}</option>)}</select></TableCell><TableCell><Button size="sm" disabled={mutation.isPending||!(chosen[line.id]??line.packId)} onClick={()=>mutation.mutate({line})}>Link</Button>{line.packId&&<Button size="sm" variant="ghost" disabled={mutation.isPending} onClick={()=>mutation.mutate({line,remove:true})}>Unlink</Button>}</TableCell></TableRow>)}
 </TableBody></Table></div></DialogContent></Dialog>;
}
