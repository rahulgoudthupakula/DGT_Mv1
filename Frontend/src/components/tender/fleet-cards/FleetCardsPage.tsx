import { useState } from "react";
import {useQuery} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import {useFleet,amount,expected,variance,fmt,type FleetBatch as SavedBatch,type FleetDetails} from './fleetData';
import {FleetCreate,FleetSettlement,FleetReconcile} from './FleetDialogs';
import {exportRows} from '../credit-card/creditCardData';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Download, FileText, Search, Fuel, DollarSign, TrendingUp, CreditCard, Receipt, X,
} from "lucide-react";

interface FleetBatch {
  id: string;
  date: string;
  provider: string;
  posBatchId: string;
  fleetSales: number;
  gallonsSold: number | null;
  discount: number | null;
  processorFee: number | null;
  netDeposit: number | null;
  status: "Open" | "Settled" | "Reconciled";
  transactions: number;
  avgPrice: number | null;
  settlementDate?: string;
  referenceNo?: string;
  variance: number | null;
  actualDeposit: number | null;
  raw: SavedBatch;
}

const statusColor = (s: string) => {
  switch (s) {
    case "Open": return "outline";
    case "Settled": return "secondary";
    case "Reconciled": return "default";
    default: return "outline";
  }
};

const gallons=(n:number|null)=>n==null?'—':n.toLocaleString('en-US',{maximumFractionDigits:3});
const price=(n:number|null)=>n==null?'—':`$${n.toFixed(3)}`;
export const FleetCardsPage = ({storeId}:{storeId:string}) => {
  const c=useFleet(storeId);
  const [create,setCreate]=useState(false),[settle,setSettle]=useState<SavedBatch|null>(null),[review,setReview]=useState<SavedBatch|null>(null),[summary,setSummary]=useState(false);
  const [provider, setProvider] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [viewId,setViewId]=useState<number|null>(null);
  const rows:FleetBatch[]=(c.q.data?.batches??[]).map(b=>({id:String(b.batch_id),date:b.business_date,provider:b.provider_name,posBatchId:b.batch_reference,fleetSales:amount(b.fleet_sales),gallonsSold:b.gallons_sold==null?null:amount(b.gallons_sold),discount:b.statement_discount==null?null:amount(b.statement_discount),processorFee:b.processor_fee==null?null:amount(b.processor_fee),netDeposit:expected(b),status:({OPEN:'Open',SETTLED:'Settled',RECONCILED:'Reconciled'} as const)[b.status],transactions:b.transaction_count,avgPrice:b.gallons_sold==null||amount(b.gallons_sold)<=0||b.fuel_sales==null?null:amount(b.fuel_sales)/amount(b.gallons_sold),settlementDate:b.settlement_date??undefined,referenceNo:b.settlement_reference??undefined,variance:variance(b),actualDeposit:b.actual_deposit==null?null:amount(b.actual_deposit),raw:b}));
  const selectedBatch=rows.find(b=>Number(b.id)===viewId)??null;
  const detail=useQuery({queryKey:['fleet-details',storeId,viewId,selectedBatch?.raw.version],queryFn:()=>request<FleetDetails>(c.base+'/batches/'+viewId),enabled:viewId!=null});

  const hasActiveFilters = provider !== "all" || status !== "all" || search !== "" || !!c.range.start || !!c.range.end;
  const clearFilters = () => { setProvider("all"); setStatus("all"); setSearch(""); c.setRange({start:'',end:''}); };

  const filtered = rows.filter((b) => {
    if (provider !== "all" && b.provider !== provider) return false;
    if (status !== "all" && b.status !== status) return false;
    if (search && !b.posBatchId.toLowerCase().includes(search.toLowerCase()) && !b.provider.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalSales = filtered.reduce((s, b) => s + b.fleetSales, 0);
  const totalGallons = filtered.some(b=>b.gallonsSold==null)?null:filtered.reduce((s,b)=>s+amount(b.gallonsSold),0);
  const avgPrice = totalGallons!=null&&totalGallons>0?filtered.reduce((s,b)=>s+amount(b.raw.fuel_sales),0)/totalGallons:null;
  const totalFees = filtered.reduce((s, b) => s + (b.processorFee??0), 0);
  const netSettlement = filtered.reduce((s, b) => s + (b.netDeposit??0), 0);

  const exported=filtered.map(b=>({'Date':b.date,'Provider':b.provider,'Batch Reference':b.posBatchId,'Source':b.raw.source_kind,'Fleet Sales':b.fleetSales,'Gallons':b.gallonsSold,'Fuel Sales':b.raw.fuel_sales,'Volume Note':b.raw.volume_note,'Additional Statement Discount':b.discount,'Processor Fee':b.processorFee,'Expected Deposit':b.netDeposit,'Amount Received':b.actualDeposit,'Variance':b.variance,'Status':b.status,'Transactions':b.transactions,'Settlement Date':b.settlementDate,'Settlement Reference':b.referenceNo,'Review Note':b.raw.variance_review_note,'Notes':b.raw.notes}));
  if(!c.q.data)return <div className="p-6">{c.q.isPending?'Loading Fleet batches…':<><p role="alert">{c.q.error?.message}</p><Button onClick={()=>void c.q.refetch()}>Retry</Button></>}</div>;
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Fleet Card Transactions</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={!filtered.length||c.busy||!!c.q.error} onClick={()=>exportRows("fleet-batches",exported)}><Download className="h-4 w-4 mr-1" />Export</Button>
          <Button variant="outline" size="sm" disabled={c.busy} onClick={()=>setSummary(true)}><FileText className="h-4 w-4 mr-1" />Settlement Summary</Button>
          <Button size="sm" disabled={c.busy||!!c.q.error} onClick={()=>{c.setError('');setCreate(true);}}>+ Create Batch</Button>
        </div>
      </div>

      {(c.error||c.q.error)&&<p role="alert" className="text-destructive">{c.error||c.q.error?.message}</p>}
      {c.q.isFetching&&<p className="text-sm text-muted-foreground">Refreshing batches…</p>}
      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Date Range</label>
              <div className="flex gap-2"><Input aria-label="Fleet From" type="date" max={c.q.data.today} value={c.range.start||c.q.data.start} onChange={e=>c.setRange(r=>({start:e.target.value,end:r.end||c.q.data!.end}))} className="w-40" /><Input aria-label="Fleet To" type="date" max={c.q.data.today} value={c.range.end||c.q.data.end} onChange={e=>c.setRange(r=>({start:r.start||c.q.data!.start,end:e.target.value}))} className="w-40" /></div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Fleet Provider</label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {Array.from(new Set(rows.map(b=>b.provider))).sort().map(p=><SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Settled">Settled</SelectItem>
                  <SelectItem value="Reconciled">Reconciled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Batch / Provider</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 w-44" />
              </div>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-9 text-xs gap-1 text-muted-foreground self-end" onClick={clearFilters}>
                <X className="w-3.5 h-3.5" />Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">Totals cover the selected batches. Unknown fees and deposits remain blank. Fuel totals show — when a receipt needs fuel identification or payment allocation. Statement discounts are additional deductions only.</p>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Fleet Sales", value: `$${totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "text-primary" },
          { label: "Total Gallons Sold", value: gallons(totalGallons), icon: Fuel, color: "text-blue-600" },
          { label: "Avg Price / Gallon", value: price(avgPrice), icon: TrendingUp, color: "text-amber-600" },
          { label: "Total Fees", value: fmt(filtered.some(b=>b.processorFee!=null)?totalFees:null), icon: CreditCard, color: "text-destructive" },
          { label: "Net Settlement Expected", value: fmt(filtered.some(b=>b.netDeposit!=null)?netSettlement:null), icon: Receipt, color: "text-green-600" },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <c.icon className={`h-4 w-4 ${c.color}`} />
                <span className="text-xs text-muted-foreground">{c.label}</span>
              </div>
              <p className="text-lg font-bold text-foreground">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Fleet Provider</TableHead>
                <TableHead>Batch Reference</TableHead>
                <TableHead className="text-right">Fleet Sales $</TableHead>
                <TableHead className="text-right">Gallons</TableHead>
                <TableHead className="text-right">Discount $</TableHead>
                <TableHead className="text-right">Fee $</TableHead>
                <TableHead className="text-right">Net Deposit $</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="text-sm">{b.date}</TableCell>
                  <TableCell className="font-medium text-sm">{b.provider}</TableCell>
                  <TableCell className="text-sm">{b.posBatchId}<span className="block text-xs text-muted-foreground">{b.raw.source_kind==='MANUAL_GROUP'?'Manual group':'POS batch'}</span></TableCell>
                  <TableCell className="text-right text-sm">${b.fleetSales.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-sm">{gallons(b.gallonsSold)}</TableCell>
                  <TableCell className="text-right text-sm text-amber-600">{fmt(b.discount)}</TableCell>
                  <TableCell className="text-right text-sm text-destructive">{fmt(b.processorFee)}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{fmt(b.netDeposit)}</TableCell>
                  <TableCell><Badge variant={statusColor(b.status)}>{b.status}</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setViewId(Number(b.id))}>View</Button>
                    {b.status!=='Reconciled'&&<Button variant="ghost" size="sm" disabled={c.busy||!!c.q.error} onClick={()=>{c.setError('');setSettle(b.raw);}}>{b.status==='Open'?'Settle':'Edit Settlement'}</Button>}
                    {b.status==='Settled'&&<Button variant="ghost" size="sm" disabled={c.busy||!!c.q.error} onClick={()=>{c.setError('');setReview(b.raw);}}>Reconcile</Button>}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No Fleet batches found. Use Create Batch to select recorded payments.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Drawer */}
      <Sheet open={!!selectedBatch} onOpenChange={() => setViewId(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Fleet Batch Details</SheetTitle>
            <SheetDescription>{selectedBatch?.posBatchId} — {selectedBatch?.provider}</SheetDescription>
          </SheetHeader>
          {selectedBatch && (
            <div className="mt-6 space-y-6">
              {/* Sales Breakdown */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Sales Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Transactions</span><span className="font-medium">{selectedBatch.transactions}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Gallons Sold</span><span className="font-medium">{gallons(selectedBatch.gallonsSold)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Avg Price / Gallon</span><span className="font-medium">{price(selectedBatch.avgPrice)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Additional Statement Discount</span><span className="font-medium text-amber-600">{fmt(selectedBatch.discount)}</span></div>
                </div>
              </div>
              <Separator />
              {/* Settlement Breakdown */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Settlement Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Fleet Sales</span><span className="font-medium">${selectedBatch.fleetSales.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">− Additional Statement Discount</span><span className="text-amber-600">{fmt(selectedBatch.discount)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">− Processor Fee</span><span className="text-destructive">{fmt(selectedBatch.processorFee)}</span></div>
                  <Separator />
                  <div className="flex justify-between font-semibold"><span>Expected Deposit</span><span>{fmt(selectedBatch.netDeposit)}</span></div>
                </div>
              </div>
              <Separator />
              {selectedBatch.raw.volume_note&&<p className="text-sm text-amber-700">{selectedBatch.raw.volume_note}</p>}
              {/* Deposit Info */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Deposit Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Amount received</span><span>{fmt(selectedBatch.actualDeposit)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Settlement Date</span><span className="font-medium">{selectedBatch.settlementDate || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Reference #</span><span className="font-medium">{selectedBatch.referenceNo || "—"}</span></div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Variance</span>
                    <span className={`font-medium ${selectedBatch.variance === 0 ? "text-green-600" : selectedBatch.variance !== null ? "text-destructive" : ""}`}>
                      {selectedBatch.variance !== null ? `$${selectedBatch.variance.toFixed(2)}` : "—"}
                    </span>
                  </div>
                </div>
              </div>
              <section className="space-y-2 text-sm">
                {selectedBatch.raw.notes&&<p>Notes: {selectedBatch.raw.notes}</p>}
                {selectedBatch.raw.variance_review_note&&<p>Variance review: {selectedBatch.raw.variance_review_note}</p>}
                <h3 className="font-semibold">Included Payments</h3>
                {detail.isPending&&<p>Loading payments…</p>}{detail.error&&<p role="alert">{detail.error.message}</p>}
                {detail.data?.payments.map(p=><div key={p.sale_payment_id} className="flex justify-between gap-3"><span>{p.receipt_no}</span><span>{fmt(amount(p.payment_amount_snapshot))}</span></div>)}
                <h3 className="font-semibold pt-2">History</h3>
                {detail.data?.audit.map(e=><p key={e.event_id} className="text-xs text-muted-foreground">{e.created_at} · {e.actor} · {e.event_type.split('_').join(' ')}</p>)}
              </section>
            </div>
          )}
        </SheetContent>
      </Sheet>
      {create&&<FleetCreate c={c} onClose={()=>setCreate(false)}/>}
      {settle&&<FleetSettlement c={c} batch={settle} onClose={()=>setSettle(null)}/>}
      {review&&<FleetReconcile c={c} batch={review} onClose={()=>setReview(null)}/>}
      <Dialog open={summary} onOpenChange={setSummary}><DialogContent><DialogHeader><DialogTitle>Fleet Settlement Summary</DialogTitle><DialogDescription>{c.q.data.start} through {c.q.data.end} · Current filters · {filtered.length} batches</DialogDescription></DialogHeader>
       <div className="space-y-2 text-sm"><p>Fleet sales: {fmt(totalSales)}</p><p>Gallons: {gallons(totalGallons)}</p><p>Average fuel price: {price(avgPrice)}</p><p>Transactions: {new Set(filtered.flatMap(b=>JSON.parse(b.raw.receipt_ids_json??'[]') as number[])).size}</p><p>Expected settlement (recorded fees): {fmt(filtered.some(b=>b.netDeposit!=null)?netSettlement:null)}</p><p>Received (settled batches): {fmt(filtered.some(b=>b.actualDeposit!=null)?filtered.reduce((s,b)=>s+(b.actualDeposit??0),0):null)}</p><p>Variance (settled batches): {fmt(filtered.some(b=>b.variance!=null)?filtered.reduce((s,b)=>s+(b.variance??0),0):null)}</p></div>
       <Button disabled={!filtered.length} onClick={()=>exportRows('fleet-settlement-summary',exported)}>Export Summary Details</Button>
      </DialogContent></Dialog>
    </div>
  );
};
