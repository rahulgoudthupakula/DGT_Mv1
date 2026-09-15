import { useEffect, useRef, useState } from "react";
import { Upload, FileText, AlertTriangle, Plus, Trash2, PenLine, ScanLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

import { request } from '@/lib/backend';
import { assignmentOn, type BolHeader, type BolLine, type Delivery, type DeliveryOptions } from './gasDeliveryData';

interface AddDeliveryDialogProps {
  storeId: string;
  options: DeliveryOptions;
  delivery: Delivery|null;
  today: string;
  canEdit: boolean;
  canReceive: boolean;
  onSaved: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "choose" | "upload" | "processing" | "manual";

const emptyLine = (): BolLine => ({
  key: crypto.randomUUID(),
  productCode: "",
  description: "",
  octane: "",
  grossGallons: "",
  netGallons: "",
  temperature: "",
  gravity: "",
  meter: "",
  compartment: "",
  tank: "",
  gradeId: "",
});

export const AddDeliveryDialog = ({ open, onOpenChange, storeId, options, delivery, today, canEdit, canReceive, onSaved }: AddDeliveryDialogProps) => {
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [readOnly,setReadOnly]=useState(!!delivery);
  const requestToken=useRef({body:'',key:crypto.randomUUID()});
  const [step, setStep] = useState<Step>("choose");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const [header, setHeader] = useState<BolHeader>({
    bolNumber: "",
    folio: "",
    loadDate: today,
    loadTime: "",
    terminal: "",
    supplier: "",
    customer: "",
    destination: "",
    carrier: "",
    driver: "",
    tractor: "",
    trailer: "",
    notes: "",
  });
  const [lines, setLines] = useState<BolLine[]>([emptyLine()]);

  useEffect(()=>{
    if(!open)return;
    setError('');setReadOnly(!!delivery);setStep(delivery?'manual':'choose');
    if(delivery){setHeader({...delivery.header});setLines(delivery.lines.map(l=>({...l,octane:l.octane==null?'':String(l.octane),grossGallons:String(l.grossGallons),netGallons:String(l.netGallons),temperature:l.temperature==null?'':String(l.temperature),gravity:l.gravity==null?'':String(l.gravity)})));}
    else {setHeader({bolNumber:'',folio:'',loadDate:today,loadTime:'',terminal:'',supplier:'',customer:'',destination:'',carrier:'',driver:'',tractor:'',trailer:'',notes:''});setLines([emptyLine()]);}
  },[open,delivery,today]);
  const tankOptions=options.tanks.flatMap(t=>{const grade=assignmentOn(t,header.loadDate);return grade?[{...t,grade,label:`Tank ${t.number} — ${grade.gradeName}`}]:[];});
  async function save(receive:boolean){
    setError('');setBusy(true);
    try {
      const path=`/access/stores/${encodeURIComponent(storeId)}/gas-deliveries`;
      if(readOnly&&delivery){await request(path+`/${delivery.id}/receive`,{method:'POST',headers:{'If-Match':delivery.version}});}
      else {
        if(!header.bolNumber.trim()||!header.supplier||!header.loadDate)throw Error('Enter the BOL number, load date and supplier.');
        const values=lines.map(l=>{
          const tank=tankOptions.find(t=>t.id===l.tank);
          if(!tank||!l.description.trim())throw Error('Each line needs a description and a tank assigned on the load date.');
          const number=(v:string,label:string,required=false)=>{if(v.trim()===''){if(required)throw Error(`Enter ${label}.`);return null;}const n=Number(v);if(!Number.isFinite(n)||(required&&n<=0))throw Error(`Enter valid ${label}.`);return n;};
          return {...l,gradeId:tank.grade.gradeId,octane:number(l.octane,'octane'),grossGallons:number(l.grossGallons,'gross gallons',true),netGallons:number(l.netGallons,'net gallons',true),temperature:number(l.temperature,'temperature'),gravity:number(l.gravity,'gravity')};
        });
        const body=JSON.stringify({header:{...header,loadTime:header.loadTime||null},lines:values,receive});
        if(requestToken.current.body!==body)requestToken.current={body,key:crypto.randomUUID()};
        await request(path+(delivery?`/${delivery.id}`:''),{method:delivery?'PUT':'POST',headers:{'Idempotency-Key':requestToken.current.key,...(delivery?{'If-Match':delivery.version}:{})},body});
      }
      toast({title:receive?'Delivery received':'Draft saved',description:receive?'Delivered gallons were recorded once in inventory movements.':'No inventory movement was posted.'});onSaved();
    }catch(e){setError(e instanceof Error?e.message:'Could not save delivery');}finally{setBusy(false);}
  }

  const totalGross = lines.reduce((s, l) => s + (parseFloat(l.grossGallons) || 0), 0);
  const totalNet = lines.reduce((s, l) => s + (parseFloat(l.netGallons) || 0), 0);

  const setLine = (key: string, patch: Partial<BolLine>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const resetAll = () => {
    setStep("choose");
    setUploadedFile(null);
    setParseError(null);
    setHeader({
      bolNumber: "", folio: "", loadDate: today, loadTime: "",
      terminal: "", supplier: "", customer: "", destination: "",
      carrier: "", driver: "", tractor: "", trailer: "", notes: "",
    });
    setLines([emptyLine()]);
  };

  const close = () => {
    if(busy)return;
    onOpenChange(false);
    resetAll();
  };

  const field = (label: string, value: string, onChange: (v: string) => void, opts?: { required?: boolean; placeholder?: string; type?: string }) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {label} {opts?.required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        className="h-9 text-xs"
        aria-label={label}
        type={opts?.type}
        placeholder={readOnly?"—":opts?.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className={cn("transition-all duration-300", step === "manual" ? "max-w-6xl" : "max-w-lg")}>
        <DialogHeader>
          <DialogTitle>
            {step === "choose" && "Add Delivery"}
            {step === "upload" && "Auto Fill — Upload BOL"}
            {step === "processing" && "Reading BOL…"}
            {step === "manual" && (delivery ? `BOL ${delivery.header.bolNumber} — ${delivery.status === "DRAFT" ? "Draft" : "Received"}` : "Bill of Lading Details")}
          </DialogTitle>
          <DialogDescription>
            {step === "choose" && "Choose how you'd like to record this fuel delivery."}
            {step === "upload" && "Choose a photo or PDF of the driver's BOL slip. Auto Fill is not connected in this design preview."}
            {step === "processing" && "Extracting the BOL header and product lines. Please wait."}
            {step === "manual" && (readOnly?"Saved BOL details and delivered quantities.":"Enter the delivery details and quantities exactly as printed on the BOL.")}
          </DialogDescription>
        </DialogHeader>

        {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
        {step === "choose" && (
          <div className="grid gap-3 py-4">
            <button
              disabled title="BOL photo reading is not connected yet"
              className="flex items-start gap-3 rounded-lg border border-input p-4 text-left opacity-60"
            >
              <ScanLine className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Auto Fill from BOL photo</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  BOL photo reading is not connected yet. Use Fill Manually for now.
                </p>
              </div>
            </button>
            <button
              onClick={() => setStep("manual")}
              className="flex items-start gap-3 rounded-lg border border-input p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/40"
            >
              <PenLine className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Fill Manually</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Type the BOL details in yourself.
                </p>
              </div>
            </button>
          </div>
        )}

        {step === "upload" && (
          <>
            <div className="space-y-4 py-4">
              <Label className="text-xs font-medium">BOL photo or PDF</Label>
              <label
                className={cn(
                  "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-4 py-8 cursor-pointer transition-colors",
                  uploadedFile ? "border-primary/50 bg-primary/5" : "border-input hover:border-primary/40 hover:bg-muted/30"
                )}
              >
                {uploadedFile ? (
                  <>
                    <FileText className="h-10 w-10 text-primary" />
                    <div className="text-center">
                      <p className="text-sm font-medium">{uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(uploadedFile.size / 1024).toFixed(1)} KB — click to change
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Drop file here or click to browse</p>
                      <p className="text-xs text-muted-foreground mt-0.5">PDF, JPG, PNG supported</p>
                    </div>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    setUploadedFile(e.target.files?.[0] ?? null);
                    setParseError(null);
                  }}
                />
              </label>
              {parseError && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
                  <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive">{parseError}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("choose")}>Back</Button>
              <Button variant="secondary" onClick={() => { setStep("manual"); setParseError(null); }}>
                Enter Manually
              </Button>
              <Button disabled title="BOL parsing will be connected after design review">
                <Upload className="h-4 w-4 mr-2" />
                Read BOL
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "processing" && (
          <div className="py-12 flex flex-col items-center gap-5">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-muted animate-spin border-t-primary" />
              <FileText className="h-6 w-6 text-primary absolute inset-0 m-auto" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">Scanning {uploadedFile?.name}</p>
              <p className="text-xs text-muted-foreground">Reading BOL #, terminal, driver, gallons and compartments…</p>
            </div>
          </div>
        )}

        {step === "manual" && (
          <>
            <div className="space-y-6 py-2 max-h-[70vh] overflow-y-auto pr-1">
              {delivery?.status==='RECEIVED'&&<p className="text-xs text-muted-foreground">Received {delivery.receivedAt?new Date(delivery.receivedAt).toLocaleString():''} by {delivery.receivedBy}. Receipt is recorded; this BOL is read-only.</p>}
              <fieldset disabled={busy||readOnly} className="space-y-6 min-w-0">
              {/* BOL header */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bill of Lading</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {field("BOL #", header.bolNumber, (v) => setHeader({ ...header, bolNumber: v }), { required: true, placeholder: "00001387 79" })}
                  {field("Folio #", header.folio, (v) => setHeader({ ...header, folio: v }), { placeholder: "02/015" })}
                  {field("Load Date", header.loadDate, (v) => setHeader({ ...header, loadDate: v }), { type: "date", required: true })}
                  {field("Load Time", header.loadTime, (v) => setHeader({ ...header, loadTime: v }), { type: "time" })}
                </div>
              </section>

              {/* Terminal & supplier */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Terminal & Supplier</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {field("Shipment Origin (Terminal)", header.terminal, (v) => setHeader({ ...header, terminal: v }), { placeholder: "3200 University Blvd" })}
                  <div className="space-y-1.5"><Label className="text-xs font-medium">Supplier <span className="text-destructive">*</span></Label><Select disabled={busy||readOnly} value={header.supplier} onValueChange={supplier=>setHeader({...header,supplier})}><SelectTrigger aria-label="Supplier" className="h-9 text-xs"><SelectValue placeholder="Select supplier"/></SelectTrigger><SelectContent>{options.vendors.map(v=><SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}{header.supplier&&!options.vendors.some(v=>v.id===header.supplier)&&<SelectItem value={header.supplier} disabled>{delivery?.vendorName||'Unavailable supplier'}</SelectItem>}</SelectContent></Select>{options.vendors.length===0&&<p className="text-xs text-muted-foreground">Add a vendor for this store in Vendor Management first.</p>}</div>
                  {field("Customer / Account", header.customer, (v) => setHeader({ ...header, customer: v }), { placeholder: "Account #" })}
                  {field("Destination", header.destination, (v) => setHeader({ ...header, destination: v }), { placeholder: "Store address" })}
                </div>
              </section>

              {/* Carrier & driver */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Carrier & Driver</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {field("Carrier Name", header.carrier, (v) => setHeader({ ...header, carrier: v }), { placeholder: "Baltimore Tank Lines" })}
                  {field("Driver", header.driver, (v) => setHeader({ ...header, driver: v }), { placeholder: "Last, First" })}
                  {field("Tractor #", header.tractor, (v) => setHeader({ ...header, tractor: v }))}
                  {field("Trailer #", header.trailer, (v) => setHeader({ ...header, trailer: v }))}
                </div>
              </section>

              {tankOptions.length===0&&<p className="text-xs text-destructive">No tank has a fuel grade assigned on this load date. Configure tanks in Gas Settings first.</p>}
              {/* Product lines */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product Delivered</h3>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => setLines([...lines, emptyLine()])}>
                    <Plus className="h-3.5 w-3.5" />
                    Add Line
                  </Button>
                </div>
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr className="[&>th]:px-2 [&>th]:py-2 [&>th]:font-semibold [&>th]:text-left [&>th]:whitespace-nowrap">
                        <th>Product Code</th>
                        <th className="min-w-[200px]">Description</th>
                        <th>Octane</th>
                        <th className="text-right">Gross Gal</th>
                        <th className="text-right">Net Gal</th>
                        <th className="text-right">Temp °F</th>
                        <th className="text-right">Gravity</th>
                        <th>Meter</th>
                        <th>Cmpt</th>
                        <th>Tank</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((l) => (
                        <tr key={l.key} className="border-t border-border [&>td]:px-2 [&>td]:py-1.5">
                          <td><Input className="h-8 text-xs w-24" aria-label={`Product code line ${lines.indexOf(l)+1}`} value={l.productCode} onChange={(e) => setLine(l.key, { productCode: e.target.value })} placeholder="BPD080" /></td>
                          <td><Input className="h-8 text-xs" aria-label={`Description line ${lines.indexOf(l)+1}`} value={l.description} onChange={(e) => setLine(l.key, { description: e.target.value })} placeholder="BP 87 REG E10 9+" /></td>
                          <td><Input className="h-8 text-xs w-16" aria-label={`Octane line ${lines.indexOf(l)+1}`} value={l.octane} onChange={(e) => setLine(l.key, { octane: e.target.value })} /></td>
                          <td><Input className="h-8 text-xs w-24 text-right" type="number" aria-label={`Gross gallons line ${lines.indexOf(l)+1}`} value={l.grossGallons} onChange={(e) => setLine(l.key, { grossGallons: e.target.value })} /></td>
                          <td><Input className="h-8 text-xs w-24 text-right" type="number" aria-label={`Net gallons line ${lines.indexOf(l)+1}`} value={l.netGallons} onChange={(e) => setLine(l.key, { netGallons: e.target.value })} /></td>
                          <td><Input className="h-8 text-xs w-20 text-right" type="number" aria-label={`Temperature line ${lines.indexOf(l)+1}`} value={l.temperature} onChange={(e) => setLine(l.key, { temperature: e.target.value })} /></td>
                          <td><Input className="h-8 text-xs w-20 text-right" type="number" aria-label={`Gravity line ${lines.indexOf(l)+1}`} value={l.gravity} onChange={(e) => setLine(l.key, { gravity: e.target.value })} /></td>
                          <td><Input className="h-8 text-xs w-20" value={l.meter} onChange={(e) => setLine(l.key, { meter: e.target.value })} /></td>
                          <td><Input className="h-8 text-xs w-16" value={l.compartment} onChange={(e) => setLine(l.key, { compartment: e.target.value })} /></td>
                          <td>
                            <Select disabled={busy||readOnly} value={l.tank} onValueChange={(v) => {const selected=tankOptions.find(t=>t.id===v);setLine(l.key, { tank:v,gradeId:selected?.grade.gradeId??'',octane:selected?String(selected.grade.octane):l.octane,description:l.description||selected?.grade.gradeName||'' });}}>
                              <SelectTrigger aria-label={`Tank for line ${lines.indexOf(l)+1}`} className="h-8 text-xs w-[150px]">
                                <SelectValue placeholder="Assign tank" />
                              </SelectTrigger>
                              <SelectContent>
                                {tankOptions.map((t) => (<SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>))}
                                {l.tank&&!tankOptions.some(t=>t.id===l.tank)&&<SelectItem value={l.tank} disabled>{delivery?.lines.find(x=>x.tank===l.tank)?.tankNumber||'Unavailable tank'}</SelectItem>}
                              </SelectContent>
                            </Select>
                          </td>
                          <td>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => setLines(lines.length > 1 ? lines.filter((x) => x.key !== l.key) : [emptyLine()])}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/40">
                      <tr className="[&>td]:px-2 [&>td]:py-2 font-semibold">
                        <td colSpan={3}>Product Totals</td>
                        <td className="text-right">{totalGross.toLocaleString()}</td>
                        <td className="text-right">{totalNet.toLocaleString()}</td>
                        <td colSpan={6} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>

              {/* Notes & attachment */}
              <section className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">BOL Message / Notes</Label>
                  <Textarea
                    className="text-xs min-h-[92px]"
                    placeholder={readOnly?"—":"Footnotes printed on the BOL, or anything noted at the drop."}
                    value={header.notes}
                    onChange={(e) => setHeader({ ...header, notes: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Attachment (BOL photo / PDF)</Label>
                  <label className="flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-input px-4 py-6 cursor-pointer hover:bg-muted/40 transition-colors">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <p className="text-xs">Document storage is not connected yet.</p>
                    <p className="text-[10px] text-muted-foreground">PDF, JPG, PNG up to 10 MB</p>
                    <input
                      disabled
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => setUploadedFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              </section>
              </fieldset>
            </div>

            <DialogFooter className="border-t border-border pt-4">
              <Button variant="outline" disabled={busy} onClick={close}>{readOnly?'Close':'Cancel'}</Button>
              {readOnly&&delivery?.status==='DRAFT'&&canEdit&&<Button variant="secondary" onClick={()=>setReadOnly(false)}>Edit Draft</Button>}
              {!readOnly&&canEdit&&<Button variant="secondary" disabled={busy} onClick={()=>save(false)}>{busy?'Saving…':'Save Draft'}</Button>}
              {canReceive&&delivery?.status!=='RECEIVED'&&<Button disabled={busy} onClick={()=>save(true)}>{busy?'Saving…':'Confirm Received'}</Button>}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
