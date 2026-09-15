import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/ui/table-pagination";

const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const entries = [
  { date: "Feb 15, 2026", runId: "PR-2026-04", expense: 5140.77, taxesPayable: 1214.69, bankOutflow: 3356.08, links: ["Bank Ledger"] },
  { date: "Feb 10, 2026", runId: "TAX-2026-02", expense: 0, taxesPayable: -3671.80, bankOutflow: 3671.80, links: ["Bank Ledger", "Tax Payment"] },
  { date: "Jan 31, 2026", runId: "PR-2026-03", expense: 5080.50, taxesPayable: 1198.40, bankOutflow: 3312.10, links: ["Bank Ledger"] },
  { date: "Jan 15, 2026", runId: "PR-2026-02", expense: 5120.00, taxesPayable: 1208.00, bankOutflow: 3342.00, links: ["Bank Ledger"] },
];

export const PayrollLedger = () => {
  const [pageSize, setPageSize] = useState(10);
  const { paginated, page, totalPages, totalItems, hasPrev, hasNext, prevPage, nextPage } = usePagination(entries, pageSize);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Payroll Ledger</h1>

      <Card className="border-dashboard-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Payroll Run ID</TableHead>
                <TableHead className="text-right">Payroll Expense</TableHead>
                <TableHead className="text-right">Taxes Payable</TableHead>
                <TableHead className="text-right">Bank Outflow</TableHead>
                <TableHead>Links</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((e) => (
                <TableRow key={e.runId}>
                  <TableCell>{e.date}</TableCell>
                  <TableCell className="font-mono text-sm">{e.runId}</TableCell>
                  <TableCell className="text-right font-mono">{e.expense > 0 ? fmt(e.expense) : "—"}</TableCell>
                  <TableCell className={`text-right font-mono ${e.taxesPayable < 0 ? "text-emerald-600" : ""}`}>
                    {e.taxesPayable !== 0 ? fmt(e.taxesPayable) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-destructive">{fmt(e.bankOutflow)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {e.links.map((l) => (
                        <Button key={l} variant="ghost" size="sm" className="h-6 text-[10px] text-primary">
                          <ExternalLink className="w-3 h-3 mr-1" />{l}
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize}
            hasPrev={hasPrev} hasNext={hasNext} onPrev={prevPage} onNext={nextPage}
            onPageSizeChange={(s) => setPageSize(s)}
          />
        </CardContent>
      </Card>
    </div>
  );
};
