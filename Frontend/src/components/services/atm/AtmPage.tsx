import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Download, Plus, Search, Eye, AlertTriangle, DollarSign,
  Hash, Landmark, ArrowDownCircle, ArrowUpCircle, Minus, X,
} from "lucide-react";

const mockTransactions = [
  { id: 1, dateTime: "2025-02-10 09:12 AM", transRef: "ATM-90001", txType: "Withdrawal" as const, withdrawalAmt: 200, atmFee: 3.5, netDispensed: 196.5, status: "Completed", settlementStatus: "Settled" },
  { id: 2, dateTime: "2025-02-10 10:30 AM", transRef: "ATM-90002", txType: "Balance Inquiry" as const, withdrawalAmt: 0, atmFee: 1.5, netDispensed: 0, status: "Completed", settlementStatus: "Pending" },
  { id: 3, dateTime: "2025-02-10 11:45 AM", transRef: "ATM-90003", txType: "Withdrawal" as const, withdrawalAmt: 300, atmFee: 3.5, netDispensed: 296.5, status: "Failed", settlementStatus: "Pending" },
  { id: 4, dateTime: "2025-02-09 02:15 PM", transRef: "ATM-90004", txType: "Withdrawal" as const, withdrawalAmt: 500, atmFee: 3.5, netDispensed: 496.5, status: "Completed", settlementStatus: "Settled" },
  { id: 5, dateTime: "2025-02-09 04:00 PM", transRef: "ATM-90005", txType: "Declined" as const, withdrawalAmt: 60, atmFee: 0, netDispensed: 0, status: "Failed", settlementStatus: "Pending" },
  { id: 6, dateTime: "2025-02-08 08:20 AM", transRef: "ATM-90006", txType: "Withdrawal" as const, withdrawalAmt: 400, atmFee: 3.5, netDispensed: 396.5, status: "Completed", settlementStatus: "Settled" },
  { id: 7, dateTime: "2025-02-08 09:05 AM", transRef: "ATM-90007", txType: "Mini Statement" as const, withdrawalAmt: 0, atmFee: 1.0, netDispensed: 0, status: "Completed", settlementStatus: "Settled" },
  { id: 8, dateTime: "2025-02-08 11:30 AM", transRef: "ATM-90008", txType: "Balance Inquiry" as const, withdrawalAmt: 0, atmFee: 1.5, netDispensed: 0, status: "Completed", settlementStatus: "Pending" },
];

const mockCashLoads = [
  { id: 1, date: "2025-02-10", loadedAmt: 10000, loadedBy: "Manager A", machineId: "ATM-01", newBalance: 18500, notes: "Weekly refill" },
  { id: 2, date: "2025-02-07", loadedAmt: 8000, loadedBy: "Manager B", machineId: "ATM-01", newBalance: 12000, notes: "Mid-week top-up" },
  { id: 3, date: "2025-02-03", loadedAmt: 10000, loadedBy: "Manager A", machineId: "ATM-01", newBalance: 15000, notes: "Weekly refill" },
];

const statusColor = (s: string) => {
  switch (s) {
    case "Completed": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
    case "Failed": return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
    case "Reversed": return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
    default: return "bg-muted text-muted-foreground";
  }
};

const settlementColor = (s: string) => {
  switch (s) {
    case "Settled": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
    case "Pending": return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
    default: return "bg-muted text-muted-foreground";
  }
};

export function AtmPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [machineFilter, setMachineFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<typeof mockTransactions[0] | null>(null);
  const [cashLoadDrawerOpen, setCashLoadDrawerOpen] = useState(false);
  const [cashLoadType, setCashLoadType] = useState<"load" | "remove">("load");

  const hasActiveFilters = search !== "" || statusFilter !== "all" || machineFilter !== "all";
  const clearFilters = () => { setSearch(""); setStatusFilter("all"); setMachineFilter("all"); };

  const filtered = mockTransactions.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (search && !t.transRef.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalWithdrawals = mockTransactions.filter(t => t.status === "Completed" && t.txType === "Withdrawal").reduce((s, t) => s + t.withdrawalAmt, 0);
  const totalTx = mockTransactions.length;
  const totalFeeRevenue = mockTransactions.filter(t => t.status === "Completed").reduce((s, t) => s + t.atmFee, 0);
  const balanceInquiryCount = mockTransactions.filter(t => t.txType === "Balance Inquiry").length;
  const balanceInquiryRevenue = mockTransactions.filter(t => t.txType === "Balance Inquiry" && t.status === "Completed").reduce((s, t) => s + t.atmFee, 0);
  const currentBalance = 8500;
  const variance = 0;

  // Reconciliation
  const openingCash = 5000;
  const cashLoaded = 10000;
  const totalWithdrawn = totalWithdrawals;
  const cashRemoved = 0;
  const expectedBalance = openingCash + cashLoaded - totalWithdrawn - cashRemoved;
  const actualBalance = 8500;
  const reconVariance = actualBalance - expectedBalance;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">ATM Transactions</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCashLoadType("load"); setCashLoadDrawerOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Record Cash Load
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center sticky top-0 z-10 bg-background py-2">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search Transaction Ref #" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={machineFilter} onValueChange={setMachineFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="ATM Machine" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Machines</SelectItem>
            <SelectItem value="ATM-01">ATM-01</SelectItem>
            <SelectItem value="ATM-02">ATM-02</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
            <SelectItem value="Reversed">Reversed</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-9 text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={clearFilters}>
            <X className="h-3.5 w-3.5" />Clear filters
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
              <DollarSign className="h-3.5 w-3.5" /> Total Withdrawals
            </div>
            <div className="text-xl font-bold text-foreground">${totalWithdrawals.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
              <Hash className="h-3.5 w-3.5" /> # Transactions
            </div>
            <div className="text-xl font-bold text-foreground">{totalTx}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
              <Landmark className="h-3.5 w-3.5" /> ATM Fee Revenue
            </div>
            <div className="text-xl font-bold text-foreground">${totalFeeRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
              <DollarSign className="h-3.5 w-3.5" /> ATM Cash Balance
            </div>
            <div className="text-xl font-bold text-foreground">${currentBalance.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Variance
            </div>
            <div className={`text-xl font-bold ${variance !== 0 ? "text-destructive" : "text-emerald-600"}`}>
              ${variance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
              <Hash className="h-3.5 w-3.5" /> Balance Inquiries
            </div>
            <div className="text-xl font-bold text-foreground">{balanceInquiryCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
              <DollarSign className="h-3.5 w-3.5" /> Inquiry Revenue
            </div>
            <div className="text-xl font-bold text-foreground">${balanceInquiryRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Transaction Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Transaction Ref #</TableHead>
                <TableHead>Transaction Type</TableHead>
                <TableHead className="text-right">Withdrawal $</TableHead>
                <TableHead className="text-right">ATM Fee $</TableHead>
                <TableHead className="text-right">Net Dispensed $</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Settlement</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs">{t.dateTime}</TableCell>
                  <TableCell className="font-mono text-xs">{t.transRef}</TableCell>
                  <TableCell><Badge variant="outline">{t.txType}</Badge></TableCell>
                  <TableCell className="text-right font-medium">{t.withdrawalAmt > 0 ? `$${t.withdrawalAmt.toFixed(2)}` : "—"}</TableCell>
                  <TableCell className="text-right">${t.atmFee.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{t.netDispensed > 0 ? `$${t.netDispensed.toFixed(2)}` : "—"}</TableCell>
                  <TableCell><Badge variant="outline" className={statusColor(t.status)}>{t.status}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={settlementColor(t.settlementStatus)}>{t.settlementStatus}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedTx(t); setDrawerOpen(true); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No transactions found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cash Load Log */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Cash Load Log</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setCashLoadType("load"); setCashLoadDrawerOpen(true); }}>
                <ArrowDownCircle className="h-4 w-4 mr-1" /> Add Cash Load
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setCashLoadType("remove"); setCashLoadDrawerOpen(true); }}>
                <ArrowUpCircle className="h-4 w-4 mr-1" /> Record Removal
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Loaded Amount $</TableHead>
                <TableHead>Loaded By</TableHead>
                <TableHead>ATM Machine ID</TableHead>
                <TableHead className="text-right">New Balance $</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCashLoads.map((cl) => (
                <TableRow key={cl.id}>
                  <TableCell className="text-xs">{cl.date}</TableCell>
                  <TableCell className="text-right font-medium">${cl.loadedAmt.toLocaleString()}</TableCell>
                  <TableCell>{cl.loadedBy}</TableCell>
                  <TableCell className="font-mono text-xs">{cl.machineId}</TableCell>
                  <TableCell className="text-right">${cl.newBalance.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{cl.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ATM Balance Reconciliation */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">ATM Balance Reconciliation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Opening ATM Cash</span><span className="font-medium">${openingCash.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">+ Cash Loaded</span><span className="font-medium text-emerald-600">+${cashLoaded.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">− Withdrawals</span><span className="font-medium text-red-600">−${totalWithdrawn.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">− Cash Removed</span><span className="font-medium text-red-600">−${cashRemoved.toLocaleString()}</span></div>
              <Separator />
              <div className="flex justify-between font-semibold"><span>Expected ATM Balance</span><span>${expectedBalance.toLocaleString()}</span></div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Actual ATM Balance (counted)</span><span className="font-medium">${actualBalance.toLocaleString()}</span></div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Variance</span>
                <span className={reconVariance !== 0 ? "text-destructive" : "text-emerald-600"}>
                  ${reconVariance >= 0 ? "+" : ""}${reconVariance.toLocaleString()}
                </span>
              </div>
              {reconVariance !== 0 && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5" /> Variance exceeds tolerance — review required
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Transaction Details</SheetTitle>
            <SheetDescription>Read-only ATM transaction detail</SheetDescription>
          </SheetHeader>
          {selectedTx && (
            <div className="mt-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground block text-xs">POS Transaction ID</span><span className="font-medium">POS-{selectedTx.id.toString().padStart(6, "0")}</span></div>
                <div><span className="text-muted-foreground block text-xs">Transaction Ref #</span><span className="font-mono font-medium">{selectedTx.transRef}</span></div>
                <div><span className="text-muted-foreground block text-xs">Processor Reference</span><span className="font-medium">PROC-{(selectedTx.id * 1111).toString()}</span></div>
                <div><span className="text-muted-foreground block text-xs">Date & Time</span><span className="font-medium">{selectedTx.dateTime}</span></div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground block text-xs">Withdrawal Amount</span><span className="font-medium">${selectedTx.withdrawalAmt.toFixed(2)}</span></div>
                <div><span className="text-muted-foreground block text-xs">ATM Fee</span><span className="font-medium">${selectedTx.atmFee.toFixed(2)}</span></div>
                <div><span className="text-muted-foreground block text-xs">Net Dispensed</span><span className="font-medium">${selectedTx.netDispensed.toFixed(2)}</span></div>
                <div><span className="text-muted-foreground block text-xs">Surcharge (if any)</span><span className="font-medium">$0.00</span></div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground block text-xs">Status</span><Badge variant="outline" className={statusColor(selectedTx.status)}>{selectedTx.status}</Badge></div>
                <div><span className="text-muted-foreground block text-xs">Settlement</span><Badge variant="outline" className={settlementColor(selectedTx.settlementStatus)}>{selectedTx.settlementStatus}</Badge></div>
                <div><span className="text-muted-foreground block text-xs">Clerk ID</span><span className="font-medium">—</span></div>
                <div><span className="text-muted-foreground block text-xs">Settlement Ref</span><span className="font-medium">{selectedTx.settlementStatus === "Settled" ? `SET-${selectedTx.id * 222}` : "—"}</span></div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Cash Load / Removal Drawer */}
      <Sheet open={cashLoadDrawerOpen} onOpenChange={setCashLoadDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{cashLoadType === "load" ? "Record Cash Load" : "Record Cash Removal"}</SheetTitle>
            <SheetDescription>Enter {cashLoadType === "load" ? "cash load" : "cash removal"} details</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Amount $</label>
              <Input type="number" placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{cashLoadType === "load" ? "Loaded" : "Removed"} By</label>
              <Input placeholder="Name" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">ATM Machine ID</label>
              <Select defaultValue="ATM-01">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATM-01">ATM-01</SelectItem>
                  <SelectItem value="ATM-02">ATM-02</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <Input placeholder="Optional notes" />
            </div>
            <Button className="w-full">{cashLoadType === "load" ? "Record Cash Load" : "Record Cash Removal"}</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
