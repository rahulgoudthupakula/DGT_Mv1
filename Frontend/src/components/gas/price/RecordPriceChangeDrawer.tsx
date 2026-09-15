import { useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DollarSign, Fuel } from "lucide-react";
import { toast } from "sonner";

import {request} from '@/lib/backend';
import {type PriceData,priceText} from './gasPriceData';
interface RecordPriceChangeDrawerProps {children:React.ReactNode;path:string;data:PriceData;onSaved:(data:PriceData)=>void;}
export const RecordPriceChangeDrawer=({children,path,data,onSaved}:RecordPriceChangeDrawerProps)=>{
 const [open,setOpen]=useState(false),[selectedFuel,setSelectedFuel]=useState('');
 const [cash,setCash]=useState(''),[credit,setCredit]=useState(''),[reason,setReason]=useState(''),[notes,setNotes]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[loadFailed,setLoadFailed]=useState(false);
 const [snapshot,setSnapshot]=useState(data);
 const [effectiveTime,setEffectiveTime]=useState('now'),[scheduledFor,setScheduledFor]=useState(''),[overlapChoice,setOverlapChoice]=useState('');
 const token=useRef({body:'',key:crypto.randomUUID()});
 const currentRows=snapshot.history.filter(p=>p.gradeId===selectedFuel&&p.current);
 const currentFuel=currentRows.length===1?currentRows[0]:null;
 function selectGrade(grade:string,base=snapshot){setSelectedFuel(grade);const current=base.history.filter(p=>p.gradeId===grade&&p.current);setCash(current.length===1?String(current[0].cash):'');setCredit(current.length===1?String(current[0].credit):'');setError('');}
 async function changeOpen(value:boolean){
  if(busy)return;
  if(!value){setOpen(false);return;}
  setOpen(true);setBusy(true);setError('');setLoadFailed(false);setReason('');setNotes('');setEffectiveTime('now');setScheduledFor('');setOverlapChoice('');token.current={body:'',key:crypto.randomUUID()};
  try{const fresh=await request<PriceData>(path);onSaved(fresh);setSnapshot(fresh);selectGrade(fresh.grades[0]?.id??'',fresh);}
  catch(e){setLoadFailed(true);setError(e instanceof Error?e.message:'Could not load current prices');}finally{setBusy(false);}
 }
 async function handleSave(){setBusy(true);setError('');try{
  if(!selectedFuel||cash.trim()===''||credit.trim()===''||!Number.isFinite(Number(cash))||!Number.isFinite(Number(credit))||Number(cash)<=0||Number(credit)<=0)throw Error('Select a grade and enter positive cash and credit prices.');
  if(effectiveTime==='scheduled'&&!scheduledFor)throw Error('Enter a scheduled date and time.');
  const body=JSON.stringify({gradeId:selectedFuel,cash:Number(cash),credit:Number(credit),reason,notes,effectiveTime,scheduledFor:effectiveTime==='scheduled'?scheduledFor:null,overlapChoice:effectiveTime==='scheduled'?overlapChoice:null});
  if(token.current.body!==body)token.current={body,key:crypto.randomUUID()};
  const saved=await request<PriceData>(path,{method:'POST',headers:{'If-Match':currentFuel?`${currentFuel.id}:${currentFuel.version}`:'0','Idempotency-Key':token.current.key},body});
  onSaved(saved);toast.success(effectiveTime==='scheduled'?'Price change scheduled':'Selling prices saved');setOpen(false);
 }catch(e){setError(e instanceof Error?e.message:'Could not save price');}finally{setBusy(false);}}

  return (
    <Sheet open={open} onOpenChange={changeOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4 text-primary" />
            Record Price Change
          </SheetTitle>
        </SheetHeader>

        {error&&<p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        <fieldset disabled={busy} className="space-y-5 mt-6">
          {/* Fuel Type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Fuel Type</Label>
            <Select disabled={busy} value={selectedFuel} onValueChange={v=>selectGrade(v)}>
              <SelectTrigger aria-label="Fuel grade" className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {snapshot.grades.map((f) => (<SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Price (read-only) */}
          <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fuel className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Current Price</span>
            </div>
            <span className="text-sm font-bold">{priceText(currentFuel?.cash)} cash / {priceText(currentFuel?.credit)} credit</span>
          </div>

          {/* New Price */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">New Cash Price / Gallon</Label>
            <Input
              type="number"
              step="0.001"
              placeholder="0.000"
              aria-label="New cash price" value={cash}
              onChange={(e) => setCash(e.target.value)}
              className="h-9 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5"><Label className="text-xs font-medium">New Credit Price / Gallon</Label><Input aria-label="New credit price" type="number" step="0.001" placeholder="0.000" value={credit} onChange={e=>setCredit(e.target.value)} className="h-9 text-xs font-mono"/></div>
          {/* Effective Time */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Effective Time</Label>
            <RadioGroup value={effectiveTime} onValueChange={setEffectiveTime} className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="now" id="now" />
                <Label htmlFor="now" className="text-xs cursor-pointer">Now</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="scheduled" id="scheduled" />
                <Label htmlFor="scheduled" className="text-xs cursor-pointer">Scheduled</Label>
              </div>
            </RadioGroup>
          </div>

          {effectiveTime==='scheduled'&&<div className="space-y-2"><Label className="text-xs font-medium">Scheduled date &amp; time ({snapshot.timezone})</Label><Input aria-label="Scheduled date and time" type="datetime-local" step="1" value={scheduledFor} onChange={e=>setScheduledFor(e.target.value)} className="h-9 text-xs"/><p className="text-xs text-muted-foreground">Current prices remain until this time. One upcoming change per fuel grade.</p><details className="text-xs"><summary>Repeated clock time (daylight saving)</summary><Select value={overlapChoice} onValueChange={setOverlapChoice}><SelectTrigger aria-label="Repeated clock time"><SelectValue placeholder="Choose only if the time occurs twice"/></SelectTrigger><SelectContent><SelectItem value="earlier">First occurrence</SelectItem><SelectItem value="later">Second occurrence</SelectItem></SelectContent></Select></details></div>}
          {/* Reason */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Reason <span className="text-muted-foreground">(recommended)</span></Label>
            <Select disabled={busy} value={reason} onValueChange={setReason}>
              <SelectTrigger aria-label="Price change reason" className="h-9 text-xs">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="market">Market change</SelectItem>
                <SelectItem value="competitor">Competitor adjustment</SelectItem>
                <SelectItem value="cost">Cost increase</SelectItem>
                <SelectItem value="promotion">Promotion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Notes <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              aria-label="Price change notes" placeholder="Additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs min-h-[60px]"
            />
          </div>

          {/* POS Note */}
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
            <p className="text-[11px] text-yellow-700">
              Applies in DGT now or at your chosen store-local time. POS sending is not connected. Delivery receipts do not change selling prices.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button disabled={busy||loadFailed||currentRows.length>1} size="sm" className="flex-1 text-xs" onClick={handleSave}>{busy?'Saving…':effectiveTime==='scheduled'?'Save & Schedule':'Save Price Change'}</Button>
            <Button disabled={busy} size="sm" variant="outline" className="flex-1 text-xs" onClick={()=>changeOpen(false)}>Cancel</Button>
          </div>
        </fieldset>
      </SheetContent>
    </Sheet>
  );
};
