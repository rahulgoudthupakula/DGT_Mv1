import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

export interface VatProfitRow {
  vatRate: number;
  gallonsSold: number;
  netSales: number;
  fuelCost: number;
  lossAdj: number;
  grossProfit: number;
  netProfit: number;
  profitPerGal: number;
}

export interface DayProfitRow {
  date: string;
  vatRate: number;
  gallonsSold: number;
  netSales: number;
  fuelCost: number;
  netProfit: number;
  profitPerGal: number;
}

const vatData: VatProfitRow[] = [
  { vatRate: 5, gallonsSold: 8200, netSales: 24600, fuelCost: 20500, lossAdj: -120, grossProfit: 4100, netProfit: 3980, profitPerGal: 0.485 },
  { vatRate: 10, gallonsSold: 52400, netSales: 183400, fuelCost: 149800, lossAdj: -450, grossProfit: 33600, netProfit: 33150, profitPerGal: 0.633 },
  { vatRate: 15, gallonsSold: 28600, netSales: 114400, fuelCost: 97400, lossAdj: -280, grossProfit: 17000, netProfit: 16720, profitPerGal: 0.585 },
  { vatRate: 20, gallonsSold: 18900, netSales: 85050, fuelCost: 75620, lossAdj: -200, grossProfit: 9430, netProfit: 9230, profitPerGal: 0.489 },
];

const dayData: DayProfitRow[] = [
  { date: "2025-06-01", vatRate: 10, gallonsSold: 4520, netSales: 15820, fuelCost: 12920, netProfit: 2900, profitPerGal: 0.642 },
  { date: "2025-06-01", vatRate: 15, gallonsSold: 1280, netSales: 5120, fuelCost: 4360, netProfit: 760, profitPerGal: 0.594 },
  { date: "2025-06-01", vatRate: 20, gallonsSold: 2100, netSales: 9450, fuelCost: 8400, netProfit: 1050, profitPerGal: 0.500 },
  { date: "2025-06-02", vatRate: 10, gallonsSold: 4680, netSales: 16380, fuelCost: 13380, netProfit: 3000, profitPerGal: 0.641 },
  { date: "2025-06-02", vatRate: 15, gallonsSold: 890, netSales: 3560, fuelCost: 3030, netProfit: 530, profitPerGal: 0.596 },
  { date: "2025-06-02", vatRate: 20, gallonsSold: 1950, netSales: 8775, fuelCost: 7800, netProfit: 975, profitPerGal: 0.500 },
  { date: "2025-06-03", vatRate: 10, gallonsSold: 4350, netSales: 15225, fuelCost: 12430, netProfit: 2795, profitPerGal: 0.643 },
  { date: "2025-06-03", vatRate: 15, gallonsSold: 1150, netSales: 4600, fuelCost: 3920, netProfit: 680, profitPerGal: 0.591 },
];

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt3 = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const fmtGal = (n: number) => n.toLocaleString("en-US");

interface Props {
  viewType: string;
  onRowClick: (row: VatProfitRow | DayProfitRow) => void;
}

export const GasProfitVatTable = ({ viewType, onRowClick }: Props) => {
  if (viewType === "by-vat") {
    const totals = vatData.reduce(
      (a, r) => ({
        gallonsSold: a.gallonsSold + r.gallonsSold,
        netSales: a.netSales + r.netSales,
        fuelCost: a.fuelCost + r.fuelCost,
        lossAdj: a.lossAdj + r.lossAdj,
        grossProfit: a.grossProfit + r.grossProfit,
        netProfit: a.netProfit + r.netProfit,
      }),
      { gallonsSold: 0, netSales: 0, fuelCost: 0, lossAdj: 0, grossProfit: 0, netProfit: 0 }
    );

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>VAT Rate (%)</TableHead>
            <TableHead className="text-right">Gallons Sold</TableHead>
            <TableHead className="text-right">Net Sales (Excl. VAT)</TableHead>
            <TableHead className="text-right">Fuel Cost</TableHead>
            <TableHead className="text-right">Loss / Adj</TableHead>
            <TableHead className="text-right">Gross Profit</TableHead>
            <TableHead className="text-right">Net Profit</TableHead>
            <TableHead className="text-right">Profit / Gal</TableHead>
            <TableHead className="text-center w-[60px]">View</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vatData.map((r, i) => (
            <TableRow key={i} className="cursor-pointer hover:bg-muted/50" onClick={() => onRowClick(r)}>
              <TableCell className="font-medium">{r.vatRate}%</TableCell>
              <TableCell className="text-right">{fmtGal(r.gallonsSold)}</TableCell>
              <TableCell className="text-right">${fmt(r.netSales)}</TableCell>
              <TableCell className="text-right">${fmt(r.fuelCost)}</TableCell>
              <TableCell className="text-right text-destructive">${fmt(r.lossAdj)}</TableCell>
              <TableCell className="text-right">${fmt(r.grossProfit)}</TableCell>
              <TableCell className="text-right font-semibold">${fmt(r.netProfit)}</TableCell>
              <TableCell className="text-right">${fmt3(r.profitPerGal)}</TableCell>
              <TableCell className="text-center">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onRowClick(r); }}>
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="font-bold">
            <TableCell>Total</TableCell>
            <TableCell className="text-right">{fmtGal(totals.gallonsSold)}</TableCell>
            <TableCell className="text-right">${fmt(totals.netSales)}</TableCell>
            <TableCell className="text-right">${fmt(totals.fuelCost)}</TableCell>
            <TableCell className="text-right">${fmt(totals.lossAdj)}</TableCell>
            <TableCell className="text-right">${fmt(totals.grossProfit)}</TableCell>
            <TableCell className="text-right">${fmt(totals.netProfit)}</TableCell>
            <TableCell className="text-right">${fmt3(totals.netProfit / totals.gallonsSold)}</TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    );
  }

  // By Day
  const totals = dayData.reduce(
    (a, r) => ({
      gallonsSold: a.gallonsSold + r.gallonsSold,
      netSales: a.netSales + r.netSales,
      fuelCost: a.fuelCost + r.fuelCost,
      netProfit: a.netProfit + r.netProfit,
    }),
    { gallonsSold: 0, netSales: 0, fuelCost: 0, netProfit: 0 }
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>VAT Rate (%)</TableHead>
          <TableHead className="text-right">Gallons Sold</TableHead>
          <TableHead className="text-right">Net Sales (Excl. VAT)</TableHead>
          <TableHead className="text-right">Fuel Cost</TableHead>
          <TableHead className="text-right">Net Profit</TableHead>
          <TableHead className="text-right">Profit / Gal</TableHead>
          <TableHead className="text-center w-[60px]">View</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dayData.map((r, i) => (
          <TableRow key={i} className="cursor-pointer hover:bg-muted/50" onClick={() => onRowClick(r)}>
            <TableCell>{r.date}</TableCell>
            <TableCell className="font-medium">{r.vatRate}%</TableCell>
            <TableCell className="text-right">{fmtGal(r.gallonsSold)}</TableCell>
            <TableCell className="text-right">${fmt(r.netSales)}</TableCell>
            <TableCell className="text-right">${fmt(r.fuelCost)}</TableCell>
            <TableCell className="text-right font-semibold">${fmt(r.netProfit)}</TableCell>
            <TableCell className="text-right">${fmt3(r.profitPerGal)}</TableCell>
            <TableCell className="text-center">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onRowClick(r); }}>
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow className="font-bold">
          <TableCell>Total</TableCell>
          <TableCell />
          <TableCell className="text-right">{fmtGal(totals.gallonsSold)}</TableCell>
          <TableCell className="text-right">${fmt(totals.netSales)}</TableCell>
          <TableCell className="text-right">${fmt(totals.fuelCost)}</TableCell>
          <TableCell className="text-right">${fmt(totals.netProfit)}</TableCell>
          <TableCell className="text-right">${fmt3(totals.netProfit / totals.gallonsSold)}</TableCell>
          <TableCell />
        </TableRow>
      </TableFooter>
    </Table>
  );
};
