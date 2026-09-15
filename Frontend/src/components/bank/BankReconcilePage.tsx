import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Download, Upload, PlayCircle, CheckCircle2, XCircle,
  TrendingUp, TrendingDown, Landmark, ArrowRightLeft, AlertTriangle, X,
} from "lucide-react";

// ── Mock Data ──────────────────────────────────────────────
const reconciliationSummary = {
  statementOpeningBalance: 124500.00,
  statementClosingBalance: 141420.00,
  systemLedgerBalance: 141910.00,
  clearedDeposits: 21845.00,
  clearedWithdrawals: 16340.00,
  variance: 490.00,
  status: "Open" as "Open" | "Balanced" | "Closed",
};

const bankStatementEntries = [
  { id: "bs-1", date: "2026-02-11", sourceModule: "Credit Card", vendorOrPayee: "VISA/MC", invoiceId: "INV-4501", paymentMode: "ACH", deposit: 8450.00, withdrawal: null, matched: true },
  { id: "bs-2", date: "2026-02-11", sourceModule: "EBT", vendorOrPayee: "SNAP Program", invoiceId: "INV-4502", paymentMode: "ACH", deposit: 3200.00, withdrawal: null, matched: true },
  { id: "bs-3", date: "2026-02-11", sourceModule: "Vendor Payment", vendorOrPayee: "McLane Co", invoiceId: "CHK-1042", paymentMode: "Check", deposit: null, withdrawal: 5640.00, matched: true },
  { id: "bs-4", date: "2026-02-10", sourceModule: "Fleet Card", vendorOrPayee: "WEX Fleet", invoiceId: "INV-4490", paymentMode: "ACH", deposit: 4120.00, withdrawal: null, matched: true },
  { id: "bs-5", date: "2026-02-10", sourceModule: "Services", vendorOrPayee: "Money Order Comm", invoiceId: "SVC-2201", paymentMode: "Wire", deposit: 890.00, withdrawal: null, matched: false },
  { id: "bs-6", date: "2026-02-10", sourceModule: "Vendor Payment", vendorOrPayee: "Core-Mark", invoiceId: "CHK-1043", paymentMode: "Check", deposit: null, withdrawal: 8200.00, matched: true },
  { id: "bs-7", date: "2026-02-09", sourceModule: "Credit Card", vendorOrPayee: "AMEX", invoiceId: "INV-4478", paymentMode: "ACH", deposit: 2850.00, withdrawal: null, matched: false },
  { id: "bs-8", date: "2026-02-09", sourceModule: "Manual", vendorOrPayee: "Bank", invoiceId: "ADJ-001", paymentMode: "Internal", deposit: 45.00, withdrawal: null, matched: true },
  { id: "bs-9", date: "2026-02-09", sourceModule: "Fund Transfer", vendorOrPayee: "Internal", invoiceId: "TRF-001", paymentMode: "Internal", deposit: null, withdrawal: 5000.00, matched: true },
  { id: "bs-10", date: "2026-02-08", sourceModule: "Credit Card", vendorOrPayee: "Discover", invoiceId: "INV-4465", paymentMode: "ACH", deposit: 1950.00, withdrawal: null, matched: true },
  { id: "bs-11", date: "2026-02-08", sourceModule: "Vendor Payment", vendorOrPayee: "Pepsi Beverages", invoiceId: "CHK-1044", paymentMode: "Check", deposit: null, withdrawal: 3275.00, matched: true },
  { id: "bs-12", date: "2026-02-08", sourceModule: "EBT", vendorOrPayee: "WIC Program", invoiceId: "INV-4460", paymentMode: "ACH", deposit: 1680.00, withdrawal: null, matched: true },
  { id: "bs-13", date: "2026-02-07", sourceModule: "Credit Card", vendorOrPayee: "VISA/MC", invoiceId: "INV-4450", paymentMode: "ACH", deposit: 7320.00, withdrawal: null, matched: true },
  { id: "bs-14", date: "2026-02-07", sourceModule: "Vendor Payment", vendorOrPayee: "Coca-Cola Dist.", invoiceId: "CHK-1045", paymentMode: "Check", deposit: null, withdrawal: 4510.00, matched: true },
  { id: "bs-15", date: "2026-02-07", sourceModule: "Fleet Card", vendorOrPayee: "Voyager Fleet", invoiceId: "INV-4445", paymentMode: "ACH", deposit: 2980.00, withdrawal: null, matched: false },
  { id: "bs-16", date: "2026-02-07", sourceModule: "Services", vendorOrPayee: "ATM Commission", invoiceId: "SVC-2198", paymentMode: "Wire", deposit: 425.00, withdrawal: null, matched: true },
  { id: "bs-17", date: "2026-02-06", sourceModule: "Credit Card", vendorOrPayee: "AMEX", invoiceId: "INV-4438", paymentMode: "ACH", deposit: 3150.00, withdrawal: null, matched: true },
  { id: "bs-18", date: "2026-02-06", sourceModule: "Vendor Payment", vendorOrPayee: "S&P Wholesale", invoiceId: "CHK-1046", paymentMode: "ACH", deposit: null, withdrawal: 6890.00, matched: false },
  { id: "bs-19", date: "2026-02-06", sourceModule: "Fund Transfer", vendorOrPayee: "Internal", invoiceId: "TRF-002", paymentMode: "Internal", deposit: 10000.00, withdrawal: null, matched: true },
  { id: "bs-20", date: "2026-02-05", sourceModule: "Credit Card", vendorOrPayee: "Discover", invoiceId: "INV-4425", paymentMode: "ACH", deposit: 1420.00, withdrawal: null, matched: true },
  { id: "bs-21", date: "2026-02-05", sourceModule: "Vendor Payment", vendorOrPayee: "Frito-Lay Inc", invoiceId: "CHK-1047", paymentMode: "Check", deposit: null, withdrawal: 2150.00, matched: true },
  { id: "bs-22", date: "2026-02-05", sourceModule: "Manual", vendorOrPayee: "Bank Fee", invoiceId: "FEE-002", paymentMode: "Auto Debit", deposit: null, withdrawal: 35.00, matched: true },
  { id: "bs-23", date: "2026-02-04", sourceModule: "Credit Card", vendorOrPayee: "VISA/MC", invoiceId: "INV-4410", paymentMode: "ACH", deposit: 9100.00, withdrawal: null, matched: true },
  { id: "bs-24", date: "2026-02-04", sourceModule: "EBT", vendorOrPayee: "SNAP Program", invoiceId: "INV-4408", paymentMode: "ACH", deposit: 2740.00, withdrawal: null, matched: false },
  { id: "bs-25", date: "2026-02-04", sourceModule: "Vendor Payment", vendorOrPayee: "Dean Foods", invoiceId: "CHK-1048", paymentMode: "Check", deposit: null, withdrawal: 1890.00, matched: true },
];

const systemLedgerEntries = [
  { id: "sl-1", date: "2026-02-11", sourceModule: "Credit Card Settlement", reference: "CC-20260211-001", invoiceId: "INV-4501", deposit: 8450.00, withdrawal: null, matched: true },
  { id: "sl-2", date: "2026-02-11", sourceModule: "EBT Settlement", reference: "EBT-20260211-001", invoiceId: "INV-4502", deposit: 3200.00, withdrawal: null, matched: true },
  { id: "sl-3", date: "2026-02-11", sourceModule: "Vendor Payment", reference: "VP-20260211-001", invoiceId: "CHK-1042", deposit: null, withdrawal: 5640.00, matched: true },
  { id: "sl-4", date: "2026-02-10", sourceModule: "Fleet Settlement", reference: "FL-20260210-001", invoiceId: "INV-4490", deposit: 4120.00, withdrawal: null, matched: true },
  { id: "sl-5", date: "2026-02-10", sourceModule: "Services Settlement", reference: "SV-20260210-001", invoiceId: "SVC-2201", deposit: 890.00, withdrawal: null, matched: false },
  { id: "sl-6", date: "2026-02-10", sourceModule: "Vendor Payment", reference: "VP-20260210-002", invoiceId: "CHK-1043", deposit: null, withdrawal: 8200.00, matched: true },
  { id: "sl-7", date: "2026-02-09", sourceModule: "Credit Card Settlement", reference: "CC-20260209-001", invoiceId: "INV-4478", deposit: 2850.00, withdrawal: null, matched: false },
  { id: "sl-8", date: "2026-02-09", sourceModule: "Manual Entry", reference: "ADJ-20260209-001", invoiceId: "ADJ-001", deposit: 45.00, withdrawal: null, matched: true },
  { id: "sl-9", date: "2026-02-09", sourceModule: "Fund Transfer", reference: "TRF-20260209-001", invoiceId: "TRF-001", deposit: null, withdrawal: 5000.00, matched: true },
  { id: "sl-10", date: "2026-02-08", sourceModule: "Credit Card Settlement", reference: "CC-20260208-001", invoiceId: "INV-4465", deposit: 1950.00, withdrawal: null, matched: true },
  { id: "sl-11", date: "2026-02-08", sourceModule: "Vendor Payment", reference: "VP-20260208-001", invoiceId: "CHK-1044", deposit: null, withdrawal: 3275.00, matched: true },
  { id: "sl-12", date: "2026-02-08", sourceModule: "EBT Settlement", reference: "EBT-20260208-001", invoiceId: "INV-4460", deposit: 1680.00, withdrawal: null, matched: true },
  { id: "sl-13", date: "2026-02-07", sourceModule: "Credit Card Settlement", reference: "CC-20260207-001", invoiceId: "INV-4450", deposit: 7320.00, withdrawal: null, matched: true },
  { id: "sl-14", date: "2026-02-07", sourceModule: "Vendor Payment", reference: "VP-20260207-001", invoiceId: "CHK-1045", deposit: null, withdrawal: 4510.00, matched: true },
  { id: "sl-15", date: "2026-02-07", sourceModule: "Fleet Settlement", reference: "FL-20260207-001", invoiceId: "INV-4445", deposit: 2980.00, withdrawal: null, matched: false },
  { id: "sl-16", date: "2026-02-07", sourceModule: "Services Settlement", reference: "SV-20260207-001", invoiceId: "SVC-2198", deposit: 425.00, withdrawal: null, matched: true },
  { id: "sl-17", date: "2026-02-07", sourceModule: "Services Settlement", reference: "SV-20260207-002", invoiceId: "SVC-2190", deposit: 340.00, withdrawal: null, matched: false },
  { id: "sl-18", date: "2026-02-06", sourceModule: "Credit Card Settlement", reference: "CC-20260206-001", invoiceId: "INV-4438", deposit: 3150.00, withdrawal: null, matched: true },
  { id: "sl-19", date: "2026-02-06", sourceModule: "Vendor Payment", reference: "VP-20260206-001", invoiceId: "CHK-1046", deposit: null, withdrawal: 6890.00, matched: false },
  { id: "sl-20", date: "2026-02-06", sourceModule: "Fund Transfer", reference: "TRF-20260206-001", invoiceId: "TRF-002", deposit: 10000.00, withdrawal: null, matched: true },
  { id: "sl-21", date: "2026-02-05", sourceModule: "Credit Card Settlement", reference: "CC-20260205-001", invoiceId: "INV-4425", deposit: 1420.00, withdrawal: null, matched: true },
  { id: "sl-22", date: "2026-02-05", sourceModule: "Vendor Payment", reference: "VP-20260205-001", invoiceId: "CHK-1047", deposit: null, withdrawal: 2150.00, matched: true },
  { id: "sl-23", date: "2026-02-05", sourceModule: "Manual Entry", reference: "FEE-20260205-001", invoiceId: "FEE-002", deposit: null, withdrawal: 35.00, matched: true },
  { id: "sl-24", date: "2026-02-04", sourceModule: "Credit Card Settlement", reference: "CC-20260204-001", invoiceId: "INV-4410", deposit: 9100.00, withdrawal: null, matched: true },
  { id: "sl-25", date: "2026-02-04", sourceModule: "EBT Settlement", reference: "EBT-20260204-001", invoiceId: "INV-4408", deposit: 2740.00, withdrawal: null, matched: false },
  { id: "sl-26", date: "2026-02-04", sourceModule: "Vendor Payment", reference: "VP-20260204-001", invoiceId: "CHK-1048", deposit: null, withdrawal: 1890.00, matched: true },
  { id: "sl-27", date: "2026-02-04", sourceModule: "Vendor Payment", reference: "VP-20260204-002", invoiceId: "VP-2208", deposit: null, withdrawal: 2500.00, matched: false },
];

// ── Component ──────────────────────────────────────────────
export const BankReconcilePage = () => {
  const [bankAccount, setBankAccount] = useState("checking");
  const [periodFrom, setPeriodFrom] = useState("2026-02-07");
  const [periodTo, setPeriodTo] = useState("2026-02-11");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBankEntry, setSelectedBankEntry] = useState<string | null>(null);
  const [selectedSystemEntries, setSelectedSystemEntries] = useState<string[]>([]);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);

  const [bankEntries, setBankEntries] = useState(bankStatementEntries);
  const [systemEntries, setSystemEntries] = useState(systemLedgerEntries);

  const hasActiveFilters = statusFilter !== "all";
  const clearFilters = () => { setStatusFilter("all"); };

  const unmatchedBank = bankEntries.filter((e) => !e.matched);
  const unmatchedSystem = systemEntries.filter((e) => !e.matched);
  const unmatchedBankTotal =
    unmatchedBank.reduce((sum, e) => sum + (e.deposit ?? 0) - (e.withdrawal ?? 0), 0);
  const unmatchedSystemTotal =
    unmatchedSystem.reduce((sum, e) => sum + (e.deposit ?? 0) - (e.withdrawal ?? 0), 0);
  const differenceAmount = unmatchedBankTotal - unmatchedSystemTotal;

  const handleMatch = () => {
    if (!selectedBankEntry || selectedSystemEntries.length === 0) return;
    setBankEntries((prev) =>
      prev.map((e) => (e.id === selectedBankEntry ? { ...e, matched: true } : e))
    );
    setSystemEntries((prev) =>
      prev.map((e) => (selectedSystemEntries.includes(e.id) ? { ...e, matched: true } : e))
    );
    setSelectedBankEntry(null);
    setSelectedSystemEntries([]);
  };

  const toggleSystemEntry = (id: string) => {
    setSelectedSystemEntries((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const statusBadge = (s: string) => {
    if (s === "Open") return "secondary" as const;
    if (s === "Balanced") return "default" as const;
    return "outline" as const;
  };

  const isBalanced = reconciliationSummary.variance === 0;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Bank Reconciliation</h1>
          <Badge variant={statusBadge(reconciliationSummary.status)}>
            {reconciliationSummary.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            <Upload className="w-4 h-4 mr-1" /> Upload Bank Statement
          </Button>
          <Button size="sm">
            <PlayCircle className="w-4 h-4 mr-1" /> Start Reconciliation
          </Button>
          <Button size="sm" variant="outline">
            <Download className="w-4 h-4 mr-1" /> Export Report
          </Button>
        </div>
      </div>

      {/* ── Filters ── */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Bank Account</Label>
              <Select value={bankAccount} onValueChange={setBankAccount}>
                <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Business Checking</SelectItem>
                  <SelectItem value="savings">Business Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Statement From</Label>
              <Input type="date" className="h-8 w-36 text-xs" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Statement To</Label>
              <Input type="date" className="h-8 w-36 text-xs" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Balanced">Balanced</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-muted-foreground" onClick={clearFilters}>
                <X className="w-3.5 h-3.5" />Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Reconciliation Summary ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Landmark className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Stmt Opening</span>
            </div>
            <p className="text-base font-bold">${reconciliationSummary.statementOpeningBalance.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Landmark className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Stmt Closing</span>
            </div>
            <p className="text-base font-bold">${reconciliationSummary.statementClosingBalance.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[10px] text-muted-foreground">System Ledger</span>
            </div>
            <p className="text-base font-bold text-blue-600">${reconciliationSummary.systemLedgerBalance.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-green-600" />
              <span className="text-[10px] text-muted-foreground">Cleared Deposits</span>
            </div>
            <p className="text-base font-bold text-green-600">${reconciliationSummary.clearedDeposits.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-red-600" />
              <span className="text-[10px] text-muted-foreground">Cleared Withdrawals</span>
            </div>
            <p className="text-base font-bold text-red-600">${reconciliationSummary.clearedWithdrawals.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className={isBalanced ? "border-green-300 bg-green-50/50" : "border-red-300 bg-red-50/50"}>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-1.5 mb-1">
              {isBalanced
                ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                : <AlertTriangle className="w-3.5 h-3.5 text-red-600" />}
              <span className="text-[10px] text-muted-foreground">Variance</span>
            </div>
            <p className={`text-base font-bold ${isBalanced ? "text-green-600" : "text-red-600"}`}>
              ${reconciliationSummary.variance.toLocaleString()}
            </p>
            <span className={`text-[10px] font-medium ${isBalanced ? "text-green-600" : "text-red-600"}`}>
              {isBalanced ? "🟢 Balanced" : "🔴 Out of Balance"}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* ── Matching Interface (Split Screen) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left — Bank Statement Entries */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Bank Statement Entries</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] w-8"></TableHead>
                    <TableHead className="text-[10px]">Date</TableHead>
                    <TableHead className="text-[10px]">Source Module</TableHead>
                    <TableHead className="text-[10px]">Vendor/Payee</TableHead>
                    <TableHead className="text-[10px]">Invoice ID</TableHead>
                    <TableHead className="text-[10px]">Payment Mode</TableHead>
                    <TableHead className="text-[10px] text-right">Deposit $</TableHead>
                    <TableHead className="text-[10px] text-right">Withdrawal $</TableHead>
                    <TableHead className="text-[10px] text-center">Matched</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankEntries.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className={`text-xs cursor-pointer ${
                        selectedBankEntry === entry.id ? "bg-accent" : ""
                      } ${entry.matched ? "opacity-60" : ""}`}
                      onClick={() => !entry.matched && setSelectedBankEntry(entry.id)}
                    >
                      <TableCell className="p-2">
                        {!entry.matched && (
                          <Checkbox
                            checked={selectedBankEntry === entry.id}
                            onCheckedChange={() => setSelectedBankEntry(entry.id)}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-[10px]">{entry.date}</TableCell>
                      <TableCell className="text-[10px]">{entry.sourceModule}</TableCell>
                      <TableCell className="text-[10px]">{entry.vendorOrPayee}</TableCell>
                      <TableCell className="text-[10px] font-mono">{entry.invoiceId}</TableCell>
                      <TableCell className="text-[10px]">{entry.paymentMode}</TableCell>
                      <TableCell className="text-[10px] text-right text-green-600 font-medium">
                        {entry.deposit ? `$${entry.deposit.toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell className="text-[10px] text-right text-red-600 font-medium">
                        {entry.withdrawal ? `$${entry.withdrawal.toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {entry.matched
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 inline" />
                          : <XCircle className="w-3.5 h-3.5 text-muted-foreground inline" />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Right — System Ledger Entries */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">System Ledger Entries</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] w-8"></TableHead>
                    <TableHead className="text-[10px]">Date</TableHead>
                    <TableHead className="text-[10px]">Source Module</TableHead>
                    <TableHead className="text-[10px]">Reference</TableHead>
                    <TableHead className="text-[10px]">Invoice ID</TableHead>
                    <TableHead className="text-[10px] text-right">Deposit $</TableHead>
                    <TableHead className="text-[10px] text-right">Withdrawal $</TableHead>
                    <TableHead className="text-[10px] text-center">Matched</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemEntries.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className={`text-xs cursor-pointer ${
                        selectedSystemEntries.includes(entry.id) ? "bg-accent" : ""
                      } ${entry.matched ? "opacity-60" : ""}`}
                      onClick={() => !entry.matched && toggleSystemEntry(entry.id)}
                    >
                      <TableCell className="p-2">
                        {!entry.matched && (
                          <Checkbox
                            checked={selectedSystemEntries.includes(entry.id)}
                            onCheckedChange={() => toggleSystemEntry(entry.id)}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-[10px]">{entry.date}</TableCell>
                      <TableCell className="text-[10px]">{entry.sourceModule}</TableCell>
                      <TableCell className="text-[10px] font-mono">{entry.reference}</TableCell>
                      <TableCell className="text-[10px] font-mono">{entry.invoiceId}</TableCell>
                      <TableCell className="text-[10px] text-right text-green-600 font-medium">
                        {entry.deposit ? `$${entry.deposit.toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell className="text-[10px] text-right text-red-600 font-medium">
                        {entry.withdrawal ? `$${entry.withdrawal.toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {entry.matched
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 inline" />
                          : <XCircle className="w-3.5 h-3.5 text-muted-foreground inline" />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Match Action Bar ── */}
      {(selectedBankEntry || selectedSystemEntries.length > 0) && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Selected: <span className="font-medium text-foreground">{selectedBankEntry ? "1 bank entry" : "0 bank entries"}</span>
                {" ↔ "}
                <span className="font-medium text-foreground">{selectedSystemEntries.length} system {selectedSystemEntries.length === 1 ? "entry" : "entries"}</span>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedBankEntry(null);
                    setSelectedSystemEntries([]);
                  }}
                >
                  Clear Selection
                </Button>
                <Button
                  size="sm"
                  disabled={!selectedBankEntry || selectedSystemEntries.length === 0}
                  onClick={handleMatch}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Match & Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Variance Panel ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Variance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground">Unmatched Bank Entries</h4>
              {unmatchedBank.length === 0 ? (
                <p className="text-xs text-muted-foreground">None</p>
              ) : (
                unmatchedBank.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-xs border-b pb-1">
                    <span className="truncate max-w-[160px]">{e.vendorOrPayee}</span>
                    <span className={e.deposit ? "text-green-600" : "text-red-600"}>
                      {e.deposit ? `+$${e.deposit.toLocaleString()}` : `-$${e.withdrawal?.toLocaleString()}`}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground">Unmatched System Entries</h4>
              {unmatchedSystem.length === 0 ? (
                <p className="text-xs text-muted-foreground">None</p>
              ) : (
                unmatchedSystem.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-xs border-b pb-1">
                    <span className="truncate max-w-[160px]">{e.reference}</span>
                    <span className={e.deposit ? "text-green-600" : "text-red-600"}>
                      {e.deposit ? `+$${e.deposit.toLocaleString()}` : `-$${e.withdrawal?.toLocaleString()}`}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground">Difference Amount</h4>
              <p className={`text-xl font-bold ${differenceAmount === 0 ? "text-green-600" : "text-red-600"}`}>
                ${Math.abs(differenceAmount).toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {differenceAmount > 0 ? "Bank has more" : differenceAmount < 0 ? "System has more" : "Balanced"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button size="sm" variant="outline" onClick={() => setShowAdjustmentModal(true)}>
              Create Adjustment Entry
            </Button>
            <Button size="sm" variant="secondary">
              Save as Draft
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Status Flow Reference ── */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Open</Badge>
              <span className="text-muted-foreground">Reconciliation started</span>
            </div>
            <span className="text-muted-foreground">→</span>
            <div className="flex items-center gap-2">
              <Badge variant="default">Balanced</Badge>
              <span className="text-muted-foreground">No variance</span>
            </div>
            <span className="text-muted-foreground">→</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Closed</Badge>
              <span className="text-muted-foreground">Finalized & locked</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Adjustment Entry Modal ── */}
      <Dialog open={showAdjustmentModal} onOpenChange={setShowAdjustmentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Adjustment Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input type="date" className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">Deposit (Credit)</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal (Debit)</SelectItem>
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
              <Input placeholder="Reason for adjustment…" className="h-8 text-xs" />
            </div>
            <p className="text-[10px] text-muted-foreground">⚠ Requires permission. Adjustment will appear in Bank Ledger.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAdjustmentModal(false)}>Cancel</Button>
            <Button size="sm" onClick={() => setShowAdjustmentModal(false)}>Save Adjustment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
