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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  FileWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ItemPurchaseRow {
  productName: string;
  date: string;
  vendor: string;
  invoiceNumber: string;
  scanCode: string;
  sku: string;
  category: string;
  receivedQty: number;
  unitCost: number;
  extendedCost: number;
  rebate: number|null;
  netCost: number;
  paymentStatus: "Paid" | "Partial" | "Unpaid" | "Unknown";
  /** Previous purchase's unit cost — for spike detection */
  prevUnitCost: number|null;
  /** Previous purchase's vendor — for vendor-change detection */
  prevVendor: string;
  /** Whether this receipt has been invoiced */
  invoiced: boolean;
}

const fmt = (n: number|null) => n===null?"—":
  `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const statusVariant = (s: ItemPurchaseRow["paymentStatus"]) => {
  switch (s) {
    case "Paid":
      return "default" as const;
    case "Partial":
      return "secondary" as const;
    case "Unknown": return "outline" as const;
    case "Unpaid":
      return "destructive" as const;
  }
};

interface Props {
  data: ItemPurchaseRow[];
  costSpikeThreshold: number; // percentage
}

export const SingleItemPurchaseTable = ({
  data,
  costSpikeThreshold,
}: Props) => {
  const totals = data.reduce(
    (acc, r) => ({
      receivedQty: acc.receivedQty + r.receivedQty,
      extendedCost: acc.extendedCost + r.extendedCost,
      rebate: acc.rebate + (r.rebate??0),
      netCost: acc.netCost + r.netCost,
    }),
    { receivedQty: 0, extendedCost: 0, rebate: 0, netCost: 0 }
  );

  return (
    <TooltipProvider>
      <div className="rounded-md border overflow-auto max-h-[480px]">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead className="text-[11px] w-8" />
              <TableHead className="text-[11px]">Product Name</TableHead>
              <TableHead className="text-[11px]">Date</TableHead>
              <TableHead className="text-[11px]">Scan Code</TableHead>
              <TableHead className="text-[11px]">SKU</TableHead>
              <TableHead className="text-[11px]">Category</TableHead>
              <TableHead className="text-[11px]">Vendor</TableHead>
              <TableHead className="text-[11px]">Invoice #</TableHead>
              <TableHead className="text-[11px] text-right">Recv Qty</TableHead>
              <TableHead className="text-[11px] text-right">Unit Cost</TableHead>
              <TableHead className="text-[11px] text-right">Ext. Cost</TableHead>
              <TableHead className="text-[11px] text-right">Rebate $</TableHead>
              <TableHead className="text-[11px] text-right">Net Cost</TableHead>
              <TableHead className="text-[11px] text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{data.length===0&&<TableRow><TableCell colSpan={14}>No approved item purchases found.</TableCell></TableRow>}
            {data.map((row, i) => {
              const flags = getFlags(row, costSpikeThreshold);

              return (
                <TableRow
                  key={i}
                  className={cn(
                    "hover:bg-muted/50",
                    flags.length > 0 && "border-l-2",
                    flags.some((f) => f.type === "cost-spike") &&
                      "border-l-destructive",
                    !flags.some((f) => f.type === "cost-spike") &&
                      flags.some((f) => f.type === "vendor-changed") &&
                      "border-l-[hsl(var(--warning))]",
                    !flags.some((f) => f.type === "cost-spike") &&
                      !flags.some((f) => f.type === "vendor-changed") &&
                      flags.some((f) => f.type === "uninvoiced") &&
                      "border-l-[hsl(var(--warning))]"
                  )}
                >
                  {/* Flags column */}
                  <TableCell className="px-2">
                    <div className="flex items-center gap-0.5">
                      {flags.map((f, fi) => (
                        <Tooltip key={fi}>
                          <TooltipTrigger asChild>{f.icon}</TooltipTrigger>
                          <TooltipContent side="right" className="text-xs">
                            {f.label}
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-medium">{row.productName}</TableCell>
                  <TableCell className="text-xs font-medium">{row.date}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{row.scanCode}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{row.sku}</TableCell>
                  <TableCell className="text-xs">{row.category}</TableCell>
                  <TableCell className="text-xs">{row.vendor}</TableCell>
                  <TableCell className="text-xs font-medium text-primary">
                    {row.invoiceNumber || (
                      <span className="text-muted-foreground italic">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-right">{row.receivedQty}</TableCell>
                  <TableCell className="text-xs text-right font-medium">
                    {fmt(row.unitCost)}
                  </TableCell>
                  <TableCell className="text-xs text-right">{fmt(row.extendedCost)}</TableCell>
                  <TableCell
                    className={cn(
                      "text-xs text-right",
                      row.rebate > 0 && "text-[hsl(var(--success))] font-medium"
                    )}
                  >
                    {row.rebate > 0 ? fmt(row.rebate) : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-right font-medium">
                    {fmt(row.netCost)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={statusVariant(row.paymentStatus)}
                      className="text-[10px] px-2 py-0"
                    >
                      {row.paymentStatus}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={8} className="text-xs font-semibold">
                Total ({data.length} purchases)
              </TableCell>
              <TableCell className="text-xs text-right font-semibold">
                {totals.receivedQty}
              </TableCell>
              <TableCell />
              <TableCell className="text-xs text-right font-semibold">
                {fmt(totals.extendedCost)}
              </TableCell>
              <TableCell className="text-xs text-right font-semibold text-[hsl(var(--success))]">
                —
              </TableCell>
              <TableCell className="text-xs text-right font-semibold">
                {fmt(totals.netCost)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* ── Flag Legend ─────────────────────────────────── */}
      <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <ArrowUpRight className="h-3 w-3 text-destructive" />
          Cost ↑ &gt; {costSpikeThreshold}%
        </span>
        <span className="flex items-center gap-1">
          <RefreshCw className="h-3 w-3 text-[hsl(var(--warning))]" />
          Vendor changed
        </span>
        <span className="flex items-center gap-1">
          <FileWarning className="h-3 w-3 text-[hsl(var(--warning))]" />
          Received but not invoiced
        </span>
      </div>
    </TooltipProvider>
  );
};

/* ── Flag helpers ──────────────────────────────────────── */

interface Flag {
  type: "cost-spike" | "vendor-changed" | "uninvoiced";
  icon: React.ReactNode;
  label: string;
}

function getFlags(row: ItemPurchaseRow, threshold: number): Flag[] {
  const flags: Flag[] = [];

  // Cost spike
  if (row.prevUnitCost!==null && row.prevUnitCost > 0) {
    const pctChange =
      ((row.unitCost - row.prevUnitCost) / row.prevUnitCost) * 100;
    if (pctChange > threshold) {
      flags.push({
        type: "cost-spike",
        icon: (
          <ArrowUpRight className="h-3.5 w-3.5 text-destructive" />
        ),
        label: `Cost ↑ ${pctChange.toFixed(1)}% vs previous (${fmt(row.prevUnitCost)} → ${fmt(row.unitCost)})`,
      });
    }
  }

  // Vendor changed
  if (row.prevVendor && row.vendor !== row.prevVendor) {
    flags.push({
      type: "vendor-changed",
      icon: (
        <RefreshCw className="h-3.5 w-3.5 text-[hsl(var(--warning))]" />
      ),
      label: `Vendor changed: ${row.prevVendor} → ${row.vendor}`,
    });
  }

  // Uninvoiced
  if (!row.invoiced) {
    flags.push({
      type: "uninvoiced",
      icon: (
        <FileWarning className="h-3.5 w-3.5 text-[hsl(var(--warning))]" />
      ),
      label: "Received but not invoiced",
    });
  }

  return flags;
}
