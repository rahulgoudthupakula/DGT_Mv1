import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Download, FileText, DollarSign, Hash, Receipt, AlertTriangle, CircleDot, X } from "lucide-react";

// --- Types ---
interface MoneyOrder {
  id: string;
  dateTime: string;
  provider: string;
  moNumber: string;
  amountIssued: number;
  feeCollected: number;
  commission: number;
  tenderType: string;
  status: "Issued" | "Voided" | "Reversed" | "Settled" | "Unsettled";
  posTransactionId: string;
  clerk: string;
  customerId: string;
  voidReason?: string;
  settlementRef?: string;
  flags: string[];
}

// --- Mock data ---
const mockData: MoneyOrder[] = [
  { id: "1", dateTime: "2025-02-10 09:14 AM", provider: "MoneyGram", moNumber: "****4821", amountIssued: 500, feeCollected: 1.5, commission: 0.75, tenderType: "Cash", status: "Issued", posTransactionId: "POS-88210", clerk: "John D.", customerId: "***-1234", flags: [], },
  { id: "2", dateTime: "2025-02-10 10:32 AM", provider: "Western Union", moNumber: "****7733", amountIssued: 2500, feeCollected: 3.0, commission: 1.5, tenderType: "Cash", status: "Issued", posTransactionId: "POS-88215", clerk: "Maria S.", customerId: "***-5678", flags: ["high_amount"], },
  { id: "3", dateTime: "2025-02-09 02:45 PM", provider: "MoneyGram", moNumber: "****1190", amountIssued: 300, feeCollected: 1.0, commission: 0.5, tenderType: "Cash", status: "Voided", posTransactionId: "POS-88100", clerk: "John D.", customerId: "***-9012", voidReason: "Customer requested cancellation", flags: ["multiple_voids"], },
  { id: "4", dateTime: "2025-02-08 11:00 AM", provider: "Western Union", moNumber: "****5502", amountIssued: 750, feeCollected: 2.0, commission: 1.0, tenderType: "Card", status: "Settled", posTransactionId: "POS-87990", clerk: "Alex P.", customerId: "***-3456", settlementRef: "BATCH-2025-001", flags: [], },
  { id: "5", dateTime: "2025-02-05 03:20 PM", provider: "MoneyGram", moNumber: "****8844", amountIssued: 1000, feeCollected: 2.0, commission: 1.0, tenderType: "Cash", status: "Unsettled", posTransactionId: "POS-87800", clerk: "Maria S.", customerId: "***-7890", flags: ["unsettled_old"], },
  { id: "6", dateTime: "2025-02-10 01:15 PM", provider: "MoneyGram", moNumber: "****3310", amountIssued: 200, feeCollected: 1.0, commission: 0.5, tenderType: "Cash", status: "Reversed", posTransactionId: "POS-88220", clerk: "John D.", customerId: "***-2345", voidReason: "Duplicate issuance", flags: ["multiple_voids"], },
];

const statusColor: Record<string, string> = {
  Issued: "bg-emerald-100 text-emerald-800",
  Voided: "bg-red-100 text-red-800",
  Reversed: "bg-orange-100 text-orange-800",
  Settled: "bg-blue-100 text-blue-800",
  Unsettled: "bg-yellow-100 text-yellow-800",
};

export const MoneyOrderPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [selectedRow, setSelectedRow] = useState<MoneyOrder | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);

  const hasActiveFilters = search !== "" || statusFilter !== "all" || providerFilter !== "all";
  const clearFilters = () => { setSearch(""); setStatusFilter("all"); setProviderFilter("all"); };

  const filtered = mockData.filter((mo) => {
    if (statusFilter !== "all" && mo.status !== statusFilter) return false;
    if (providerFilter !== "all" && mo.provider !== providerFilter) return false;
    if (search && !mo.moNumber.includes(search) && !mo.posTransactionId.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalIssued = filtered.reduce((s, r) => s + r.amountIssued, 0);
  const totalFees = filtered.reduce((s, r) => s + r.feeCollected, 0);
  const totalCommission = filtered.reduce((s, r) => s + r.commission, 0);
  const unsettledAmt = filtered.filter((r) => r.status === "Unsettled" || r.status === "Issued").reduce((s, r) => s + r.amountIssued, 0);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const renderFlag = (flag: string) => {
    switch (flag) {
      case "high_amount": return <span key={flag} title="High amount" className="cursor-pointer text-red-500">🔴</span>;
      case "multiple_voids": return <span key={flag} title="Multiple voids by same user" className="cursor-pointer text-yellow-500">🟡</span>;
      case "unsettled_old": return <span key={flag} title="Unsettled > 7 days" className="cursor-pointer text-orange-500">⚠️</span>;
      default: return null;
    }
  };

  const summaryCards = [
    { label: "Total Issued", value: `$${totalIssued.toLocaleString()}`, icon: DollarSign },
    { label: "# Transactions", value: filtered.length.toString(), icon: Hash },
    { label: "Total Fees Collected", value: `$${totalFees.toFixed(2)}`, icon: Receipt },
    { label: "Commission Earned", value: `$${totalCommission.toFixed(2)}`, icon: FileText },
    { label: "Unsettled Amount", value: `$${unsettledAmt.toLocaleString()}`, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Money Orders</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Export</Button>
          <Button size="sm" variant="outline" onClick={() => setBatchMode(!batchMode)}>
            {batchMode ? "Cancel Batch" : "Record Settlement"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end sticky top-0 bg-background z-10 py-2">
        <Input placeholder="Search MO # / Ref #" value={search} onChange={(e) => setSearch(e.target.value)} className="w-52 h-9 text-sm" />
        <Select value={providerFilter} onValueChange={setProviderFilter}>
          <SelectTrigger className="w-40 h-9 text-sm"><SelectValue placeholder="Provider" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            <SelectItem value="MoneyGram">MoneyGram</SelectItem>
            <SelectItem value="Western Union">Western Union</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Issued">Issued</SelectItem>
            <SelectItem value="Voided">Voided</SelectItem>
            <SelectItem value="Reversed">Reversed</SelectItem>
            <SelectItem value="Settled">Settled</SelectItem>
            <SelectItem value="Unsettled">Unsettled</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-9 text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={clearFilters}>
            <X className="h-3.5 w-3.5" />Clear filters
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {summaryCards.map((c) => (
          <Card key={c.label} className="border border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-muted"><c.icon className="w-4 h-4 text-muted-foreground" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-lg font-bold text-foreground">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Batch Settlement Bar */}
      {batchMode && selectedIds.size > 0 && (
        <Card className="border border-primary/30 bg-primary/5">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex gap-6 text-sm">
              <span><strong>{selectedIds.size}</strong> selected</span>
              <span>Total: <strong>${[...selectedIds].reduce((s, id) => s + (mockData.find((m) => m.id === id)?.amountIssued ?? 0), 0).toLocaleString()}</strong></span>
              <span>Fees: <strong>${[...selectedIds].reduce((s, id) => s + (mockData.find((m) => m.id === id)?.feeCollected ?? 0), 0).toFixed(2)}</strong></span>
            </div>
            <Button size="sm">Create Settlement Batch</Button>
          </CardContent>
        </Card>
      )}

      {/* Main Table */}
      <Card className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {batchMode && <TableHead className="w-10" />}
              <TableHead>Date & Time</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>MO #</TableHead>
              <TableHead className="text-right">Amount $</TableHead>
              <TableHead className="text-right">Fee $</TableHead>
              <TableHead className="text-right">Commission $</TableHead>
              <TableHead>Tender</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>QC</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((mo) => (
              <TableRow key={mo.id}>
                {batchMode && (
                  <TableCell>
                    {(mo.status === "Issued" || mo.status === "Unsettled") && (
                      <Checkbox checked={selectedIds.has(mo.id)} onCheckedChange={() => toggleSelect(mo.id)} />
                    )}
                  </TableCell>
                )}
                <TableCell className="text-xs whitespace-nowrap">{mo.dateTime}</TableCell>
                <TableCell className="text-xs">{mo.provider}</TableCell>
                <TableCell className="text-xs font-mono">{mo.moNumber}</TableCell>
                <TableCell className="text-right text-xs font-medium">${mo.amountIssued.toLocaleString()}</TableCell>
                <TableCell className="text-right text-xs">${mo.feeCollected.toFixed(2)}</TableCell>
                <TableCell className="text-right text-xs">${mo.commission.toFixed(2)}</TableCell>
                <TableCell className="text-xs">{mo.tenderType}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`text-[10px] ${statusColor[mo.status]}`}>{mo.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">{mo.flags.map(renderFlag)}</div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setSelectedRow(mo)}>View</Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={batchMode ? 11 : 10} className="text-center text-muted-foreground py-8">No transactions found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* View Drawer */}
      <Sheet open={!!selectedRow} onOpenChange={(o) => !o && setSelectedRow(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Money Order Details</SheetTitle>
            <SheetDescription>Transaction detail for MO {selectedRow?.moNumber}</SheetDescription>
          </SheetHeader>
          {selectedRow && (
            <div className="mt-6 space-y-4 text-sm">
              <DetailRow label="POS Transaction ID" value={selectedRow.posTransactionId} />
              <DetailRow label="Date & Time" value={selectedRow.dateTime} />
              <DetailRow label="Provider" value={selectedRow.provider} />
              <DetailRow label="Money Order #" value={selectedRow.moNumber} />
              <DetailRow label="Amount Issued" value={`$${selectedRow.amountIssued.toLocaleString()}`} />
              <DetailRow label="Fee Collected" value={`$${selectedRow.feeCollected.toFixed(2)}`} />
              <DetailRow label="Commission" value={`$${selectedRow.commission.toFixed(2)}`} />
              <DetailRow label="Tender Type" value={selectedRow.tenderType} />
              <DetailRow label="Status" value={selectedRow.status} />
              <DetailRow label="Clerk / User" value={selectedRow.clerk} />
              <DetailRow label="Customer ID" value={selectedRow.customerId} />
              {selectedRow.voidReason && <DetailRow label="Void / Reversal Reason" value={selectedRow.voidReason} />}
              {selectedRow.settlementRef && <DetailRow label="Settlement Reference" value={selectedRow.settlementRef} />}
              {selectedRow.flags.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground w-40 shrink-0">QC Flags</span>
                  <div className="flex gap-1">{selectedRow.flags.map(renderFlag)}</div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground w-40 shrink-0">Attachments</span>
                <span className="text-foreground italic">None</span>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start gap-2">
    <span className="text-muted-foreground w-40 shrink-0">{label}</span>
    <span className="text-foreground font-medium">{value}</span>
  </div>
);
