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

interface MoneyTransfer {
  id: string;
  dateTime: string;
  provider: string;
  type: "Send" | "Receive";
  transferRef: string;
  principalAmount: number;
  feeCollected: number;
  commission: number;
  tenderType: string;
  status: "Completed" | "Cancelled" | "Reversed" | "Settled" | "Unsettled";
  posTransactionId: string;
  sender: string;
  receiver: string;
  country: string;
  clerk: string;
  confirmationCode: string;
  reversalReason?: string;
  settlementBatchId?: string;
}

const mockData: MoneyTransfer[] = [
  { id: "1", dateTime: "2025-02-10 09:30 AM", provider: "Western Union", type: "Send", transferRef: "WU-882100", principalAmount: 500, feeCollected: 12.99, commission: 5.00, tenderType: "Cash", status: "Completed", posTransactionId: "POS-55010", sender: "***-John D.", receiver: "***-Maria L.", country: "Mexico", clerk: "Alex P.", confirmationCode: "MTCN-100200300" },
  { id: "2", dateTime: "2025-02-10 11:15 AM", provider: "MoneyGram", type: "Send", transferRef: "MG-772150", principalAmount: 1200, feeCollected: 22.00, commission: 9.50, tenderType: "Cash", status: "Completed", posTransactionId: "POS-55015", sender: "***-Carlos R.", receiver: "***-Ana G.", country: "Guatemala", clerk: "John D.", confirmationCode: "REF-445566" },
  { id: "3", dateTime: "2025-02-10 01:00 PM", provider: "Western Union", type: "Receive", transferRef: "WU-882200", principalAmount: 350, feeCollected: 0, commission: 3.00, tenderType: "Cash", status: "Completed", posTransactionId: "POS-55020", sender: "***-Pedro M.", receiver: "***-Luis T.", country: "El Salvador", clerk: "Maria S.", confirmationCode: "MTCN-400500600" },
  { id: "4", dateTime: "2025-02-09 02:45 PM", provider: "MoneyGram", type: "Send", transferRef: "MG-771000", principalAmount: 800, feeCollected: 15.99, commission: 7.00, tenderType: "Card", status: "Settled", posTransactionId: "POS-54990", sender: "***-James W.", receiver: "***-Rosa P.", country: "Honduras", clerk: "Alex P.", confirmationCode: "REF-112233", settlementBatchId: "BATCH-MT-001" },
  { id: "5", dateTime: "2025-02-08 10:00 AM", provider: "Western Union", type: "Send", transferRef: "WU-880500", principalAmount: 250, feeCollected: 8.99, commission: 3.50, tenderType: "Cash", status: "Cancelled", posTransactionId: "POS-54800", sender: "***-David K.", receiver: "***-Sofia N.", country: "Colombia", clerk: "John D.", confirmationCode: "MTCN-700800900", reversalReason: "Customer cancelled before processing" },
  { id: "6", dateTime: "2025-02-05 03:30 PM", provider: "MoneyGram", type: "Send", transferRef: "MG-768000", principalAmount: 600, feeCollected: 11.99, commission: 5.50, tenderType: "Cash", status: "Unsettled", posTransactionId: "POS-54500", sender: "***-Mike B.", receiver: "***-Elena V.", country: "Dominican Republic", clerk: "Maria S.", confirmationCode: "REF-998877" },
];

const statusColor: Record<string, string> = {
  Completed: "bg-emerald-100 text-emerald-800",
  Cancelled: "bg-red-100 text-red-800",
  Reversed: "bg-orange-100 text-orange-800",
  Settled: "bg-blue-100 text-blue-800",
  Unsettled: "bg-yellow-100 text-yellow-800",
};

export const MoneyTransferPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedRow, setSelectedRow] = useState<MoneyTransfer | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);

  const hasActiveFilters = search !== "" || statusFilter !== "all" || providerFilter !== "all" || typeFilter !== "all";
  const clearFilters = () => { setSearch(""); setStatusFilter("all"); setProviderFilter("all"); setTypeFilter("all"); };

  const filtered = mockData.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (providerFilter !== "all" && t.provider !== providerFilter) return false;
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    if (search && !t.transferRef.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalTransfers = filtered.reduce((s, r) => s + r.principalAmount, 0);
  const totalFees = filtered.reduce((s, r) => s + r.feeCollected, 0);
  const totalCommission = filtered.reduce((s, r) => s + r.commission, 0);
  const unsettledAmt = filtered.filter((r) => r.status === "Unsettled" || r.status === "Completed").reduce((s, r) => s + r.principalAmount, 0);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const summaryCards = [
    { label: "Total Transfers", value: `$${totalTransfers.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: DollarSign },
    { label: "Total Fees Collected", value: `$${totalFees.toFixed(2)}`, icon: Receipt },
    { label: "Commission Earned", value: `$${totalCommission.toFixed(2)}`, icon: FileText },
    { label: "# Transactions", value: filtered.length.toString(), icon: Hash },
    { label: "Unsettled Amount", value: `$${unsettledAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Money Transfer</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Export</Button>
          <Button size="sm" variant="outline" onClick={() => setBatchMode(!batchMode)}>
            {batchMode ? "Cancel Batch" : "Create Settlement Batch"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-end sticky top-0 bg-background z-10 py-2">
        <Input placeholder="Search Transfer Ref #" value={search} onChange={(e) => setSearch(e.target.value)} className="w-52 h-9 text-sm" />
        <Select value={providerFilter} onValueChange={setProviderFilter}>
          <SelectTrigger className="w-40 h-9 text-sm"><SelectValue placeholder="Provider" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            <SelectItem value="Western Union">Western Union</SelectItem>
            <SelectItem value="MoneyGram">MoneyGram</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Send">Send</SelectItem>
            <SelectItem value="Receive">Receive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
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

      {batchMode && selectedIds.size > 0 && (
        <Card className="border border-primary/30 bg-primary/5">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex gap-6 text-sm">
              <span><strong>{selectedIds.size}</strong> selected</span>
              <span>Principal: <strong>${[...selectedIds].reduce((s, id) => s + (mockData.find((m) => m.id === id)?.principalAmount ?? 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
              <span>Fees: <strong>${[...selectedIds].reduce((s, id) => s + (mockData.find((m) => m.id === id)?.feeCollected ?? 0), 0).toFixed(2)}</strong></span>
              <span>Commission: <strong>${[...selectedIds].reduce((s, id) => s + (mockData.find((m) => m.id === id)?.commission ?? 0), 0).toFixed(2)}</strong></span>
            </div>
            <Button size="sm">Create Settlement Batch</Button>
          </CardContent>
        </Card>
      )}

      <Card className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {batchMode && <TableHead className="w-10" />}
              <TableHead>Date & Time</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Transfer Ref #</TableHead>
              <TableHead className="text-right">Principal $</TableHead>
              <TableHead className="text-right">Fee $</TableHead>
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
                <TableCell>
                  <Badge variant="outline" className="text-[10px]">{t.type}</Badge>
                </TableCell>
                <TableCell className="text-xs font-mono">{t.transferRef}</TableCell>
                <TableCell className="text-right text-xs font-medium">${t.principalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-right text-xs">${t.feeCollected.toFixed(2)}</TableCell>
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

      <Sheet open={!!selectedRow} onOpenChange={(o) => !o && setSelectedRow(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Transfer Details</SheetTitle>
            <SheetDescription>Transaction detail for {selectedRow?.transferRef}</SheetDescription>
          </SheetHeader>
          {selectedRow && (
            <div className="mt-6 space-y-4 text-sm">
              <DetailRow label="POS Transaction ID" value={selectedRow.posTransactionId} />
              <DetailRow label="Date & Time" value={selectedRow.dateTime} />
              <DetailRow label="Provider" value={selectedRow.provider} />
              <DetailRow label="Type" value={selectedRow.type} />
              <DetailRow label="Transfer Ref #" value={selectedRow.transferRef} />
              <DetailRow label="Principal Amount" value={`$${selectedRow.principalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
              <DetailRow label="Fee Collected" value={`$${selectedRow.feeCollected.toFixed(2)}`} />
              <DetailRow label="Commission" value={`$${selectedRow.commission.toFixed(2)}`} />
              <DetailRow label="Tender Type" value={selectedRow.tenderType} />
              <DetailRow label="Status" value={selectedRow.status} />
              <DetailRow label="Sender" value={selectedRow.sender} />
              <DetailRow label="Receiver" value={selectedRow.receiver} />
              <DetailRow label="Country / Destination" value={selectedRow.country} />
              <DetailRow label="Clerk ID" value={selectedRow.clerk} />
              <DetailRow label="Confirmation Code" value={selectedRow.confirmationCode} />
              {selectedRow.reversalReason && <DetailRow label="Reversal Reason" value={selectedRow.reversalReason} />}
              {selectedRow.settlementBatchId && <DetailRow label="Settlement Batch ID" value={selectedRow.settlementBatchId} />}
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
