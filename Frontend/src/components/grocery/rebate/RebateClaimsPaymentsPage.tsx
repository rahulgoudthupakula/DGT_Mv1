import {useQuery,useQueryClient} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import {useRebates} from './useRebates';
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, ArrowLeft, Upload, FileText, Send, CheckCircle2, DollarSign, XCircle } from "lucide-react";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { toast } from "sonner";

export interface RebateClaim {
  id: string;
  version: string;
  payments: {id:string;amount:number;method:string;date:string;reference:string}[];
  reference: string;
  program: string;
  provider: string;
  period: string;
  periodRange: string;
  earned: number | null;
  claimed: number | null;
  approved: number | null;
  payment: number | null;
  status: string;
  submittedDate?: string;
  submittedBy?: string;
  approvalDate?: string;
  adjustmentReason?: string;
  paymentMethod?: string;
  paymentDate?: string;
  paymentRef?: string;
  notes?: string;
}

const STATUSES = [
  "Not Submitted", "Submitted", "Under Review", "Approved",
  "Partially Approved", "Rejected", "Paid", "Partially Paid",
];

const PAYMENT_METHODS = ["ACH Transfer", "Check", "Vendor Credit", "Invoice Deduction", "Wire Transfer"];

const fmt = (n: number | null) =>
  n === null ? "—" : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    Paid: "default", Approved: "default", "Partially Paid": "secondary",
    "Partially Approved": "secondary", Rejected: "destructive",
    Submitted: "outline", "Under Review": "outline", "Not Submitted": "outline",
  };
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
};

const today = () => new Date().toISOString().slice(0, 10);

type ActionKind = "submit" | "approve" | "payment" | "reject" | null;

const ClaimDetails = ({
  claim, onBack, onUpdate, busy,
}: {
  claim: RebateClaim;
  onBack: () => void;
  onUpdate: (updates: Record<string,unknown>) => Promise<boolean>;
  busy:boolean;
}) => {
  const [action, setAction] = useState<ActionKind>(null);
  const [notes, setNotes] = useState(claim.notes || "");

  // form state for the open action dialog
  const [claimedAmount, setClaimedAmount] = useState(String(claim.claimed ?? ""));
  const [submittedDate, setSubmittedDate] = useState(claim.submittedDate || today());
  const [approvedAmount, setApprovedAmount] = useState(String(claim.approved ?? claim.claimed ?? ""));
  const [approvalDate, setApprovalDate] = useState(claim.approvalDate || today());
  const [adjustmentReason, setAdjustmentReason] = useState(claim.adjustmentReason || "");
  const [paymentAmount, setPaymentAmount] = useState(String(Math.max(0,(claim.approved??0)-(claim.payment??0))));
  const [paymentMethod, setPaymentMethod] = useState(claim.paymentMethod || "ACH Transfer");
  const [paymentDate, setPaymentDate] = useState(claim.paymentDate || today());
  const [paymentRef, setPaymentRef] = useState(claim.paymentRef || "");

  const adjustment = claim.approved !== null && claim.claimed !== null ? claim.approved - claim.claimed : 0;

  const closeDialog = () => setAction(null);

  const [paymentKey,setPaymentKey]=useState(()=>crypto.randomUUID());
  const send=async(body:Record<string,unknown>)=>{if(await onUpdate(body)){closeDialog();setPaymentKey(crypto.randomUUID());}};
  const saveSubmit=()=>send({action:'submit',claimed:claimedAmount,submittedDate});
  const saveApproval=()=>send({action:'approve',approved:approvedAmount,approvalDate,adjustmentReason});
  const savePayment=()=>send({action:'payment',payment:paymentAmount,paymentMethod,paymentDate,paymentRef,requestKey:paymentKey});
  const saveReject=()=>send({action:'reject',approvalDate,adjustmentReason});
  const canDecide=['Submitted','Under Review'].includes(claim.status);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Claims & Payments
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">{claim.program} {claim.period} Claim</h2>
              {statusBadge(claim.status)}
            </div>
            <p className="text-xs text-muted-foreground">
              Claim #: {claim.reference} • Provider: {claim.provider} • Period: {claim.periodRange}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={busy||claim.status!=="Submitted"} onClick={()=>onUpdate({action:"review"})}>Mark Under Review</Button>
          <Button size="sm" variant="outline" disabled={busy||claim.status!=="Not Submitted"} onClick={() => setAction("submit")}>
            <Send className="h-3.5 w-3.5 mr-1" /> Mark Submitted
          </Button>
          <Button size="sm" variant="outline" disabled={busy||!canDecide} onClick={() => setAction("approve")}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Record Approval
          </Button>
          <Button size="sm" disabled={busy||!["Approved","Partially Approved","Partially Paid"].includes(claim.status)} onClick={() => setAction("payment")}>
            <DollarSign className="h-3.5 w-3.5 mr-1" /> Record Payment
          </Button>
          <Button size="sm" variant="outline" disabled={busy||!canDecide} onClick={() => setAction("reject")}>
            <XCircle className="h-3.5 w-3.5 mr-1" /> Reject / Adjust
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Earned", value: fmt(claim.earned) },
          { label: "Claimed", value: fmt(claim.claimed) },
          { label: "Approved", value: fmt(claim.approved) },
          { label: "Payment", value: fmt(claim.payment) },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-xl font-bold text-foreground mt-1">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {adjustment !== 0 && (
        <Card className="border-warning/40">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Adjustment</p>
            <p className="text-lg font-bold text-destructive">
              {adjustment > 0 ? "+" : "-"}${Math.abs(adjustment).toLocaleString()}
            </p>
            {claim.adjustmentReason && (
              <p className="text-sm text-muted-foreground mt-1">Reason: {claim.adjustmentReason}</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Claim Information</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
            <div><p className="text-xs text-muted-foreground">Claim #</p><p>{claim.reference}</p></div>
            <div><p className="text-xs text-muted-foreground">Program</p><p>{claim.program}</p></div>
            <div><p className="text-xs text-muted-foreground">Provider</p><p>{claim.provider}</p></div>
            <div><p className="text-xs text-muted-foreground">Claim Period</p><p>{claim.period} ({claim.periodRange})</p></div>
            <div><p className="text-xs text-muted-foreground">Submitted Date</p><p>{claim.submittedDate || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Submitted By</p><p>{claim.submittedBy || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Approval Date</p><p>{claim.approvalDate || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Claim Status</p><p>{claim.status}</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Payment Information</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
            <div><p className="text-xs text-muted-foreground">Payment Status</p><p>{claim.payment ? claim.status : "Pending"}</p></div>
            <div><p className="text-xs text-muted-foreground">Payment Amount</p><p>{fmt(claim.payment)}</p></div>
            <div><p className="text-xs text-muted-foreground">Payment Method</p><p>{claim.paymentMethod || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Payment Date</p><p>{claim.paymentDate || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Payment / Credit Reference #</p><p>{claim.paymentRef || "—"}</p></div><div className="sm:col-span-2 space-y-2"><p className="text-xs text-muted-foreground">Payment History</p>{claim.payments.map(p=><div key={p.id} className="border rounded-md p-2">{p.date} · {p.method} · {p.reference} · {fmt(p.amount)}</div>)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Supporting Documents</CardTitle>
            <Button size="sm" variant="outline" disabled>
              <Upload className="h-3.5 w-3.5 mr-1" /> Upload Supporting Document
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {([] as string[]).map((d) => (
              <div key={d} className="flex items-center gap-2 border rounded-md px-3 py-2">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" /> {d}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              rows={4}
              placeholder="Add internal notes about this claim..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex justify-end">
              <Button size="sm" variant="outline" disabled={busy} onClick={() => onUpdate({action:"notes",notes})}>
                Save Notes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mark Submitted */}
      <Dialog open={action === "submit"} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Mark Claim Submitted</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2"><Label>Claimed Amount</Label>
              <Input type="number" value={claimedAmount} onChange={(e) => setClaimedAmount(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Submitted Date</Label>
              <Input type="date" value={submittedDate} onChange={(e) => setSubmittedDate(e.target.value)} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button disabled={busy} onClick={saveSubmit}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Approval */}
      <Dialog open={action === "approve"} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Approval</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2"><Label>Approved Amount</Label>
              <Input type="number" value={approvedAmount} onChange={(e) => setApprovedAmount(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Approval Date</Label>
              <Input type="date" value={approvalDate} onChange={(e) => setApprovalDate(e.target.value)} /></div>
            {Number(approvedAmount) !== (claim.claimed ?? Number(approvedAmount)) && (
              <div className="grid gap-2"><Label>Adjustment Reason</Label>
                <Textarea rows={3} value={adjustmentReason} onChange={(e) => setAdjustmentReason(e.target.value)} /></div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button disabled={busy} onClick={saveApproval}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Payment */}
      <Dialog open={action === "payment"} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2"><Label>Payment Amount</Label>
              <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Payment Date</Label>
              <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Payment / Credit Reference #</Label>
              <Input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="ACH-77120" /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button disabled={busy} onClick={savePayment}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject / Adjust */}
      <Dialog open={action === "reject"} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Reject Claim</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2"><Label>Decision Date</Label>
              <Input type="date" value={approvalDate} onChange={(e) => setApprovalDate(e.target.value)} /></div>
            <div className="grid gap-2"><Label>Reason</Label>
              <Textarea rows={3} value={adjustmentReason} onChange={(e) => setAdjustmentReason(e.target.value)} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button variant="destructive" onClick={saveReject} disabled={busy||!adjustmentReason.trim()}>Reject Claim</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const RebateClaimsPaymentsPage = ({storeId}:{storeId:string}) => {
  const client=useQueryClient(),path='/access/stores/'+encodeURIComponent(storeId)+'/rebates/claims';
  const query=useQuery({queryKey:['rebate-claims',storeId],queryFn:()=>request<RebateClaim[]>(path)});
  const {query:catalog}=useRebates(storeId);
  const claims=query.data??[];
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const [newProgram,setNewProgram]=useState(''),[periodStart,setPeriodStart]=useState(''),[periodEnd,setPeriodEnd]=useState(''),[newAmount,setNewAmount]=useState('');
  async function mutate(url:string,body:unknown,version?:string){
    if(busy)return false;setBusy(true);setError('');
    try{await request(url,{method:'POST',headers:version?{'If-Match':version}:{},body:JSON.stringify(body)});await client.invalidateQueries({queryKey:['rebate-claims',storeId]});toast.success('Claim saved');return true;}
    catch(e){const message=e instanceof Error?e.message:String(e);setError(message);toast.error(message);return false;}finally{setBusy(false);}
  }
  async function createClaim(action:string){if(await mutate(path,{programId:newProgram,periodStart,periodEnd,claimed:newAmount,action,submittedDate:today()})){setShowNew(false);setNewAmount('');}}

  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const programs = Array.from(new Set(claims.map((c) => c.program)));
  const providers = Array.from(new Set(claims.map((c) => c.provider)));
  const periods = Array.from(new Set(claims.map((c) => c.period)));

  const filtered = claims.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.program.toLowerCase().includes(q) || c.provider.toLowerCase().includes(q) || c.reference.toLowerCase().includes(q)) &&
      (programFilter === "all" || c.program === programFilter) &&
      (providerFilter === "all" || c.provider === providerFilter) &&
      (statusFilter === "all" || c.status === statusFilter) &&
      (periodFilter === "all" || c.period === periodFilter)
    );
  });

  const { paginated, page, totalPages, totalItems, pageSize, hasPrev, hasNext, nextPage, prevPage } =
    usePagination(filtered, 10);

  const earned = null;
  const submitted = claims.reduce((s, c) => s + (c.claimed || 0), 0);
  const approved = claims.reduce((s, c) => s + (c.approved || 0), 0);
  const paid = claims.reduce((s, c) => s + (c.payment || 0), 0);
  const outstanding = approved - paid;

  const selected = claims.find((c) => c.id === selectedId) || null;

  const updateClaim=(id:string,updates:Record<string,unknown>)=>mutate(path+'/'+id+'/actions',updates,claims.find(c=>c.id===id)?.version);
  if (selected) {
    return (
      <ClaimDetails
        key={selected.id+"-"+selected.version} claim={selected} busy={busy}
        onBack={() => setSelectedId(null)}
        onUpdate={(u) => updateClaim(selected.id, u)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {query.isPending&&<p>Loading claims…</p>}{query.error&&<p role="alert" className="text-destructive">{String(query.error)}</p>}<p className="text-sm text-muted-foreground">Record claims and provider decisions here. Earned rebates are not calculated yet.</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Earned", value: earned },
          { label: "Submitted", value: submitted },
          { label: "Approved", value: approved },
          { label: "Outstanding", value: outstanding },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-xl font-bold text-foreground mt-1">{fmt(c.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="space-y-3 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-lg">Claims & Payments</CardTitle>
            <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Claim</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search claims..." className="pl-9 w-56" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={programFilter} onValueChange={setProgramFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All Programs" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {programs.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All Providers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                {providers.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Periods" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Periods</SelectItem>
                {periods.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Claim Period</TableHead>
                <TableHead className="text-right">Earned</TableHead>
                <TableHead className="text-right">Claimed</TableHead>
                <TableHead className="text-right">Approved</TableHead>
                <TableHead className="text-right">Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{!query.isPending&&!query.error&&filtered.length===0&&<TableRow><TableCell colSpan={9}>No claims found.</TableCell></TableRow>}
              {paginated.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => setSelectedId(c.id)}>
                  <TableCell className="font-medium">{c.program}</TableCell>
                  <TableCell className="text-muted-foreground">{c.provider}</TableCell>
                  <TableCell>{c.period}</TableCell>
                  <TableCell className="text-right">{fmt(c.earned)}</TableCell>
                  <TableCell className="text-right">{fmt(c.claimed)}</TableCell>
                  <TableCell className="text-right">{fmt(c.approved)}</TableCell>
                  <TableCell className="text-right">{fmt(c.payment)}</TableCell>
                  <TableCell>{statusBadge(c.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); setSelectedId(c.id); }}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize}
            hasPrev={hasPrev} hasNext={hasNext} onPrev={prevPage} onNext={nextPage}
          />
        </CardContent>
      </Card>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Rebate Claim</DialogTitle></DialogHeader>{error&&<p role="alert" className="text-destructive">{error}</p>}
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Program</Label>
              <Select value={newProgram} onValueChange={setNewProgram}><SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                <SelectContent>{catalog.data?.programs.filter(p=>["Active","Expired","Upcoming"].includes(p.status)).map(p=><SelectItem key={p.id} value={p.id}>{p.name} — {p.vendor}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Claim Period</Label>
              <div className="grid grid-cols-2 gap-2"><Input aria-label="Period start" type="date" value={periodStart} onChange={e=>setPeriodStart(e.target.value)}/><Input aria-label="Period end" type="date" value={periodEnd} onChange={e=>setPeriodEnd(e.target.value)}/></div>
            </div>
            <div className="grid gap-2">
              <Label>Claimed Amount</Label>
              <Input type="number" min="0.01" step="0.01" placeholder="Enter the amount requested" value={newAmount} onChange={e=>setNewAmount(e.target.value)}/>
            </div>
            <div className="grid gap-2">
              <Label>Supporting Documents</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Document upload is not connected yet</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" disabled={busy||!newProgram||!periodStart||!periodEnd} onClick={()=>createClaim("draft")}>Save as Draft</Button>
              <Button disabled={busy||!newProgram||!periodStart||!periodEnd||!newAmount} onClick={()=>createClaim("submit")}>
                <Send className="h-4 w-4 mr-1" /> Submit Claim
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
