import {useCards,fmt,net,difference,statusName,exportRows,DateFilters,type Batch} from './creditCardData';
import {CreateBatch,BatchTransition} from './BatchDialogs';
import { useState } from "react";
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Download, Upload, CheckCircle2, CreditCard, DollarSign, TrendingDown, AlertTriangle, ArrowRightLeft, X } from "lucide-react";

type BatchStatus = "Open" | "Submitted" | "Settled" | "Reconciled";

type SettlementRow={id:string;batchDate:string;posBatchId:string;posCardSales:number;processorSales:number|null;fees:number|null;netDeposit:number|null;bankDeposit:number|null;variance:number|null;status:BatchStatus;txnCount:number;chargebacks:number;feeBreakdown:{interchange:null;assessment:null;processing:null};raw:Batch};
const statusColor: Record<BatchStatus, string> = {
  Open: "bg-muted text-muted-foreground",
  Submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Settled: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  Reconciled: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

const varianceColor = (v: number|null) => {
  if(v==null)return "text-muted-foreground";
  if (v === 0) return "text-green-600 dark:text-green-400";
  if (Math.abs(v) <= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
};

export const CreditCardSettlementPage = () => {
 const c=useCards();const data=c.q.data!;
 const [creating,setCreating]=useState(false),[transition,setTransition]=useState<{batch:Batch;action:'SUBMIT'|'SETTLE'|'RECONCILE'}|null>(null);
 const rows:SettlementRow[]=data.batches.map(b=>({id:String(b.batch_id),batchDate:b.business_date,posBatchId:b.batch_reference,posCardSales:Number(b.pos_sales),processorSales:b.processor_sales,fees:b.actual_fee,netDeposit:net(b),bankDeposit:b.received_amount,variance:difference(b),status:statusName(b),txnCount:b.transaction_count,chargebacks:Number(b.chargebacks),feeBreakdown:{interchange:null,assessment:null,processing:null},raw:b}));
  const [processor, setProcessor] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [markOpen, setMarkOpen] = useState(false);
  const [viewRow, setViewRow] = useState<SettlementRow | null>(null);

  const hasActiveFilters = processor !== "all" || statusFilter !== "all";
  const clearFilters = () => { setProcessor("all"); setStatusFilter("all"); };

  const filtered = rows.filter((r) => {
    if (processor !== "all" && String(r.raw.processor_id)!==processor) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });

  const totals = {
    posCardSales: filtered.reduce((s, r) => s + r.posCardSales, 0),
    processorSales: filtered.reduce((s, r) => s + Number(r.processorSales??0), 0),
    fees: filtered.reduce((s, r) => s + Number(r.fees??0), 0),
    netDeposit: filtered.reduce((s, r) => s + Number(r.netDeposit??0), 0),
    variance: filtered.reduce((s, r) => s + Number(r.variance??0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Credit Card Settlement</h1>
          <p className="text-sm text-muted-foreground">Reconcile POS card batches against processor deposits</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled title="Processor file format integration is pending"><Upload className="w-4 h-4 mr-1" />Import Processor File</Button>
          <Button variant="outline" size="sm" onClick={()=>exportRows("card-settlements",filtered.map(r=>({...r.raw,expected_net:net(r.raw),deposit_difference:difference(r.raw)})))}><Download className="w-4 h-4 mr-1" />Export</Button>
          <Button size="sm" onClick={()=>setCreating(true)}>+ Create Batch</Button>
          <Button size="sm" disabled={!rows.some(r=>r.status==='Submitted')} onClick={() => setMarkOpen(true)}><CheckCircle2 className="w-4 h-4 mr-1" />Mark as Settled</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-10 bg-background py-3 flex flex-wrap gap-3 items-end border-b border-border pb-4">
        <DateFilters />
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Processor</label>
          <Select value={processor} onValueChange={setProcessor}>
            <SelectTrigger className="w-40 h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Processors</SelectItem>
              {data.processors.map(p=><SelectItem key={p.processor_id} value={String(p.processor_id)}>{p.processor_name}</SelectItem>)}
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
              <SelectItem value="Submitted">Submitted</SelectItem>
              <SelectItem value="Settled">Settled</SelectItem>
              <SelectItem value="Reconciled">Reconciled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-9 text-xs gap-1 text-muted-foreground" onClick={clearFilters}>
            <X className="w-3.5 h-3.5" />Clear filters
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">Manual groups use selected recorded payments. Missing statement amounts remain blank; summary totals include only recorded amounts.</p>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><CreditCard className="w-4 h-4 text-muted-foreground" /><span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">POS Card Sales</span></div>
          <p className="text-lg font-bold text-foreground">{fmt(totals.posCardSales)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><ArrowRightLeft className="w-4 h-4 text-muted-foreground" /><span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Processor Sales</span></div>
          <p className="text-lg font-bold text-foreground">{fmt(totals.processorSales)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><TrendingDown className="w-4 h-4 text-muted-foreground" /><span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Total Fees</span></div>
          <p className="text-lg font-bold text-foreground">{fmt(totals.fees)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4 text-muted-foreground" /><span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Net Deposit</span></div>
          <p className="text-lg font-bold text-foreground">{fmt(totals.netDeposit)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-muted-foreground" /><span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Variance</span></div>
          <p className={`text-lg font-bold ${varianceColor(totals.variance)}`}>{fmt(totals.variance)}</p>
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
                <TableHead className="text-[11px] text-right">POS Card Sales</TableHead>
                <TableHead className="text-[11px] text-right">Processor Sales</TableHead>
                <TableHead className="text-[11px] text-right">Fees</TableHead>
                <TableHead className="text-[11px] text-right">Net Deposit</TableHead>
                <TableHead className="text-[11px] text-right">Amount Received</TableHead>
                <TableHead className="text-[11px] text-right">Variance</TableHead>
                <TableHead className="text-[11px]">Status</TableHead>
                <TableHead className="text-[11px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length===0&&<TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">No batches for these filters. Add a processor in Settings, then create a batch.</TableCell></TableRow>}
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{r.batchDate}</TableCell>
                  <TableCell className="text-xs font-medium">{r.posBatchId}<span className="block text-muted-foreground text-[10px]">{r.raw.processor_name} · Manual group</span></TableCell>
                  <TableCell className="text-xs text-right">{fmt(r.posCardSales)}</TableCell>
                  <TableCell className="text-xs text-right">{fmt(r.processorSales)}</TableCell>
                  <TableCell className="text-xs text-right">{fmt(r.fees)}</TableCell>
                  <TableCell className="text-xs text-right">{fmt(r.netDeposit)}</TableCell>
                  <TableCell className="text-xs text-right">{r.bankDeposit !== null ? fmt(r.bankDeposit) : "—"}</TableCell>
                  <TableCell className={`text-xs text-right font-semibold ${varianceColor(r.variance)}`}>{fmt(r.variance)}</TableCell>
                  <TableCell><Badge className={`text-[10px] ${statusColor[r.status]}`}>{r.status}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setViewRow(r)}>View</Button>{r.raw.status!=='RECONCILED'&&<Button variant="ghost" size="sm" className="text-xs h-7" disabled={c.busy} onClick={()=>setTransition({batch:r.raw,action:r.raw.status==='OPEN'?'SUBMIT':r.raw.status==='SUBMITTED'?'SETTLE':'RECONCILE'})}>{r.raw.status==='OPEN'?'Submit':r.raw.status==='SUBMITTED'?'Settle':'Reconcile'}</Button>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mark as Settled Dialog */}
      <Dialog open={markOpen} onOpenChange={setMarkOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark Batches as Settled</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Select the batch whose funds were received.</p>
          {filtered.filter(r=>r.status==='Submitted').map(r=><Button key={r.id} variant="outline" onClick={()=>{setMarkOpen(false);setTransition({batch:r.raw,action:'SETTLE'});}}>{r.posBatchId} · {fmt(r.netDeposit)}</Button>)}
          <DialogFooter><Button variant="outline" onClick={()=>setMarkOpen(false)}>Cancel</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {creating&&<CreateBatch onClose={()=>setCreating(false)}/>}
      {transition&&<BatchTransition {...transition} onClose={()=>setTransition(null)}/>}
      {/* View Settlement Drawer */}
      <Sheet open={!!viewRow} onOpenChange={() => setViewRow(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Settlement Details — {viewRow?.id}</SheetTitle>
            <SheetDescription>Batch {viewRow?.posBatchId} • {viewRow?.batchDate}</SheetDescription>
          </SheetHeader>
          {viewRow && (
            <div className="mt-6 space-y-6">
              {/* POS Summary */}
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-2">POS Summary</h3>
                <div className="bg-muted/40 rounded-md p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Card Sales Total</span><span className="font-medium">{fmt(viewRow.posCardSales)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Chargeable Payments</span><span className="font-medium">{viewRow.txnCount}</span></div>
                </div>
              </section>

              <p className="text-xs text-muted-foreground">Processor / POS difference: {viewRow.processorSales==null?'—':fmt(Number(viewRow.processorSales)-viewRow.posCardSales)}. Fee components await a processor statement import; the actual total fee is recorded in Update Batch Fee.</p>
              {/* Processor Summary */}
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-2">Processor Summary</h3>
                <div className="bg-muted/40 rounded-md p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Gross Amount</span><span className="font-medium">{fmt(viewRow.processorSales)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Interchange Fee</span><span className="font-medium">({fmt(viewRow.feeBreakdown.interchange)})</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Assessment Fee</span><span className="font-medium">({fmt(viewRow.feeBreakdown.assessment)})</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Processing Fee</span><span className="font-medium">({fmt(viewRow.feeBreakdown.processing)})</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Chargebacks</span><span className="font-medium">({fmt(viewRow.chargebacks)})</span></div>
                  <div className="flex justify-between border-t border-border pt-1 mt-1"><span className="font-medium text-foreground">Net Deposit</span><span className="font-bold">{fmt(viewRow.netDeposit)}</span></div>
                </div>
              </section>

              {/* Reconciliation */}
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-2">Reconciliation</h3>
                <div className="bg-muted/40 rounded-md p-3 text-sm font-mono space-y-1">
                  <div className="flex justify-between"><span>Processor Sales</span><span>{fmt(viewRow.processorSales)}</span></div>
                  <div className="flex justify-between"><span>− Fees</span><span>({fmt(viewRow.fees)})</span></div><div className="flex justify-between"><span>− Chargebacks</span><span>{fmt(viewRow.chargebacks)}</span></div>
                  <div className="flex justify-between border-t border-border pt-1"><span>= Expected Deposit</span><span>{fmt(viewRow.netDeposit)}</span></div>
                  <div className="flex justify-between"><span>Amount Received</span><span>{viewRow.bankDeposit !== null ? fmt(viewRow.bankDeposit) : "—"}</span></div>
                  <div className={`flex justify-between border-t border-border pt-1 font-bold ${varianceColor(viewRow.variance)}`}>
                    <span>= Variance</span><span>{fmt(viewRow.variance)}</span>
                  </div>
                </div>
              </section>

              {/* Status */}
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-2">Status</h3>
                <Badge className={`${statusColor[viewRow.status]} text-xs`}>{viewRow.status}</Badge>
                <div className="mt-3 flex gap-1">
                  {(["Open", "Submitted", "Settled", "Reconciled"] as BatchStatus[]).map((s, i) => (
                    <div key={s} className="flex items-center gap-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${(["Open", "Submitted", "Settled", "Reconciled"].indexOf(viewRow.status) >= i) ? "bg-primary" : "bg-muted"}`} />
                      <span className="text-[10px] text-muted-foreground">{s}</span>
                      {i < 3 && <div className="w-4 h-px bg-border" />}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
