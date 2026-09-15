import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface DayRow {
  date: string;
  day: string;
  fuelType: string;
  gallonsSold: number;
  grossSales: number;
  vatRate: number;
  vatAmount: number;
  netSales: number;
}

interface VatRow {
  vatRate: number;
  gallonsSold: number;
  grossSales: number;
  vatAmount: number;
  netSales: number;
  pctOfTotal: number;
}

const dayData: DayRow[] = [
  { date: "2025-06-01", day: "Sun", fuelType: "Regular", gallonsSold: 4520, grossSales: 17402.00, vatRate: 10, vatAmount: 1582.00, netSales: 15820.00 },
  { date: "2025-06-01", day: "Sun", fuelType: "Plus", gallonsSold: 1280, grossSales: 5888.00, vatRate: 15, vatAmount: 768.00, netSales: 5120.00 },
  { date: "2025-06-01", day: "Sun", fuelType: "Premium", gallonsSold: 2100, grossSales: 11340.00, vatRate: 20, vatAmount: 1890.00, netSales: 9450.00 },
  { date: "2025-06-02", day: "Mon", fuelType: "Regular", gallonsSold: 4680, grossSales: 18018.00, vatRate: 10, vatAmount: 1638.00, netSales: 16380.00 },
  { date: "2025-06-02", day: "Mon", fuelType: "Diesel", gallonsSold: 890, grossSales: 4094.00, vatRate: 15, vatAmount: 534.00, netSales: 3560.00 },
  { date: "2025-06-02", day: "Mon", fuelType: "Premium", gallonsSold: 1950, grossSales: 10530.00, vatRate: 20, vatAmount: 1755.00, netSales: 8775.00 },
  { date: "2025-06-03", day: "Tue", fuelType: "Regular", gallonsSold: 4350, grossSales: 16747.50, vatRate: 10, vatAmount: 1522.50, netSales: 15225.00 },
  { date: "2025-06-03", day: "Tue", fuelType: "Plus", gallonsSold: 1150, grossSales: 5290.00, vatRate: 15, vatAmount: 690.00, netSales: 4600.00 },
];

const vatData: VatRow[] = [
  { vatRate: 5, gallonsSold: 8200, grossSales: 25830.00, vatAmount: 1230.00, netSales: 24600.00, pctOfTotal: 7.8 },
  { vatRate: 10, gallonsSold: 52400, grossSales: 201740.00, vatAmount: 18340.00, netSales: 183400.00, pctOfTotal: 42.1 },
  { vatRate: 15, gallonsSold: 28600, grossSales: 131560.00, vatAmount: 17160.00, netSales: 114400.00, pctOfTotal: 28.9 },
  { vatRate: 20, gallonsSold: 18900, grossSales: 102060.00, vatAmount: 17010.00, netSales: 85050.00, pctOfTotal: 21.2 },
];

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtGal = (n: number) => n.toLocaleString("en-US");

interface Props {
  viewType: string;
  onRowClick: (row: DayRow | VatRow) => void;
}

export const SalesVatTable = ({ viewType, onRowClick }: Props) => {
  if (viewType === "by-vat") {
    const totals = vatData.reduce(
      (a, r) => ({ gallonsSold: a.gallonsSold + r.gallonsSold, grossSales: a.grossSales + r.grossSales, vatAmount: a.vatAmount + r.vatAmount, netSales: a.netSales + r.netSales }),
      { gallonsSold: 0, grossSales: 0, vatAmount: 0, netSales: 0 }
    );

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>VAT Rate (%)</TableHead>
            <TableHead className="text-right">Gallons Sold</TableHead>
            <TableHead className="text-right">Gross Sales</TableHead>
            <TableHead className="text-right">VAT Amount</TableHead>
            <TableHead className="text-right">Net Sales</TableHead>
            <TableHead className="text-right">% of Total</TableHead>
            <TableHead className="text-center w-[60px]">View</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vatData.map((r, i) => (
            <TableRow key={i} className="cursor-pointer hover:bg-muted/50" onClick={() => onRowClick(r)}>
              <TableCell className="font-medium">{r.vatRate}%</TableCell>
              <TableCell className="text-right">{fmtGal(r.gallonsSold)}</TableCell>
              <TableCell className="text-right">${fmt(r.grossSales)}</TableCell>
              <TableCell className="text-right">${fmt(r.vatAmount)}</TableCell>
              <TableCell className="text-right font-semibold">${fmt(r.netSales)}</TableCell>
              <TableCell className="text-right">{r.pctOfTotal}%</TableCell>
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
            <TableCell className="text-right">${fmt(totals.grossSales)}</TableCell>
            <TableCell className="text-right">${fmt(totals.vatAmount)}</TableCell>
            <TableCell className="text-right">${fmt(totals.netSales)}</TableCell>
            <TableCell className="text-right">100%</TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    );
  }

  // By Day
  const totals = dayData.reduce(
    (a, r) => ({ gallonsSold: a.gallonsSold + r.gallonsSold, grossSales: a.grossSales + r.grossSales, vatAmount: a.vatAmount + r.vatAmount, netSales: a.netSales + r.netSales }),
    { gallonsSold: 0, grossSales: 0, vatAmount: 0, netSales: 0 }
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Day</TableHead>
          <TableHead>Fuel Type</TableHead>
          <TableHead className="text-right">Gallons Sold</TableHead>
          <TableHead className="text-right">Gross Sales</TableHead>
          <TableHead className="text-right">VAT Rate (%)</TableHead>
          <TableHead className="text-right">VAT Amount</TableHead>
          <TableHead className="text-right">Net Sales</TableHead>
          <TableHead className="text-center w-[60px]">View</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dayData.map((r, i) => (
          <TableRow key={i} className="cursor-pointer hover:bg-muted/50" onClick={() => onRowClick(r)}>
            <TableCell>{r.date}</TableCell>
            <TableCell>{r.day}</TableCell>
            <TableCell className="font-medium">{r.fuelType}</TableCell>
            <TableCell className="text-right">{fmtGal(r.gallonsSold)}</TableCell>
            <TableCell className="text-right">${fmt(r.grossSales)}</TableCell>
            <TableCell className="text-right">{r.vatRate}%</TableCell>
            <TableCell className="text-right">${fmt(r.vatAmount)}</TableCell>
            <TableCell className="text-right font-semibold">${fmt(r.netSales)}</TableCell>
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
          <TableCell />
          <TableCell className="text-right">{fmtGal(totals.gallonsSold)}</TableCell>
          <TableCell className="text-right">${fmt(totals.grossSales)}</TableCell>
          <TableCell />
          <TableCell className="text-right">${fmt(totals.vatAmount)}</TableCell>
          <TableCell className="text-right">${fmt(totals.netSales)}</TableCell>
          <TableCell />
        </TableRow>
      </TableFooter>
    </Table>
  );
};
