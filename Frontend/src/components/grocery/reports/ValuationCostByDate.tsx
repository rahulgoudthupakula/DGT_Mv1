import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface DayRow {
  date: string;
  day: string;
  openingCost: number;
  inventoryIn: number;
  inventoryOut: number;
  adjustments: number;
  closingCost: number;
  actualInventory: number;
  variation: number;
}

const mockRows: DayRow[] = [
  { date: "02/01/2025", day: "Sat", openingCost: 12450.00, inventoryIn: 1850.00, inventoryOut: 980.00, adjustments: -45.00, closingCost: 13275.00, actualInventory: 13150.00, variation: -125.00 },
  { date: "02/02/2025", day: "Sun", openingCost: 13275.00, inventoryIn: 0, inventoryOut: 720.00, adjustments: 0, closingCost: 12555.00, actualInventory: 12555.00, variation: 0 },
  { date: "02/03/2025", day: "Mon", openingCost: 12555.00, inventoryIn: 2340.00, inventoryOut: 1100.00, adjustments: -82.50, closingCost: 13712.50, actualInventory: 13680.00, variation: -32.50 },
  { date: "02/04/2025", day: "Tue", openingCost: 13712.50, inventoryIn: 680.00, inventoryOut: 890.00, adjustments: -22.00, closingCost: 13480.50, actualInventory: 13480.50, variation: 0 },
  { date: "02/05/2025", day: "Wed", openingCost: 13480.50, inventoryIn: 1520.00, inventoryOut: 1050.00, adjustments: -55.00, closingCost: 13895.50, actualInventory: 13820.00, variation: -75.50 },
  { date: "02/06/2025", day: "Thu", openingCost: 13895.50, inventoryIn: 950.00, inventoryOut: 870.00, adjustments: 0, closingCost: 13975.50, actualInventory: 13975.50, variation: 0 },
  { date: "02/07/2025", day: "Fri", openingCost: 13975.50, inventoryIn: 3200.00, inventoryOut: 1450.00, adjustments: -30.00, closingCost: 15695.50, actualInventory: 15600.00, variation: -95.50 },
];

export const ValuationCostByDate = () => {
  const totalIn = mockRows.reduce((s, r) => s + r.inventoryIn, 0);
  const totalOut = mockRows.reduce((s, r) => s + r.inventoryOut, 0);
  const totalAdj = mockRows.reduce((s, r) => s + r.adjustments, 0);
  const totalVar = mockRows.reduce((s, r) => s + r.variation, 0);

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="rounded-md border">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-[11px] font-semibold">Date</TableHead>
                    <TableHead className="text-[11px] font-semibold">Day</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Opening Inventory (Cost)</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Inventory In (Cost)</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Inventory Out (Cost)</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Adjustments (Cost)</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Closing Inventory (Cost)</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Actual Inventory (Cost)</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Variation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRows.map((row) => (
                    <TableRow key={row.date} className="hover:bg-muted/30">
                      <TableCell className="text-xs font-medium">{row.date}</TableCell>
                      <TableCell className="text-xs">{row.day}</TableCell>
                      <TableCell className="text-xs text-right">${fmt(row.openingCost)}</TableCell>
                      <TableCell className="text-xs text-right text-[hsl(var(--success))]">${fmt(row.inventoryIn)}</TableCell>
                      <TableCell className="text-xs text-right text-destructive">${fmt(row.inventoryOut)}</TableCell>
                      <TableCell className={`text-xs text-right ${row.adjustments < 0 ? "text-destructive" : ""}`}>
                        {row.adjustments !== 0 ? `$${fmt(row.adjustments)}` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-right font-semibold">${fmt(row.closingCost)}</TableCell>
                      <TableCell className="text-xs text-right">${fmt(row.actualInventory)}</TableCell>
                      <TableCell className={`text-xs text-right font-semibold ${row.variation < 0 ? "text-destructive" : row.variation > 0 ? "text-[hsl(var(--success))]" : ""}`}>
                        {row.variation !== 0 ? `$${fmt(row.variation)}` : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-muted/60 font-semibold">
                    <TableCell className="text-xs" colSpan={2}>Totals</TableCell>
                    <TableCell className="text-xs text-right">${fmt(mockRows[0].openingCost)}</TableCell>
                    <TableCell className="text-xs text-right">${fmt(totalIn)}</TableCell>
                    <TableCell className="text-xs text-right">${fmt(totalOut)}</TableCell>
                    <TableCell className="text-xs text-right">${fmt(totalAdj)}</TableCell>
                    <TableCell className="text-xs text-right font-bold">${fmt(mockRows[mockRows.length - 1].closingCost)}</TableCell>
                    <TableCell className="text-xs text-right font-bold">${fmt(mockRows[mockRows.length - 1].actualInventory)}</TableCell>
                    <TableCell className={`text-xs text-right font-bold ${totalVar < 0 ? "text-destructive" : totalVar > 0 ? "text-[hsl(var(--success))]" : ""}`}>
                      {totalVar !== 0 ? `$${fmt(totalVar)}` : "—"}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};
