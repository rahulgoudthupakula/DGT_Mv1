import {useCards,fmt,net,statusName,exportRows,DateFilters,type Batch} from './creditCardData';
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Download, Save, DollarSign, Percent, TrendingDown, AlertTriangle, CreditCard } from "lucide-react";

type BatchFeeStatus = "Open" | "Submitted" | "Fee Updated" | "Settled" | "Reconciled";

interface BatchFeeRow {
  id: string;
  batchDate: string;
  posBatchId: string;
  grossCardSales: number;
  configuredFeePercent: number;
  expectedFee: number;
  actualFee: number|null;
  feeDifference: number|null;
  status: BatchFeeStatus;
  reason?: string;
  notes?: string;
  raw:Batch;
}

const statusColor: Record<BatchFeeStatus, string> = {
  Open: "bg-muted text-muted-foreground",
  Submitted: "bg-blue-100 text-blue-800",
  "Fee Updated": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  Settled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Reconciled: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

const diffColor = (v: number|null) => {
  if(v==null)return "text-muted-foreground";
  if (v === 0) return "text-green-600 dark:text-green-400";
  if (Math.abs(v) <= 25) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
};

export const UpdateBatchFeePage = () => {
 const c=useCards(),data=c.q.data!;
 const rows:BatchFeeRow[]=data.batches.map(b=>({id:String(b.batch_id),batchDate:b.business_date,posBatchId:b.batch_reference,grossCardSales:Number(b.pos_sales),configuredFeePercent:Number(b.configured_fee_percent),expectedFee:Number(b.expected_fee),actualFee:b.actual_fee,feeDifference:b.actual_fee==null?null:Number(b.actual_fee)-Number(b.expected_fee),status:b.status==='OPEN'&&b.actual_fee!=null?'Fee Updated':statusName(b),reason:b.fee_reason??'',notes:b.notes??'',raw:b}));
  const [processor, setProcessor] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchBatch, setSearchBatch] = useState("");
  const [editRow, setEditRow] = useState<BatchFeeRow | null>(null);
  const [viewRow, setViewRow] = useState<BatchFeeRow | null>(null);
  const [editActualFee, setEditActualFee] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const filtered = rows.filter((r) => {
    if(processor!=="all"&&String(r.raw.processor_id)!==processor)return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (searchBatch && !r.posBatchId.toLowerCase().includes(searchBatch.toLowerCase())) return false;
    return true;
  });

  const totals = {
    grossSales: filtered.reduce((s, r) => s + r.grossCardSales, 0),
    expectedFees: filtered.reduce((s, r) => s + r.expectedFee, 0),
    actualFees: filtered.reduce((s, r) => s + Number(r.actualFee??0), 0),
    totalDifference: filtered.reduce((s, r) => s + Number(r.feeDifference??0), 0),
  };

  const openEditModal = (row: BatchFeeRow) => {
    setEditRow(row);
    setEditActualFee(row.actualFee==null?"":String(row.actualFee));
    setEditReason(row.reason || "");
    setEditNotes(row.notes || "");
  };

  const editDiff = editRow ? (parseFloat(editActualFee || "0") - editRow.expectedFee) : 0;
  const tolerance=editRow?Number(editRow.raw.fee_base)*Number(data.settings.fee_difference_percent)/100:0;
  const requiresReason = Math.abs(editDiff) > tolerance;
  const canSave=!c.busy&&/^\d+(\.\d{1,2})?$/.test(editActualFee)&&(!requiresReason||!!editReason.trim());
  const saveFee=()=>{if(editRow)void c.mutate(`/batches/${editRow.raw.batch_id}/fee`,{version:editRow.raw.version,actualFee:Number(editActualFee),reason:editReason,notes:editNotes},'PUT').then(()=>setEditRow(null)).catch(()=>{});};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Update Batch Fee</h1>
          <p className="text-sm text-muted-foreground">Adjust actual processing fees per batch when processor statements differ</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={()=>exportRows("batch-fees",filtered.map(r=>({...r.raw,fee_difference:r.feeDifference,expected_net:net(r.raw)})))}><Download className="w-4 h-4 mr-1" />Export</Button>
          <Button size="sm" disabled title="Use Edit on a batch to save its fee"><Save className="w-4 h-4 mr-1" />Save Changes</Button>
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
              <SelectItem value="Open">Open</SelectItem><SelectItem value="Submitted">Submitted</SelectItem>
              <SelectItem value="Fee Updated">Fee Updated</SelectItem>
              <SelectItem value="Settled">Settled</SelectItem>
              <SelectItem value="Reconciled">Reconciled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Batch Reference</label>
          <Input placeholder="Search batch…" value={searchBatch} onChange={(e) => setSearchBatch(e.target.value)} className="w-40 h-9 text-xs" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><CreditCard className="w-4 h-4 text-muted-foreground" /><span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Gross Card Sales</span></div>
          <p className="text-lg font-bold text-foreground">{fmt(totals.grossSales)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><Percent className="w-4 h-4 text-muted-foreground" /><span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Expected Fees</span></div>
          <p className="text-lg font-bold text-foreground">{fmt(totals.expectedFees)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4 text-muted-foreground" /><span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Actual Fees</span></div>
          <p className="text-lg font-bold text-foreground">{fmt(totals.actualFees)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-muted-foreground" /><span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Fee Difference</span></div>
          <p className={`text-lg font-bold ${diffColor(totals.totalDifference)}`}>{fmt(totals.totalDifference)}</p>
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
                <TableHead className="text-[11px] text-right">Gross Sales</TableHead>
                <TableHead className="text-[11px] text-right">Fee %</TableHead>
                <TableHead className="text-[11px] text-right">Expected Fee</TableHead>
                <TableHead className="text-[11px] text-right">Actual Fee</TableHead>
                <TableHead className="text-[11px] text-right">Difference</TableHead>
                <TableHead className="text-[11px]">Status</TableHead>
                <TableHead className="text-[11px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length===0&&<TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">No batches for these filters.</TableCell></TableRow>}
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{r.batchDate}</TableCell>
                  <TableCell className="text-xs font-medium">{r.posBatchId}</TableCell>
                  <TableCell className="text-xs text-right">{fmt(r.grossCardSales)}</TableCell>
                  <TableCell className="text-xs text-right">{r.configuredFeePercent}%</TableCell>
                  <TableCell className="text-xs text-right">{fmt(r.expectedFee)}</TableCell>
                  <TableCell className="text-xs text-right">{fmt(r.actualFee)}</TableCell>
                  <TableCell className={`text-xs text-right font-semibold ${diffColor(r.feeDifference)}`}>{fmt(r.feeDifference)}</TableCell>
                  <TableCell><Badge className={`text-[10px] ${statusColor[r.status]}`}>{r.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {(r.raw.status !== "RECONCILED") && (
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => openEditModal(r)}>Edit</Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setViewRow(r)}>View</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Fee Modal */}
      <Dialog open={!!editRow} onOpenChange={() => setEditRow(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Fee — {editRow?.posBatchId}</DialogTitle></DialogHeader>
          {editRow && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-md p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Gross Sales</span><span className="font-medium">{fmt(editRow.grossCardSales)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Configured Rate</span><span className="font-medium">{editRow.configuredFeePercent}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Expected Fee</span><span className="font-medium">{fmt(editRow.expectedFee)}</span></div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Actual Fee</Label>
                <Input type="number" step="0.01" value={editActualFee} onChange={(e) => setEditActualFee(e.target.value)} aria-label="Actual Fee" className="h-9" />
                {editDiff !== 0 && (
                  <p className={`text-xs font-medium ${diffColor(Math.abs(editDiff))}`}>
                    Difference: {fmt(editDiff)} {editDiff > 0 ? "(over)" : "(under)"}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Reason {requiresReason && <span className="text-destructive">*</span>}</Label>
                <Input placeholder="e.g. PCI fee, chargeback fee, downgrade" value={editReason} onChange={(e) => setEditReason(e.target.value)} className="h-9" />
                {requiresReason && !editReason && (
                  <p className="text-[10px] text-destructive">Reason is required when difference exceeds {fmt(tolerance)}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Notes</Label>
                <Textarea placeholder="Additional details…" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="min-h-[60px] text-xs" />
              </div>
            </div>
          )}
          {c.error&&<p role="alert" className="text-destructive">{c.error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRow(null)}>Cancel</Button>
            <Button variant="outline" onClick={saveFee} disabled={!canSave}>Save</Button>
            <Button onClick={saveFee} disabled={!canSave}><TrendingDown className="w-4 h-4 mr-1" />Save & Recalculate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Batch Fee Drawer */}
      <Sheet open={!!viewRow} onOpenChange={() => setViewRow(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Batch Fee Details — {viewRow?.id}</SheetTitle>
            <SheetDescription>Batch {viewRow?.posBatchId} • {viewRow?.batchDate}</SheetDescription>
          </SheetHeader>
          {viewRow && (
            <div className="mt-6 space-y-6">
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-2">Fee Calculation</h3>
                <div className="bg-muted/40 rounded-md p-3 text-sm font-mono space-y-1">
                  <div className="flex justify-between"><span>Fee Base</span><span>{fmt(viewRow.raw.fee_base)}</span></div>
                  <div className="flex justify-between"><span>× Fee Rate</span><span>{viewRow.configuredFeePercent}%</span></div><div className="flex justify-between"><span>+ Per-payment fees</span><span>{fmt(Number(viewRow.raw.per_transaction_fee)*viewRow.raw.transaction_count)}</span></div>
                  <div className="flex justify-between border-t border-border pt-1"><span>= Expected Fee</span><span>{fmt(viewRow.expectedFee)}</span></div>
                  <div className="flex justify-between"><span>Actual Fee</span><span>{fmt(viewRow.actualFee)}</span></div>
                  <div className={`flex justify-between border-t border-border pt-1 font-bold ${diffColor(viewRow.feeDifference)}`}>
                    <span>= Difference</span><span>{fmt(viewRow.feeDifference)}</span>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-foreground mb-2">Net Deposit Impact</h3>
                <div className="bg-muted/40 rounded-md p-3 text-sm font-mono space-y-1">
                  <div className="flex justify-between"><span>Processor Sales</span><span>{fmt(viewRow.raw.processor_sales)}</span></div>
                  <div className="flex justify-between"><span>− Actual Fee</span><span>({fmt(viewRow.actualFee)})</span></div><div className="flex justify-between"><span>− Chargebacks</span><span>{fmt(viewRow.raw.chargebacks)}</span></div>
                  <div className="flex justify-between border-t border-border pt-1 font-bold">
                    <span>= Net Deposit</span><span>{fmt(net(viewRow.raw))}</span>
                  </div>
                </div>
              </section>

              {viewRow.reason && (
                <section>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Adjustment Reason</h3>
                  <p className="text-sm text-muted-foreground bg-muted/40 rounded-md p-3">{viewRow.reason}</p>
                </section>
              )}

              {viewRow.notes && (
                <section>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground bg-muted/40 rounded-md p-3">{viewRow.notes}</p>
                </section>
              )}

              <section>
                <h3 className="text-sm font-semibold text-foreground mb-2">Status</h3>
                <Badge className={`${statusColor[viewRow.status]} text-xs`}>{viewRow.status}</Badge>
                <div className="mt-3 flex gap-1">
                  {(["Open", "Fee Updated", "Settled", "Reconciled"] as BatchFeeStatus[]).map((s, i) => (
                    <div key={s} className="flex items-center gap-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${(["Open", "Fee Updated", "Settled", "Reconciled"].indexOf(viewRow.status) >= i) ? "bg-primary" : "bg-muted"}`} />
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
