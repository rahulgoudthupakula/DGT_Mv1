import { useState } from "react";
import { useAppNavigation } from "@/contexts/NavigationContext";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight, CreditCard, FileText, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PurchaseInvoice {
  id:string;
  paidAmount:number|null;
  paymentStatus:"Paid"|"Partial"|"Unpaid"|"Unknown";
  discount:number;
  date: string;
  day: string;
  invoiceNumber: string;
  vendor: string;
  purchaseAmount: number;
  invoiceAmount: number;
  expenses: number;
  prepaidTax: number;
  rebateAmount: number | null;
  pendingAmount: number | null;
  cash: number | null;
  eft: number | null;
  check: number | null;
  bank: number | null;
  netPurchase: number;
  paymentDueDate: string;
}

const fmt = (n: number | null) => n===null?"—":
  `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

type PaymentStatus = "Paid" | "Partial" | "Unpaid" | "Unknown";

const getPaymentStatus = (row: PurchaseInvoice) => row.paymentStatus;

const statusVariant = (status: PaymentStatus) => {
  switch (status) {
    case "Paid":
      return "default" as const;
    case "Partial":
      return "secondary" as const;
    case "Unknown":
      return "outline" as const;
    case "Unpaid":
      return "destructive" as const;
  }
};

interface Props {
  data: PurchaseInvoice[];
}

export const PurchaseInvoiceSummaryTable = ({ data }: Props) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const { paginated, page, totalPages, totalItems, pageSize, hasPrev, hasNext, nextPage, prevPage } = usePagination(data, 10);

  const toggleRow = (index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const totals = data.reduce(
    (acc, row) => {
      const paidAmount = row.paidAmount;
      return {
        invoiceTotal: acc.invoiceTotal + row.invoiceAmount,
        paidAmount: acc.paidAmount + (paidAmount??0),
        pendingAmount: acc.pendingAmount + (row.pendingAmount??0),
      };
    },
    { invoiceTotal: 0, paidAmount: 0, pendingAmount: 0 }
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>
            <TableHead className="text-[11px] w-8" />
            <TableHead className="text-[11px]">Date</TableHead>
            <TableHead className="text-[11px]">Day</TableHead>
            <TableHead className="text-[11px]">Invoice #</TableHead>
            <TableHead className="text-[11px]">Vendor</TableHead>
            <TableHead className="text-[11px] text-right">Invoice Total</TableHead>
            <TableHead className="text-[11px] text-right">Paid Amount</TableHead>
            <TableHead className="text-[11px] text-right">Pending Amount</TableHead>
            <TableHead className="text-[11px] text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{data.length===0&&<TableRow><TableCell colSpan={9}>No approved invoices found.</TableCell></TableRow>}
          {paginated.map((row, i) => {
            const globalIndex = (page - 1) * pageSize + i;
            const status = getPaymentStatus(row);
            const paidAmount = row.paidAmount;
            const isOpen = expandedRows.has(globalIndex);

            return (
              <Collapsible key={globalIndex} open={isOpen} onOpenChange={() => toggleRow(globalIndex)} asChild>
                <>
                  <CollapsibleTrigger asChild>
                    <TableRow className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="px-2">
                        <ChevronRight
                          className={cn(
                            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                            isOpen && "rotate-90"
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-xs font-medium">{row.date}</TableCell>
                      <TableCell className="text-xs">{row.day}</TableCell>
                      <TableCell className="text-xs font-medium text-primary">{row.invoiceNumber}</TableCell>
                      <TableCell className="text-xs">{row.vendor}</TableCell>
                      <TableCell className="text-xs text-right font-medium">{fmt(row.invoiceAmount)}</TableCell>
                      <TableCell className="text-xs text-right">{fmt(paidAmount)}</TableCell>
                      <TableCell
                        className={cn(
                          "text-xs text-right font-medium",
                          (row.pendingAmount??0) > 0 ? "text-[hsl(var(--warning))]" : "text-[hsl(var(--success))]"
                        )}
                      >
                        {fmt(row.pendingAmount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={statusVariant(status)} className="text-[10px] px-2 py-0">
                          {status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </CollapsibleTrigger>

                  <CollapsibleContent asChild>
                    <TableRow className="bg-muted/20 hover:bg-muted/30">
                      <TableCell colSpan={9} className="p-0">
                        <ExpandedDetails row={row} paidAmount={paidAmount} />
                      </TableCell>
                    </TableRow>
                  </CollapsibleContent>
                </>
              </Collapsible>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={5} className="text-xs font-semibold">
              Total ({data.length} invoices)
            </TableCell>
            <TableCell className="text-xs text-right font-semibold">{fmt(totals.invoiceTotal)}</TableCell>
            <TableCell className="text-xs text-right font-semibold">{data.some(r=>r.paidAmount===null)?'—':fmt(totals.paidAmount)}</TableCell>
            <TableCell
              className={cn(
                "text-xs text-right font-semibold",
                totals.pendingAmount > 0 ? "text-[hsl(var(--warning))]" : "text-[hsl(var(--success))]"
              )}
            >
              {data.some(r=>r.pendingAmount===null)?'—':fmt(totals.pendingAmount)}
            </TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
      <TablePagination
        page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize}
        hasPrev={hasPrev} hasNext={hasNext} onPrev={prevPage} onNext={nextPage}
      />
    </div>
  );
};

/* ── Expanded details ─────────────────────────────────────── */

const LineItem = ({
  label,
  value,
  prefix = "",
  highlight,
}: {
  label: string;
  value: number|null;
  prefix?: string;
  highlight?: "success" | "warning" | "destructive";
}) => (
  <div className="flex justify-between text-xs py-0.5">
    <span className="text-muted-foreground">
      {prefix} {label}
    </span>
    <span
      className={cn(
        "font-medium",
        highlight === "success" && "text-[hsl(var(--success))]",
        highlight === "warning" && "text-[hsl(var(--warning))]",
        highlight === "destructive" && "text-destructive"
      )}
    >
      {fmt(value)}
    </span>
  </div>
);

const ExpandedDetails = ({
  row,
  paidAmount,
}: {
  row: PurchaseInvoice;
  paidAmount: number|null;
}) => {
  const { navigateTo } = useAppNavigation();

  return (
    <div className="grid grid-cols-3 gap-6 px-6 py-4">
      {/* Section A: Purchase Breakdown */}
      <div className="space-y-1">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Purchase Breakdown
        </h4>
        <LineItem label="Purchase Amount" value={row.purchaseAmount} />
        <LineItem label="Expenses" value={row.expenses} prefix="+" />
        <LineItem label="Prepaid Tax" value={row.prepaidTax} prefix="+" />
        <LineItem label="Invoice Discount" value={row.discount} prefix="−" />
        <LineItem label="Rebates" value={row.rebateAmount} prefix="−" highlight="success" />
        <Separator className="my-1.5" />
        <div className="flex justify-between text-xs font-semibold pt-0.5">
          <span>Invoice Amount</span>
          <span>{fmt(row.invoiceAmount)}</span>
        </div>
      </div>

      {/* Section B: Payment Breakdown */}
      <div className="space-y-1">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Payment Breakdown
        </h4>
        <LineItem label="Cash" value={row.cash} />
        <LineItem label="EFT" value={row.eft} />
        <LineItem label="Check" value={row.check} />
        <LineItem label="Bank" value={row.bank} />
        <Separator className="my-1.5" />
        <div className="flex justify-between text-xs font-semibold pt-0.5">
          <span>Total Paid</span>
          <span>{fmt(paidAmount)}</span>
        </div>
      </div>

      {/* Section C: Status & Actions */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Status & Actions
        </h4>
        <div className="flex justify-between text-xs py-0.5">
          <span className="text-muted-foreground">Pending Amount</span>
          <span
            className={cn(
              "font-semibold",
              (row.pendingAmount??0) > 0 ? "text-[hsl(var(--warning))]" : "text-[hsl(var(--success))]"
            )}
          >
            {fmt(row.pendingAmount)}
          </span>
        </div>
        <div className="flex justify-between text-xs py-0.5">
          <span className="text-muted-foreground">Due Date</span>
          <span className="font-medium">{row.paymentDueDate}</span>
        </div>
        <Separator className="my-1.5" />
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] gap-1"
            disabled title="Invoice payment recording is not connected"
          >
            <CreditCard className="h-3 w-3" />
            Record Payment
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] gap-1"
            onClick={() => navigateTo("Grocery", "Edit & view invoices", "View invoice", {invoiceId:row.id})}
          >
            <FileText className="h-3 w-3" />
            View Invoice
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] gap-1"
            onClick={() =>
              navigateTo("Price Book", "Vendor management", "vendor-profile", {
                vendorName: row.vendor,
              })
            }
          >
            <ExternalLink className="h-3 w-3" />
            Go to Vendor
          </Button>
        </div>
      </div>
    </div>
  );
};
