import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export interface InventoryCostRow {
  id: number;
  date: string;
  day: string;
  fuelType: string;
  openingGasVolume: number;
  delivery: number;
  adjustment: number;
  sale: number;
  closingGasVolume: number;
  unitPurchasedCost: number;
  runningInventoryValue: number;
}

const allMockData: InventoryCostRow[] = [
  { id: 1, date: "Feb 01", day: "Sat", fuelType: "Regular", openingGasVolume: 12500, delivery: 8200, adjustment: 0, sale: 3950, closingGasVolume: 16750, unitPurchasedCost: 2.81, runningInventoryValue: 46311 },
  { id: 2, date: "Feb 02", day: "Sun", fuelType: "Regular", openingGasVolume: 16750, delivery: 0, adjustment: 0, sale: 2800, closingGasVolume: 13950, unitPurchasedCost: 2.81, runningInventoryValue: 38420 },
  { id: 3, date: "Feb 03", day: "Mon", fuelType: "Regular", openingGasVolume: 13950, delivery: 0, adjustment: -120, sale: 3100, closingGasVolume: 10730, unitPurchasedCost: 2.81, runningInventoryValue: 29553 },
  { id: 4, date: "Feb 04", day: "Tue", fuelType: "Premium", openingGasVolume: 5400, delivery: 4500, adjustment: 0, sale: 1200, closingGasVolume: 8700, unitPurchasedCost: 3.35, runningInventoryValue: 29145 },
  { id: 5, date: "Feb 05", day: "Wed", fuelType: "Premium", openingGasVolume: 8700, delivery: 0, adjustment: 0, sale: 980, closingGasVolume: 7720, unitPurchasedCost: 3.35, runningInventoryValue: 25862 },
  { id: 6, date: "Feb 06", day: "Thu", fuelType: "Diesel", openingGasVolume: 8200, delivery: 0, adjustment: 0, sale: 1450, closingGasVolume: 6750, unitPurchasedCost: 2.95, runningInventoryValue: 19913 },
  { id: 7, date: "Feb 07", day: "Fri", fuelType: "Diesel", openingGasVolume: 6750, delivery: 6000, adjustment: 0, sale: 1800, closingGasVolume: 10950, unitPurchasedCost: 3.02, runningInventoryValue: 33069 },
  { id: 8, date: "Feb 08", day: "Sat", fuelType: "Regular", openingGasVolume: 10730, delivery: 8500, adjustment: 0, sale: 4200, closingGasVolume: 15030, unitPurchasedCost: 2.79, runningInventoryValue: 41934 },
];

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtCost = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const fmtDollar = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

interface Props {
  onRowClick: (row: InventoryCostRow) => void;
  fuelType: string;
}

export const InventoryCostTable = ({ onRowClick, fuelType }: Props) => {
  const filtered = allMockData.filter((row) => {
    if (fuelType !== "all" && row.fuelType.toLowerCase() !== fuelType.toLowerCase()) return false;
    return true;
  });

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
                    <TableHead className="text-[11px] font-semibold">Fuel Type</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Opening Gas Vol.</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Delivery</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Adjustment</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Sale</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Closing Gas Vol.</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Unit Purchased Cost</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right bg-muted/80">Running Inv. Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-xs text-muted-foreground py-8">
                        No records match the selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((row) => (
                      <TableRow key={row.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => onRowClick(row)}>
                        <TableCell className="text-xs">{row.date}</TableCell>
                        <TableCell className="text-xs">{row.day}</TableCell>
                        <TableCell className="text-xs">{row.fuelType}</TableCell>
                        <TableCell className="text-xs text-right">{fmt(row.openingGasVolume)}</TableCell>
                        <TableCell className="text-xs text-right">{row.delivery > 0 ? fmt(row.delivery) : "—"}</TableCell>
                        <TableCell className="text-xs text-right">
                          {row.adjustment !== 0 ? (
                            <span className={row.adjustment < 0 ? "text-destructive" : "text-primary"}>{row.adjustment > 0 ? "+" : ""}{fmt(row.adjustment)}</span>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-right">{row.sale > 0 ? fmt(row.sale) : "—"}</TableCell>
                        <TableCell className="text-xs text-right font-medium">{fmt(row.closingGasVolume)}</TableCell>
                        <TableCell className="text-xs text-right">{fmtCost(row.unitPurchasedCost)}</TableCell>
                        <TableCell className="text-xs text-right font-semibold bg-muted/30">{fmtDollar(row.runningInventoryValue)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};
