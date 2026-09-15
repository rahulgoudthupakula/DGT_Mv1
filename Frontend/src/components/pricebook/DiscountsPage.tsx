import {useQuery,useQueryClient} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Percent, Users, ShieldCheck, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface DiscountReason {
  id: string;
  version: string;
  combinePromotions: boolean;
  eligibilityType: string;
  seniorAge: number|null;
  name: string;
  code: string;
  valueType: "PERCENT" | "AMOUNT";
  value: number;
  appliesTo: "Whole Ticket" | "Single Item";
  managerApproval: boolean;
  allowOnRestricted: boolean;
  allowOnFuel: boolean;
  dailyCap: number; // 0 = no cap
  active: boolean;
}

interface DiscountGiven {
  id: string;
  date: string;
  receipt: string;
  cashier: string;
  reason: string;
  ticketTotal: number;
  discountAmount: number;
  approvedBy: string;
}

const emptyForm = {
  eligibilityType: "NONE",
  seniorAge: "",
  name: "",
  code: "",
  valueType: "PERCENT" as DiscountReason["valueType"],
  value: "",
  appliesTo: "Whole Ticket" as DiscountReason["appliesTo"],
  combinePromotions: false,
  managerApproval: false,
  allowOnRestricted: false,
  allowOnFuel: false,
  dailyCap: "",
};

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const DiscountsPage = ({storeId}:{storeId:string}) => {
  const client=useQueryClient(),path=`/access/stores/${encodeURIComponent(storeId)}/discounts`;
  const query=useQuery({queryKey:['discounts',storeId],queryFn:()=>request<{reasons:DiscountReason[];history:DiscountGiven[];discountTypes:{value:string;label:string}[]}>(path)});
  const approvalPath=`/access/stores/${encodeURIComponent(storeId)}/checkout-discounts`;
  const approvals=useQuery({queryKey:['discount-approvals',storeId],queryFn:()=>request<{application_id:number;reason_name:string;cashier_name:string;sale_id:number;discount_amount:number;eligibility_type:string;employee_id:number|null}[]>(`${approvalPath}/requests`)});
  async function review(id:number,decision:'approve'|'reject'){
    setBusy(true);setError('');try{await request(`${approvalPath}/${id}/${decision}`,{method:'POST',body:'{}'});await Promise.all([client.invalidateQueries({queryKey:['discount-approvals',storeId]}),client.invalidateQueries({queryKey:['discounts',storeId]})]);toast.success(decision==='approve'?'Discount applied':'Request rejected');}catch(e){setError(e instanceof Error?e.message:'Could not review request');}finally{setBusy(false);}
  }
  const reasons=query.data?.reasons??[], discountsGiven=query.data?.history??[];
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DiscountReason | null>(null);
  const [toDelete, setToDelete] = useState<DiscountReason | null>(null);
  const [form, setForm] = useState(emptyForm);

  const set = (patch: Partial<typeof emptyForm>) => setForm((f) => ({ ...f, ...patch }));

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (r: DiscountReason) => {
    setEditing(r);
    setForm({
      eligibilityType: r.eligibilityType,
      seniorAge: r.seniorAge==null?"":String(r.seniorAge),
      name: r.name,
      code: r.code,
      valueType: r.valueType,
      value: String(r.value),
      appliesTo: r.appliesTo,
      combinePromotions: r.combinePromotions,
      managerApproval: r.managerApproval,
      allowOnRestricted: r.allowOnRestricted,
      allowOnFuel: r.allowOnFuel,
      dailyCap: r.dailyCap ? String(r.dailyCap) : "",
    });
    setOpen(true);
  };

  const valid =
    form.name.trim() !== "" &&
    form.code.trim() !== "" &&
    form.value !== "" &&
    Number(form.value) > 0 &&
    (form.valueType !== "PERCENT" || Number(form.value) <= 100);

  async function persist(payload:object,existing:DiscountReason|null){
    setBusy(true);setError('');
    try{await request(existing?`${path}/${existing.id}`:path,{method:existing?'PUT':'POST',headers:existing?{'If-Match':existing.version}:{},body:JSON.stringify(payload)});
      await client.invalidateQueries({queryKey:['discounts',storeId]});return true;
    }catch(e){setError(e instanceof Error?e.message:'Could not save discount');return false;}finally{setBusy(false);}
  }
  const save=async()=>{
    if(!valid){setError('Enter a name, code and valid discount value.');return;}
    if(await persist({...form,seniorAge:form.eligibilityType==='SENIOR'?Number(form.seniorAge):null,value:Number(form.value),dailyCap:form.dailyCap===''?0:Number(form.dailyCap),active:editing?editing.active:true},editing)){
      setOpen(false);toast.success('Discount saved');
    }
  };
  const confirmDelete=async()=>{
    if(toDelete&&await persist({...toDelete,active:false},toDelete)){setToDelete(null);toast.success('Discount deactivated');}
  };
  const toggleActive=async(id:string)=>{const r=reasons.find(r=>r.id===id);if(r)await persist({...r,active:!r.active},r);};

  const totals = useMemo(() => {
    const total = discountsGiven.reduce((s, d) => s + d.discountAmount, 0);
    const byReason = new Map<string, { count: number; amount: number }>();
    const byCashier = new Map<string, { count: number; amount: number }>();
    discountsGiven.forEach((d) => {
      const r = byReason.get(d.reason) ?? { count: 0, amount: 0 };
      byReason.set(d.reason, { count: r.count + 1, amount: r.amount + d.discountAmount });
      const c = byCashier.get(d.cashier) ?? { count: 0, amount: 0 };
      byCashier.set(d.cashier, { count: c.count + 1, amount: c.amount + d.discountAmount });
    });
    return {
      total,
      count: discountsGiven.length,
      avg: discountsGiven.length ? total / discountsGiven.length : 0,
      byReason: [...byReason.entries()].sort((a, b) => b[1].amount - a[1].amount),
      byCashier: [...byCashier.entries()].sort((a, b) => b[1].amount - a[1].amount),
    };
  }, [discountsGiven]);

  const valueLabel = (r: DiscountReason) => (r.valueType === "PERCENT" ? `${r.value}%` : money(r.value));

  return (
    <div className="space-y-4">
      {(error||query.error)&&<p role="alert" className="text-destructive">{error||String(query.error)}</p>}
      <p className="text-sm text-muted-foreground">{query.isPending?'Loading discounts…':'Settings are saved for this store. The backend supports open-sale discount calculation, eligibility, approval and caps. Register controls still need POS integration.'}</p>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Discounts</h1>
          <p className="text-sm text-muted-foreground">
            Discounts a cashier can apply at the register — employee, senior, student, military and more. These work
            independently of promotions once POS is connected.
          </p>
        </div>
      </div>

      <Tabs defaultValue="reasons">
        <TabsList>
          <TabsTrigger value="reasons">Discount Reasons</TabsTrigger>
          <TabsTrigger value="report">Discounts Given</TabsTrigger>
        </TabsList>

        {/* SETUP */}
        <TabsContent value="reasons" className="space-y-4 pt-4">
          <div className="flex justify-end">
            <Button size="sm" disabled={busy||query.isPending||!!query.error} onClick={openNew}>
              <Plus className="h-4 w-4 mr-1" /> Add Discount
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Percent className="h-5 w-5" /> Register Discounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Discount</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Applies To</TableHead>
                    <TableHead>Manager Approval</TableHead>
                    <TableHead>Age-Restricted</TableHead>
                    <TableHead>Fuel</TableHead>
                    <TableHead className="text-right">Daily Cap</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!query.isPending&&reasons.length===0&&<TableRow><TableCell colSpan={10}>No discounts configured for this store.</TableCell></TableRow>}
                  {reasons.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-sm">{r.name}</TableCell>
                      <TableCell className="font-mono text-xs">{r.code}</TableCell>
                      <TableCell className="text-sm font-semibold">{valueLabel(r)}</TableCell>
                      <TableCell className="text-sm">{r.appliesTo}</TableCell>
                      <TableCell>
                        <Badge variant={r.managerApproval ? "default" : "secondary"} className="text-[10px]">
                          {r.managerApproval ? "Required" : "Not required"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.allowOnRestricted ? "outline" : "secondary"} className="text-[10px]">
                          {r.allowOnRestricted ? "Allowed" : "Blocked"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.allowOnFuel ? "outline" : "secondary"} className="text-[10px]">
                          {r.allowOnFuel ? "Allowed" : "Blocked"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">{r.dailyCap ? money(r.dailyCap) : "No cap"}</TableCell>
                      <TableCell>
                        <Switch disabled={busy} checked={r.active} onCheckedChange={() => toggleActive(r.id)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={busy} aria-label={`Edit ${r.name}`} onClick={() => openEdit(r)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={busy||!r.active} aria-label={`Deactivate ${r.name}`} onClick={() => setToDelete(r)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REPORT */}
        <TabsContent value="report" className="space-y-4 pt-4">
          <Card><CardHeader><CardTitle className="text-base">Pending Approvals</CardTitle></CardHeader><CardContent>
          {approvals.error&&<p role="alert" className="text-destructive">{String(approvals.error)}</p>}
          {approvals.isPending?<p>Loading requests…</p>:!approvals.error&&!approvals.data?.length?<p className="text-sm text-muted-foreground">No pending discount requests.</p>:null}
          {approvals.data?.map(r=><div key={r.application_id} className="flex flex-wrap items-center gap-3 border-b py-3"><span className="flex-1 text-sm">{r.reason_name} · Sale {r.sale_id} · {r.cashier_name} · {money(r.discount_amount)}<br/>Eligibility: {r.eligibility_type}{r.employee_id?` · Employee ${r.employee_id}`:''}</span><Button disabled={busy} size="sm" onClick={()=>review(r.application_id,'approve')}>Approve</Button><Button disabled={busy} size="sm" variant="outline" onClick={()=>review(r.application_id,'reject')}>Reject</Button></div>)}
          </CardContent></Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" /> Total Discounts Given
                </p>
                <p className="text-2xl font-bold">{money(totals.total)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> Transactions Discounted
                </p>
                <p className="text-2xl font-bold">{totals.count}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" /> Average Discount
                </p>
                <p className="text-2xl font-bold">{money(totals.avg)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">By Discount Reason</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Times Used</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {totals.byReason.map(([name, v]) => (
                      <TableRow key={name}>
                        <TableCell className="text-sm">{name}</TableCell>
                        <TableCell className="text-right text-sm">{v.count}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{money(v.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">By Cashier</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cashier</TableHead>
                      <TableHead className="text-right">Times Used</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {totals.byCashier.map(([name, v]) => (
                      <TableRow key={name}>
                        <TableCell className="text-sm">{name}</TableCell>
                        <TableCell className="text-right text-sm">{v.count}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{money(v.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Discount Log</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Cashier</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Ticket Total</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead>Approved By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discountsGiven.length===0&&<TableRow><TableCell colSpan={7}>No recorded discounts yet. Discounts appear after an application is approved and applied.</TableCell></TableRow>}
                  {discountsGiven.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="text-xs">{d.date}</TableCell>
                      <TableCell className="font-mono text-xs">{d.receipt}</TableCell>
                      <TableCell className="text-sm">{d.cashier}</TableCell>
                      <TableCell className="text-sm">{d.reason}</TableCell>
                      <TableCell className="text-right text-sm">{money(d.ticketTotal)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{money(d.discountAmount)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{d.approvedBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add / Edit dialog */}
      <Dialog open={open} onOpenChange={v=>!busy&&setOpen(v)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Discount" : "Add Discount"}</DialogTitle>
          </DialogHeader>
          <fieldset disabled={busy} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Discount Name</Label>
                <Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Employee Discount" />
              </div>
              <div className="space-y-1.5">
                <Label>Short Code</Label>
                <Input value={form.code} onChange={(e) => set({ code: e.target.value })} placeholder="EMP" />
              </div>
              <div className="space-y-1.5">
                <Label>Discount Type</Label>
                <Select value={form.valueType} onValueChange={(v) => set({ valueType: v as DiscountReason["valueType"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {query.data?.discountTypes.map(t=><SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{form.valueType === "PERCENT" ? "Percent (%)" : "Amount ($)"}</Label>
                <Input type="number" value={form.value} onChange={(e) => set({ value: e.target.value })} placeholder="10" />
              </div>
              <div className="space-y-1.5">
                <Label>Applies To</Label>
                <Select value={form.appliesTo} onValueChange={(v) => set({ appliesTo: v as DiscountReason["appliesTo"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Whole Ticket">Whole ticket</SelectItem>
                    <SelectItem value="Single Item">Single item</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Daily Cap per Store ($)</Label><p className="text-xs text-muted-foreground">Total for this discount across the store’s business day. Blank or 0 means no cap.</p>
                <Input type="number" value={form.dailyCap} onChange={(e) => set({ dailyCap: e.target.value })} placeholder="Leave blank for no cap" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3"><div><Label>Eligibility check</Label><Select value={form.eligibilityType} onValueChange={v=>set({eligibilityType:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{[['NONE','None'],['EMPLOYEE','Active store employee'],['STUDENT','Student ID checked'],['SENIOR','Senior age confirmed'],['MILITARY','Military / veteran ID checked']].map(([value,label])=><SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>{form.eligibilityType==='SENIOR'&&<div><Label>Minimum senior age</Label><Input type="number" min="1" max="120" value={form.seniorAge} onChange={e=>set({seniorAge:e.target.value})}/></div>}</div>
            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center justify-between"><Label>Combine with promotions</Label><Switch checked={form.combinePromotions} onCheckedChange={v=>set({combinePromotions:v})}/></div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Manager approval required</Label>
                  <p className="text-xs text-muted-foreground">A different authorized manager/admin must approve the request.</p>
                </div>
                <Switch checked={form.managerApproval} onCheckedChange={(v) => set({ managerApproval: v })} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow on age-restricted items</Label>
                  <p className="text-xs text-muted-foreground">Cigarettes, alcohol, vape, lottery.</p>
                </div>
                <Switch checked={form.allowOnRestricted} onCheckedChange={(v) => set({ allowOnRestricted: v })} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow on fuel</Label>
                  <p className="text-xs text-muted-foreground">Apply to gas purchases as well as store items.</p>
                </div>
                <Switch checked={form.allowOnFuel} onCheckedChange={(v) => set({ allowOnFuel: v })} />
              </div>
            </div>
          </fieldset>
          {error&&<p role="alert" className="text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={busy||query.isPending||!valid} onClick={save}>{editing ? "Save Changes" : "Add Discount"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate this discount?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.name} will no longer be available at the register. Past discounts already given stay in the report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={e=>{e.preventDefault();void confirmDelete();}}>Deactivate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
