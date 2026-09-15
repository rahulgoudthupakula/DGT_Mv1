import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Download, DollarSign, Hash, Receipt, FileText, AlertTriangle, X } from "lucide-react";

interface BillPayTransaction {
  id: string;
  dateTime: string;
  provider: string;
  billerName: string;
  referenceNo: string;
  billAmount: number;
  serviceFee: number;
  commission: number;
  tenderType: string;
  status: "Completed" | "Voided" | "Reversed" | "Settled" | "Unsettled";
  posTransactionId: string;
  customerAccount: string;
  clerk: string;
  confirmationNo: string;
  settlementBatchId?: string;
  notes?: string;
}

const mockData: BillPayTransaction[] = [
  { id: "1", dateTime: "2025-02-10 09:20 AM", provider: "PayNearMe", billerName: "Duke Energy", referenceNo: "REF-90210", billAmount: 185.50, serviceFee: 1.99, commission: 0.80, tenderType: "Cash", status: "Completed", posTransactionId: "POS-44010", customerAccount: "***-4821", clerk: "John D.", confirmationNo: "CNF-882100" },
  { id: "2", dateTime: "2025-02-10 10:45 AM", provider: "Western Union", billerName: "AT&T Wireless", referenceNo: "REF-90215", billAmount: 320.00, serviceFee: 2.49, commission: 1.20, tenderType: "Cash", status: "Completed", posTransactionId: "POS-44015", customerAccount: "***-7733", clerk: "Maria S.", confirmationNo: "CNF-882150" },
  { id: "3", dateTime: "2025-02-09 01:30 PM", provider: "PayNearMe", billerName: "State Farm Insurance", referenceNo: "REF-90100", billAmount: 450.00, serviceFee: 2.99, commission: 1.50, tenderType: "Card", status: "Settled", posTransactionId: "POS-43990", customerAccount: "***-1190", clerk: "Alex P.", confirmationNo: "CNF-881000", settlementBatchId: "BATCH-BP-001" },
  { id: "4", dateTime: "2025-02-08 03:15 PM", provider: "CheckFreePay", billerName: "Comcast Cable", referenceNo: "REF-89800", billAmount: 125.00, serviceFee: 1.49, commission: 0.60, tenderType: "Cash", status: "Voided", posTransactionId: "POS-43800", customerAccount: "***-5502", clerk: "John D.", confirmationNo: "CNF-878000", notes: "Customer changed mind" },
  { id: "5", dateTime: "2025-02-05 04:00 PM", provider: "Western Union", billerName: "T-Mobile", referenceNo: "REF-89500", billAmount: 95.00, serviceFee: 1.49, commission: 0.60, tenderType: "Cash", status: "Unsettled", posTransactionId: "POS-43500", customerAccount: "***-8844", clerk: "Maria S.", confirmationNo: "CNF-875000" },
  { id: "6", dateTime: "2025-02-10 02:10 PM", provider: "CheckFreePay", billerName: "Water Utility Co", referenceNo: "REF-90220", billAmount: 78.30, serviceFee: 1.49, commission: 0.60, tenderType: "Cash", status: "Reversed", posTransactionId: "POS-44020", customerAccount: "***-3310", clerk: "Alex P.", confirmationNo: "CNF-882200", notes: "Duplicate payment reversal" },
];

const statusColor: Record<string, string> = {
  Completed: "bg-emerald-100 text-emerald-800",
  Voided: "bg-red-100 text-red-800",
  Reversed: "bg-orange-100 text-orange-800",
  Settled: "bg-blue-100 text-blue-800",
  Unsettled: "bg-yellow-100 text-yellow-800",
};

export const BillPayPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [billerFilter, setBillerFilter] = useState("all");
  const [selectedRow, setSelectedRow] = useState<BillPayTransaction | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);

  const billers = [...new Set(mockData.map((t) => t.billerName))];
  const providers = [...new Set(mockData.map((t) => t.provider))];

  const hasActiveFilters = search !== "" || statusFilter !== "all" || providerFilter !== "all" || billerFilter !== "all";
  const clearFilters = () => { setSearch(""); setStatusFilter("all"); setProviderFilter("all"); setBillerFilter("all"); };

  const filtered = mockData.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (providerFilter !== "all" && t.provider !== providerFilter) return false;
    if (billerFilter !== "all" && t.billerName !== billerFilter) return false;
    if (search && !t.referenceNo.toLowerCase().includes(search.toLowerCase()) && !t.customerAccount.includes(search)) return false;
    return true;
  });

  const totalBillAmt = filtered.reduce((s, r) => s + r.billAmount, 0);
  const totalFees = filtered.reduce((s, r) => s + r.serviceFee, 0);
  const totalCommission = filtered.reduce((s, r) => s + r.commission, 0);
  const unsettledAmt = filtered.filter((r) => r.status === "Unsettled" || r.status === "Completed").reduce((s, r) => s + r.billAmount, 0);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const summaryCards = [
    { label: "Total Bill Amount", value: `$${totalBillAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: DollarSign },
    { label: "Total Service Fees", value: `$${totalFees.toFixed(2)}`, icon: Receipt },
    { label: "Commission Earned", value: `$${totalCommission.toFixed(2)}`, icon: FileText },
    { label: "# Transactions", value: filtered.length.toString(), icon: Hash },
    { label: "Unsettled Amount", value: `$${unsettledAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Bill Pay</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Export</Button>
          <Button size="sm" variant="outline" onClick={() => setBatchMode(!batchMode)}>
            {batchMode ? "Cancel Batch" : "Create Settlement Batch"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end sticky top-0 bg-background z-10 py-2">
        <Input placeholder="Search Ref # / Account #" value={search} onChange={(e) => setSearch(e.target.value)} className="w-56 h-9 text-sm" />
        <Select value={providerFilter} onValueChange={setProviderFilter}>
          <SelectTrigger className="w-40 h-9 text-sm"><SelectValue placeholder="Provider" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            {providers.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={billerFilter} onValueChange={setBillerFilter}>
          <SelectTrigger className="w-48 h-9 text-sm"><SelectValue placeholder="Biller Name" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Billers</SelectItem>
            {billers.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
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
              <span>Total: <strong>${[...selectedIds].reduce((s, id) => s + (mockData.find((m) => m.id === id)?.billAmount ?? 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
              <span>Fees: <strong>${[...selectedIds].reduce((s, id) => s + (mockData.find((m) => m.id === id)?.serviceFee ?? 0), 0).toFixed(2)}</strong></span>
              <span>Commission: <strong>${[...selectedIds].reduce((s, id) => s + (mockData.find((m) => m.id === id)?.commission ?? 0), 0).toFixed(2)}</strong></span>
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
              <TableHead>Biller Name</TableHead>
              <TableHead>Reference #</TableHead>
              <TableHead className="text-right">Bill Amount $</TableHead>
              <TableHead className="text-right">Service Fee $</TableHead>
              <TableHead className="text-right">Commission $</TableHead>
              <TableHead>Tender</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.id}>
                {batchMode && (
                  <TableCell>
                    {(t.status === "Completed" || t.status === "Unsettled") && (
                      <Checkbox checked={selectedIds.has(t.id)} onCheckedChange={() => toggleSelect(t.id)} />
                    )}
                  </TableCell>
                )}
                <TableCell className="text-xs whitespace-nowrap">{t.dateTime}</TableCell>
                <TableCell className="text-xs">{t.provider}</TableCell>
                <TableCell className="text-xs">{t.billerName}</TableCell>
                <TableCell className="text-xs font-mono">{t.referenceNo}</TableCell>
                <TableCell className="text-right text-xs font-medium">${t.billAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-right text-xs">${t.serviceFee.toFixed(2)}</TableCell>
                <TableCell className="text-right text-xs">${t.commission.toFixed(2)}</TableCell>
                <TableCell className="text-xs">{t.tenderType}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`text-[10px] ${statusColor[t.status]}`}>{t.status}</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setSelectedRow(t)}>View</Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={batchMode ? 12 : 11} className="text-center text-muted-foreground py-8">No transactions found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* View Drawer */}
      <Sheet open={!!selectedRow} onOpenChange={(o) => !o && setSelectedRow(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Bill Pay Details</SheetTitle>
            <SheetDescription>Transaction detail for {selectedRow?.referenceNo}</SheetDescription>
          </SheetHeader>
          {selectedRow && (
            <div className="mt-6 space-y-4 text-sm">
              <DetailRow label="POS Transaction ID" value={selectedRow.posTransactionId} />
              <DetailRow label="Date & Time" value={selectedRow.dateTime} />
              <DetailRow label="Provider" value={selectedRow.provider} />
              <DetailRow label="Biller Name" value={selectedRow.billerName} />
              <DetailRow label="Reference #" value={selectedRow.referenceNo} />
              <DetailRow label="Bill Amount" value={`$${selectedRow.billAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
              <DetailRow label="Service Fee" value={`$${selectedRow.serviceFee.toFixed(2)}`} />
              <DetailRow label="Commission" value={`$${selectedRow.commission.toFixed(2)}`} />
              <DetailRow label="Tender Type" value={selectedRow.tenderType} />
              <DetailRow label="Status" value={selectedRow.status} />
              <DetailRow label="Customer Account" value={selectedRow.customerAccount} />
              <DetailRow label="Clerk ID" value={selectedRow.clerk} />
              <DetailRow label="Confirmation #" value={selectedRow.confirmationNo} />
              {selectedRow.settlementBatchId && <DetailRow label="Settlement Batch ID" value={selectedRow.settlementBatchId} />}
              {selectedRow.notes && <DetailRow label="Notes / Reversal Reason" value={selectedRow.notes} />}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start gap-2">
    <span className="text-muted-foreground w-44 shrink-0">{label}</span>
    <span className="text-foreground font-medium">{value}</span>
  </div>
);
