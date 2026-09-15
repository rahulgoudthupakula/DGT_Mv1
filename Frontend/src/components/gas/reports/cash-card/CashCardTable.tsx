import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export interface CashCardRow {
  id: number;
  date: string;
  fuelType: string;
  cashAmount: number;
  cardCount: number;
  cardAmount: number;
  cardCommission: number;
}

const mockData: CashCardRow[] = [
  { id: 1, date: "Feb 01", fuelType: "Regular", cashAmount: 3280, cardCount: 42, cardAmount: 5420, cardCommission: 135.50 },
  { id: 2, date: "Feb 01", fuelType: "Premium", cashAmount: 2150, cardCount: 28, cardAmount: 4380, cardCommission: 109.50 },
  { id: 3, date: "Feb 02", fuelType: "Regular", cashAmount: 2940, cardCount: 38, cardAmount: 4850, cardCommission: 121.25 },
  { id: 4, date: "Feb 02", fuelType: "Diesel", cashAmount: 1870, cardCount: 22, cardAmount: 3620, cardCommission: 90.50 },
  { id: 5, date: "Feb 03", fuelType: "Regular", cashAmount: 3100, cardCount: 45, cardAmount: 5210, cardCommission: 130.25 },
  { id: 6, date: "Feb 03", fuelType: "Plus", cashAmount: 2680, cardCount: 31, cardAmount: 3940, cardCommission: 98.50 },
  { id: 7, date: "Feb 04", fuelType: "Regular", cashAmount: 2520, cardCount: 35, cardAmount: 4360, cardCommission: 109.00 },
];

const fmtDollar = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
  onRowClick: (row: CashCardRow) => void;
}

export const CashCardTable = ({ onRowClick }: Props) => {
  const totalCash = mockData.reduce((s, r) => s + r.cashAmount, 0);
  const totalCardCount = mockData.reduce((s, r) => s + r.cardCount, 0);
  const totalCard = mockData.reduce((s, r) => s + r.cardAmount, 0);
  const totalCommission = mockData.reduce((s, r) => s + r.cardCommission, 0);

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
                    <TableHead className="text-[11px] font-semibold">Fuel Type</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Cash Amount</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">No. of Cards</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Card Amount</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Card Commission</TableHead>
                    <TableHead className="text-[11px] font-semibold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockData.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => onRowClick(row)}>
                      <TableCell className="text-xs">{row.date}</TableCell>
                      <TableCell className="text-xs">{row.fuelType}</TableCell>
                      <TableCell className="text-xs text-right">{fmtDollar(row.cashAmount)}</TableCell>
                      <TableCell className="text-xs text-right">{row.cardCount}</TableCell>
                      <TableCell className="text-xs text-right">{fmtDollar(row.cardAmount)}</TableCell>
                      <TableCell className="text-xs text-right">{fmtDollar(row.cardCommission)}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); onRowClick(row); }}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-muted/60 font-semibold">
                    <TableCell className="text-xs" colSpan={2}>Totals</TableCell>
                    <TableCell className="text-xs text-right font-bold">{fmtDollar(totalCash)}</TableCell>
                    <TableCell className="text-xs text-right font-bold">{totalCardCount}</TableCell>
                    <TableCell className="text-xs text-right font-bold">{fmtDollar(totalCard)}</TableCell>
                    <TableCell className="text-xs text-right font-bold">{fmtDollar(totalCommission)}</TableCell>
                    <TableCell />
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
