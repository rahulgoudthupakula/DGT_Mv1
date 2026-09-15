import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { PricebookValuationItem } from "./InventoryByItem";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/ui/table-pagination";

interface Props {
  items: PricebookValuationItem[];
  onItemClick: (item: PricebookValuationItem) => void;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const statusVariant = (status: PricebookValuationItem["status"]) => {
  switch (status) {
    case "Normal": return "outline" as const;
    case "Slow-moving": return "secondary" as const;
    case "Expiring": return "destructive" as const;
  }
};

export const InventoryByItemTable = ({ items, onItemClick }: Props) => {
  const [pageSize, setPageSize] = useState(10);
  const totalQty = items.reduce((s, i) => s + (i.onHandQty??0), 0);
  
  const { paginated, page, totalPages, totalItems, hasPrev, hasNext, prevPage, nextPage } = usePagination(items, pageSize);

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="rounded-md border">
          <ScrollArea className="w-full whitespace-nowrap">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-[11px] font-semibold">Item / SKU</TableHead>
                  <TableHead className="text-[11px] font-semibold">Sub-Department</TableHead>
                  <TableHead className="text-[11px] font-semibold text-right">On-hand Qty</TableHead>
                  <TableHead className="text-[11px] font-semibold text-right">Current Unit Cost</TableHead>
                  <TableHead className="text-[11px] font-semibold text-right">Inventory Value</TableHead>
                  <TableHead className="text-[11px] font-semibold text-right">Last Purchase Cost</TableHead>
                  <TableHead className="text-[11px] font-semibold">Last Purchase Date</TableHead>
                  <TableHead className="text-[11px] font-semibold text-right">Stock Age (days)</TableHead>
                  <TableHead className="text-[11px] font-semibold text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => onItemClick(item)}>
                    <TableCell className="text-xs">
                      <div>
                        <span className="font-medium">{item.itemName}</span>
                        <span className="block text-[10px] text-muted-foreground">{item.sku}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{item.category}</TableCell>
                    <TableCell className="text-xs text-right font-medium">{item.onHandQty}</TableCell>
                    <TableCell className="text-xs text-right">{item.currentUnitCost==null?"":`$${fmt(item.currentUnitCost)}`}</TableCell>
                    <TableCell className="text-xs text-right font-semibold">{item.inventoryValue==null?"":`$${fmt(item.inventoryValue)}`}</TableCell>
                    <TableCell className="text-xs text-right"></TableCell>
                    <TableCell className="text-xs"></TableCell>
                    <TableCell className="text-xs text-right">
</TableCell>
                    <TableCell className="text-xs text-center">
</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted/60 font-semibold">
                  <TableCell className="text-xs" colSpan={2}>Recorded total ({items.length} items)</TableCell>
                  <TableCell className="text-xs text-right font-bold">{items.some(i=>i.onHandQty!=null)?totalQty:""}</TableCell>
                  <TableCell className="text-xs" />
                  <TableCell className="text-xs text-right font-bold">{items.some(i=>i.inventoryValue!=null)?`$${fmt(items.reduce((sum,i)=>sum+Math.round((i.inventoryValue??0)*100),0)/100)}`:""}</TableCell>
                  <TableCell className="text-xs" colSpan={4} />
                </TableRow>
              </TableFooter>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <TablePagination
            page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize}
            hasPrev={hasPrev} hasNext={hasNext} onPrev={prevPage} onNext={nextPage}
            onPageSizeChange={(s) => setPageSize(s)}
          />
        </div>
      </CardContent>
    </Card>
  );
};
