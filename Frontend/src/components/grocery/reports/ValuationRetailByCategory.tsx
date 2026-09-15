import {useStockReports,stockCategories} from './useStockReports';
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const fmt = (n: number|null) => n===null?"—":
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pct = (n: number|null) => n===null?"—": n.toFixed(1) + "%";

interface CategoryRow {
  category: string;
  onHandQty: number;
  avgRetail: number;
  inventoryValueRetail: number;
  potentialMargin: number;
  actualInventory: number;
  variation: number;
}



export const ValuationRetailByCategory = ({storeId}:{storeId:string}) => {
 const query=useStockReports(storeId);const mockRows=stockCategories(query.data?.items??[]);
  const totalQty = mockRows.some(r=>r.onHandQty==null)?null:mockRows.reduce((s, r) => s + r.onHandQty, 0);
  const totalRetailValue = mockRows.reduce((s, r) => s + (r.inventoryValueRetail??0), 0);
  const totalActual = mockRows.reduce((s, r) => s + (r.actualInventory??0), 0);
  const totalVar = mockRows.reduce((s, r) => s + (r.variation??0), 0);

  if(query.isPending)return <p>Loading stock…</p>;if(query.error)return <p role="alert">{String(query.error)}</p>;
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="rounded-md border">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-[11px] font-semibold">Category</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">On-hand Qty</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Avg Retail</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Inventory Value (Retail)</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Actual Inventory (Retail)</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Variation</TableHead>
                    <TableHead className="text-[11px] font-semibold text-right">Potential Margin %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRows.map((row) => (
                    <TableRow key={row.category} className="hover:bg-muted/30">
                      <TableCell className="text-xs font-medium">{row.category}</TableCell>
                      <TableCell className="text-xs text-right">{row.onHandQty??"—"}</TableCell>
                      <TableCell className="text-xs text-right">${fmt(row.avgRetail)}</TableCell>
                      <TableCell className="text-xs text-right font-semibold">${fmt(row.inventoryValueRetail)}</TableCell>
                      <TableCell className="text-xs text-right">${fmt(row.actualInventory)}</TableCell>
                      <TableCell className={`text-xs text-right font-semibold ${row.variation < 0 ? "text-destructive" : row.variation > 0 ? "text-[hsl(var(--success))]" : ""}`}>
                        {row.variation !== 0 ? `$${fmt(row.variation)}` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={row.potentialMargin >= 35 ? "text-[hsl(var(--success))] font-medium" : row.potentialMargin < 28 ? "text-destructive font-medium" : ""}>
                          {pct(row.potentialMargin)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-muted/60 font-semibold">
                    <TableCell className="text-xs">Total</TableCell>
                    <TableCell className="text-xs text-right font-bold">{totalQty??"—"}</TableCell>
                    <TableCell className="text-xs" />
                    <TableCell className="text-xs text-right font-bold">${mockRows.some(r=>r.missingRetail)?'—':fmt(totalRetailValue)}</TableCell>
                    <TableCell className="text-xs text-right font-bold">$—</TableCell>
                    <TableCell className={`text-xs text-right font-bold ${totalVar < 0 ? "text-destructive" : totalVar > 0 ? "text-[hsl(var(--success))]" : ""}`}>
                      {totalVar !== 0 ? `$$—` : "—"}
                    </TableCell>
                    <TableCell className="text-xs" />
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
