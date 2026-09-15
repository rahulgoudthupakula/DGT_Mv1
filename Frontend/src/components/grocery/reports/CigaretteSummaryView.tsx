import {useCigaretteReport} from './useCigaretteReport';
import { Card, CardContent } from "@/components/ui/card";
import { Package, Boxes, DollarSign, Tag } from "lucide-react";
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { isWithinInterval, parse } from "date-fns";

const fmt = (n: number) => n==null?"—":
  n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

interface DailyRow {
  date: string;
  day: string;
  soldCarton: number;
  soldPack: number;
  purchase: number;
  adjustments: number;
  systemCount: number;
  manualCount: number;
  missingExtra: number;
}





interface CigaretteSummaryViewProps {
 storeId:string;
  startDate?: Date;
  endDate?: Date;
}

export const CigaretteSummaryView = ({ storeId,startDate, endDate }: CigaretteSummaryViewProps) => {
  const report=useCigaretteReport(storeId);const mockRows=report.summary;
 const summaryCards=[{label:"Total Cartons on Hand",value:String(report.cartons),icon:Boxes},{label:"Total Packs on Hand",value:String(report.packs),icon:Package},{label:"Inventory Value (Cost)",value:report.cost==null?"—":"$"+report.cost.toFixed(2),icon:DollarSign},{label:"Inventory Value (Retail)",value:report.retail==null?"—":"$"+report.retail.toFixed(2),icon:Tag}];
  const filteredRows = mockRows.filter((row) => {
    if (!startDate && !endDate) return true;
    const rowDate = parse(row.date, "MM/dd/yyyy", new Date());
    if (startDate && endDate) return isWithinInterval(rowDate, { start: startDate, end: endDate });
    if (startDate) return rowDate >= startDate;
    if (endDate) return rowDate <= endDate;
    return true;
  });

  const totals = filteredRows.reduce(
    (acc, r) => ({
      soldCarton: acc.soldCarton + r.soldCarton,
      soldPack: acc.soldPack + r.soldPack,
      purchase: acc.purchase + r.purchase,
      adjustments: acc.adjustments + r.adjustments,
      systemCount: acc.systemCount + r.systemCount,
      manualCount: acc.manualCount + r.manualCount,
      missingExtra: acc.missingExtra + r.missingExtra,
    }),
    { soldCarton: 0, soldPack: 0, purchase: 0, adjustments: 0, systemCount: 0, manualCount: 0, missingExtra: 0 }
  );

  if(report.pending)return <p>Loading cigarette reports…</p>;if(report.error)return <p role="alert">{String(report.error)}</p>;
  return (
    <div className="space-y-4"><p className="text-xs text-muted-foreground">Pack/carton sales use the item’s recorded selling unit. Stock follows the recorded movement ledger; imported sales were not replayed into stock. Physical counts are unavailable. Purchase and adjustment quantities use each item’s base unit.</p>{report.missingUnits&&<p className="text-xs text-muted-foreground">Some cigarette items lack a pack/carton unit and are excluded from that breakdown.</p>}
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2.5">
                <card.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{card.label}</p>
                  <p className="text-lg font-bold">{card.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily Table */}
      <Card>
        <CardContent className="pt-5">
          <div className="rounded-md border">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background">
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-[11px] font-semibold" rowSpan={2}>Date</TableHead>
                      <TableHead className="text-[11px] font-semibold" rowSpan={2}>Day</TableHead>
                      <TableHead className="text-[11px] font-semibold text-center border-l" colSpan={2}>Sold</TableHead>
                      <TableHead className="text-[11px] font-semibold text-right border-l">Purchase</TableHead>
                      <TableHead className="text-[11px] font-semibold text-right">Adjustments</TableHead>
                      <TableHead className="text-[11px] font-semibold text-right border-l">System Count</TableHead>
                      <TableHead className="text-[11px] font-semibold text-right">Manual Count</TableHead>
                      <TableHead className="text-[11px] font-semibold text-right border-l">Missing / Extra</TableHead>
                    </TableRow>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-[10px] text-muted-foreground text-right border-l">Carton</TableHead>
                      <TableHead className="text-[10px] text-muted-foreground text-right">Pack</TableHead>
                      <TableHead className="border-l" />
                      <TableHead />
                      <TableHead className="border-l" />
                      <TableHead />
                      <TableHead className="border-l" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-sm">
                          No data for the selected date range.
                        </TableCell>
                      </TableRow>
                    ) : filteredRows.map((row) => (
                      <TableRow key={row.date} className="hover:bg-muted/30">
                        <TableCell className="text-xs font-medium">{row.date}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{row.day}</TableCell>
                        <TableCell className="text-xs text-right border-l">{row.soldCarton}</TableCell>
                        <TableCell className="text-xs text-right">{row.soldPack}</TableCell>
                        <TableCell className="text-xs text-right border-l">{row.purchase}</TableCell>
                        <TableCell className={`text-xs text-right ${row.adjustments !== 0 ? "text-[hsl(var(--warning))] font-medium" : ""}`}>
                          {row.adjustments}
                        </TableCell>
                        <TableCell className="text-xs text-right border-l">{row.systemCount}</TableCell>
                        <TableCell className="text-xs text-right">{row.manualCount}</TableCell>
                        <TableCell className={`text-xs text-right font-medium border-l ${
                          row.missingExtra < 0 ? "text-destructive" : row.missingExtra > 0 ? "text-[hsl(var(--success))]" : ""
                        }`}>
                          {row.missingExtra > 0 ? `+${row.missingExtra}` : row.missingExtra}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="bg-muted/60 font-semibold">
                      <TableCell className="text-xs" colSpan={2}>Total</TableCell>
                      <TableCell className="text-xs text-right font-bold border-l">{fmt(totals.soldCarton)}</TableCell>
                      <TableCell className="text-xs text-right font-bold">{fmt(totals.soldPack)}</TableCell>
                      <TableCell className="text-xs text-right font-bold border-l">{fmt(totals.purchase)}</TableCell>
                      <TableCell className="text-xs text-right font-bold">{fmt(totals.adjustments)}</TableCell>
                      <TableCell className="text-xs text-right font-bold border-l">{filteredRows.length?fmt(filteredRows[0].systemCount):'—'}</TableCell>
                      <TableCell className="text-xs text-right font-bold">—</TableCell>
                      <TableCell className={`text-xs text-right font-bold border-l ${
                        totals.missingExtra < 0 ? "text-destructive" : totals.missingExtra > 0 ? "text-[hsl(var(--success))]" : ""
                      }`}>
                        {totals.missingExtra > 0 ? `+${totals.missingExtra}` : totals.missingExtra}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
