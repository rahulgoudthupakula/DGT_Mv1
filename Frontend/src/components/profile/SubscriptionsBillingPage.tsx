import { useState } from "react";
import { useQuery,useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/backend";
import { useStoreAccess } from "@/lib/store-access";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table,TableBody,TableCell,TableHead,TableHeader,TableRow } from "@/components/ui/table";
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription } from "@/components/ui/dialog";
import { CreditCard,Download } from "lucide-react";
type Plan={subscription_plan_id:number;plan_name:string;monthly_price:number};
type Subscription=Plan&{version:string;subscription_status:string;current_period_price:number;current_period_end:string;next_billing_date:string|null;auto_renewal:boolean};
type Invoice={invoice_id:number;invoice_number:string;invoice_date:string;total_amount:number;dgt_invoice_status:string;invoice_kind:string;plan_name_snapshot:string};
type Addon={addon_id:number;name:string;description:string;monthly_price:number;active:boolean;cancel_at_period_end:boolean};
type Billing={addons:Addon[];subscription:Subscription|null;plans:Plan[];invoices:Invoice[]};
const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
export const SubscriptionsBillingPage=({storeId}:{storeId:string})=>{
 const access=useStoreAccess(storeId),client=useQueryClient();const admin=access.data?.admin===true;
 const path=`/access/stores/${encodeURIComponent(storeId)}/billing`;
 const query=useQuery({queryKey:['store-billing',storeId],queryFn:()=>request<Billing>(path),enabled:!!storeId&&admin,refetchInterval:60000});
 const [mode,setMode]=useState(''),[planId,setPlanId]=useState(''),[key,setKey]=useState(''),[version,setVersion]=useState('0'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const sub=query.data?.subscription;const plans=query.data?.plans??[];
 const choices=plans.filter(p=>mode==='START'||(mode==='UPGRADE'?Number(p.monthly_price)>Number(sub?.monthly_price):Number(p.monthly_price)<Number(sub?.monthly_price)));
 const addon=query.data?.addons?.find(a=>String(a.addon_id)===planId);
 const addonMode=mode.startsWith('ADDON_');
 const plan=plans.find(p=>String(p.subscription_plan_id)===planId);
 const due=mode==='START'?Number(plan?.monthly_price??0):Math.max(0,Number(plan?.monthly_price??0)-Number(sub?.current_period_price??0));
 function open(m:string){setMode(m);setPlanId('');setKey(crypto.randomUUID());setVersion(sub?.version??'0');setError('');setMessage('');}
 async function save(){setBusy(true);setError('');try{const data=await request<Billing>(path,{method:'POST',headers:{'Idempotency-Key':key},body:JSON.stringify({action:mode==='UPGRADE'||mode==='DOWNGRADE'?'CHANGE':mode,planId:mode==='CANCEL'?null:Number(planId),version})});client.setQueryData(['store-billing',storeId],data);setMode('');setMessage(mode==='ADDON_CANCEL'?'Add-on cancellation scheduled for period end.':mode==='CANCEL'?'Cancellation scheduled for the end of this period.':'Subscription updated. Any new charges are recorded as due; no payment was collected.');await client.invalidateQueries({queryKey:['backend-store',storeId]});}catch(e){setError(e instanceof Error?e.message:'Could not update billing');}finally{setBusy(false);}}
 if(access.isPending)return <p>Loading access…</p>;
 if(!admin)return <p>{access.error?.message??'Only your company admin can view and manage billing.'}</p>;
 const active=sub?.subscription_status==='ACTIVE';
 return <div className="space-y-6"><h1 className="text-2xl font-bold">Subscriptions &amp; Billing</h1>
 {query.isPending&&<p>Loading billing…</p>}{query.error&&<p role="alert">{query.error.message} <Button onClick={()=>query.refetch()}>Retry</Button></p>}
 {message&&<p role="status">{message}</p>}
 <Card><CardHeader><CardTitle className="text-lg">Current Plan</CardTitle></CardHeader><CardContent>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm"><div><span className="text-muted-foreground block">Plan</span><span className="font-semibold text-lg">{sub?.plan_name??''}</span></div><div><span className="text-muted-foreground block">Base Plan Monthly Cost</span><span className="font-semibold text-lg">{sub?money(Number(sub.monthly_price)):''}</span></div><div><span className="text-muted-foreground block">Next Billing Date</span><span>{sub?.next_billing_date??''}</span></div><div><span className="text-muted-foreground block">Payment Method</span><CreditCard className="w-4 h-4 text-muted-foreground"/></div></div>
 <div className="mt-4 flex flex-wrap gap-3">
 {query.data&&!sub?<Button onClick={()=>open('START')}>Choose Plan</Button>:<><Button disabled={!active||!sub?.auto_renewal||!plans.some(p=>Number(p.monthly_price)>Number(sub?.monthly_price))} onClick={()=>open('UPGRADE')}>Upgrade Plan</Button><Button variant="outline" disabled={!active||!sub?.auto_renewal||!plans.some(p=>Number(p.monthly_price)<Number(sub?.monthly_price))} onClick={()=>open('DOWNGRADE')}>Downgrade Plan</Button></>}
 </div>
 {sub&&<p className="mt-4 text-sm"><Badge>{!active?'Cancelled':!sub.auto_renewal?'Cancellation scheduled':'Active'}</Badge> {active&&<>Current period ends {sub.current_period_end}. Amount billed this period: {money(Number(sub.current_period_price))}. {sub.auto_renewal&&<>Next renewal: {money(Number(sub.monthly_price))}.</>}</>}</p>}
 {query.data&&!sub&&<p className="mt-3 text-sm">No subscription for this store yet.</p>}
 {sub?.auto_renewal&&active&&<p className="mt-3 text-sm">Next renewal including add-ons: {money(Number(sub.monthly_price)+(query.data?.addons??[]).filter(a=>a.active&&!a.cancel_at_period_end).reduce((total,a)=>total+Number(a.monthly_price),0))}.</p>}
 <p className="mt-3 text-xs text-muted-foreground">Amounts are USD. Payment collection and tax calculation are not connected; invoices are recorded as due.</p>
 </CardContent></Card>

 <Card><CardHeader><CardTitle className="text-lg">Add-ons</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Add-on</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{query.data?.addons?.map(a=><TableRow key={a.addon_id}><TableCell>{a.name}<p className="text-xs text-muted-foreground">{a.description}</p></TableCell><TableCell>{money(Number(a.monthly_price))}/month</TableCell><TableCell>{a.active?(a.cancel_at_period_end?'Ends at period end':'Active'):'Not added'}</TableCell><TableCell><Button variant="outline" disabled={!active||!sub?.auto_renewal||a.cancel_at_period_end&&a.active} onClick={()=>{open(a.active?'ADDON_CANCEL':'ADDON_ADD');setPlanId(String(a.addon_id));}}>{a.active?'Cancel add-on':'Add'}</Button></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
 <Card><CardHeader><CardTitle className="text-lg">Invoices History</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Invoice #</TableHead><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Download</TableHead></TableRow></TableHeader><TableBody>
 {query.data?.invoices.map(i=><TableRow key={i.invoice_id}><TableCell className="font-mono text-xs">{i.invoice_number}<span className="block font-sans">{i.plan_name_snapshot} · {i.invoice_kind}</span></TableCell><TableCell>{i.invoice_date}</TableCell><TableCell>{money(Number(i.total_amount))}</TableCell><TableCell><Badge variant="secondary">{i.dgt_invoice_status}</Badge></TableCell><TableCell><Button disabled variant="ghost" size="icon" aria-label="Invoice document not available"><Download className="w-4 h-4"/></Button></TableCell></TableRow>)}
 {query.data?.invoices.length===0&&<TableRow><TableCell colSpan={5}>No invoices yet.</TableCell></TableRow>}
 </TableBody></Table><p className="text-xs text-muted-foreground mt-2">Invoice documents are not generated yet.</p></CardContent></Card>
 <Card><CardContent className="pt-6 flex items-center justify-between"><div><p className="font-medium text-sm">Cancel Subscription</p><p className="text-xs text-muted-foreground">Cancel at the end of the current billing period. No refund or credit.</p></div><Button variant="destructive" size="sm" disabled={!active||!sub?.auto_renewal} onClick={()=>open('CANCEL')}>Cancel Subscription</Button></CardContent></Card>
 <Dialog open={!!mode} onOpenChange={v=>{if(!v&&!busy)setMode('');}}><DialogContent><DialogHeader><DialogTitle>{addonMode?(mode==='ADDON_ADD'?'Add add-on':'Cancel add-on'):mode==='CANCEL'?'Cancel Subscription':mode==='START'?'Choose Plan':mode==='UPGRADE'?'Upgrade Plan':'Downgrade Plan'}</DialogTitle><DialogDescription>{addonMode?(mode==='ADDON_ADD'?'Full monthly price is due now, then on each subscription renewal. No payment is collected.':'This add-on remains active until the current billing period ends. No refund or credit.'):mode==='CANCEL'?`Your subscription remains active until ${sub?.current_period_end}. No further renewal will be invoiced.`:'Plan selection changes immediately. Upgrade differences are billed now; downgrades receive no credit and reduce the next renewal price.'}</DialogDescription></DialogHeader>
 {addonMode&&addon&&<p>{addon.name}: {money(Number(addon.monthly_price))}/month. {mode==='ADDON_ADD'?'Due now: '+money(Number(addon.monthly_price)): 'Ends '+sub?.current_period_end}</p>}
 {mode!=='CANCEL'&&!addonMode&&<><label>Plan<select className="block border rounded p-2 w-full bg-background" value={planId} disabled={busy} onChange={e=>{setPlanId(e.target.value);setKey(crypto.randomUUID());}}><option value="">Select a plan</option>{choices.map(p=><option key={p.subscription_plan_id} value={p.subscription_plan_id}>{p.plan_name} — {money(Number(p.monthly_price))}/month</option>)}</select></label>{plan&&<p>Due now: {money(due)}. Next monthly renewal: {money(Number(plan.monthly_price))}. Amounts already billed this period are not charged again.</p>}</>}
 {error&&<p role="alert" className="text-destructive">{error}</p>}<div className="flex gap-2"><Button disabled={busy||(mode!=='CANCEL'&&!planId)} onClick={save}>{busy?'Saving…':'Confirm'}</Button><Button variant="outline" disabled={busy} onClick={()=>setMode('')}>Cancel</Button></div>
 </DialogContent></Dialog>
 </div>;
};
