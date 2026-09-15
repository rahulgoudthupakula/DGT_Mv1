import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface DayRow {
  date: string;
  fuelType: string;
  gallonsSold: number;
  taxRate: number;
  taxAmount: number;
  exemptGallons: number;
  adjustments: number;
  netTax: number;
}

interface FuelRow {
  fuelType: string;
  gallonsSold: number;
  taxRate: number;
  taxAmount: number;
  exemptGallons: number;
  adjustments: number;
  netTax: number;
}

const dayData: DayRow[] = [
  { date: "2025-06-01", fuelType: "Regular", gallonsSold: 4520, taxRate: 0.184, taxAmount: 831.68, exemptGallons: 0, adjustments: 0, netTax: 831.68 },
  { date: "2025-06-01", fuelType: "Premium", gallonsSold: 1280, taxRate: 0.184, taxAmount: 235.52, exemptGallons: 40, adjustments: -7.36, netTax: 228.16 },
  { date: "2025-06-01", fuelType: "Diesel", gallonsSold: 2100, taxRate: 0.244, taxAmount: 512.40, exemptGallons: 150, adjustments: -36.60, netTax: 475.80 },
  { date: "2025-06-02", fuelType: "Regular", gallonsSold: 4680, taxRate: 0.184, taxAmount: 861.12, exemptGallons: 0, adjustments: 0, netTax: 861.12 },
  { date: "2025-06-02", fuelType: "Plus", gallonsSold: 890, taxRate: 0.184, taxAmount: 163.76, exemptGallons: 0, adjustments: 0, netTax: 163.76 },
  { date: "2025-06-02", fuelType: "Diesel", gallonsSold: 1950, taxRate: 0.244, taxAmount: 475.80, exemptGallons: 80, adjustments: -19.52, netTax: 456.28 },
  { date: "2025-06-03", fuelType: "Regular", gallonsSold: 4350, taxRate: 0.184, taxAmount: 800.40, exemptGallons: 0, adjustments: 0, netTax: 800.40 },
  { date: "2025-06-03", fuelType: "Premium", gallonsSold: 1150, taxRate: 0.184, taxAmount: 211.60, exemptGallons: 0, adjustments: -5.00, netTax: 206.60 },
];

const fuelData: FuelRow[] = [
  { fuelType: "Regular", gallonsSold: 52400, taxRate: 0.184, taxAmount: 9641.60, exemptGallons: 0, adjustments: 0, netTax: 9641.60 },
  { fuelType: "Plus", gallonsSold: 18200, taxRate: 0.184, taxAmount: 3348.80, exemptGallons: 120, adjustments: -22.08, netTax: 3326.72 },
  { fuelType: "Premium", gallonsSold: 22100, taxRate: 0.184, taxAmount: 4066.40, exemptGallons: 280, adjustments: -51.52, netTax: 4014.88 },
  { fuelType: "Diesel", gallonsSold: 31880, taxRate: 0.244, taxAmount: 7778.72, exemptGallons: 960, adjustments: -234.24, netTax: 7544.48 },
];

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtGal = (n: number) => n.toLocaleString("en-US");

interface Props {
  viewType: string;
  onRowClick: (row: DayRow | FuelRow) => void;
}

export const GasTaxTable = ({ viewType, onRowClick }: Props) => {
  if (viewType === "by-fuel") {
    const totals = fuelData.reduce(
      (a, r) => ({
        gallonsSold: a.gallonsSold + r.gallonsSold,
        taxAmount: a.taxAmount + r.taxAmount,
        exemptGallons: a.exemptGallons + r.exemptGallons,
        adjustments: a.adjustments + r.adjustments,
        netTax: a.netTax + r.netTax,
      }),
      { gallonsSold: 0, taxAmount: 0, exemptGallons: 0, adjustments: 0, netTax: 0 }
    );

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fuel Type</TableHead>
            <TableHead className="text-right">Gallons Sold</TableHead>
            <TableHead className="text-right">Tax Rate ($/gal)</TableHead>
            <TableHead className="text-right">Tax Amount</TableHead>
            <TableHead className="text-right">Exempt Gal</TableHead>
            <TableHead className="text-right">Credits / Adj</TableHead>
            <TableHead className="text-right">Net Tax</TableHead>
            <TableHead className="text-center w-[60px]">View</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fuelData.map((r, i) => (
            <TableRow key={i} className="cursor-pointer hover:bg-muted/50" onClick={() => onRowClick(r)}>
              <TableCell className="font-medium">{r.fuelType}</TableCell>
              <TableCell className="text-right">{fmtGal(r.gallonsSold)}</TableCell>
              <TableCell className="text-right">${r.taxRate.toFixed(3)}</TableCell>
              <TableCell className="text-right">${fmt(r.taxAmount)}</TableCell>
              <TableCell className="text-right">{fmtGal(r.exemptGallons)}</TableCell>
              <TableCell className="text-right">${fmt(r.adjustments)}</TableCell>
              <TableCell className="text-right font-semibold">${fmt(r.netTax)}</TableCell>
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
            <TableCell />
            <TableCell className="text-right">${fmt(totals.taxAmount)}</TableCell>
            <TableCell className="text-right">{fmtGal(totals.exemptGallons)}</TableCell>
            <TableCell className="text-right">${fmt(totals.adjustments)}</TableCell>
            <TableCell className="text-right">${fmt(totals.netTax)}</TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    );
  }

  // By Day (default)
  const totals = dayData.reduce(
    (a, r) => ({
      gallonsSold: a.gallonsSold + r.gallonsSold,
      taxAmount: a.taxAmount + r.taxAmount,
      exemptGallons: a.exemptGallons + r.exemptGallons,
      adjustments: a.adjustments + r.adjustments,
      netTax: a.netTax + r.netTax,
    }),
    { gallonsSold: 0, taxAmount: 0, exemptGallons: 0, adjustments: 0, netTax: 0 }
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Fuel Type</TableHead>
          <TableHead className="text-right">Gallons Sold</TableHead>
          <TableHead className="text-right">Tax Rate ($/gal)</TableHead>
          <TableHead className="text-right">Tax Amount</TableHead>
          <TableHead className="text-right">Exempt Gal</TableHead>
          <TableHead className="text-right">Adj / Credits</TableHead>
          <TableHead className="text-right">Net Tax</TableHead>
          <TableHead className="text-center w-[60px]">View</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dayData.map((r, i) => (
          <TableRow key={i} className="cursor-pointer hover:bg-muted/50" onClick={() => onRowClick(r)}>
            <TableCell>{r.date}</TableCell>
            <TableCell className="font-medium">{r.fuelType}</TableCell>
            <TableCell className="text-right">{fmtGal(r.gallonsSold)}</TableCell>
            <TableCell className="text-right">${r.taxRate.toFixed(3)}</TableCell>
            <TableCell className="text-right">${fmt(r.taxAmount)}</TableCell>
            <TableCell className="text-right">{fmtGal(r.exemptGallons)}</TableCell>
            <TableCell className="text-right">${fmt(r.adjustments)}</TableCell>
            <TableCell className="text-right font-semibold">${fmt(r.netTax)}</TableCell>
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
          <TableCell />
          <TableCell className="text-right">${fmt(totals.taxAmount)}</TableCell>
          <TableCell className="text-right">{fmtGal(totals.exemptGallons)}</TableCell>
          <TableCell className="text-right">${fmt(totals.adjustments)}</TableCell>
          <TableCell className="text-right">${fmt(totals.netTax)}</TableCell>
          <TableCell />
        </TableRow>
      </TableFooter>
    </Table>
  );
};
