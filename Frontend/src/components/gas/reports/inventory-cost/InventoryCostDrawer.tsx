import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import type { InventoryCostRow } from "./InventoryCostTable";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  row: InventoryCostRow | null;
}

const fmt = (v: number | undefined, d = 0) => (v ?? 0).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtDollar = (v: number | undefined) => "$" + (v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtCost = (v: number | undefined) => "$" + (v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });

export const InventoryCostDrawer = ({ open, onOpenChange, row }: Props) => {
  if (!row) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">Inventory Detail — {row.date} ({row.day})</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-muted-foreground">Date</span><p className="font-medium text-foreground">{row.date} ({row.day})</p></div>
            <div><span className="text-muted-foreground">Fuel Type</span><p className="font-medium text-foreground">{row.fuelType}</p></div>
          </div>

          <Separator />

          <h5 className="text-xs font-semibold">Volume Summary</h5>
          <div className="space-y-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Opening Gas Volume</span><span className="text-foreground">{fmt(row.openingGasVolume)} gal</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="text-foreground">{row.delivery > 0 ? fmt(row.delivery) + " gal" : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Adjustment</span><span className={row.adjustment !== 0 ? (row.adjustment < 0 ? "text-destructive" : "text-primary") : "text-foreground"}>{row.adjustment !== 0 ? (row.adjustment > 0 ? "+" : "") + fmt(row.adjustment) + " gal" : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Sale</span><span className="text-foreground">{row.sale > 0 ? fmt(row.sale) + " gal" : "—"}</span></div>
            <Separator />
            <div className="flex justify-between font-semibold"><span>Closing Gas Volume</span><span>{fmt(row.closingGasVolume)} gal</span></div>
          </div>

          <Separator />

          <h5 className="text-xs font-semibold">Cost & Valuation</h5>
          <div className="space-y-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Unit Purchased Cost</span><span className="text-foreground">{fmtCost(row.unitPurchasedCost)}</span></div>
            <Separator />
            <div className="flex justify-between font-semibold"><span>Running Inventory Value</span><span>{fmtDollar(row.runningInventoryValue)}</span></div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
