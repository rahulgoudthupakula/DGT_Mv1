import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface PosSalesItem {
  method: string;
  gallons: number;
  sales: number;
}

interface PriceChange {
  date: string;
  grade: string;
  oldPrice: number;
  newPrice: number;
}

interface FuelDetail {
  fuelType: string;
  gallons: number;
  sales: number;
}

interface GasSalesDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  posSales: PosSalesItem[];
  priceChanges: PriceChange[];
  fuelDetails: FuelDetail[];
}

const dollar = (v: number) =>
  "$" + (v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmt = (v: number, d = 0) =>
  (v ?? 0).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

export const GasSalesDrawer = ({ open, onClose, title, posSales, priceChanges, fuelDetails }: GasSalesDrawerProps) => (
  <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
    <SheetContent className="w-full sm:max-w-md overflow-y-auto">
      <SheetHeader>
        <SheetTitle className="text-base">Sales Detail — {title}</SheetTitle>
      </SheetHeader>

      <div className="mt-6 space-y-6">
        {/* POS Sales Breakdown */}
        <div>
          <h4 className="text-xs font-semibold mb-2">POS Sales Breakdown</h4>
          <div className="space-y-1.5">
            {posSales.map((p) => (
              <div key={p.method} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{p.method}</span>
                <span>{fmt(p.gallons)} gal — {dollar(p.sales)}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Price Changes */}
        <div>
          <h4 className="text-xs font-semibold mb-2">Price Changes During Period</h4>
          {priceChanges.length === 0 ? (
            <p className="text-xs text-muted-foreground">No price changes</p>
          ) : (
            <div className="space-y-1.5">
              {priceChanges.map((c, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{c.date} — {c.grade}</span>
                  <span>${c.oldPrice.toFixed(3)} → ${c.newPrice.toFixed(3)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Fuel Type Details */}
        <div>
          <h4 className="text-xs font-semibold mb-2">Fuel Type Details</h4>
          <div className="space-y-1.5">
            {fuelDetails.map((f) => (
              <div key={f.fuelType} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{f.fuelType}</span>
                <span>{fmt(f.gallons)} gal — {dollar(f.sales)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SheetContent>
  </Sheet>
);
