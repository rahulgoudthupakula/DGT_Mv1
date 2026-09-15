import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export interface BalanceRow {
  id: number;
  tenderType: "Cash" | "Card";
  openingBalance: number;
  gasSalesInflow: number;
  refundsAdjustments: number;
  depositsSettlements: number;
  expectedClosing: number;
  actualClosing: number | null;
  variance: number;
  status: "Balanced" | "Pending Settlement" | "Variance";
}

const mockData: BalanceRow[] = [
  { id: 1, tenderType: "Cash", openingBalance: 4200, gasSalesInflow: 18540, refundsAdjustments: -120, depositsSettlements: 17800, expectedClosing: 4820, actualClosing: 4780, variance: -40, status: "Variance" },
  { id: 2, tenderType: "Card", openingBalance: 8250, gasSalesInflow: 29780, refundsAdjustments: -85, depositsSettlements: 30090, expectedClosing: 7855, actualClosing: null, variance: 0, status: "Pending Settlement" },
];

const fmt = (n: number | null) => {
  if (n === null) return "—";
  const abs = Math.abs(n);
  const str = "$" + abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `(${str})` : str;
};

const statusStyle = (s: BalanceRow["status"]) => {
  switch (s) {
    case "Balanced": return { variant: "default" as const, className: "bg-[hsl(142,71%,45%)] text-white border-0 text-[10px] px-1.5 py-0" };
    case "Pending Settlement": return { variant: "secondary" as const, className: "bg-[hsl(45,93%,47%)]/15 text-[hsl(45,93%,47%)] border-0 text-[10px] px-1.5 py-0" };
    case "Variance": return { variant: "destructive" as const, className: "text-[10px] px-1.5 py-0" };
  }
};

interface Props {
  onRowClick: (row: BalanceRow) => void;
}

export const CashCardBalanceTable = ({ onRowClick }: Props) => {
  const totals = mockData.reduce(
    (acc, r) => ({
      opening: acc.opening + r.openingBalance,
      inflow: acc.inflow + r.gasSalesInflow,
      refunds: acc.refunds + r.refundsAdjustments,
      deposits: acc.deposits + r.depositsSettlements,
      expected: acc.expected + r.expectedClosing,
      actual: acc.actual + (r.actualClosing ?? 0),
      variance: acc.variance + r.variance,
    }),
    { opening: 0, inflow: 0, refunds: 0, deposits: 0, expected: 0, actual: 0, variance: 0 }
  );

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="rounded-md border">
          <ScrollArea className="w-full whitespace-nowrap">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-[11px] font-semibold">Tender Type</TableHead>
                  <TableHead className="text-[11px] font-semibold text-right">Opening Balance</TableHead>
                  <TableHead className="text-[11px] font-semibold text-right">Gas Sales Inflow</TableHead>
                  <TableHead className="text-[11px] font-semibold text-right">Refunds / Adj.</TableHead>
                  <TableHead className="text-[11px] font-semibold text-right">Deposits / Settlements</TableHead>
                  <TableHead className="text-[11px] font-semibold text-right">Expected Closing</TableHead>
                  <TableHead className="text-[11px] font-semibold text-right">Actual Closing</TableHead>
                  <TableHead className="text-[11px] font-semibold text-right">Variance</TableHead>
                  <TableHead className="text-[11px] font-semibold">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockData.map((row) => {
                  const st = statusStyle(row.status);
                  return (
                    <TableRow key={row.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => onRowClick(row)}>
                      <TableCell className="text-xs font-medium">{row.tenderType}</TableCell>
                      <TableCell className="text-xs text-right">{fmt(row.openingBalance)}</TableCell>
                      <TableCell className="text-xs text-right">{fmt(row.gasSalesInflow)}</TableCell>
                      <TableCell className="text-xs text-right">{fmt(row.refundsAdjustments)}</TableCell>
                      <TableCell className="text-xs text-right">{fmt(row.depositsSettlements)}</TableCell>
                      <TableCell className="text-xs text-right font-semibold">{fmt(row.expectedClosing)}</TableCell>
                      <TableCell className="text-xs text-right">{fmt(row.actualClosing)}</TableCell>
                      <TableCell className={`text-xs text-right font-semibold ${row.variance !== 0 ? "text-destructive" : ""}`}>{fmt(row.variance)}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant={st.variant} className={st.className}>{row.status}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); onRowClick(row); }}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted/60 font-semibold">
                  <TableCell className="text-xs font-bold">Totals</TableCell>
                  <TableCell className="text-xs text-right font-bold">{fmt(totals.opening)}</TableCell>
                  <TableCell className="text-xs text-right font-bold">{fmt(totals.inflow)}</TableCell>
                  <TableCell className="text-xs text-right font-bold">{fmt(totals.refunds)}</TableCell>
                  <TableCell className="text-xs text-right font-bold">{fmt(totals.deposits)}</TableCell>
                  <TableCell className="text-xs text-right font-bold">{fmt(totals.expected)}</TableCell>
                  <TableCell className="text-xs text-right font-bold">{fmt(totals.actual)}</TableCell>
                  <TableCell className={`text-xs text-right font-bold ${totals.variance !== 0 ? "text-destructive" : ""}`}>{fmt(totals.variance)}</TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableFooter>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};
