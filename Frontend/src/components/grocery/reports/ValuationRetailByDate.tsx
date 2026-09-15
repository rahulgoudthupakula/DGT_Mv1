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
  openingRetail: number;
  inventoryIn: number;
  inventoryOut: number;
  adjustments: number;
  closingRetail: number;
  actualInventory: number;
  variation: number;
}

const mockRows: DayRow[] = [
  { date: "02/01/2025", day: "Sat", openingRetail: 18675.00, inventoryIn: 2775.00, inventoryOut: 1470.00, adjustments: -67.50, closingRetail: 19912.50, actualInventory: 19750.00, variation: -162.50 },
  { date: "02/02/2025", day: "Sun", openingRetail: 19912.50, inventoryIn: 0, inventoryOut: 1080.00, adjustments: 0, closingRetail: 18832.50, actualInventory: 18832.50, variation: 0 },
  { date: "02/03/2025", day: "Mon", openingRetail: 18832.50, inventoryIn: 3510.00, inventoryOut: 1650.00, adjustments: -123.75, closingRetail: 20568.75, actualInventory: 20520.00, variation: -48.75 },
  { date: "02/04/2025", day: "Tue", openingRetail: 20568.75, inventoryIn: 1020.00, inventoryOut: 1335.00, adjustments: -33.00, closingRetail: 20220.75, actualInventory: 20220.75, variation: 0 },
  { date: "02/05/2025", day: "Wed", openingRetail: 20220.75, inventoryIn: 2280.00, inventoryOut: 1575.00, adjustments: -82.50, closingRetail: 20843.25, actualInventory: 20730.00, variation: -113.25 },
  { date: "02/06/2025", day: "Thu", openingRetail: 20843.25, inventoryIn: 1425.00, inventoryOut: 1305.00, adjustments: 0, closingRetail: 20963.25, actualInventory: 20963.25, variation: 0 },
  { date: "02/07/2025", day: "Fri", openingRetail: 20963.25, inventoryIn: 4800.00, inventoryOut: 2175.00, adjustments: -45.00, closingRetail: 23543.25, actualInventory: 23400.00, variation: -143.25 },
];

export const ValuationRetailByDate = () => {
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
                    <TableHead className="text-[11px] font-semibold text-right">Opening Inventory (Retail)</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Inventory In (Retail)</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Inventory Out (Retail)</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Adjustments (Retail)</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Closing Inventory (Retail)</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Actual Inventory (Retail)</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Variation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRows.map((row) => (
                    <TableRow key={row.date} className="hover:bg-muted/30">
                      <TableCell className="text-xs font-medium">{row.date}</TableCell>
                      <TableCell className="text-xs">{row.day}</TableCell>
                      <TableCell className="text-xs text-right">${fmt(row.openingRetail)}</TableCell>
                      <TableCell className="text-xs text-right text-[hsl(var(--success))]">${fmt(row.inventoryIn)}</TableCell>
                      <TableCell className="text-xs text-right text-destructive">${fmt(row.inventoryOut)}</TableCell>
                      <TableCell className={`text-xs text-right ${row.adjustments < 0 ? "text-destructive" : ""}`}>
                        {row.adjustments !== 0 ? `$${fmt(row.adjustments)}` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-right font-semibold">${fmt(row.closingRetail)}</TableCell>
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
                    <TableCell className="text-xs text-right">${fmt(mockRows[0].openingRetail)}</TableCell>
                    <TableCell className="text-xs text-right">${fmt(totalIn)}</TableCell>
                    <TableCell className="text-xs text-right">${fmt(totalOut)}</TableCell>
                    <TableCell className="text-xs text-right">${fmt(totalAdj)}</TableCell>
                    <TableCell className="text-xs text-right font-bold">${fmt(mockRows[mockRows.length - 1].closingRetail)}</TableCell>
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
