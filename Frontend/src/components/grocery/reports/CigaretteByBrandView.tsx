import {useCigaretteReport} from './useCigaretteReport';
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { format, parse, isSameDay } from "date-fns";

const fmt = (n: number) => n==null?"—":
  n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

interface BrandDailyRow {
  date: string;
  day: string;
  brand: string;
  soldCarton: number;
  soldPack: number;
  purchase: number;
  adjustments: number;
  systemCount: number;
  missingExtra: number;
}



interface CigaretteByBrandViewProps {
 storeId:string;
  date?: Date;
}

export const CigaretteByBrandView = ({ storeId,date }: CigaretteByBrandViewProps) => {
  const report=useCigaretteReport(storeId);const mockRows=report.rows;
  const filteredRows = date
    ? mockRows.filter((row) => {
        const rowDate = parse(row.date, "MM/dd/yyyy", new Date());
        return isSameDay(rowDate, date);
      })
    : mockRows.filter((row) => row.dateKey === mockRows[mockRows.length-1]?.dateKey); // default: latest day

  const selectedDay = filteredRows[0];

  const totals = filteredRows.reduce(
    (acc, r) => ({
      soldCarton: acc.soldCarton + r.soldCarton,
      soldPack: acc.soldPack + r.soldPack,
      purchase: acc.purchase + r.purchase,
      adjustments: acc.adjustments + r.adjustments,
      systemCount: acc.systemCount + r.systemCount,
      missingExtra: acc.missingExtra + r.missingExtra,
    }),
    { soldCarton: 0, soldPack: 0, purchase: 0, adjustments: 0, systemCount: 0, missingExtra: 0 }
  );

  if(report.pending)return <p>Loading cigarette reports…</p>;if(report.error)return <p role="alert">{String(report.error)}</p>;
  return (
    <Card>
      <CardContent className="pt-5">
        {selectedDay && (
          <p className="text-xs text-muted-foreground mb-3">
            Showing all brands for <span className="font-semibold text-foreground">{selectedDay.date} ({selectedDay.day})</span>
          </p>
        )}
        <div className="rounded-md border">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-[11px] font-semibold" rowSpan={2}>Brand</TableHead>
                    <TableHead className="text-[11px] font-semibold text-center border-l" colSpan={2}>Sold</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right border-l">Purchase</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Adjustments</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right border-l">System Count</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right border-l">Missing / Extra</TableHead>
                  </TableRow>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-[10px] text-muted-foreground text-right border-l">Carton</TableHead>
                    <TableHead className="text-[10px] text-muted-foreground text-right">Pack</TableHead>
                    <TableHead className="border-l" />
                    <TableHead />
                    <TableHead className="border-l" />
                    <TableHead className="border-l" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                        No data for the selected date.
                      </TableCell>
                    </TableRow>
                  ) : filteredRows.map((row) => (
                    <TableRow key={row.brand} className="hover:bg-muted/30">
                      <TableCell className="text-xs font-medium">{row.brand}</TableCell>
                      <TableCell className="text-xs text-right border-l">{row.soldCarton}</TableCell>
                      <TableCell className="text-xs text-right">{row.soldPack}</TableCell>
                      <TableCell className="text-xs text-right border-l">{row.purchase}</TableCell>
                      <TableCell className={`text-xs text-right ${row.adjustments !== 0 ? "text-[hsl(var(--warning))] font-medium" : ""}`}>
                        {row.adjustments}
                      </TableCell>
                      <TableCell className="text-xs text-right border-l">{row.systemCount}</TableCell>
                      <TableCell className={`text-xs text-right font-medium border-l ${
                        row.missingExtra < 0 ? "text-destructive" : row.missingExtra > 0 ? "text-[hsl(var(--success))]" : ""
                      }`}>
                        {row.missingExtra > 0 ? `+${row.missingExtra}` : row.missingExtra}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                {filteredRows.length > 0 && (
                  <TableFooter>
                    <TableRow className="bg-muted/60 font-semibold">
                      <TableCell className="text-xs">Total</TableCell>
                      <TableCell className="text-xs text-right font-bold border-l">{fmt(totals.soldCarton)}</TableCell>
                      <TableCell className="text-xs text-right font-bold">{fmt(totals.soldPack)}</TableCell>
                      <TableCell className="text-xs text-right font-bold border-l">{fmt(totals.purchase)}</TableCell>
                      <TableCell className="text-xs text-right font-bold">{fmt(totals.adjustments)}</TableCell>
                      <TableCell className="text-xs text-right font-bold border-l">{filteredRows.length?fmt(totals.systemCount):'—'}</TableCell>
                      <TableCell className={`text-xs text-right font-bold border-l ${
                        totals.missingExtra < 0 ? "text-destructive" : totals.missingExtra > 0 ? "text-[hsl(var(--success))]" : ""
                      }`}>
                        {totals.missingExtra > 0 ? `+${totals.missingExtra}` : totals.missingExtra}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};
