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
  { date: "02/01/2026", checksCashed: 18, checkAmount: 12400.00, feeEarned: 248.00, totalCommission: 248.00 },
  { date: "02/02/2026", checksCashed: 12, checkAmount: 8200.00, feeEarned: 164.00, totalCommission: 164.00 },
  { date: "02/03/2026", checksCashed: 15, checkAmount: 10500.00, feeEarned: 210.00, totalCommission: 210.00 },
];

const collectionsData = [
  { date: "02/01/2026", cashGivenOut: 12152.00, checksReceived: 12400.00, commission: 248.00, netMovement: 0.00 },
  { date: "02/02/2026", cashGivenOut: 8036.00, checksReceived: 8200.00, commission: 164.00, netMovement: 0.00 },
  { date: "02/03/2026", cashGivenOut: 10290.00, checksReceived: 10500.00, commission: 210.00, netMovement: 0.00 },
];

export const CheckCashingSummaryReport = () => {
  const [view, setView] = useState<View>("sales");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const totalCommission = salesData.reduce((s, r) => s + r.totalCommission, 0);
  const totalCashMovement = collectionsData.reduce((s, r) => s + r.cashGivenOut, 0);

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
                  <TableHead className="text-right"># Checks Cashed</TableHead>
                  <TableHead className="text-right">Check Amount</TableHead>
                  <TableHead className="text-right">Fee Earned</TableHead>
                  <TableHead className="text-right">Total Commission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.map((r) => (
                  <TableRow key={r.date}>
                    <TableCell className="font-medium">{r.date}</TableCell>
                    <TableCell className="text-right">{r.checksCashed}</TableCell>
                    <TableCell className="text-right">${r.checkAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${r.feeEarned.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold">${r.totalCommission.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold">Totals</TableCell>
                  <TableCell className="text-right font-bold">{salesData.reduce((s, r) => s + r.checksCashed, 0)}</TableCell>
                  <TableCell className="text-right font-bold">${salesData.reduce((s, r) => s + r.checkAmount, 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold">${salesData.reduce((s, r) => s + r.feeEarned, 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold">${totalCommission.toFixed(2)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Cash Given Out</TableHead>
                  <TableHead className="text-right">Checks Received</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Net Movement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collectionsData.map((r) => (
                  <TableRow key={r.date}>
                    <TableCell className="font-medium">{r.date}</TableCell>
                    <TableCell className="text-right">${r.cashGivenOut.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${r.checksReceived.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${r.commission.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold">${r.netMovement.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold">Total Commission</TableCell>
                  <TableCell colSpan={3} />
                  <TableCell className="text-right font-bold">${totalCommission.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">Total Cash Movement</TableCell>
                  <TableCell className="text-right text-muted-foreground">${totalCashMovement.toFixed(2)}</TableCell>
                  <TableCell colSpan={3} />
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
