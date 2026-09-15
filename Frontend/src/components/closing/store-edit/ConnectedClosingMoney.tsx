import {Accordion,AccordionContent,AccordionItem,AccordionTrigger} from '@/components/ui/accordion';
import {Input} from '@/components/ui/input';
import {type ClosingDay,isFuel} from '../closingData';
import {money} from '@/components/live-counter/liveActivityData';
export type CashForm={openingCash:string;cashAdded:string;cashDrops:string;payouts:string;actualCash:string;notes:string};
export function ConnectedClosingMoney({data,form,onChange,disabled}:{data:ClosingDay;form:CashForm;onChange:(key:keyof CashForm,value:string)=>void;disabled:boolean}){
 const row=(label:string,value:string)=><div key={label} className="flex justify-between gap-3 py-2 text-sm"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
 const section=(id:string,title:string,children:React.ReactNode)=><AccordionItem value={id} className="border rounded-lg px-3"><AccordionTrigger className="text-sm py-2.5 hover:no-underline">{title}</AccordionTrigger><AccordionContent>{children}</AccordionContent></AccordionItem>;
 const field=(key:keyof CashForm,label:string)=><label className="flex justify-between items-center gap-4 py-2 text-sm">{label}<Input aria-label={label} className="w-36 text-right" type="number" min="0" step="0.01" value={form[key]} disabled={disabled} onChange={e=>onChange(key,e.target.value)}/></label>;
 return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div><h3 className="text-sm font-bold text-primary uppercase tracking-wide mb-2">💰 Money In</h3><Accordion type="multiple" defaultValue={['merch','cash-in','tenders']} className="space-y-1">
 {section('merch','Merchandise Sales',data.source.departments.filter(d=>!isFuel(d.name)).map(d=>row(d.name,money(d.amount))))}
 {section('tax','Sales Tax',row('Tax included in recorded sales',money(data.source.stats.tax)))}
 {section('fuel','Fuel Sold',<>{row('Total Fuel Sold (Gallons)',`${data.source.stats.gasVolume.toLocaleString()} gal`)}{data.source.departments.filter(d=>isFuel(d.name)).map(d=>row(d.name,money(d.amount)))}</>)}
 {section('tenders','Recorded Payments',<>{data.source.tenders.map(t=>row(t.name,money(t.amount)))}<p className="text-xs text-muted-foreground">Recorded payments, not bank settlement confirmation. Refunds are already deducted.</p></>)}
 {section('cash-in','Store Opening Amount',<>{field('openingCash','Opening Cash')}{field('cashAdded','Cash Added')}<p className="text-xs text-muted-foreground">Opening cash is the counted float for this day; it is not sales revenue.</p></>)}
 </Accordion></div><div><h3 className="text-sm font-bold text-destructive uppercase tracking-wide mb-2">💸 Money Out</h3><Accordion type="multiple" defaultValue={['drops','expenses','closing']} className="space-y-1">
 {section('drops','Cash Drops',<>{field('cashDrops','Cash Drops')}<p className="text-xs text-muted-foreground">Cash moved from the drawer to the safe. Bank deposit processing is separate.</p></>)}
 {section('expenses','Other Money Paid',field('payouts','Cash Payouts / Expenses'))}
 {section('closing','Closing Amount',<>{field('actualCash','Counted Closing Cash')}<p className="text-xs text-muted-foreground">Count after recorded payouts and cash drops.</p></>)}
 {section('notes','Notes',<textarea aria-label="Closing Notes" className="w-full border rounded-md p-3 bg-background" rows={4} maxLength={2000} disabled={disabled} value={form.notes} onChange={e=>onChange('notes',e.target.value)}/>)}
 </Accordion></div></div>;
}
