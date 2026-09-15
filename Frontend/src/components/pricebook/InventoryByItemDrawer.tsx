import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/backend";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { PricebookValuationItem } from "./InventoryByItem";

interface Props {
  storeId:string;
  timezone?:string;
  item: PricebookValuationItem | null;
  onClose: () => void;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const InventoryByItemDrawer = ({ item, onClose, storeId, timezone }: Props) => {
  const query=useQuery({queryKey:['stock-movements',storeId,item?.id],queryFn:()=>request<{movements:{id:number;date:string;type:string;qty:number;reference:number|null}[]}>(`/access/stores/${storeId}/current-stock/${item!.id}/movements`),enabled:!!item});
  if (!item) return null;
  const date=(value:string)=>new Intl.DateTimeFormat('en-US',{timeZone:timezone||'UTC',dateStyle:'short',timeStyle:'short'}).format(new Date(value));
  return (
    <Sheet open={!!item} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[420px] sm:w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">{item.itemName}</SheetTitle>
          <SheetDescription className="text-xs">{item.sku} · {item.category}</SheetDescription>
        </SheetHeader>
        <div className="mt-5 space-y-5">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">Cost Trend (Last 5 Purchases)</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-md border p-2.5">
                <p className="text-[10px] text-muted-foreground">Avg Cost</p>
                <p className="text-sm font-bold"></p>
              </div>
              <div className="rounded-md border p-2.5">
                <p className="text-[10px] text-muted-foreground">Min</p>
                <p className="text-sm font-bold text-[hsl(var(--success))]"></p>
              </div>
              <div className="rounded-md border p-2.5">
                <p className="text-[10px] text-muted-foreground">Max</p>
                <p className="text-sm font-bold text-destructive"></p>
              </div>
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">Purchase History (Last 5)</h4>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-[10px] font-semibold">Date</TableHead>
                    <TableHead className="text-[10px] font-semibold">Vendor</TableHead>
                    <TableHead className="text-[10px] font-semibold text-right">Qty</TableHead>
                    <TableHead className="text-[10px] font-semibold text-right">Unit Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {item.purchaseHistory.map((p, i) => (
                    <TableRow key={i} className="hover:bg-muted/30">
                      <TableCell className="text-[11px]">{p.date}</TableCell>
                      <TableCell className="text-[11px]">{p.vendor}</TableCell>
                      <TableCell className="text-[11px] text-right">{p.qty}</TableCell>
                      <TableCell className="text-[11px] text-right">${fmt(p.unitCost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">Inventory Movements (latest 100)</h4>{query.isPending&&<p>Loading movements…</p>}{query.error&&<p role="alert">{query.error.message}</p>}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-[10px] font-semibold">Date</TableHead>
                    <TableHead className="text-[10px] font-semibold">Type</TableHead>
                    <TableHead className="text-[10px] font-semibold text-right">Qty</TableHead>
                    <TableHead className="text-[10px] font-semibold">Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data?.movements.length===0&&<TableRow><TableCell colSpan={4}>No recorded movements</TableCell></TableRow>}
                  {(query.data?.movements??[]).map((m, i) => (
                    <TableRow key={i} className="hover:bg-muted/30">
                      <TableCell className="text-[11px]">{date(m.date)}</TableCell>
                      <TableCell className="text-[11px]">
                        <Badge variant={m.type === "Received" ? "outline" : "secondary"} className="text-[9px] px-1.5 py-0">{m.type}</Badge>
                      </TableCell>
                      <TableCell className={`text-[11px] text-right font-medium ${m.qty < 0 ? "text-destructive" : ""}`}>
                        {m.qty > 0 ? `+${m.qty}` : m.qty}
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground">{m.reference==null?"":`Reference #${m.reference}`}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
