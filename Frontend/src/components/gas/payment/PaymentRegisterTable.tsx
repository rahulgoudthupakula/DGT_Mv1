import { useState } from "react";
import { Eye, CreditCard } from "lucide-react";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaymentDetailsDrawer } from "./PaymentDetailsDrawer";
import { RecordPaymentDrawer } from "./RecordPaymentDrawer";
import { toast } from "sonner";

interface InvoiceRow {
  id: string;
  date: string;
  vendor: string;
  invoiceNo: string;
  bolNo: string;
  totalAmount: number;
  paidAmount: number;
  outstanding: number;
  dueDate: string;
  status: "Paid" | "Partial" | "Unpaid";
  paymentMethod: string;
}

const mockData: InvoiceRow[] = [
  { id: "1", date: "Feb 08, 2026", vendor: "Sunoco LP", invoiceNo: "INV-4821", bolNo: "BOL-2401", totalAmount: 18450, paidAmount: 18450, outstanding: 0, dueDate: "Feb 15, 2026", status: "Paid", paymentMethod: "ach" },
  { id: "2", date: "Feb 07, 2026", vendor: "Marathon Petroleum", invoiceNo: "INV-4819", bolNo: "BOL-2398", totalAmount: 9100, paidAmount: 6200, outstanding: 2900, dueDate: "Feb 14, 2026", status: "Partial", paymentMethod: "check" },
  { id: "3", date: "Feb 06, 2026", vendor: "Shell Oil", invoiceNo: "INV-4815", bolNo: "BOL-2395", totalAmount: 12300, paidAmount: 0, outstanding: 12300, dueDate: "Feb 13, 2026", status: "Unpaid", paymentMethod: "" },
  { id: "4", date: "Feb 05, 2026", vendor: "ExxonMobil", invoiceNo: "INV-4810", bolNo: "BOL-2390", totalAmount: 7650, paidAmount: 0, outstanding: 7650, dueDate: "Feb 12, 2026", status: "Unpaid", paymentMethod: "" },
  { id: "5", date: "Feb 04, 2026", vendor: "Sunoco LP", invoiceNo: "INV-4805", bolNo: "BOL-2385", totalAmount: 21400, paidAmount: 21400, outstanding: 0, dueDate: "Feb 11, 2026", status: "Paid", paymentMethod: "bank_transfer" },
  { id: "6", date: "Feb 03, 2026", vendor: "Marathon Petroleum", invoiceNo: "INV-4800", bolNo: "BOL-2380", totalAmount: 15200, paidAmount: 12000, outstanding: 3200, dueDate: "Feb 10, 2026", status: "Partial", paymentMethod: "cash" },
];

const statusStyles: Record<string, string> = {
  Paid: "bg-success/10 text-success border-success/20",
  Partial: "bg-warning/10 text-warning border-warning/20",
  Unpaid: "bg-destructive/10 text-destructive border-destructive/20",
};

interface Props {
  vendor: string;
  paymentMethod: string;
  status: string;
  deliveryRef: string;
}

export const PaymentRegisterTable = ({ vendor, paymentMethod, status, deliveryRef }: Props) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [activeInvoice, setActiveInvoice] = useState<InvoiceRow | null>(null);

  const filtered = mockData.filter((r) => {
    if (vendor !== "all") {
      const v = vendor.toLowerCase();
      if (!r.vendor.toLowerCase().includes(v)) return false;
    }
    if (paymentMethod !== "all" && r.paymentMethod !== paymentMethod) return false;
    if (status !== "all" && r.status.toLowerCase() !== status.toLowerCase()) return false;
    if (deliveryRef.trim()) {
      const q = deliveryRef.trim().toLowerCase();
      if (!r.invoiceNo.toLowerCase().includes(q) && !r.bolNo.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const unpaid = filtered.filter((r) => r.status !== "Paid");
    if (selectedIds.size === unpaid.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unpaid.map((r) => r.id)));
    }
  };

  const handleViewDetails = (row: InvoiceRow) => {
    setActiveInvoice(row);
    setDetailsOpen(true);
  };

  const handleRecordPayment = (row: InvoiceRow) => {
    setActiveInvoice(row);
    setRecordOpen(true);
  };

  const handleBatchPay = () => {
    if (selectedIds.size === 0) return;
    const selected = filtered.filter((r) => selectedIds.has(r.id));
    const vendors = new Set(selected.map((r) => r.vendor));
    if (vendors.size > 1) {
      toast.error("Batch pay is only available for invoices from the same vendor.");
      return;
    }
    const totalOutstanding = selected.reduce((s, r) => s + r.outstanding, 0);
    setActiveInvoice({ ...selected[0], invoiceNo: selected.map((r) => r.invoiceNo).join(", "), outstanding: totalOutstanding });
    setRecordOpen(true);
  };

  const unpaidCount = filtered.filter((r) => r.status !== "Paid").length;
  const { paginated, page, totalPages, totalItems, hasPrev, hasNext, prevPage, nextPage } = usePagination(filtered, pageSize);

  return (
    <>
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-4 py-2 mb-3">
          <span className="text-xs text-foreground font-medium">{selectedIds.size} invoice(s) selected</span>
          <Button size="sm" className="text-xs gap-1.5" onClick={handleBatchPay}>
            <CreditCard className="h-3.5 w-3.5" />
            Pay Selected
          </Button>
        </div>
      )}

      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10 text-[10px] h-9">
                <Checkbox checked={selectedIds.size === unpaidCount && unpaidCount > 0} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead className="text-[10px] h-9">Date</TableHead>
              <TableHead className="text-[10px] h-9">Vendor</TableHead>
              <TableHead className="text-[10px] h-9">Invoice # / BOL #</TableHead>
              <TableHead className="text-[10px] h-9 text-right">Total</TableHead>
              <TableHead className="text-[10px] h-9 text-right">Paid</TableHead>
              <TableHead className="text-[10px] h-9 text-right">Outstanding</TableHead>
              <TableHead className="text-[10px] h-9">Due Date</TableHead>
              <TableHead className="text-[10px] h-9">Status</TableHead>
              <TableHead className="text-[10px] h-9 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-xs text-muted-foreground py-8">
                  No invoices match the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30">
                  <TableCell className="py-2">
                    {row.status !== "Paid" && (
                      <Checkbox checked={selectedIds.has(row.id)} onCheckedChange={() => toggleSelect(row.id)} />
                    )}
                  </TableCell>
                  <TableCell className="text-xs py-2">{row.date}</TableCell>
                  <TableCell className="text-xs py-2 font-medium">{row.vendor}</TableCell>
                  <TableCell className="text-xs py-2">
                    <button className="text-primary hover:underline font-medium" onClick={() => handleViewDetails(row)}>
                      {row.invoiceNo}
                    </button>
                    <span className="text-muted-foreground ml-1">/ {row.bolNo}</span>
                  </TableCell>
                  <TableCell className="text-xs py-2 text-right font-medium">${row.totalAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-xs py-2 text-right text-success font-medium">${row.paidAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-xs py-2 text-right font-medium">
                    {row.outstanding > 0 ? (
                      <span className="text-destructive">${row.outstanding.toLocaleString()}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs py-2 text-muted-foreground">{row.dueDate}</TableCell>
                  <TableCell className="text-xs py-2">
                    <Badge variant="outline" className={`text-[10px] py-0 ${statusStyles[row.status]}`}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="View details" onClick={() => handleViewDetails(row)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {row.status !== "Paid" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Record payment" onClick={() => handleRecordPayment(row)}>
                          <CreditCard className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize}
          hasPrev={hasPrev} hasNext={hasNext} onPrev={prevPage} onNext={nextPage}
          onPageSizeChange={(s) => setPageSize(s)}
        />
      </div>

      <PaymentDetailsDrawer
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        invoice={activeInvoice}
        onRecordPayment={() => { setDetailsOpen(false); setRecordOpen(true); }}
      />
      <RecordPaymentDrawer
        open={recordOpen}
        onOpenChange={setRecordOpen}
        prefill={activeInvoice ? { vendor: activeInvoice.vendor, invoiceNo: activeInvoice.invoiceNo, outstanding: activeInvoice.outstanding } : null}
      />
    </>
  );
};
