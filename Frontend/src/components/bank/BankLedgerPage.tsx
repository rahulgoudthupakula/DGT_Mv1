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
import { Download, Plus, RefreshCw, Eye, DollarSign, TrendingUp, TrendingDown, ArrowRightLeft, Landmark, Pencil, Trash2, CheckCircle2, XCircle, X } from "lucide-react";

// ── Mock Data ──────────────────────────────────────────────
const summaryData = {
  openingBalance: 124500.00,
  totalDeposits: 38750.00,
  totalWithdrawals: 21340.00,
  netChange: 17410.00,
  closingBalance: 141910.00,
};

const ledgerEntries = [
  { id: 1, date: "2026-02-11", accountName: "Business Checking", sourceModule: "Credit Card Settlement", vendorName: "Visa/MC", invoiceReference: "CC-20260211-001", description: "Visa/MC daily settlement", modeOfTransfer: "ACH", isReconciled: true, creditDebit: "Credit" as const, amount: 8450.00, status: "Cleared" },
  { id: 2, date: "2026-02-11", accountName: "Business Checking", sourceModule: "EBT Settlement", vendorName: "EBT/SNAP", invoiceReference: "EBT-20260211-001", description: "EBT/SNAP weekly settlement", modeOfTransfer: "ACH", isReconciled: true, creditDebit: "Credit" as const, amount: 3200.00, status: "Cleared" },
  { id: 3, date: "2026-02-11", accountName: "Business Checking", sourceModule: "Vendor Payment", vendorName: "McLane Co.", invoiceReference: "VP-20260211-001", description: "McLane Co. invoice payment", modeOfTransfer: "Check", isReconciled: true, creditDebit: "Debit" as const, amount: 5640.00, status: "Cleared" },
  { id: 4, date: "2026-02-10", accountName: "Business Checking", sourceModule: "Fleet Settlement", vendorName: "Fleet Card", invoiceReference: "FL-20260210-001", description: "Fleet card batch settlement", modeOfTransfer: "ACH", isReconciled: true, creditDebit: "Credit" as const, amount: 4120.00, status: "Cleared" },
  { id: 5, date: "2026-02-10", accountName: "Business Checking", sourceModule: "Services Settlement", vendorName: "Services", invoiceReference: "SV-20260210-001", description: "Money order & bill pay commissions", modeOfTransfer: "Wire", isReconciled: false, creditDebit: "Credit" as const, amount: 890.00, status: "Pending" },
  { id: 6, date: "2026-02-10", accountName: "Business Checking", sourceModule: "Vendor Payment", vendorName: "Core-Mark", invoiceReference: "VP-20260210-002", description: "Core-Mark distribution", modeOfTransfer: "Check", isReconciled: true, creditDebit: "Debit" as const, amount: 8200.00, status: "Cleared" },
  { id: 7, date: "2026-02-09", accountName: "Business Savings", sourceModule: "Manual", vendorName: "—", invoiceReference: "TRF-20260209-001", description: "Transfer to savings account", modeOfTransfer: "Internal", isReconciled: true, creditDebit: "Debit" as const, amount: 5000.00, status: "Cleared" },
  { id: 8, date: "2026-02-09", accountName: "Business Checking", sourceModule: "Credit Card Settlement", vendorName: "Amex", invoiceReference: "CC-20260209-001", description: "Amex daily settlement", modeOfTransfer: "ACH", isReconciled: false, creditDebit: "Credit" as const, amount: 2850.00, status: "Pending" },
  { id: 9, date: "2026-02-09", accountName: "Business Checking", sourceModule: "Manual", vendorName: "Bank", invoiceReference: "ADJ-20260209-001", description: "Bank fee reversal", modeOfTransfer: "Adjustment", isReconciled: true, creditDebit: "Credit" as const, amount: 45.00, status: "Reconciled" },
  { id: 10, date: "2026-02-08", accountName: "Business Checking", sourceModule: "Vendor Payment", vendorName: "Lottery", invoiceReference: "VP-20260208-001", description: "Lottery commission offset", modeOfTransfer: "Check", isReconciled: true, creditDebit: "Debit" as const, amount: 2500.00, status: "Reconciled" },
  { id: 11, date: "2026-02-08", accountName: "Business Checking", sourceModule: "Credit Card Settlement", vendorName: "Discover", invoiceReference: "CC-20260208-001", description: "Discover batch settlement", modeOfTransfer: "ACH", isReconciled: true, creditDebit: "Credit" as const, amount: 1950.00, status: "Reconciled" },
  { id: 12, date: "2026-02-07", accountName: "Business Checking", sourceModule: "Services Settlement", vendorName: "ATM", invoiceReference: "SV-20260207-001", description: "ATM surcharge revenue", modeOfTransfer: "ACH", isReconciled: true, creditDebit: "Credit" as const, amount: 340.00, status: "Reconciled" },
];

const reconciliationData = {
  systemLedgerBalance: 141910.00,
  bankStatementBalance: 141420.00,
  variance: 490.00,
  clearedCount: 8,
  unclearedCount: 2,
  reconciledCount: 4,
};

// ── Component ──────────────────────────────────────────────
export const BankLedgerPage = () => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [bankAccount, setBankAccount] = useState("all");
  const [entryType, setEntryType] = useState("all");
  const [referenceSearch, setReferenceSearch] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<typeof ledgerEntries[0] | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReconcile, setShowReconcile] = useState(false);

  const hasActiveFilters = bankAccount !== "all" || entryType !== "all" || referenceSearch !== "";
  const clearFilters = () => { setBankAccount("all"); setEntryType("all"); setReferenceSearch(""); setDateFrom(""); setDateTo(""); };

  const filtered = ledgerEntries.filter((e) => {
    if (bankAccount !== "all") {
      if (bankAccount === "checking" && e.accountName !== "Business Checking") return false;
      if (bankAccount === "savings" && e.accountName !== "Business Savings") return false;
    }
    if (entryType !== "all" && e.creditDebit !== entryType) return false;
    if (referenceSearch && !e.invoiceReference.toLowerCase().includes(referenceSearch.toLowerCase()) && !e.description.toLowerCase().includes(referenceSearch.toLowerCase())) return false;
    return true;
  });

  const statusColor = (s: string) => {
    if (s === "Cleared") return "default";
    if (s === "Pending") return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Bank Ledger</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Manual Entry
          </Button>
          <Button size="sm" variant="outline">
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowReconcile(true)}>
            <RefreshCw className="w-4 h-4 mr-1" /> Reconcile
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
              <Label className="text-xs">Bank Account</Label>
              <Select value={bankAccount} onValueChange={setBankAccount}>
                <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  <SelectItem value="checking">Business Checking</SelectItem>
                  <SelectItem value="savings">Business Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Entry Type</Label>
              <Select value={entryType} onValueChange={setEntryType}>
                <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Credit">Credit</SelectItem>
                  <SelectItem value="Debit">Debit</SelectItem>
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Landmark className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Opening Balance</span>
            </div>
            <p className="text-lg font-bold text-foreground">${summaryData.openingBalance.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Total Deposits</span>
            </div>
            <p className="text-lg font-bold text-green-600">${summaryData.totalDeposits.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-xs text-muted-foreground">Total Withdrawals</span>
            </div>
            <p className="text-lg font-bold text-red-600">${summaryData.totalWithdrawals.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowRightLeft className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">Net Change</span>
            </div>
            <p className="text-lg font-bold text-blue-600">+${summaryData.netChange.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-foreground" />
              <span className="text-xs text-muted-foreground">Closing Balance</span>
            </div>
            <p className="text-lg font-bold text-foreground">${summaryData.closingBalance.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Ledger Table ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ledger Entries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Account Name</TableHead>
                  <TableHead className="text-xs">Source Module</TableHead>
                  <TableHead className="text-xs">Vendor Name</TableHead>
                  <TableHead className="text-xs">Invoice Reference</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs">Mode of Transfer</TableHead>
                  <TableHead className="text-xs text-center">Reconciled</TableHead>
                  <TableHead className="text-xs">Credit/Debit</TableHead>
                  <TableHead className="text-xs text-right">Amount $</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id} className="text-xs">
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>{entry.accountName}</TableCell>
                    <TableCell>{entry.sourceModule}</TableCell>
                    <TableCell>{entry.vendorName}</TableCell>
                    <TableCell className="font-mono text-[10px]">{entry.invoiceReference}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{entry.description}</TableCell>
                    <TableCell>{entry.modeOfTransfer}</TableCell>
                    <TableCell className="text-center">
                      {entry.isReconciled
                        ? <CheckCircle2 className="w-4 h-4 text-green-600 inline" />
                        : <XCircle className="w-4 h-4 text-muted-foreground inline" />}
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.creditDebit === "Credit" ? "default" : "secondary"} className="text-[10px]">
                        {entry.creditDebit}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${entry.creditDebit === "Credit" ? "text-green-600" : "text-red-600"}`}>
                      ${entry.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColor(entry.status)} className="text-[10px]">{entry.status}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSelectedEntry(entry)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Entry Detail Drawer ── */}
      <Sheet open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Ledger Entry Detail</SheetTitle>
          </SheetHeader>
          {selectedEntry && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Date</span><p className="font-medium">{selectedEntry.date}</p></div>
                <div><span className="text-muted-foreground">Account Name</span><p className="font-medium">{selectedEntry.accountName}</p></div>
                <div><span className="text-muted-foreground">Source Module</span><p className="font-medium">{selectedEntry.sourceModule}</p></div>
                <div><span className="text-muted-foreground">Vendor Name</span><p className="font-medium">{selectedEntry.vendorName}</p></div>
                <div><span className="text-muted-foreground">Invoice Reference</span><p className="font-mono text-xs">{selectedEntry.invoiceReference}</p></div>
                <div><span className="text-muted-foreground">Mode of Transfer</span><p className="font-medium">{selectedEntry.modeOfTransfer}</p></div>
                <div className="col-span-2"><span className="text-muted-foreground">Description</span><p className="font-medium">{selectedEntry.description}</p></div>
                <div><span className="text-muted-foreground">Credit/Debit</span><p><Badge variant={selectedEntry.creditDebit === "Credit" ? "default" : "secondary"}>{selectedEntry.creditDebit}</Badge></p></div>
                <div><span className="text-muted-foreground">Amount</span><p className={`font-bold ${selectedEntry.creditDebit === "Credit" ? "text-green-600" : "text-red-600"}`}>${selectedEntry.amount.toLocaleString()}</p></div>
                <div><span className="text-muted-foreground">Reconciled</span><p className="font-medium">{selectedEntry.isReconciled ? "Yes" : "No"}</p></div>
                <div><span className="text-muted-foreground">Status</span><p><Badge variant={statusColor(selectedEntry.status)}>{selectedEntry.status}</Badge></p></div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Add Manual Entry Modal ── */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Manual Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input type="date" className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Entry Type</Label>
                <Select>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Deposit">Deposit</SelectItem>
                    <SelectItem value="Withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="Transfer">Transfer</SelectItem>
                    <SelectItem value="Adjustment">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Amount</Label>
              <Input type="number" placeholder="0.00" className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Textarea placeholder="Enter description…" className="text-xs" rows={2} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Reference</Label>
              <Input placeholder="Reference #" className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Attachment</Label>
              <Input type="file" className="h-8 text-xs" />
            </div>
            <p className="text-[10px] text-muted-foreground">⚠ Cannot backdate after reconciliation. Requires permission.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button size="sm" onClick={() => setShowAddModal(false)}>Save Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reconciliation Drawer ── */}
      <Sheet open={showReconcile} onOpenChange={setShowReconcile}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Bank Reconciliation</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">System Ledger Balance</p>
                  <p className="text-xl font-bold">${reconciliationData.systemLedgerBalance.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Bank Statement Balance</p>
                  <p className="text-xl font-bold">${reconciliationData.bankStatementBalance.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Variance</p>
                <p className="text-2xl font-bold text-amber-600">${reconciliationData.variance.toLocaleString()}</p>
              </CardContent>
            </Card>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Status Breakdown</h4>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cleared</span>
                <Badge variant="default">{reconciliationData.clearedCount}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uncleared</span>
                <Badge variant="secondary">{reconciliationData.unclearedCount}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Reconciled</span>
                <Badge variant="outline">{reconciliationData.reconciledCount}</Badge>
              </div>
            </div>
            <Button className="w-full" size="sm">Mark Selected as Reconciled</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
