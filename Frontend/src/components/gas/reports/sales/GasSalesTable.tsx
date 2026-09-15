import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface DaySalesRow {
  date: string;
  day: string;
  gallonsSold: number;
  sales: number;
  avgPrice: number;
  highPrice: number;
  lowPrice: number;
}

export interface FuelSalesRow {
  fuelType: string;
  gallonsSold: number;
  sales: number;
  avgPrice: number;
  pctOfTotal: number;
}

export interface HourSalesRow {
  hour: string;
  gallonsSold: number;
  sales: number;
  avgPrice: number;
}

interface GasSalesTableProps {
  viewType: "by-day" | "by-fuel" | "by-hour";
  dayData: DaySalesRow[];
  fuelData: FuelSalesRow[];
  hourData: HourSalesRow[];
  onRowClick: (index: number) => void;
}

const fmt = (v: number | undefined, d = 2) =>
  (v ?? 0).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
const dollar = (v: number | undefined) => "$" + fmt(v);

export const GasSalesTable = ({ viewType, dayData, fuelData, hourData, onRowClick }: GasSalesTableProps) => {
  if (viewType === "by-fuel") {
    const totals = fuelData.reduce((a, r) => ({ g: a.g + r.gallonsSold, s: a.s + r.sales }), { g: 0, s: 0 });
    return (
      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold">Fuel Type</TableHead>
              <TableHead className="text-xs font-semibold text-right">Gallons Sold</TableHead>
              <TableHead className="text-xs font-semibold text-right">Sales $</TableHead>
              <TableHead className="text-xs font-semibold text-right">Avg Price / Gal</TableHead>
              <TableHead className="text-xs font-semibold text-right">% of Total Sales</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fuelData.map((r, i) => (
              <TableRow key={r.fuelType} className="cursor-pointer hover:bg-muted/30" onClick={() => onRowClick(i)}>
                <TableCell className="text-xs font-medium">{r.fuelType}</TableCell>
                <TableCell className="text-xs text-right">{fmt(r.gallonsSold, 0)}</TableCell>
                <TableCell className="text-xs text-right">{dollar(r.sales)}</TableCell>
                <TableCell className="text-xs text-right">{dollar(r.avgPrice)}</TableCell>
                <TableCell className="text-xs text-right">{fmt(r.pctOfTotal, 1)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-muted/60 font-bold">
              <TableCell className="text-xs">Total</TableCell>
              <TableCell className="text-xs text-right">{fmt(totals.g, 0)}</TableCell>
              <TableCell className="text-xs text-right">{dollar(totals.s)}</TableCell>
              <TableCell className="text-xs text-right">—</TableCell>
              <TableCell className="text-xs text-right">100.0%</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </ScrollArea>
    );
  }

  if (viewType === "by-hour") {
    const totals = hourData.reduce((a, r) => ({ g: a.g + r.gallonsSold, s: a.s + r.sales }), { g: 0, s: 0 });
    return (
      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold">Hour</TableHead>
              <TableHead className="text-xs font-semibold text-right">Gallons Sold</TableHead>
              <TableHead className="text-xs font-semibold text-right">Sales $</TableHead>
              <TableHead className="text-xs font-semibold text-right">Avg Price / Gal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hourData.map((r, i) => (
              <TableRow key={r.hour} className="cursor-pointer hover:bg-muted/30" onClick={() => onRowClick(i)}>
                <TableCell className="text-xs font-medium">{r.hour}</TableCell>
                <TableCell className="text-xs text-right">{fmt(r.gallonsSold, 0)}</TableCell>
                <TableCell className="text-xs text-right">{dollar(r.sales)}</TableCell>
                <TableCell className="text-xs text-right">{dollar(r.avgPrice)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-muted/60 font-bold">
              <TableCell className="text-xs">Total</TableCell>
              <TableCell className="text-xs text-right">{fmt(totals.g, 0)}</TableCell>
              <TableCell className="text-xs text-right">{dollar(totals.s)}</TableCell>
              <TableCell className="text-xs text-right">—</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </ScrollArea>
    );
  }

  // By Day (default)
  const totals = dayData.reduce(
    (a, r) => ({ g: a.g + r.gallonsSold, s: a.s + r.sales }),
    { g: 0, s: 0 }
  );
  return (
    <ScrollArea className="w-full">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs font-semibold">Date</TableHead>
            <TableHead className="text-xs font-semibold">Day</TableHead>
            <TableHead className="text-xs font-semibold text-right">Gallons Sold</TableHead>
            <TableHead className="text-xs font-semibold text-right">Sales $</TableHead>
            <TableHead className="text-xs font-semibold text-right">Avg Price / Gal</TableHead>
            <TableHead className="text-xs font-semibold text-right">High Price</TableHead>
            <TableHead className="text-xs font-semibold text-right">Low Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dayData.map((r, i) => (
            <TableRow key={r.date} className="cursor-pointer hover:bg-muted/30" onClick={() => onRowClick(i)}>
              <TableCell className="text-xs font-medium">{r.date}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{r.day}</TableCell>
              <TableCell className="text-xs text-right">{fmt(r.gallonsSold, 0)}</TableCell>
              <TableCell className="text-xs text-right">{dollar(r.sales)}</TableCell>
              <TableCell className="text-xs text-right">{dollar(r.avgPrice)}</TableCell>
              <TableCell className="text-xs text-right">{dollar(r.highPrice)}</TableCell>
              <TableCell className="text-xs text-right">{dollar(r.lowPrice)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="bg-muted/60 font-bold">
            <TableCell className="text-xs">Total</TableCell>
            <TableCell className="text-xs"></TableCell>
            <TableCell className="text-xs text-right">{fmt(totals.g, 0)}</TableCell>
            <TableCell className="text-xs text-right">{dollar(totals.s)}</TableCell>
            <TableCell className="text-xs text-right">—</TableCell>
            <TableCell className="text-xs text-right">—</TableCell>
            <TableCell className="text-xs text-right">—</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </ScrollArea>
  );
};
