import {useRebates} from './useRebates';
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  RebateProgram, RebateTier, OFFERED_BY_TYPES, PROGRAM_TYPES, ELIGIBILITY_SCOPES,
  QUALIFICATION_TYPES, MEASUREMENT_BASIS, REWARD_TYPES, CALCULATION_OPTIONS,
  CLAIM_FREQUENCIES, PAYMENT_METHODS, DEPARTMENT_OPTIONS, BRAND_OPTIONS, VENDOR_OPTIONS,
} from "./rebateTypes";

type FormState = Omit<RebateProgram, "id">;

const emptyForm: FormState = {
  vendorId:"",selectedProductIds:[],
  name: "", vendor: "", eligibleItems: "", rebateType: "", startDate: "", endDate: "",
  claimFrequency: "Quarterly", status: "Active",
  offeredByType: "Vendor / Distributor", description: "",
  eligibilityScope: "All Products from Provider", scopeValue: "", selectedProductCount: 0,
  qualificationType: "Purchase Amount", target: "", measurementBasis: "Purchases",
  rewardType: "Percentage", rewardValue: "", calculation: "On qualifying purchases",
  tiers: [{ from: "", to: "", reward: "" }],
  claimRequired: true, submissionDeadlineDays: "15", paymentMethod: "Vendor Credit",
};

interface Props {
  storeId:string;busy?:boolean;error?:string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: RebateProgram | null;
  onSave: (program: FormState, status: string) => Promise<boolean>;
  title?: string;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <Separator className="mt-2" />
    </div>
    {children}
  </div>
);

export const AddRebateProgramDialog = ({ storeId,busy,error,open, onOpenChange, initial, onSave, title }: Props) => {
  const {query}=useRebates(storeId);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...emptyForm, ...initial, tiers: initial.tiers?.length ? initial.tiers : emptyForm.tiers } : emptyForm);
    }
  }, [open, initial]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const isTiered = form.rebateType === "Tiered";
  const scope = form.eligibilityScope;
  const vendorProvider = form.offeredByType === 'Vendor / Distributor';
  const vendorProducts = new Set(query.data?.productVendorLinks?.filter(link=>link.vendorId===form.vendorId).map(link=>link.productId));
  const availableProducts = (query.data?.products??[]).filter(product=>!vendorProvider || vendorProducts.has(product.id));

  const updateTier = (idx: number, key: keyof RebateTier, value: string) =>
    setForm((f) => ({
      ...f,
      tiers: (f.tiers || []).map((t, i) => (i === idx ? { ...t, [key]: value } : t)),
    }));

  const addTier = () => setForm((f) => ({ ...f, tiers: [...(f.tiers || []), { from: "", to: "", reward: "" }] }));
  const removeTier = (idx: number) => setForm((f) => ({ ...f, tiers: (f.tiers || []).filter((_, i) => i !== idx) }));

  const handleSave = async(status: string) => {
    if (!form.name.trim()) { toast.error("Program name is required"); return; }
    if (!form.vendor) { toast.error("Offered By is required"); return; }
    if (!form.rebateType) { toast.error("Program type is required"); return; }
    if (!form.startDate || !form.endDate) { toast.error("Start and end dates are required"); return; }
    const scopeLabel =
      scope === "All Products from Provider" ? `All ${form.vendor} Products`
        : scope === "Specific Products" ? `${form.selectedProductCount || 0} Specific Products`
          : form.scopeValue || scope || "";
    if(await onSave({ ...form, eligibleItems: scopeLabel }, status))onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={v=>!busy&&onOpenChange(v)}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title || "Add Rebate Program"}</DialogTitle></DialogHeader>

        {error&&<p role="alert" className="text-destructive">{error}</p>}
        <fieldset disabled={busy||query.isPending} className="space-y-6 py-2">
          <Section title="Basic Information">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2 sm:col-span-2">
                <Label>Program Name *</Label>
                <Input placeholder="e.g., Frito-Lay Q1 Volume Bonus" value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Offered By Type *</Label>
                <Select value={form.offeredByType} onValueChange={v=>setForm(f=>({...f,offeredByType:v,vendorId:"",vendor:"",selectedProductIds:[],eligibilityScope:"Specific Products",scopeValue:""}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{OFFERED_BY_TYPES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Offered By *</Label>
                {form.offeredByType==='Vendor / Distributor'?<Select value={form.vendorId||''} onValueChange={v=>setForm(f=>({...f,vendorId:v,selectedProductIds:[],vendor:query.data?.vendors.find(x=>x.id===v)?.name??''}))}><SelectTrigger><SelectValue placeholder="Select provider"/></SelectTrigger><SelectContent>{query.data?.vendors.map(v=><SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent></Select>:<Input value={form.vendor} onChange={e=>set('vendor',e.target.value)} placeholder="Provider name"/>}
              </div>
              <div className="grid gap-2">
                <Label>Program Type *</Label>
                <Select value={form.rebateType} onValueChange={(v) => set("rebateType", v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{PROGRAM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div />
              <div className="grid gap-2">
                <Label>Start Date *</Label>
                <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>End Date *</Label>
                <Input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label>Description</Label>
                <Textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
              </div>
            </div>
          </Section>

          <Section title="Eligible Products">
            <div className="grid gap-3">
              <Label>Eligibility Scope *</Label>
              <RadioGroup value={scope} onValueChange={v=>setForm(f=>({...f,eligibilityScope:v,scopeValue:""}))} className="grid gap-2 sm:grid-cols-2">
                {ELIGIBILITY_SCOPES.map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <RadioGroupItem value={s} id={`scope-${s}`} />
                    <label htmlFor={`scope-${s}`} className="text-sm cursor-pointer">{s}</label>
                  </div>
                ))}
              </RadioGroup>

              {(scope === "Department" || scope === "Subdepartment") && (
                <div className="grid gap-2 max-w-sm">
                  <Label>{scope}</Label>
                  <Select value={form.scopeValue} onValueChange={(v) => set("scopeValue", v)}>
                    <SelectTrigger><SelectValue placeholder={`Select ${scope.toLowerCase()}`} /></SelectTrigger>
                    <SelectContent>{(scope==='Department'?query.data?.departments:query.data?.subdepartments)?.map(d=><SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}

              {scope === "Brand" && (
                <div className="grid gap-2 max-w-sm">
                  <Label>Brand</Label>
                  <Select value={form.scopeValue} onValueChange={(v) => set("scopeValue", v)}>
                    <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                    <SelectContent>{query.data?.brands.map(b=><SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}

              {scope==='Specific Products'&&<div className="border rounded p-3 max-h-48 overflow-auto space-y-2">{availableProducts.map(p=><label key={p.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.selectedProductIds?.includes(p.id)??false} onChange={e=>setForm(f=>({...f,selectedProductIds:e.target.checked?[...(f.selectedProductIds??[]),p.id]:(f.selectedProductIds??[]).filter(id=>id!==p.id)}))}/>{p.name} — {p.barcode||p.sku}</label>)}<p className="text-xs text-muted-foreground">{vendorProvider && !form.vendorId ? "Select a vendor first." : availableProducts.length===0 ? "No items linked to this vendor. Link items in Vendor Management first." : ""}</p><p className="text-xs text-muted-foreground">Selected products: {form.selectedProductIds?.length??0}</p></div>}
            </div>
          </Section>

          <Section title="Qualification">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label>Qualification Type *</Label>
                <Select value={form.qualificationType} onValueChange={(v) => set("qualificationType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{QUALIFICATION_TYPES.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Target / Threshold</Label>
                <Input placeholder="e.g., 20000" value={form.target} onChange={(e) => set("target", e.target.value)} disabled={form.qualificationType === "No Minimum Requirement"} />
              </div>
              <div className="grid gap-2">
                <Label>Measurement Basis</Label>
                <Select value={form.measurementBasis} onValueChange={(v) => set("measurementBasis", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MEASUREMENT_BASIS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </Section>

          <Section title="Reward">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label>Reward Type *</Label>
                <Select value={form.rewardType} onValueChange={(v) => set("rewardType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{REWARD_TYPES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Reward Value *</Label>
                <Input placeholder="e.g., 3.00" value={form.rewardValue} onChange={(e) => set("rewardValue", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Calculation</Label>
                <Select value={form.calculation} onValueChange={(v) => set("calculation", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CALCULATION_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </Section>

          {isTiered && (
            <Section title="Rebate Tiers">
              <div className="space-y-2">
                {(form.tiers || []).map((tier, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                    <Input placeholder="From" value={tier.from} onChange={(e) => updateTier(idx, "from", e.target.value)} />
                    <Input placeholder="To (blank = and above)" value={tier.to} onChange={(e) => updateTier(idx, "to", e.target.value)} />
                    <Input placeholder="Reward (e.g., 2%)" value={tier.reward} onChange={(e) => updateTier(idx, "reward", e.target.value)} />
                    <Button variant="ghost" size="icon" onClick={() => removeTier(idx)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={addTier}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Tier
                  </Button>
                </div>
              </div>
            </Section>
          )}

          <Section title="Claim & Payment Settings">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label>Claim Required?</Label>
                <RadioGroup
                  value={form.claimRequired ? "yes" : "no"}
                  onValueChange={(v) => set("claimRequired", v === "yes")}
                  className="flex gap-4 pt-1"
                >
                  <div className="flex items-center gap-2"><RadioGroupItem value="yes" id="claim-yes" /><label htmlFor="claim-yes" className="text-sm">Yes</label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="no" id="claim-no" /><label htmlFor="claim-no" className="text-sm">No</label></div>
                </RadioGroup>
              </div>
              {form.claimRequired && (
                <>
                  <div className="grid gap-2">
                    <Label>Claim Frequency</Label>
                    <Select value={form.claimFrequency} onValueChange={(v) => set("claimFrequency", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CLAIM_FREQUENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Submission Deadline</Label>
                    <div className="flex items-center gap-2">
                      <Input className="w-20" value={form.submissionDeadlineDays} onChange={(e) => set("submissionDeadlineDays", e.target.value)} />
                      <span className="text-xs text-muted-foreground">days after period end</span>
                    </div>
                  </div>
                </>
              )}
              <div className="grid gap-2">
                <Label>Expected Payment Method</Label>
                <Select value={form.paymentMethod} onValueChange={(v) => set("paymentMethod", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENT_METHODS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </Section>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button variant="outline" onClick={() => handleSave("Draft")}>Save Draft</Button>
            <Button onClick={() => handleSave("Active")}>{initial ? "Save Changes" : "Create Program"}</Button>
          </div>
        </fieldset>
      </DialogContent>
    </Dialog>
  );
};
