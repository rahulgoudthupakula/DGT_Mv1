import { useState } from "react";
import { format } from "date-fns";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AddDeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "choose" | "upload" | "processing" | "manual";

type BolLine = {
  key: string;
  productCode: string;
  description: string;
  octane: string;
  grossGallons: string;
  netGallons: string;
  temperature: string;
  gravity: string;
  meter: string;
  compartment: string;
  tank: string;
};

const emptyLine = (): BolLine => ({
  key: Math.random().toString(36).slice(2),
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
});

const TANKS = [
  { value: "tank-1", label: "Tank #1 — Regular" },
  { value: "tank-2", label: "Tank #2 — Regular" },
  { value: "tank-3", label: "Tank #3 — Plus" },
  { value: "tank-4", label: "Tank #4 — Premium" },
  { value: "tank-5", label: "Tank #5 — Diesel" },
];

export const AddDeliveryDialog = ({ open, onOpenChange }: AddDeliveryDialogProps) => {
  const [step, setStep] = useState<Step>("choose");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const [header, setHeader] = useState({
    bolNumber: "",
    folio: "",
    loadDate: format(new Date(), "yyyy-MM-dd"),
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

  const totalGross = lines.reduce((s, l) => s + (parseFloat(l.grossGallons) || 0), 0);
  const totalNet = lines.reduce((s, l) => s + (parseFloat(l.netGallons) || 0), 0);

  const setLine = (key: string, patch: Partial<BolLine>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const resetAll = () => {
    setStep("choose");
    setUploadedFile(null);
    setParseError(null);
    setHeader({
      bolNumber: "", folio: "", loadDate: format(new Date(), "yyyy-MM-dd"), loadTime: "",
      terminal: "", supplier: "", customer: "", destination: "",
      carrier: "", driver: "", tractor: "", trailer: "", notes: "",
    });
    setLines([emptyLine()]);
  };

  const close = () => {
    onOpenChange(false);
    setTimeout(resetAll, 200);
  };

  const handleReadBol = async () => {
    if (!uploadedFile) return;
    setParseError(null);
    setStep("processing");
    try {
      const buffer = await uploadedFile.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i += 8192) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      }
      const base64 = btoa(binary);

      const { data, error } = await supabase.functions.invoke("parse-bol", {
        body: {
          fileData: base64,
          mimeType:
            uploadedFile.type ||
            (uploadedFile.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg"),
          fileName: uploadedFile.name,
        },
      });

      if (error || !data || (data as any).error) {
        setParseError(
          (data as any)?.error ??
            (error as any)?.context?.error ??
            "The BOL could not be read. Try a clearer photo or enter it manually."
        );
        setStep("upload");
        return;
      }

      const p = data as any;
      setHeader((h) => ({
        ...h,
        bolNumber: p.bolNumber || "",
        folio: p.folio || "",
        loadDate: p.loadDate || h.loadDate,
        loadTime: p.loadTime || "",
        terminal: p.terminal || "",
        supplier: p.supplier || "",
        customer: p.customer || "",
        destination: p.destination || "",
        carrier: p.carrier || "",
        driver: p.driver || "",
        tractor: p.tractor || "",
        trailer: p.trailer || "",
      }));
      setLines(
        (p.lines as any[]).map((l) => ({
          ...emptyLine(),
          productCode: l.productCode || "",
          description: l.description || "",
          octane: l.octane || "",
          grossGallons: l.grossGallons ? String(l.grossGallons) : "",
          netGallons: l.netGallons ? String(l.netGallons) : "",
          temperature: l.temperature ? String(l.temperature) : "",
          gravity: l.gravity ? String(l.gravity) : "",
          meter: l.meter || "",
          compartment: l.compartment || "",
        }))
      );
      setStep("manual");
      toast({ title: "BOL read", description: "Check the details below before confirming." });
    } catch {
      setParseError("Something went wrong while reading the file.");
      setStep("upload");
    }
  };

  const handleConfirm = () => {
    if (!header.bolNumber.trim()) {
      toast({ title: "BOL # is required", description: "Enter the number printed on the driver's slip.", variant: "destructive" });
      return;
    }
    if (totalGross <= 0) {
      toast({ title: "Add delivered gallons", description: "At least one product line needs gross gallons.", variant: "destructive" });
      return;
    }
    toast({
      title: "Delivery recorded",
      description: `BOL ${header.bolNumber} — ${totalGross.toLocaleString()} gross gal received.`,
    });
    close();
  };

  const field = (label: string, value: string, onChange: (v: string) => void, opts?: { required?: boolean; placeholder?: string; type?: string }) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {label} {opts?.required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        className="h-9 text-xs"
        type={opts?.type}
        placeholder={opts?.placeholder}
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
            {step === "manual" && "Bill of Lading Details"}
          </DialogTitle>
          <DialogDescription>
            {step === "choose" && "Choose how you'd like to record this fuel delivery."}
            {step === "upload" && "Upload a photo or PDF of the driver's BOL slip and we'll fill the form."}
            {step === "processing" && "Extracting the BOL header and product lines. Please wait."}
            {step === "manual" && "Enter the delivery exactly as printed on the BOL. A BOL carries no pricing."}
          </DialogDescription>
        </DialogHeader>

        {step === "choose" && (
          <div className="grid gap-3 py-4">
            <button
              onClick={() => setStep("upload")}
              className="flex items-start gap-3 rounded-lg border border-input p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/40"
            >
              <ScanLine className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Auto Fill from BOL photo</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Upload the slip the driver handed over — gallons, terminal and driver details fill themselves.
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
              <Button disabled={!uploadedFile} onClick={handleReadBol}>
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
                  {field("Supplier", header.supplier, (v) => setHeader({ ...header, supplier: v }), { placeholder: "BP Products North America" })}
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
                          <td><Input className="h-8 text-xs w-24" value={l.productCode} onChange={(e) => setLine(l.key, { productCode: e.target.value })} placeholder="BPD080" /></td>
                          <td><Input className="h-8 text-xs" value={l.description} onChange={(e) => setLine(l.key, { description: e.target.value })} placeholder="BP 87 REG E10 9+" /></td>
                          <td><Input className="h-8 text-xs w-16" value={l.octane} onChange={(e) => setLine(l.key, { octane: e.target.value })} /></td>
                          <td><Input className="h-8 text-xs w-24 text-right" type="number" value={l.grossGallons} onChange={(e) => setLine(l.key, { grossGallons: e.target.value })} /></td>
                          <td><Input className="h-8 text-xs w-24 text-right" type="number" value={l.netGallons} onChange={(e) => setLine(l.key, { netGallons: e.target.value })} /></td>
                          <td><Input className="h-8 text-xs w-20 text-right" type="number" value={l.temperature} onChange={(e) => setLine(l.key, { temperature: e.target.value })} /></td>
                          <td><Input className="h-8 text-xs w-20 text-right" type="number" value={l.gravity} onChange={(e) => setLine(l.key, { gravity: e.target.value })} /></td>
                          <td><Input className="h-8 text-xs w-20" value={l.meter} onChange={(e) => setLine(l.key, { meter: e.target.value })} /></td>
                          <td><Input className="h-8 text-xs w-16" value={l.compartment} onChange={(e) => setLine(l.key, { compartment: e.target.value })} /></td>
                          <td>
                            <Select value={l.tank} onValueChange={(v) => setLine(l.key, { tank: v })}>
                              <SelectTrigger className="h-8 text-xs w-[150px]">
                                <SelectValue placeholder="Assign tank" />
                              </SelectTrigger>
                              <SelectContent>
                                {TANKS.map((t) => (
                                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
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
                    placeholder="Footnotes printed on the BOL, or anything noted at the drop."
                    value={header.notes}
                    onChange={(e) => setHeader({ ...header, notes: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Attachment (BOL photo / PDF)</Label>
                  <label className="flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-input px-4 py-6 cursor-pointer hover:bg-muted/40 transition-colors">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <p className="text-xs">{uploadedFile ? uploadedFile.name : "Click or drag & drop to upload"}</p>
                    <p className="text-[10px] text-muted-foreground">PDF, JPG, PNG up to 10 MB</p>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => setUploadedFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              </section>
            </div>

            <DialogFooter className="border-t border-border pt-4">
              <Button variant="outline" onClick={close}>Cancel</Button>
              <Button variant="secondary" onClick={() => toast({ title: "Draft saved", description: "You can finish this delivery later." })}>
                Save Draft
              </Button>
              <Button onClick={handleConfirm}>Confirm Received</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
