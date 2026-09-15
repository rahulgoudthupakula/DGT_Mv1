import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Tabs,TabsContent,TabsList,TabsTrigger} from '@/components/ui/tabs';
import {ArrowLeft,Save,Lock,Printer,Download} from 'lucide-react';
import {request} from '@/lib/backend';
import {type ClosingDay,closingPath,exportClosing} from '../closingData';
import {money} from '@/components/live-counter/liveActivityData';
import {type CashForm} from './ConnectedClosingMoney';
import {MoneyInSection} from './MoneyInSection';
import {MoneyOutSection} from './MoneyOutSection';
import {NotNeededTab} from './NotNeededTab';
import {ClosingFieldContext,type ClosingFieldValue} from './ClosingFieldContext';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {reconciliationFields,nonnegativeReadings,readingNote} from './reconciliationFields';
import {Input} from '@/components/ui/input';
export function StoreEditDayPage({storeId,day,month,year,onBack}:{storeId:string;day:number;month:number;year:number;status:'draft'|'closed'|'issue';onBack:()=>void}){
 const date=`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
 const q=useQuery({queryKey:['closing-day',storeId,date],queryFn:()=>request<ClosingDay>(closingPath(storeId)+'/'+date),refetchOnWindowFocus:false});
 if(q.isPending)return <p>Loading business date…</p>;if(q.error)return <p role="alert">{q.error.message}<Button onClick={onBack}>Back</Button></p>;
 return <Editor key={q.data.version+q.data.sourceToken} data={q.data} storeId={storeId} onBack={onBack} reload={()=>q.refetch()}/>;
}
function Editor({data,storeId,onBack,reload}:{data:ClosingDay;storeId:string;onBack:()=>void;reload:()=>unknown}){
 const [form,setForm]=useState<CashForm>({openingCash:data.openingCash==null?'':String(data.openingCash),cashAdded:String(data.cashAdded),cashDrops:String(data.cashDrops),payouts:String(data.payouts),actualCash:data.actualCash==null?'':String(data.actualCash),notes:data.notes});
 const [readings,setReadings]=useState<Record<string,string>>(()=>Object.fromEntries([...Object.values(reconciliationFields),'deposit_cash','deposit_checks'].map(k=>[k,data.reconciliation?.[k]==null?'':String(data.reconciliation[k])])));
 const reading=(key:string)=>Number(readings[key]||0);
 const cashOut=reading('cash_purchases')+reading('pending_invoices_paid')+reading('deposit_cash');
 const [saving,setSaving]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false);
 const [sourceView,setSourceView]=useState<{label:string;source:string}|null>(null),[cashDetails,setCashDetails]=useState(false);
 const closed=data.status==='CLOSED';const cash=data.source.tenders.filter(t=>t.code==='CASH').reduce((s,t)=>s+Number(t.amount),0);
 const checkPayments=data.source.tenders.filter(t=>['CHECK','CHECKS','CHEQUE','CHEQUES'].includes(t.code)).reduce((s,t)=>s+Number(t.amount),0);
 const expectedChecks=Number((reading('opening_checks')+checkPayments-reading('deposit_checks')).toFixed(2));
 const checksKnown=readings.opening_checks!==''&&readings.closing_checks!=='';
 const expected=Number((Number(form.openingCash)+cash+Number(form.cashAdded)-Number(form.cashDrops)-Number(form.payouts)-cashOut).toFixed(2));
 const valid=['openingCash','cashAdded','cashDrops','payouts','actualCash'].every(k=>/^\d+(\.\d{1,2})?$/.test(form[k as keyof CashForm]))&&expected>=0&&(reading('deposit_checks')===0||(readings.opening_checks!==''&&expectedChecks>=0))&&Object.entries(readings).every(([key,value])=>value===''||((nonnegativeReadings.has(key)?/^\d+(\.\d{1,2})?$/:/^-?\d+(\.\d{1,2})?$/).test(value)&&Math.abs(Number(value))<=9999999999.99));
 const save=async(close:boolean)=>{setSaving(true);setError('');try{await request(closingPath(storeId)+'/'+data.date,{method:'PUT',body:JSON.stringify({...form,reconciliation:Object.fromEntries(Object.entries(readings).map(([k,v])=>[k,v===''?null:Number(v)])),openingCash:Number(form.openingCash),cashAdded:Number(form.cashAdded),cashDrops:Number(form.cashDrops),payouts:Number(form.payouts),actualCash:Number(form.actualCash),version:data.version,sourceToken:data.sourceToken,close})});setSaved(true);reload();}catch(e){setError((e as Error).message);}finally{setSaving(false);}};
 const update=(key:keyof CashForm,value:string)=>{setForm(f=>({...f,[key]:value}));setSaved(false);};
 const sourceNote=`${data.date} · ${data.timezone} · ${data.status==='CLOSED'?'Saved closing snapshot':'Recorded sales'}; amounts retain the source tax treatment.`;
 const fixed=(value:number,source=sourceNote):ClosingFieldValue=>({value:Number(value).toFixed(2),source});
 const editable=(key:keyof CashForm):ClosingFieldValue=>({value:form[key],onChange:value=>update(key,value),source:`Saved daily cash record for ${data.date}${data.isSample?' (sample cash activity)':''}.`});
 const fields:Record<string,ClosingFieldValue>={
 'Sales Tax':fixed(data.source.stats.tax),
 'Total Gas Volume':{value:Number(data.source.stats.gasVolume).toLocaleString('en-US',{maximumFractionDigits:3}),source:sourceNote+' Net gallons sold, after fuel returns.'},
 'Total Fuel Amount Sold':fixed(data.source.breakdown.gasSales),
 'Total Merchandise Sales':fixed(Number(data.source.breakdown.taxable)+Number(data.source.breakdown.nonTaxable),sourceNote+' Merchandise excludes fuel and lottery; total is before tax.'),
 'Opening Cash':editable('openingCash'),
 'Cash Expenses':editable('payouts'),
 'Closing Cash':editable('actualCash'),
 };
 const updateReading=(key:string,value:string)=>{setReadings(r=>({...r,[key]:value}));setSaved(false);};
 for(const [label,key] of Object.entries(reconciliationFields)) fields[label]={value:readings[key],onChange:value=>updateReading(key,value),source:readingNote(key)};
 for(const [label,value] of Object.entries(data.source.closingDetails?.fields??{})) fields[label]={...fixed(value,sourceNote+' Breakdown uses the item department, selling unit and recognized fuel grade name. EBT and fleet amounts are recorded payments, not settlement confirmations.'),value:label.includes('Volume')||label.endsWith('Count')?Number(value).toLocaleString('en-US',{maximumFractionDigits:3}):Number(value).toFixed(2)};
 const depositTotal=reading('deposit_cash')+reading('deposit_checks')+Number(data.reconciliation?.other_deposits||0);
 fields['Total Deposits']=fixed(depositTotal,'Recorded bank deposits. Use the source button to enter the cash and checks deposited directly from this closing drawer. Exclude money already recorded as a cash drop to the safe.');
 if(readings.opening_checks!==''&&form.openingCash!=='')fields['Total Opening Amount']=fixed(Number(form.openingCash)+reading('opening_checks'),'Opening cash plus opening checks.');
 if(readings.closing_checks!==''&&form.actualCash!=='')fields['Total Closing Amount']=fixed(Number(form.actualCash)+reading('closing_checks'),'Counted closing cash plus checks.');
 // Old closed snapshots retain their original detail availability.

 const scratch=data.source.departments.filter(d=>/scratch/i.test(d.name));
 if(!data.source.closingDetails&&scratch.length)fields['Scratch-off Sales']=fixed(scratch.reduce((s,d)=>s+Number(d.amount),0));
 const paymentTotal=data.source.tenders.reduce((s,t)=>s+Number(t.amount),0);
 return <div className="flex flex-col min-h-[calc(100vh-120px)]"><div className="sticky top-0 z-20 bg-background border-b pb-3 pt-1 mb-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4"/></Button><div><h1 className="text-lg font-bold">Business Date Details</h1><p className="text-sm text-muted-foreground">{new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}).format(new Date(data.date+'T12:00:00'))}</p></div><Badge>{data.status}</Badge>{data.isSample&&<Badge variant="outline">Sample cash activity</Badge>}</div><div className="flex gap-2"><Button variant="outline" size="sm" disabled={closed||saving||!valid} onClick={()=>save(false)}><Save className="h-4 w-4 mr-2"/>Save Draft</Button><Button size="sm" disabled={closed||saving||!valid} onClick={()=>save(true)}><Lock className="h-4 w-4 mr-2"/>Close Day</Button><Button variant="outline" size="sm" onClick={()=>setCashDetails(true)}>Cash Details</Button><Button variant="ghost" size="icon" aria-label="Print closing" onClick={()=>window.print()}><Printer className="h-4 w-4"/></Button><Button variant="ghost" size="icon" aria-label="Export closing" onClick={()=>exportClosing([data])}><Download className="h-4 w-4"/></Button></div></div></div>
 {!valid&&!closed&&<p className="text-xs text-amber-700 mb-3">Enter opening and counted cash, valid amounts, and sufficient cash/check balances for the recorded payments and deposits.</p>}
 {error&&<p role="alert" className="text-destructive">{error}<Button variant="link" onClick={()=>reload()}>Reload saved data</Button></p>}{saved&&<p role="status">Closing saved.</p>}
 <p className="text-xs text-muted-foreground mb-4">{closed?'Closed report: saved sales and payment totals are preserved.':'Sales and payment totals come from recorded transactions. Enter the day’s counted cash and cash movements.'} Card settlements and lottery statement readings save separately from POS sales. Z Reading awaits POS data. Short/Over includes checks when both check balances are entered.</p>
 {data.carryForwardDate&&<p className="text-xs text-muted-foreground mb-3">Opening cash and checks carried from the closed report for {data.carryForwardDate}. Review any counting differences before saving.</p>}
 {(!data.source.closingDetails||data.source.closingDetails.warnings.length>0)&&<p className="text-xs text-amber-700 mb-3">{data.source.closingDetails?.warnings.join(' ')??'This older closed report did not capture the detailed sales breakdown. Its saved totals are preserved.'}</p>}
 <ClosingFieldContext.Provider value={{fields,locked:closed||saving,showSource:(label,source)=>setSourceView({label,source})}}>
 <Tabs defaultValue="daily" className="flex-1"><TabsList className="mb-4"><TabsTrigger value="daily">Daily Report</TabsTrigger><TabsTrigger value="other">Not Needed for Daily Report</TabsTrigger></TabsList><TabsContent value="daily"><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><MoneyInSection/><MoneyOutSection/></div></TabsContent><TabsContent value="other"><NotNeededTab/></TabsContent></Tabs>
 </ClosingFieldContext.Provider>
 <Dialog open={sourceView!==null} onOpenChange={open=>{if(!open)setSourceView(null);}}><DialogContent><DialogHeader><DialogTitle>{sourceView?.label}</DialogTitle><DialogDescription>{sourceView?.source}</DialogDescription></DialogHeader>{sourceView?.label==='Total Deposits'&&<><label className="text-sm">Cash deposited from drawer<Input aria-label="Cash deposited from drawer" value={readings.deposit_cash} readOnly={closed||saving} onChange={e=>updateReading('deposit_cash',e.target.value)}/></label><label className="text-sm">Checks deposited from drawer<Input aria-label="Checks deposited from drawer" value={readings.deposit_checks} readOnly={closed||saving} onChange={e=>updateReading('deposit_checks',e.target.value)}/></label><p className="text-xs text-muted-foreground">Other recorded deposits: {money(Number(data.reconciliation?.other_deposits||0))}. Use Save Draft or Close Day to save entries. This records the deposit; it does not initiate a bank transfer.</p><Button onClick={()=>setSourceView(null)}>Done</Button></>}</DialogContent></Dialog>
 <Dialog open={cashDetails} onOpenChange={setCashDetails}><DialogContent><DialogHeader><DialogTitle>Cash Details</DialogTitle><DialogDescription>Saved drawer adjustments. Cash drops are transfers to the safe, not bank deposits.</DialogDescription></DialogHeader>{(['cashAdded','cashDrops'] as const).map(key=><label key={key} className="space-y-2 text-sm">{key==='cashAdded'?'Cash Added':'Cash Drops'}<Input aria-label={key==='cashAdded'?'Cash Added':'Cash Drops'} type="number" min="0" step="0.01" disabled={closed||saving} value={form[key]} onChange={e=>update(key,e.target.value)}/></label>)}<label className="space-y-2 text-sm">Notes<textarea aria-label="Closing Notes" className="border rounded-md w-full p-3 bg-background" maxLength={2000} disabled={closed||saving} value={form.notes} onChange={e=>update('notes',e.target.value)}/></label><p className="text-sm">Expected Checks: <strong>{readings.opening_checks===''?'—':money(expectedChecks)}</strong></p><p className="text-sm">Expected Cash: <strong>{form.openingCash===''?'—':money(expected)}</strong></p><Button onClick={()=>setCashDetails(false)}>Done</Button><p className="text-xs text-muted-foreground">Use Save Draft or Close Day to save changes.</p></DialogContent></Dialog>

 <div className="sticky bottom-0 z-20 bg-background border-t mt-6 py-3 flex flex-wrap gap-6 text-sm">{[['Z Reading','—'],['Total Money In',money(Number(form.openingCash)+paymentTotal+Number(form.cashAdded)+(checksKnown?reading('opening_checks'):0))],['Total Money Out',form.actualCash===''?'—':money(paymentTotal-cash+Number(form.payouts)+Number(form.cashDrops)+cashOut+Number(form.actualCash)+(checksKnown?reading('closing_checks')+reading('deposit_checks')-checkPayments:0))],['Short/Over',form.actualCash===''||form.openingCash===''?'—':money(Number(form.actualCash)-expected+(checksKnown?reading('closing_checks')-expectedChecks:0))]].map(([label,value])=><div key={label}><span className="text-muted-foreground">{label}: </span><strong>{value}</strong></div>)}</div></div>;
}
