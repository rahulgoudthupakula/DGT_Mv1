import { Fuel, Clock, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type PriceData, localDateTime, priceDay, priceText } from './gasPriceData';
export const CurrentPricesPanel = ({data}:{data:PriceData}) => {
 const ids=new Set([...data.assignedGrades,...data.history.map(p=>p.gradeId)]);
 if(ids.size===0)return <p className="text-sm text-muted-foreground">{data.grades.length?'No selling prices recorded for this store. Use Record Price Change to set its first prices.':'Add fuel grades in Gas Settings first, then record selling prices for this store.'}</p>;
 const today=priceDay(new Date().toISOString(),data.timezone);
 return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from(ids).map(id=>{
  const rows=data.history.filter(p=>p.gradeId===id),active=rows.filter(p=>p.current),current=active.length===1?active[0]:null;
  const name=data.grades.find(g=>g.id===id)?.name||rows[0]?.gradeName||'Fuel grade';
  const upcoming=rows.find(p=>p.status==='SCHEDULED');
  const count=rows.filter(p=>p.status!=='CANCELLED'&&new Date(p.effectiveFrom).getTime()<=Date.now()&&priceDay(p.effectiveFrom,data.timezone)===today).length;
  const label=active.length>1?'Needs review':!current?'Not set':count>1?'Multiple Changes':count===1?'Changed Today':'Stable';
  const color=active.length>1||count>1?'text-destructive bg-destructive/10':count===1?'text-yellow-600 bg-yellow-500/10':'text-emerald-600 bg-emerald-500/10';
  return <Card key={id} className="relative overflow-hidden"><div className={`absolute top-0 left-0 right-0 h-1 ${active.length>1||count>1?'bg-destructive':count===1?'bg-yellow-500':'bg-emerald-500'}`}/><CardContent className="pt-5 pb-4 px-4 space-y-3">
   <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Fuel className="h-4 w-4 text-primary"/><span className="text-sm font-semibold">{name}</span></div><Badge variant="outline" className={`text-[10px] border-0 ${color}`}>{label}</Badge></div>
   <div className="text-2xl font-bold">{priceText(current?.cash)}<span className="text-xs font-normal text-muted-foreground ml-1">Cash /gal</span></div>
   <div className="text-lg font-semibold">{priceText(current?.credit)}<span className="text-xs font-normal text-muted-foreground ml-1">Credit /gal</span></div>
   {current&&<div className="space-y-1"><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3 w-3"/>{localDateTime(current.effectiveFrom,data.timezone)}</div><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><User className="h-3 w-3"/>{current.actor}</div></div>}
  {upcoming&&<p className="text-xs text-muted-foreground">Scheduled: {priceText(upcoming.cash)} cash / {priceText(upcoming.credit)} credit at {localDateTime(upcoming.effectiveFrom,data.timezone)}</p>}
  </CardContent></Card>;
 })}</div>;
};
