import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Download, Plus, Eye, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Clock, X } from "lucide-react";

// ── Mock Data ──────────────────────────────────────────────
const summaryData = {
  totalTransfersOut: 18500.00,
  totalTransfersIn: 18500.00,
  netMovement: 0.00,
  pendingTransfers: 3200.00,
};

const transfers = [
  { id: 1, date: "2026-02-11", fromAccount: "Business Checking", toAccount: "Business Savings", amount: 5000.00, reference: "TRF-20260211-001", description: "Weekly savings allocation", status: "Completed", createdBy: "John M." },
  { id: 2, date: "2026-02-11", fromAccount: "Business Checking", toAccount: "Payroll Account", amount: 3200.00, reference: "TRF-20260211-002", description: "Payroll funding", status: "Pending", createdBy: "Sarah K." },
  { id: 3, date: "2026-02-10", fromAccount: "Business Savings", toAccount: "Business Checking", amount: 8000.00, reference: "TRF-20260210-001", description: "Operating cash replenishment", status: "Completed", createdBy: "John M." },
  { id: 4, date: "2026-02-09", fromAccount: "Business Checking", toAccount: "Tax Reserve", amount: 2500.00, reference: "TRF-20260209-001", description: "Monthly tax reserve", status: "Completed", createdBy: "Admin" },
  { id: 5, date: "2026-02-09", fromAccount: "Payroll Account", toAccount: "Business Checking", amount: 1200.00, reference: "TRF-20260209-002", description: "Excess payroll return", status: "Reversed", createdBy: "Sarah K." },
  { id: 6, date: "2026-02-08", fromAccount: "Business Checking", toAccount: "Business Savings", amount: 5000.00, reference: "TRF-20260208-001", description: "Weekly savings allocation", status: "Completed", createdBy: "John M." },
  { id: 7, date: "2026-02-07", fromAccount: "Business Checking", toAccount: "Vendor Escrow", amount: 4500.00, reference: "TRF-20260207-001", description: "Vendor pre-payment escrow", status: "Completed", createdBy: "Admin" },
  { id: 8, date: "2026-02-07", fromAccount: "Tax Reserve", toAccount: "Business Checking", amount: 800.00, reference: "TRF-20260207-002", description: "Tax reserve adjustment", status: "Completed", createdBy: "John M." },
];

const accounts = ["Business Checking", "Business Savings", "Payroll Account", "Tax Reserve", "Vendor Escrow"];

// ── Component ──────────────────────────────────────────────
export const FundTransferPage = () => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [fromAccountFilter, setFromAccountFilter] = useState("all");
  const [toAccountFilter, setToAccountFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [referenceSearch, setReferenceSearch] = useState("");
  const [selectedTransfer, setSelectedTransfer] = useState<typeof transfers[0] | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const hasActiveFilters = fromAccountFilter !== "all" || toAccountFilter !== "all" || statusFilter !== "all" || referenceSearch !== "";
  const clearFilters = () => { setFromAccountFilter("all"); setToAccountFilter("all"); setStatusFilter("all"); setReferenceSearch(""); setDateFrom(""); setDateTo(""); };

  const filtered = transfers.filter((t) => {
    if (fromAccountFilter !== "all" && t.fromAccount !== fromAccountFilter) return false;
    if (toAccountFilter !== "all" && t.toAccount !== toAccountFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (referenceSearch && !t.reference.toLowerCase().includes(referenceSearch.toLowerCase()) && !t.description.toLowerCase().includes(referenceSearch.toLowerCase())) return false;
    return true;
  });

  const statusColor = (s: string) => {
    if (s === "Completed") return "default" as const;
    if (s === "Pending") return "secondary" as const;
    return "outline" as const;
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Fund Transfer</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setShowNewModal(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Transfer
          </Button>
          <Button size="sm" variant="outline">
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      {/* ── Filters ── */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input type="date" className="h-8 w-36 text-xs" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input type="date" className="h-8 w-36 text-xs" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">From Account</Label>
              <Select value={fromAccountFilter} onValueChange={setFromAccountFilter}>
                <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To Account</Label>
              <Select value={toAccountFilter} onValueChange={setToAccountFilter}>
                <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Reversed">Reversed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Reference</Label>
              <Input placeholder="Search ref / desc…" className="h-8 w-44 text-xs" value={referenceSearch} onChange={(e) => setReferenceSearch(e.target.value)} />
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-muted-foreground" onClick={clearFilters}>
                <X className="w-3.5 h-3.5" />Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight className="w-4 h-4 text-red-600" />
              <span className="text-xs text-muted-foreground">Total Transfers Out</span>
            </div>
            <p className="text-lg font-bold text-red-600">${summaryData.totalTransfersOut.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownLeft className="w-4 h-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Total Transfers In</span>
            </div>
            <p className="text-lg font-bold text-green-600">${summaryData.totalTransfersIn.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowRightLeft className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">Net Movement</span>
            </div>
            <p className="text-lg font-bold text-blue-600">${summaryData.netMovement.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">Pending Transfers</span>
            </div>
            <p className="text-lg font-bold text-amber-600">${summaryData.pendingTransfers.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Transfer Table ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Transfer History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">From Account</TableHead>
                  <TableHead className="text-xs">To Account</TableHead>
                  <TableHead className="text-xs text-right">Amount $</TableHead>
                  <TableHead className="text-xs">Reference</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Created By</TableHead>
                  <TableHead className="text-xs text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id} className="text-xs">
                    <TableCell>{t.date}</TableCell>
                    <TableCell>{t.fromAccount}</TableCell>
                    <TableCell>{t.toAccount}</TableCell>
                    <TableCell className="text-right font-medium">${t.amount.toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-[10px]">{t.reference}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{t.description}</TableCell>
                    <TableCell>
                      <Badge variant={statusColor(t.status)} className="text-[10px]">{t.status}</Badge>
                    </TableCell>
                    <TableCell>{t.createdBy}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSelectedTransfer(t)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── View Detail Drawer ── */}
      <Sheet open={!!selectedTransfer} onOpenChange={() => setSelectedTransfer(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Transfer Detail</SheetTitle>
          </SheetHeader>
          {selectedTransfer && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Date</span><p className="font-medium">{selectedTransfer.date}</p></div>
                <div><span className="text-muted-foreground">Status</span><p><Badge variant={statusColor(selectedTransfer.status)}>{selectedTransfer.status}</Badge></p></div>
                <div><span className="text-muted-foreground">From Account</span><p className="font-medium">{selectedTransfer.fromAccount}</p></div>
                <div><span className="text-muted-foreground">To Account</span><p className="font-medium">{selectedTransfer.toAccount}</p></div>
                <div><span className="text-muted-foreground">Amount</span><p className="font-bold">${selectedTransfer.amount.toLocaleString()}</p></div>
                <div><span className="text-muted-foreground">Reference</span><p className="font-mono text-xs">{selectedTransfer.reference}</p></div>
                <div className="col-span-2"><span className="text-muted-foreground">Description</span><p className="font-medium">{selectedTransfer.description}</p></div>
                <div><span className="text-muted-foreground">Created By</span><p className="font-medium">{selectedTransfer.createdBy}</p></div>
              </div>
              <div className="pt-4 border-t space-y-2">
                <h4 className="text-sm font-semibold">Ledger Impact</h4>
                <p className="text-xs text-muted-foreground">
                  {selectedTransfer.status === "Completed"
                    ? `Debit: ${selectedTransfer.fromAccount} → Credit: ${selectedTransfer.toAccount}. Both entries posted to Bank Ledger.`
                    : selectedTransfer.status === "Reversed"
                    ? "Transfer reversed. Original entries voided in Bank Ledger."
                    : "Transfer pending confirmation. No ledger entries posted yet."}
                </p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── New Transfer Modal ── */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Fund Transfer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Transfer Date</Label>
              <Input type="date" className="h-8 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">From Account</Label>
                <Select>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To Account</Label>
                <Select>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Amount</Label>
              <Input type="number" placeholder="0.00" className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Reference</Label>
              <Input placeholder="Reference #" className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Textarea placeholder="Enter description…" className="text-xs" rows={2} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Attachment (optional)</Label>
              <Input type="file" className="h-8 text-xs" />
            </div>
            <p className="text-[10px] text-muted-foreground">⚠ From and To accounts must be different. Amount must not exceed available balance. Requires permission.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowNewModal(false)}>Cancel</Button>
            <Button variant="secondary" size="sm" onClick={() => setShowNewModal(false)}>Save</Button>
            <Button size="sm" onClick={() => setShowNewModal(false)}>Save & Complete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
