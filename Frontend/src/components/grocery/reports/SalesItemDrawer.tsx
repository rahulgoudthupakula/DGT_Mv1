import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUp, ArrowDown, Package, Truck } from "lucide-react";

interface DailySale {
  date: string;
  units: number;
  sales: number;
}

interface PriceChange {
  date: string;
  oldPrice: number;
  newPrice: number;
}

interface VendorInfo {
  name: string;
  lastDelivery: string;
  unitCost: number;
}

interface InventoryMovement {
  type: string;
  date: string;
  qty: number;
}

interface SalesItemDetail {
  name: string;
  scanCode: string;
  category: string;
  totalUnits: number;
  totalSales: number;
  avgPrice: number;
  dailySales: DailySale[];
  priceChanges: PriceChange[];
  vendors: VendorInfo[];
  inventoryMovements: InventoryMovement[];
}

interface SalesItemDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: SalesItemDetail | null;
}

export const SalesItemDrawer = ({ open, onOpenChange, item }: SalesItemDrawerProps) => {
  if (!item) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[440px] sm:max-w-[440px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-base">{item.name}</SheetTitle>
          <SheetDescription className="text-xs">
            <span className="font-mono">{item.scanCode}</span> · {item.category}
          </SheetDescription>
        </SheetHeader>

        <p className="text-xs text-muted-foreground mb-4">Daily sales are connected. Price-change history, vendor details and inventory movements are not included in this sales view.</p>
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="rounded-md border p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground">Units</p>
            <p className="text-sm font-bold">{item.totalUnits}</p>
          </div>
          <div className="rounded-md border p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground">Net Sales</p>
            <p className="text-sm font-bold">${item.totalSales.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-md border p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground">Avg Price</p>
            <p className="text-sm font-bold">${item.avgPrice.toFixed(2)}</p>
          </div>
        </div>

        {/* Daily Sales Breakdown */}
        <div className="mb-5">
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" />
            Daily Sales Breakdown
          </h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px] h-8">Date</TableHead>
                  <TableHead className="text-[11px] h-8 text-right">Units</TableHead>
                  <TableHead className="text-[11px] h-8 text-right">Sales $</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.dailySales.map((day) => (
                  <TableRow key={day.date}>
                    <TableCell className="text-xs py-1.5">{day.date}</TableCell>
                    <TableCell className="text-xs py-1.5 text-right">{day.units}</TableCell>
                    <TableCell className="text-xs py-1.5 text-right font-medium">
                      ${day.sales.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <Separator className="mb-5" />

        {/* Price Changes */}
        {item.priceChanges.length > 0 && (
          <div className="mb-5">
            <h4 className="text-xs font-semibold mb-2">Price Changes During Period</h4>
            <div className="space-y-1.5">
              {item.priceChanges.map((pc, i) => {
                const increased = pc.newPrice > pc.oldPrice;
                return (
                  <div key={i} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-xs text-muted-foreground">{pc.date}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">${pc.oldPrice.toFixed(2)}</span>
                      <span>→</span>
                      <span className={`font-medium ${increased ? "text-destructive" : "text-[hsl(var(--success))]"}`}>
                        ${pc.newPrice.toFixed(2)}
                      </span>
                      {increased ? (
                        <ArrowUp className="h-3 w-3 text-destructive" />
                      ) : (
                        <ArrowDown className="h-3 w-3 text-[hsl(var(--success))]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Vendors */}
        <div className="mb-5">
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5" />
            Vendor(s)
          </h4>
          <div className="space-y-1.5">
            {item.vendors.map((v, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <p className="text-xs font-medium">{v.name}</p>
                  <p className="text-[10px] text-muted-foreground">Last delivery: {v.lastDelivery}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  ${v.unitCost.toFixed(2)}/unit
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <Separator className="mb-5" />

        {/* Inventory Movement */}
        <div>
          <h4 className="text-xs font-semibold mb-2">Linked Inventory Movement</h4>
          <div className="space-y-1.5">
            {item.inventoryMovements.map((mv, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border px-3 py-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={mv.qty > 0 ? "default" : "destructive"}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {mv.qty > 0 ? "+" : ""}{mv.qty}
                  </Badge>
                  <span className="text-xs">{mv.type}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{mv.date}</span>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
