import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Plus,
  Eye,
  X,
  DollarSign,
  FileText,
  TrendingUp,
  AlertTriangle,
  Landmark,
  ArrowRight,
} from "lucide-react";

// --- Mock Data ---
const mockSettlements = [
  {
    id: "STL-2024-001",
    provider: "Western Union",
    serviceType: "Money Transfer",
    periodFrom: "2024-01-01",
    periodTo: "2024-01-15",
    totalPrincipal: 45200,
    feesCollected: 1580,
    commission: 632,
    netPayable: 46148,
    status: "Paid",
    transactions: ["MT-1001", "MT-1002", "MT-1005", "MT-1008", "MT-1012"],
    paymentMethod: "ACH",
    paymentDate: "2024-01-18",
    paymentRef: "ACH-88291",
  },
  {
    id: "STL-2024-002",
    provider: "MoneyGram",
    serviceType: "Money Transfer",
    periodFrom: "2024-01-01",
    periodTo: "2024-01-15",
    totalPrincipal: 32100,
    feesCollected: 1120,
    commission: 448,
    netPayable: 32772,
    status: "Submitted",
    transactions: ["MT-1003", "MT-1007", "MT-1009"],
    paymentMethod: "",
    paymentDate: "",
    paymentRef: "",
  },
  {
    id: "STL-2024-003",
    provider: "US Postal",
    serviceType: "Money Order",
    periodFrom: "2024-01-01",
    periodTo: "2024-01-15",
    totalPrincipal: 18500,
    feesCollected: 740,
    commission: 296,
    netPayable: 18944,
    status: "Pending",
    transactions: ["MO-2001", "MO-2002", "MO-2003", "MO-2004"],
    paymentMethod: "",
    paymentDate: "",
    paymentRef: "",
  },
  {
    id: "STL-2024-004",
    provider: "Cardtronics",
    serviceType: "ATM",
    periodFrom: "2024-01-01",
    periodTo: "2024-01-15",
    totalPrincipal: 62000,
    feesCollected: 2480,
    commission: 992,
    netPayable: 63488,
    status: "Closed",
    transactions: ["ATM-3001", "ATM-3002", "ATM-3003", "ATM-3004", "ATM-3005", "ATM-3006"],
    paymentMethod: "Check",
    paymentDate: "2024-01-20",
    paymentRef: "CHK-44520",
  },
  {
    id: "STL-2024-005",
    provider: "PayNearMe",
    serviceType: "Bill Pay",
    periodFrom: "2024-01-16",
    periodTo: "2024-01-31",
    totalPrincipal: 27800,
    feesCollected: 834,
    commission: 334,
    netPayable: 28300,
    status: "Pending",
    transactions: ["BP-4001", "BP-4002", "BP-4003"],
    paymentMethod: "",
    paymentDate: "",
    paymentRef: "",
  },
];

const providers = ["Western Union", "MoneyGram", "US Postal", "Cardtronics", "PayNearMe"];
const serviceTypes = ["Money Order", "Bill Pay", "Money Transfer", "ATM"];
const statuses = ["Pending", "Submitted", "Paid", "Closed"];

const statusColor = (s: string) => {
  switch (s) {
    case "Pending": return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "Submitted": return "bg-blue-100 text-blue-800 border-blue-300";
    case "Paid": return "bg-green-100 text-green-800 border-green-300";
    case "Closed": return "bg-gray-100 text-gray-800 border-gray-300";
    default: return "";
  }
};

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export const ServiceSettlementsPage = () => {
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterService, setFilterService] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewItem, setViewItem] = useState<typeof mockSettlements[0] | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Create batch state
  const [batchStep, setBatchStep] = useState(1);
  const [batchProvider, setBatchProvider] = useState("");
  const [batchService, setBatchService] = useState("");
  const [batchFrom, setBatchFrom] = useState("");
  const [batchTo, setBatchTo] = useState("");

  const hasActiveFilters = filterProvider !== "all" || filterService !== "all" || filterStatus !== "all";
  const clearFilters = () => { setFilterProvider("all"); setFilterService("all"); setFilterStatus("all"); };

  const filtered = mockSettlements.filter((s) => {
    if (filterProvider !== "all" && s.provider !== filterProvider) return false;
    if (filterService !== "all" && s.serviceType !== filterService) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    return true;
  });

  const totalAmount = filtered.reduce((a, b) => a + b.totalPrincipal, 0);
  const totalFees = filtered.reduce((a, b) => a + b.feesCollected, 0);
  const totalCommission = filtered.reduce((a, b) => a + b.commission, 0);
  const totalNetPayable = filtered.reduce((a, b) => a + b.netPayable, 0);
  const unsettled = filtered.filter((s) => s.status === "Pending" || s.status === "Submitted").reduce((a, b) => a + b.netPayable, 0);

  // Mock auto-calc for create batch
  const batchPrincipal = 15200;
  const batchFees = 608;
  const batchComm = 243;
  const batchNet = batchPrincipal + batchFees - batchComm;

  const resetBatch = () => {
    setBatchStep(1);
    setBatchProvider("");
    setBatchService("");
    setBatchFrom("");
    setBatchTo("");
    setShowCreate(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Service Settlements</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" /> Create Settlement Batch
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 sticky top-0 z-10 bg-background py-2">
        <Input type="date" className="w-36 h-9 text-xs" />
        <span className="text-xs text-muted-foreground">to</span>
        <Input type="date" className="w-36 h-9 text-xs" />
        <Select value={filterProvider} onValueChange={setFilterProvider}>
          <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="Provider" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            {providers.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterService} onValueChange={setFilterService}>
          <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="Service Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {serviceTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-9 text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={clearFilters}>
            <X className="h-3.5 w-3.5" />Clear filters
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Amount Processed", value: fmt(totalAmount), icon: DollarSign, color: "text-blue-600" },
          { label: "Fees Collected", value: fmt(totalFees), icon: FileText, color: "text-emerald-600" },
          { label: "Commission Earned", value: fmt(totalCommission), icon: TrendingUp, color: "text-violet-600" },
          { label: "Net Payable to Provider", value: fmt(totalNetPayable), icon: Landmark, color: "text-orange-600" },
          { label: "Unsettled Amount", value: fmt(unsettled), icon: AlertTriangle, color: "text-red-600" },
        ].map((c) => (
          <Card key={c.label} className="shadow-sm">
            <CardContent className="p-4 flex items-start gap-3">
              <c.icon className={`w-5 h-5 mt-0.5 ${c.color}`} />
              <div>
                <p className="text-[11px] text-muted-foreground">{c.label}</p>
                <p className="text-lg font-bold">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Settlement Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Settlement Batches</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-[11px]">
                <TableHead>Settlement ID</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Total Principal</TableHead>
                <TableHead className="text-right">Fees</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">Net Payable</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id} className="text-xs">
                  <TableCell className="font-mono font-medium">{s.id}</TableCell>
                  <TableCell>{s.provider}</TableCell>
                  <TableCell>{s.serviceType}</TableCell>
                  <TableCell className="whitespace-nowrap">{s.periodFrom} – {s.periodTo}</TableCell>
                  <TableCell className="text-right">{fmt(s.totalPrincipal)}</TableCell>
                  <TableCell className="text-right">{fmt(s.feesCollected)}</TableCell>
                  <TableCell className="text-right">{fmt(s.commission)}</TableCell>
                  <TableCell className="text-right font-semibold">{fmt(s.netPayable)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${statusColor(s.status)}`}>{s.status}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewItem(s)}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No settlements found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Settlement Drawer */}
      <Sheet open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {viewItem && (
            <>
              <SheetHeader>
                <SheetTitle className="text-lg">Settlement {viewItem.id}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-5 text-sm">
                {/* Basic info */}
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground text-xs">Provider</span><p className="font-medium">{viewItem.provider}</p></div>
                  <div><span className="text-muted-foreground text-xs">Service Type</span><p className="font-medium">{viewItem.serviceType}</p></div>
                  <div><span className="text-muted-foreground text-xs">Period</span><p className="font-medium">{viewItem.periodFrom} – {viewItem.periodTo}</p></div>
                  <div><span className="text-muted-foreground text-xs">Status</span><Badge variant="outline" className={`text-[10px] ${statusColor(viewItem.status)}`}>{viewItem.status}</Badge></div>
                </div>

                <Separator />

                {/* Included Transactions */}
                <div>
                  <h3 className="font-semibold text-xs mb-2 text-muted-foreground uppercase tracking-wide">Included Transactions</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {viewItem.transactions.map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px] font-mono">{t}</Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Financial Breakdown */}
                <div>
                  <h3 className="font-semibold text-xs mb-2 text-muted-foreground uppercase tracking-wide">Financial Breakdown</h3>
                  <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs space-y-1">
                    <div className="flex justify-between"><span>Total Principal</span><span>{fmt(viewItem.totalPrincipal)}</span></div>
                    <div className="flex justify-between"><span>+ Total Fees</span><span>{fmt(viewItem.feesCollected)}</span></div>
                    <div className="flex justify-between"><span>− Commission Retained</span><span>({fmt(viewItem.commission)})</span></div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-sm"><span>Net Payable</span><span>{fmt(viewItem.netPayable)}</span></div>
                  </div>
                </div>

                <Separator />

                {/* Payment Info */}
                <div>
                  <h3 className="font-semibold text-xs mb-2 text-muted-foreground uppercase tracking-wide">Payment Info</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div><span className="text-muted-foreground text-xs">Payment Method</span><p className="font-medium">{viewItem.paymentMethod || "—"}</p></div>
                    <div><span className="text-muted-foreground text-xs">Payment Date</span><p className="font-medium">{viewItem.paymentDate || "—"}</p></div>
                    <div><span className="text-muted-foreground text-xs">Reference #</span><p className="font-medium font-mono">{viewItem.paymentRef || "—"}</p></div>
                    <div><span className="text-muted-foreground text-xs">Status</span><p className="font-medium">{viewItem.status}</p></div>
                  </div>
                </div>

                {/* Status Flow */}
                <Separator />
                <div>
                  <h3 className="font-semibold text-xs mb-2 text-muted-foreground uppercase tracking-wide">Status Flow</h3>
                  <div className="flex items-center gap-1 text-[10px]">
                    {statuses.map((st, i) => (
                      <span key={st} className="flex items-center gap-1">
                        <Badge variant="outline" className={`text-[10px] ${statusColor(st)} ${st === viewItem.status ? "ring-2 ring-offset-1 ring-primary" : "opacity-50"}`}>{st}</Badge>
                        {i < statuses.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create Settlement Batch Modal */}
      <Dialog open={showCreate} onOpenChange={(v) => { if (!v) resetBatch(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Settlement Batch</DialogTitle>
          </DialogHeader>

          {batchStep === 1 && (
            <div className="space-y-4 py-2">
              <p className="text-xs text-muted-foreground font-medium">Step 1 — Select Parameters</p>
              <Select value={batchProvider} onValueChange={setBatchProvider}>
                <SelectTrigger className="text-xs"><SelectValue placeholder="Select Provider" /></SelectTrigger>
                <SelectContent>
                  {providers.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={batchService} onValueChange={setBatchService}>
                <SelectTrigger className="text-xs"><SelectValue placeholder="Select Service Type" /></SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-2 items-center">
                <Input type="date" className="text-xs" value={batchFrom} onChange={(e) => setBatchFrom(e.target.value)} />
                <span className="text-xs text-muted-foreground">to</span>
                <Input type="date" className="text-xs" value={batchTo} onChange={(e) => setBatchTo(e.target.value)} />
              </div>
            </div>
          )}

          {batchStep === 2 && (
            <div className="space-y-4 py-2">
              <p className="text-xs text-muted-foreground font-medium">Step 2 — Auto-Calculated Totals</p>
              <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs space-y-1">
                <div className="flex justify-between"><span>Total Principal</span><span>{fmt(batchPrincipal)}</span></div>
                <div className="flex justify-between"><span>Total Fees</span><span>{fmt(batchFees)}</span></div>
                <div className="flex justify-between"><span>Commission</span><span>{fmt(batchComm)}</span></div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold"><span>Net Payable</span><span>{fmt(batchNet)}</span></div>
              </div>
              <p className="text-[10px] text-muted-foreground">Includes 12 unsettled transactions for the selected period.</p>
            </div>
          )}

          {batchStep === 3 && (
            <div className="space-y-4 py-2">
              <p className="text-xs text-muted-foreground font-medium">Step 3 — Confirm & Create</p>
              <div className="text-xs space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Settlement ID</span><span className="font-mono font-semibold">STL-2024-006</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Provider</span><span>{batchProvider}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Service Type</span><span>{batchService}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Period</span><span>{batchFrom} – {batchTo}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Net Payable</span><span className="font-bold">{fmt(batchNet)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="outline" className={`text-[10px] ${statusColor("Pending")}`}>Pending</Badge></div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {batchStep > 1 && (
              <Button variant="outline" size="sm" onClick={() => setBatchStep((s) => s - 1)}>Back</Button>
            )}
            {batchStep < 3 ? (
              <Button size="sm" disabled={batchStep === 1 && (!batchProvider || !batchService || !batchFrom || !batchTo)} onClick={() => setBatchStep((s) => s + 1)}>
                Next
              </Button>
            ) : (
              <Button size="sm" onClick={resetBatch}>Create Batch</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
