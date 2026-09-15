import { useState } from "react";
import {useQuery} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import {useEbt,amount,expected,variance,type EbtBatch,type EbtDetails} from './ebtData';
import {EbtCreate,EbtSettlement,EbtReconcile} from './EbtDialogs';
import {exportRows} from '../credit-card/creditCardData';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Download, FileText, DollarSign, CreditCard, Hash, AlertTriangle, ArrowRightLeft, X } from "lucide-react";

type EbtStatus = "Open" | "Settled" | "Reconciled";

interface EbtBatchRow {
  id: string;
  batchDate: string;
  posBatchId: string;
  snapAmount: number;
  ebtCashAmount: number;
  totalEbt: number;
  fees: number | null;
  netDeposit: number | null;
  actualDeposit: number | null;
  variance: number | null;
  status: EbtStatus;
  txnCount: number;
  refunds: number;
  adjustments: number;
  settlementDate: string | null;
  reference: string | null;
  raw: EbtBatch;
}

const statusColor: Record<EbtStatus, string> = {
  Open: "bg-muted text-muted-foreground",
  Settled: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  Reconciled: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

const varianceColor = (v: number | null) => {
  if(v==null)return "text-muted-foreground";
  if (v === 0) return "text-green-600 dark:text-green-400";
  if (Math.abs(v) <= 25) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
};

const fmt = (n: number | null) => n==null ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export const EbtFoodstampsPage = ({storeId}:{storeId:string}) => {
  const c=useEbt(storeId);
  const [create,setCreate]=useState(false),[settle,setSettle]=useState<EbtBatch|null>(null),[review,setReview]=useState<EbtBatch|null>(null),[summary,setSummary]=useState(false);
  const [ebtType, setEbtType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchBatch, setSearchBatch] = useState("");
  const [viewId,setViewId]=useState<number|null>(null);
  const rows:EbtBatchRow[]=(c.q.data?.batches??[]).map(b=>({id:String(b.batch_id),batchDate:b.business_date,posBatchId:b.batch_reference,snapAmount:amount(b.snap_amount),ebtCashAmount:amount(b.cash_amount),totalEbt:amount(b.snap_amount)+amount(b.cash_amount),fees:b.fees==null?null:amount(b.fees),netDeposit:expected(b),actualDeposit:b.actual_deposit==null?null:amount(b.actual_deposit),variance:variance(b),status:({OPEN:'Open',SETTLED:'Settled',RECONCILED:'Reconciled'} as const)[b.status],txnCount:b.transaction_count,refunds:amount(b.refund_amount),adjustments:amount(b.adjustment_amount),settlementDate:b.settlement_date,reference:b.settlement_reference,raw:b}));
  const viewRow=rows.find(r=>Number(r.id)===viewId)??null;
  const detail=useQuery({queryKey:['ebt-details',storeId,viewId,viewRow?.raw.version],queryFn:()=>request<EbtDetails>(c.base+'/batches/'+viewId),enabled:viewId!=null});

  const hasActiveFilters = ebtType !== "all" || statusFilter !== "all" || searchBatch !== "";
  const clearFilters = () => { setEbtType("all"); setStatusFilter("all"); setSearchBatch(""); };

  const filtered = rows.filter((r) => {
    if(ebtType==='snap'&&!r.raw.has_snap)return false;
    if(ebtType==='cash'&&!r.raw.has_cash)return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (searchBatch && !r.posBatchId.toLowerCase().includes(searchBatch.toLowerCase())) return false;
    return true;
  });

  const totals = {
    snap: filtered.reduce((s, r) => s + r.snapAmount, 0),
    cash: filtered.reduce((s, r) => s + r.ebtCashAmount, 0),
    txnCount: new Set(filtered.flatMap(r=>JSON.parse(r.raw.receipt_ids_json??'[]') as number[])).size,
    netDeposit: filtered.reduce((s, r) => s + (r.netDeposit??0), 0),
    variance: filtered.reduce((s, r) => s + (r.variance??0), 0),
  };

  const exported=filtered.map(r=>({'Batch Date':r.batchDate,'Batch Reference':r.posBatchId,'Source':r.raw.source_kind,'SNAP Net':r.snapAmount,'EBT Cash Net':r.ebtCashAmount,'Refunds (already included)':r.refunds,'Total EBT':r.totalEbt,'Transactions':r.txnCount,'Adjustment':r.adjustments,'Adjustment Reason':r.raw.adjustment_reason,'Fees':r.fees,'Expected Deposit':r.netDeposit,'Actual Deposit':r.actualDeposit,'Variance':r.variance,'Status':r.status,'Settlement Date':r.settlementDate,'Settlement Reference':r.reference,'Notes':r.raw.notes,'Review Note':r.raw.variance_review_note}));
  if(!c.q.data)return <div className="p-6">{c.q.isPending?'Loading EBT batches…':<><p role="alert">{c.q.error?.message}</p><Button onClick={()=>void c.q.refetch()}>Retry</Button></>}</div>;
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">EBT / Food Stamps</h1>
          <p className="text-sm text-muted-foreground">Track SNAP and EBT Cash batches, settlements, and reconciliation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={!filtered.length||c.busy} onClick={()=>exportRows("ebt-batches",exported)}><Download className="w-4 h-4 mr-1" />Export</Button>
          <Button size="sm" disabled={c.busy} onClick={()=>setSummary(true)}><FileText className="w-4 h-4 mr-1" />Settlement Summary</Button>
          <Button size="sm" disabled={c.busy||!!c.q.error} onClick={()=>{c.setError('');setCreate(true);}}>+ Create Batch</Button>
        </div>
      </div>

      {(c.error||c.q.error)&&<p role="alert" className="text-destructive">{c.error||c.q.error?.message}</p>}
      {c.q.isFetching&&<p className="text-sm text-muted-foreground">Refreshing batches…</p>}
      {/* Filters */}
      <div className="sticky top-0 z-10 bg-background py-3 flex flex-wrap gap-3 items-end border-b border-border pb-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">From</label>
          <Input aria-label="EBT From" type="date" max={c.q.data.today} value={c.range.start||c.q.data.start} onChange={e=>c.setRange(r=>({start:e.target.value,end:r.end||c.q.data!.end}))} className="w-36 h-9 text-xs" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">To</label>
          <Input aria-label="EBT To" type="date" max={c.q.data.today} value={c.range.end||c.q.data.end} onChange={e=>c.setRange(r=>({start:r.start||c.q.data!.start,end:e.target.value}))} className="w-36 h-9 text-xs" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">EBT Type</label>
          <Select value={ebtType} onValueChange={setEbtType}>
            <SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="snap">SNAP</SelectItem>
              <SelectItem value="cash">EBT Cash</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="Settled">Settled</SelectItem>
              <SelectItem value="Reconciled">Reconciled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Batch Reference</label>
          <Input placeholder="Search batch…" value={searchBatch} onChange={(e) => setSearchBatch(e.target.value)} className="w-40 h-9 text-xs" />
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-9 text-xs gap-1 text-muted-foreground" onClick={clearFilters}>
            <X className="w-3.5 h-3.5" />Clear filters
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">Totals cover the batches below. Type filters select batches containing that benefit; mixed batches retain both totals. Refunds are already deducted. Missing settlement values remain blank.</p>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><CreditCard className="w-4 h-4 text-muted-foreground" /><span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Total SNAP Sales</span></div>
          <p className="text-lg font-bold text-foreground">{fmt(totals.snap)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4 text-muted-foreground" /><span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Total EBT Cash</span></div>
          <p className="text-lg font-bold text-foreground">{fmt(totals.cash)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><Hash className="w-4 h-4 text-muted-foreground" /><span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">EBT Transactions</span></div>
          <p className="text-lg font-bold text-foreground">{totals.txnCount.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><ArrowRightLeft className="w-4 h-4 text-muted-foreground" /><span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Net Settlement</span></div>
          <p className="text-lg font-bold text-foreground">{fmt(filtered.some(r=>r.netDeposit!=null)?totals.netDeposit:null)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-muted-foreground" /><span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Variance</span></div>
          <p className={`text-lg font-bold ${varianceColor(totals.variance)}`}>{fmt(filtered.some(r=>r.variance!=null)?totals.variance:null)}</p>
        </CardContent></Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px]">Batch Date</TableHead>
                <TableHead className="text-[11px]">Batch Reference</TableHead>
                <TableHead className="text-[11px] text-right">SNAP $</TableHead>
                <TableHead className="text-[11px] text-right">EBT Cash $</TableHead>
                <TableHead className="text-[11px] text-right">Total EBT $</TableHead>
                <TableHead className="text-[11px] text-right">Fees</TableHead>
                <TableHead className="text-[11px] text-right">Net Deposit</TableHead>
                <TableHead className="text-[11px]">Status</TableHead>
                <TableHead className="text-[11px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{r.batchDate}</TableCell>
                  <TableCell className="text-xs font-medium">{r.posBatchId}<span className="block text-[10px] text-muted-foreground">{r.raw.source_kind==='MANUAL_GROUP'?'Manual group':'POS batch'}</span></TableCell>
                  <TableCell className="text-xs text-right">{fmt(r.snapAmount)}</TableCell>
                  <TableCell className="text-xs text-right">{fmt(r.ebtCashAmount)}</TableCell>
                  <TableCell className="text-xs text-right font-medium">{fmt(r.totalEbt)}</TableCell>
                  <TableCell className="text-xs text-right">{fmt(r.fees)}</TableCell>
                  <TableCell className="text-xs text-right">{fmt(r.netDeposit)}</TableCell>
                  <TableCell><Badge className={`text-[10px] ${statusColor[r.status]}`}>{r.status}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setViewId(Number(r.id))}>View</Button>{r.status!=='Reconciled'&&<Button variant="ghost" size="sm" className="text-xs h-7" disabled={c.busy||!!c.q.error} onClick={()=>{c.setError('');setSettle(r.raw);}}>{r.status==='Open'?'Settle':'Edit Settlement'}</Button>}{r.status==='Settled'&&<Button variant="ghost" size="sm" className="text-xs h-7" disabled={c.busy||!!c.q.error} onClick={()=>{c.setError('');setReview(r.raw);}}>Reconcile</Button>}</TableCell>
                </TableRow>
              ))}
              {!filtered.length&&<TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">No EBT batches for these filters. Use Create Batch to select recorded payments.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Drawer */}
      <Sheet open={!!viewRow} onOpenChange={() => setViewId(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>EBT Batch Details — {viewRow?.id}</SheetTitle>
            <SheetDescription>Batch {viewRow?.posBatchId} • {viewRow?.batchDate}</SheetDescription>
          </SheetHeader>
          {viewRow && (
            <div className="mt-6 space-y-6">
              {/* Breakdown */}
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-2">EBT Breakdown</h3>
                <div className="bg-muted/40 rounded-md p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">SNAP Total</span><span className="font-medium">{fmt(viewRow.snapAmount)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Cash Benefit Total</span><span className="font-medium">{fmt(viewRow.ebtCashAmount)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Refunds (already deducted)</span><span className="font-medium">({fmt(viewRow.refunds)})</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Adjustments</span><span className="font-medium">{fmt(viewRow.adjustments)}</span></div>
                  <div className="flex justify-between border-t border-border pt-1 mt-1"><span className="font-medium text-foreground">Total EBT</span><span className="font-bold">{fmt(viewRow.totalEbt)}</span></div>
                </div>
              </section>

              {/* Settlement Info */}
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-2">Settlement Info</h3>
                <div className="bg-muted/40 rounded-md p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Settlement Date</span><span className="font-medium">{viewRow.settlementDate || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Deposit Amount</span><span className="font-medium">{viewRow.actualDeposit !== null ? fmt(viewRow.actualDeposit) : "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Reference #</span><span className="font-medium">{viewRow.reference || "—"}</span></div>
                </div>
              </section>

              {/* Reconciliation */}
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-2">Reconciliation</h3>
                <div className="bg-muted/40 rounded-md p-3 text-sm font-mono space-y-1">
                  <div className="flex justify-between"><span>POS EBT Total</span><span>{fmt(viewRow.totalEbt)}</span></div>
                  <div className="flex justify-between"><span>+ Statement adjustment</span><span>{fmt(viewRow.adjustments)}</span></div>
                  <div className="flex justify-between"><span>− Fees</span><span>({fmt(viewRow.fees)})</span></div>
                  <div className="flex justify-between border-t border-border pt-1"><span>= Expected Deposit</span><span>{fmt(viewRow.netDeposit)}</span></div>
                  <div className="flex justify-between"><span>Actual Deposit</span><span>{viewRow.actualDeposit !== null ? fmt(viewRow.actualDeposit) : "—"}</span></div>
                  <div className={`flex justify-between border-t border-border pt-1 font-bold ${varianceColor(viewRow.variance)}`}>
                    <span>= Variance</span><span>{fmt(viewRow.variance)}</span>
                  </div>
                </div>
              </section>

              <section className="text-sm space-y-2">
                {viewRow.raw.adjustment_reason&&<p>Adjustment reason: {viewRow.raw.adjustment_reason}</p>}
                {viewRow.raw.notes&&<p>Notes: {viewRow.raw.notes}</p>}
                {viewRow.raw.variance_review_note&&<p>Variance review: {viewRow.raw.variance_review_note}</p>}
                <h3 className="font-semibold">Included Payments</h3>
                {detail.isPending&&<p>Loading payments…</p>}{detail.error&&<p role="alert">{detail.error.message}</p>}
                {detail.data?.payments.map(p=><div key={p.sale_payment_id} className="flex justify-between gap-3"><span>{p.receipt_no} · {p.benefit_type}</span><span>{fmt(amount(p.payment_amount_snapshot))}</span></div>)}
                <h3 className="font-semibold pt-2">History</h3>
                {detail.data?.audit.map(e=><p key={e.event_id} className="text-xs text-muted-foreground">{e.created_at} · {e.actor} · {e.event_type.split('_').join(' ')}</p>)}
              </section>
              {/* Status */}
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-2">Status</h3>
                <Badge className={`${statusColor[viewRow.status]} text-xs`}>{viewRow.status}</Badge>
                <div className="mt-3 flex gap-1">
                  {(["Open", "Settled", "Reconciled"] as EbtStatus[]).map((s, i) => (
                    <div key={s} className="flex items-center gap-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${(["Open", "Settled", "Reconciled"].indexOf(viewRow.status) >= i) ? "bg-primary" : "bg-muted"}`} />
                      <span className="text-[10px] text-muted-foreground">{s}</span>
                      {i < 2 && <div className="w-4 h-px bg-border" />}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </SheetContent>
      </Sheet>
      {create&&<EbtCreate c={c} onClose={()=>setCreate(false)}/>}
      {settle&&<EbtSettlement c={c} batch={settle} onClose={()=>setSettle(null)}/>}
      {review&&<EbtReconcile c={c} batch={review} onClose={()=>setReview(null)}/>}
      <Dialog open={summary} onOpenChange={setSummary}><DialogContent><DialogHeader><DialogTitle>EBT Settlement Summary</DialogTitle><DialogDescription>{c.q.data.start} through {c.q.data.end} · Current filters · {filtered.length} batches</DialogDescription></DialogHeader>
       <div className="space-y-2 text-sm"><p>SNAP net: {fmt(totals.snap)}</p><p>EBT Cash net: {fmt(totals.cash)}</p><p>Transactions: {totals.txnCount}</p><p>Expected settlement (recorded fees): {fmt(filtered.some(r=>r.netDeposit!=null)?totals.netDeposit:null)}</p><p>Received (settled batches): {fmt(filtered.some(r=>r.actualDeposit!=null)?filtered.reduce((s,r)=>s+(r.actualDeposit??0),0):null)}</p><p>Variance (settled batches): {fmt(filtered.some(r=>r.variance!=null)?totals.variance:null)}</p><p>Open: {filtered.filter(r=>r.status==='Open').length} · Settled: {filtered.filter(r=>r.status==='Settled').length} · Reconciled: {filtered.filter(r=>r.status==='Reconciled').length}</p></div>
       <Button disabled={!filtered.length} onClick={()=>exportRows('ebt-settlement-summary',exported)}>Export Summary Details</Button>
      </DialogContent></Dialog>
    </div>
  );
};
