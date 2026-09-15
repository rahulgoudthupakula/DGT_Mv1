import {useProfitData} from './ProfitData';
import { useMemo } from "react";
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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface DayCashFlow {
  date: string;
  sales: number;
  purchases: number;
  netCashFlow: number;
}



const mockAdjustment = 0;

const fmt = (n: number) => n==null?"—": `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export const ProfitPurchaseView = () => {
 const report=useProfitData();const mockData:DayCashFlow[]=report.days;
  const { paginated, page, totalPages, totalItems, pageSize, hasPrev, hasNext, nextPage, prevPage } = usePagination(mockData, 10);

  const totals = useMemo(() => mockData.reduce(
    (acc, row) => ({
      sales: acc.sales + row.sales,
      purchases: acc.purchases + row.purchases,
      netCashFlow: acc.netCashFlow + row.netCashFlow,
    }),
    { sales: 0, purchases: 0, netCashFlow: 0 }
  ), [mockData]);

  const totalProfitAfterAdj = totals.netCashFlow + mockAdjustment;

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[11px]">Date</TableHead>
              <TableHead className="text-[11px] text-right">Net Sales</TableHead>
              <TableHead className="text-[11px] text-right">COGS / Purchase</TableHead>
              <TableHead className="text-[11px] text-right">Gross Profit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((row, i) => (
              <TableRow key={i}>
                <TableCell className="text-xs font-medium">{row.date}</TableCell>
                <TableCell className="text-xs text-right">{fmt(row.sales)}</TableCell>
                <TableCell className="text-xs text-right">{fmt(row.purchases)}</TableCell>
                <TableCell className={cn("text-xs text-right font-medium", row.netCashFlow >= 0 ? "text-[hsl(var(--success))]" : "text-destructive")}>
                  {fmt(row.netCashFlow)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="text-xs font-semibold">Total</TableCell>
              <TableCell className="text-xs text-right font-semibold">{fmt(totals.sales)}</TableCell>
              <TableCell className="text-xs text-right font-semibold">{mockData.some(r=>r.purchases==null)?'—':fmt(totals.purchases)}</TableCell>
              <TableCell className={cn("text-xs text-right font-semibold", totals.netCashFlow >= 0 ? "text-[hsl(var(--success))]" : "text-destructive")}>
                {mockData.some(r=>r.netCashFlow==null)?'—':fmt(totals.netCashFlow)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
        <TablePagination
          page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize}
          hasPrev={hasPrev} hasNext={hasNext} onPrev={prevPage} onNext={nextPage}
        />
      </div>

      {/* Bottom summary */}
      <div className="flex items-center gap-6 rounded-md border px-4 py-3">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Adjustment</p>
          <p className={cn("text-sm font-bold", mockAdjustment < 0 ? "text-destructive" : "text-[hsl(var(--success))]")}>
            —
          </p>
        </div>
        <Separator orientation="vertical" className="h-8" />
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Net Profit</p>
          <p className={cn("text-sm font-bold", totalProfitAfterAdj >= 0 ? "text-[hsl(var(--success))]" : "text-destructive")}>
            {mockData.some(r=>r.netCashFlow==null)?'—':fmt(totalProfitAfterAdj)}
          </p>
        </div>
      </div>
    </div>
  );
};
