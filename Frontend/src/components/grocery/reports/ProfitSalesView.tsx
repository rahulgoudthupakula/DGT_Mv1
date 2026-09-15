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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/* ── Category keys used as dynamic columns ── */


type Category = string;

interface DayProfit {
  date: string;
  day: string;
  categories: Record<Category, number>;
  total: number;
  totalTax: number;
}



const mockAdjustment = 0;

const fmt = (n: number) => n==null?"—":
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const ProfitSalesView = () => {
 const report=useProfitData();const mockData:DayProfit[]=report.days;const CATEGORIES:string[]=report.categoryNames;
  const { paginated, page, totalPages, totalItems, pageSize, hasPrev, hasNext, nextPage, prevPage } = usePagination(mockData, 10);

  /* ── Totals (always over full dataset) ── */
  const totals = useMemo(() => {
    const catTotals = {} as Record<Category, number>;
    CATEGORIES.forEach((c) => (catTotals[c] = 0));
    let total = 0;
    let totalTax = 0;

    mockData.forEach((row) => {
      CATEGORIES.forEach((c) => (catTotals[c] = catTotals[c]==null||row.categories[c]===null?null:catTotals[c]+(row.categories[c]??0)));
      total += row.total;
      totalTax += row.totalTax;
    });
    return { catTotals, total, totalTax };
  }, [mockData]);

  const totalProfitAfterAdj = totals.total + mockAdjustment;

  return (
    <div className="space-y-4">
      {/* Scrollable Table */}
      <div className="rounded-md border">
        <ScrollArea className="w-full whitespace-nowrap">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow className="bg-muted/50">
                <TableHead className="text-[11px] font-semibold">Date</TableHead>
                <TableHead className="text-[11px] font-semibold">Day</TableHead>
                {CATEGORIES.map((cat) => (
                  <TableHead key={cat} className="text-[11px] font-semibold text-right">
                    {cat}
                  </TableHead>
                ))}
                <TableHead className="text-[11px] font-semibold text-right">Total</TableHead>
                <TableHead className="text-[11px] font-semibold text-right">Total Tax</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((row, i) => (
                <TableRow key={i} className="hover:bg-muted/30">
                  <TableCell className="text-xs">{row.date}</TableCell>
                  <TableCell className="text-xs font-medium">{row.day}</TableCell>
                  {CATEGORIES.map((cat) => (
                    <TableCell key={cat} className="text-xs text-right">
                      ${fmt(row.categories[cat])}
                    </TableCell>
                  ))}
                  <TableCell className="text-xs text-right font-semibold">
                    ${fmt(row.total)}
                  </TableCell>
                  <TableCell className="text-xs text-right font-medium text-muted-foreground">
                    ${fmt(row.totalTax)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-muted/60 font-semibold">
                <TableCell className="text-xs" colSpan={2}>
                  Total Profit
                </TableCell>
                {CATEGORIES.map((cat) => (
                  <TableCell key={cat} className="text-xs text-right">
                    ${fmt(totals.catTotals[cat])}
                  </TableCell>
                ))}
                <TableCell className="text-xs text-right font-bold">
                  ${mockData.some(r=>r.total==null)?'—':fmt(totals.total)}
                </TableCell>
                <TableCell className="text-xs text-right font-bold">
                  ${fmt(totals.totalTax)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
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
            $—
          </p>
        </div>
        <Separator orientation="vertical" className="h-8" />
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Net Profit</p>
          <p className="text-sm font-bold">${mockData.some(r=>r.total==null)?'—':fmt(totalProfitAfterAdj)}</p>
        </div>
      </div>
    </div>
  );
};