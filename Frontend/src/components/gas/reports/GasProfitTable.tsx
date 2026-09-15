import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DayRow {
  date: string;
  day: string;
  gallonsSold: number;
  sales: number;
  fuelCost: number;
  grossProfit: number;
  ccFee: number;
  freight: number;
  miscCost: number;
  totalCost: number;
  netProfit: number;
}

interface FuelRow {
  fuelType: string;
  gallonsSold: number;
  avgSalePrice: number;
  avgCostPerGal: number;
  taxPerGal: number;
  marginPerGal: number;
  netProfit: number;
}

interface GasProfitTableProps {
  viewType: "by-day" | "by-fuel";
  dayData: DayRow[];
  fuelData: FuelRow[];
  onRowClick: (rowIndex: number) => void;
}

const fmt = (v: number | undefined, decimals = 2) =>
  (v ?? 0).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const fmtDollar = (v: number) => "$" + fmt(v);

const profitColor = (v: number) =>
  v >= 0 ? "text-emerald-600" : "text-destructive";

export const GasProfitTable = ({ viewType, dayData, fuelData, onRowClick }: GasProfitTableProps) => {
  if (viewType === "by-fuel") {
    const totals = fuelData.reduce(
      (acc, r) => ({
        gallons: acc.gallons + r.gallonsSold,
        profit: acc.profit + r.netProfit,
      }),
      { gallons: 0, profit: 0 }
    );

    return (
      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold">Fuel Type</TableHead>
              <TableHead className="text-xs font-semibold text-right">Gallons Sold</TableHead>
              <TableHead className="text-xs font-semibold text-right">Avg Sale $/Gal</TableHead>
              <TableHead className="text-xs font-semibold text-right">Avg Cost $/Gal</TableHead>
              <TableHead className="text-xs font-semibold text-right">Tax $/Gal</TableHead>
              <TableHead className="text-xs font-semibold text-right">Margin $/Gal</TableHead>
              <TableHead className="text-xs font-semibold text-right">Net Profit $</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fuelData.map((row, i) => (
              <TableRow
                key={row.fuelType}
                className="cursor-pointer hover:bg-muted/30"
                onClick={() => onRowClick(i)}
              >
                <TableCell className="text-xs font-medium">{row.fuelType}</TableCell>
                <TableCell className="text-xs text-right">{fmt(row.gallonsSold, 0)}</TableCell>
                <TableCell className="text-xs text-right">{fmtDollar(row.avgSalePrice)}</TableCell>
                <TableCell className="text-xs text-right">{fmtDollar(row.avgCostPerGal)}</TableCell>
                <TableCell className="text-xs text-right">{fmtDollar(row.taxPerGal)}</TableCell>
                <TableCell className={`text-xs text-right font-medium ${profitColor(row.marginPerGal)}`}>
                  {fmtDollar(row.marginPerGal)}
                </TableCell>
                <TableCell className={`text-xs text-right font-bold ${profitColor(row.netProfit)}`}>
                  {fmtDollar(row.netProfit)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-muted/60 font-bold">
              <TableCell className="text-xs">Total</TableCell>
              <TableCell className="text-xs text-right">{fmt(totals.gallons, 0)}</TableCell>
              <TableCell className="text-xs text-right">—</TableCell>
              <TableCell className="text-xs text-right">—</TableCell>
              <TableCell className="text-xs text-right">—</TableCell>
              <TableCell className="text-xs text-right">—</TableCell>
              <TableCell className={`text-xs text-right ${profitColor(totals.profit)}`}>
                {fmtDollar(totals.profit)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </ScrollArea>
    );
  }

  // By Day view
  const totals = dayData.reduce(
    (acc, r) => ({
      gallons: acc.gallons + r.gallonsSold,
      sales: acc.sales + r.sales,
      fuelCost: acc.fuelCost + r.fuelCost,
      grossProfit: acc.grossProfit + r.grossProfit,
      ccFee: acc.ccFee + r.ccFee,
      freight: acc.freight + r.freight,
      miscCost: acc.miscCost + r.miscCost,
      totalCost: acc.totalCost + r.totalCost,
      netProfit: acc.netProfit + r.netProfit,
    }),
    { gallons: 0, sales: 0, fuelCost: 0, grossProfit: 0, ccFee: 0, freight: 0, miscCost: 0, totalCost: 0, netProfit: 0 }
  );

  return (
    <ScrollArea className="w-full">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs font-semibold">Date</TableHead>
            <TableHead className="text-xs font-semibold">Day</TableHead>
            <TableHead className="text-xs font-semibold text-right">Total Gallons</TableHead>
            <TableHead className="text-xs font-semibold text-right">Total Sales</TableHead>
            <TableHead className="text-xs font-semibold text-right">Fuel Cost</TableHead>
            <TableHead className="text-xs font-semibold text-right">Gross Profit</TableHead>
            <TableHead className="text-xs font-semibold text-right">CC Fee</TableHead>
            <TableHead className="text-xs font-semibold text-right">Freight</TableHead>
            <TableHead className="text-xs font-semibold text-right">Misc Cost</TableHead>
            <TableHead className="text-xs font-semibold text-right">Total Cost</TableHead>
            <TableHead className="text-xs font-semibold text-right">Net Profit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dayData.map((row, i) => (
            <TableRow
              key={row.date}
              className="cursor-pointer hover:bg-muted/30"
              onClick={() => onRowClick(i)}
            >
              <TableCell className="text-xs font-medium">{row.date}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{row.day}</TableCell>
              <TableCell className="text-xs text-right">{fmt(row.gallonsSold, 0)}</TableCell>
              <TableCell className="text-xs text-right">{fmtDollar(row.sales)}</TableCell>
              <TableCell className="text-xs text-right">{fmtDollar(row.fuelCost)}</TableCell>
              <TableCell className={`text-xs text-right font-medium ${profitColor(row.grossProfit)}`}>
                {fmtDollar(row.grossProfit)}
              </TableCell>
              <TableCell className="text-xs text-right">{fmtDollar(row.ccFee)}</TableCell>
              <TableCell className="text-xs text-right">{fmtDollar(row.freight)}</TableCell>
              <TableCell className="text-xs text-right">{fmtDollar(row.miscCost)}</TableCell>
              <TableCell className="text-xs text-right">{fmtDollar(row.totalCost)}</TableCell>
              <TableCell className={`text-xs text-right font-bold ${profitColor(row.netProfit)}`}>
                {fmtDollar(row.netProfit)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="bg-muted/60 font-bold">
            <TableCell className="text-xs">Total</TableCell>
            <TableCell className="text-xs"></TableCell>
            <TableCell className="text-xs text-right">{fmt(totals.gallons, 0)}</TableCell>
            <TableCell className="text-xs text-right">{fmtDollar(totals.sales)}</TableCell>
            <TableCell className="text-xs text-right">{fmtDollar(totals.fuelCost)}</TableCell>
            <TableCell className={`text-xs text-right ${profitColor(totals.grossProfit)}`}>
              {fmtDollar(totals.grossProfit)}
            </TableCell>
            <TableCell className="text-xs text-right">{fmtDollar(totals.ccFee)}</TableCell>
            <TableCell className="text-xs text-right">{fmtDollar(totals.freight)}</TableCell>
            <TableCell className="text-xs text-right">{fmtDollar(totals.miscCost)}</TableCell>
            <TableCell className="text-xs text-right">{fmtDollar(totals.totalCost)}</TableCell>
            <TableCell className={`text-xs text-right ${profitColor(totals.netProfit)}`}>
              {fmtDollar(totals.netProfit)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </ScrollArea>
  );
};
