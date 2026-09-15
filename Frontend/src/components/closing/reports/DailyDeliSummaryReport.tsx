import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type View = "sales" | "collections";

const salesData = [
  { date: "02/01/2026", deliSales: 1820.50, deliTax: 127.44, total: 1947.94 },
  { date: "02/02/2026", deliSales: 1650.25, deliTax: 115.52, total: 1765.77 },
  { date: "02/03/2026", deliSales: 1740.00, deliTax: 121.80, total: 1861.80 },
];

const collectionsData = [
  { date: "02/01/2026", cash: 820.00, card: 1127.94, total: 1947.94 },
  { date: "02/02/2026", cash: 710.25, card: 1055.52, total: 1765.77 },
  { date: "02/03/2026", cash: 780.00, card: 1081.80, total: 1861.80 },
];

export const DailyDeliSummaryReport = () => {
  const [view, setView] = useState<View>("sales");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4 pb-3 flex flex-wrap items-center gap-3">
          <DatePicker label="Date From" date={startDate} onSelect={setStartDate} />
          <DatePicker label="Date To" date={endDate} onSelect={setEndDate} />
          <div className="ml-auto">
            <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as View)} className="border rounded-md">
              <ToggleGroupItem value="sales" className="text-xs px-3 h-8">Sales View</ToggleGroupItem>
              <ToggleGroupItem value="collections" className="text-xs px-3 h-8">Collections View</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 p-0">
          {view === "sales" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Deli Sales</TableHead>
                  <TableHead className="text-right">Deli Tax</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.map((r) => (
                  <TableRow key={r.date}>
                    <TableCell className="font-medium">{r.date}</TableCell>
                    <TableCell className="text-right">${r.deliSales.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${r.deliTax.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold">${r.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold">Totals</TableCell>
                  <TableCell className="text-right font-bold">${salesData.reduce((s, r) => s + r.deliSales, 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold">${salesData.reduce((s, r) => s + r.deliTax, 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold">${salesData.reduce((s, r) => s + r.total, 0).toFixed(2)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Cash</TableHead>
                  <TableHead className="text-right">Card</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collectionsData.map((r) => (
                  <TableRow key={r.date}>
                    <TableCell className="font-medium">{r.date}</TableCell>
                    <TableCell className="text-right">${r.cash.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${r.card.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold">${r.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold">Totals</TableCell>
                  <TableCell className="text-right font-bold">${collectionsData.reduce((s, r) => s + r.cash, 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold">${collectionsData.reduce((s, r) => s + r.card, 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold">${collectionsData.reduce((s, r) => s + r.total, 0).toFixed(2)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const DatePicker = ({ label, date, onSelect }: { label: string; date?: Date; onSelect: (d?: Date) => void }) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" className={cn("w-[160px] justify-start text-left text-xs h-8", !date && "text-muted-foreground")}>
        <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
        {date ? format(date, "MM/dd/yyyy") : label}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar mode="single" selected={date} onSelect={onSelect} initialFocus className="p-3 pointer-events-auto" />
    </PopoverContent>
  </Popover>
);
