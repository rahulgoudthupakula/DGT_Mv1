import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export interface PurchaseLogRow {
  id: string;
  date: string;
  day: string;
  vendor: string;
  tankVolume: number;
  purchasedVolume: number;
  purchasedCost: number;
  weightedCost: number;
  freightCost: number;
  miscCostVat: number;
  amount: number;
  paidAmount: number;
  outstanding: number;
  status: "Paid" | "Partial" | "Unpaid" | "Uninvoiced";
}

const allMockData: PurchaseLogRow[] = [
  { id: "1", date: "Feb 10, 2025", day: "Mon", vendor: "Marathon Petroleum / Regular", tankVolume: 12400, purchasedVolume: 8200, purchasedCost: 21156, weightedCost: 2.580, freightCost: 120, miscCostVat: 30, amount: 21306, paidAmount: 21306, outstanding: 0, status: "Paid" },
  { id: "2", date: "Feb 10, 2025", day: "Mon", vendor: "Marathon Petroleum / Premium", tankVolume: 8500, purchasedVolume: 4100, purchasedCost: 12710, weightedCost: 3.100, freightCost: 95, miscCostVat: 25, amount: 12830, paidAmount: 12830, outstanding: 0, status: "Paid" },
  { id: "3", date: "Feb 9, 2025", day: "Sun", vendor: "Shell Supply / Diesel", tankVolume: 15200, purchasedVolume: 9500, purchasedCost: 26600, weightedCost: 2.800, freightCost: 150, miscCostVat: 40, amount: 26790, paidAmount: 0, outstanding: 26790, status: "Uninvoiced" },
  { id: "4", date: "Feb 8, 2025", day: "Sat", vendor: "Marathon Petroleum / Regular", tankVolume: 11800, purchasedVolume: 8300, purchasedCost: 21414, weightedCost: 2.580, freightCost: 120, miscCostVat: 30, amount: 21564, paidAmount: 15000, outstanding: 6564, status: "Partial" },
  { id: "5", date: "Feb 8, 2025", day: "Sat", vendor: "BP Products / Plus", tankVolume: 6200, purchasedVolume: 3800, purchasedCost: 10830, weightedCost: 2.850, freightCost: 85, miscCostVat: 20, amount: 10935, paidAmount: 0, outstanding: 10935, status: "Unpaid" },
  { id: "6", date: "Feb 7, 2025", day: "Fri", vendor: "Shell Supply / Diesel", tankVolume: 14900, purchasedVolume: 9200, purchasedCost: 25760, weightedCost: 2.800, freightCost: 140, miscCostVat: 35, amount: 25935, paidAmount: 25935, outstanding: 0, status: "Paid" },
];

const fmt = (v: number, d = 0) => v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

const statusVariant = (s: string) => {
  if (s === "Paid") return "default";
  if (s === "Partial") return "secondary";
  if (s === "Unpaid") return "destructive";
  return "outline";
};

interface Props {
  onRowClick: (row: PurchaseLogRow) => void;
  vendor: string;
  fuelType: string;
  search: string;
}

export const PurchaseLogTable = ({ onRowClick, vendor, fuelType, search }: Props) => {
  const filtered = allMockData.filter((row) => {
    if (vendor !== "all") {
      const v = vendor.toLowerCase();
      if (!row.vendor.toLowerCase().includes(v)) return false;
    }
    if (fuelType !== "all" && !row.vendor.toLowerCase().includes(fuelType.toLowerCase())) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!row.vendor.toLowerCase().includes(q) && !row.date.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totals = {
    tankVolume: filtered.reduce((s, r) => s + r.tankVolume, 0),
    purchasedVolume: filtered.reduce((s, r) => s + r.purchasedVolume, 0),
    purchasedCost: filtered.reduce((s, r) => s + r.purchasedCost, 0),
    freightCost: filtered.reduce((s, r) => s + r.freightCost, 0),
    miscCostVat: filtered.reduce((s, r) => s + r.miscCostVat, 0),
    amount: filtered.reduce((s, r) => s + r.amount, 0),
    paidAmount: filtered.reduce((s, r) => s + r.paidAmount, 0),
    outstanding: filtered.reduce((s, r) => s + r.outstanding, 0),
  };
  const weightedAvg = totals.purchasedVolume > 0 ? totals.purchasedCost / totals.purchasedVolume : 0;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs">Date</TableHead>
            <TableHead className="text-xs">Day</TableHead>
            <TableHead className="text-xs">Vendor / Jobber / Fuel</TableHead>
            <TableHead className="text-xs text-right">Tank Vol</TableHead>
            <TableHead className="text-xs text-right">Purch Vol</TableHead>
            <TableHead className="text-xs text-right">Purch Cost</TableHead>
            <TableHead className="text-xs text-right">Wtd Cost</TableHead>
            <TableHead className="text-xs text-right">Freight</TableHead>
            <TableHead className="text-xs text-right">Misc/VAT</TableHead>
            <TableHead className="text-xs text-right">Amount</TableHead>
            <TableHead className="text-xs text-right">Paid</TableHead>
            <TableHead className="text-xs text-right">Outstanding</TableHead>
            <TableHead className="text-xs">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={13} className="text-center text-xs text-muted-foreground py-8">
                No records match the selected filters.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((row) => (
              <TableRow key={row.id} className="cursor-pointer hover:bg-muted/30" onClick={() => onRowClick(row)}>
                <TableCell className="text-xs text-foreground">{row.date}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{row.day}</TableCell>
                <TableCell className="text-xs text-foreground font-medium">{row.vendor}</TableCell>
                <TableCell className="text-xs text-right text-foreground">{fmt(row.tankVolume)}</TableCell>
                <TableCell className="text-xs text-right font-medium text-foreground">{fmt(row.purchasedVolume)}</TableCell>
                <TableCell className="text-xs text-right font-medium text-foreground">${fmt(row.purchasedCost)}</TableCell>
                <TableCell className="text-xs text-right text-foreground">${row.weightedCost.toFixed(3)}</TableCell>
                <TableCell className="text-xs text-right text-foreground">${fmt(row.freightCost)}</TableCell>
                <TableCell className="text-xs text-right text-foreground">${fmt(row.miscCostVat)}</TableCell>
                <TableCell className="text-xs text-right font-medium text-foreground">${fmt(row.amount)}</TableCell>
                <TableCell className="text-xs text-right text-foreground">${fmt(row.paidAmount)}</TableCell>
                <TableCell className="text-xs text-right font-medium text-foreground">${fmt(row.outstanding)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(row.status)} className="text-[10px]">{row.status}</Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        <TableFooter>
          <TableRow className="bg-muted/60 font-semibold">
            <TableCell className="text-xs" colSpan={3}>Totals</TableCell>
            <TableCell className="text-xs text-right">{fmt(totals.tankVolume)}</TableCell>
            <TableCell className="text-xs text-right">{fmt(totals.purchasedVolume)}</TableCell>
            <TableCell className="text-xs text-right">${fmt(totals.purchasedCost)}</TableCell>
            <TableCell className="text-xs text-right">${weightedAvg.toFixed(3)}</TableCell>
            <TableCell className="text-xs text-right">${fmt(totals.freightCost)}</TableCell>
            <TableCell className="text-xs text-right">${fmt(totals.miscCostVat)}</TableCell>
            <TableCell className="text-xs text-right">${fmt(totals.amount)}</TableCell>
            <TableCell className="text-xs text-right">${fmt(totals.paidAmount)}</TableCell>
            <TableCell className="text-xs text-right">${fmt(totals.outstanding)}</TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};
