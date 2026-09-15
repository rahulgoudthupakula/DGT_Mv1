import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Truck, DollarSign, Gauge, Receipt } from "lucide-react";

interface DeliveryInfo {
  bol: string;
  vendor: string;
  gallons: number;
  costPerGal: number;
  total: number;
}

interface PriceChange {
  date: string;
  grade: string;
  oldPrice: number;
  newPrice: number;
}

interface GasProfitDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  deliveries: DeliveryInfo[];
  priceChanges: PriceChange[];
  tankVariance: { expected: number; actual: number; variance: number };
  taxBreakdown: { federal: number; state: number; local: number; total: number };
}

const fmtDollar = (v: number) =>
  "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const GasProfitDrawer = ({
  open,
  onClose,
  title,
  deliveries,
  priceChanges,
  tankVariance,
  taxBreakdown,
}: GasProfitDrawerProps) => {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">{title}</SheetTitle>
          <SheetDescription>Profit drill-down details (read-only)</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Linked Deliveries */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">Linked Deliveries</h4>
            </div>
            {deliveries.length === 0 ? (
              <p className="text-xs text-muted-foreground">No deliveries linked.</p>
            ) : (
              <div className="space-y-2">
                {deliveries.map((d, i) => (
                  <div key={i} className="bg-muted/40 rounded-md p-3 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium">BOL #{d.bol}</span>
                      <Badge variant="outline" className="text-[10px]">{d.vendor}</Badge>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>{d.gallons.toLocaleString()} gal @ {fmtDollar(d.costPerGal)}/gal</span>
                      <span className="font-medium text-foreground">{fmtDollar(d.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <Separator />

          {/* Price Changes */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">Price Changes During Period</h4>
            </div>
            {priceChanges.length === 0 ? (
              <p className="text-xs text-muted-foreground">No price changes.</p>
            ) : (
              <div className="space-y-2">
                {priceChanges.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-muted/40 rounded-md p-2.5">
                    <div>
                      <span className="font-medium">{p.grade}</span>
                      <span className="text-muted-foreground ml-2">{p.date}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{fmtDollar(p.oldPrice)}</span>
                      <span className="mx-1.5">→</span>
                      <span className="font-medium">{fmtDollar(p.newPrice)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <Separator />

          {/* Tank Variance */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">Tank Variance Summary</h4>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-muted/40 rounded-md p-2.5 text-center">
                <p className="text-muted-foreground mb-0.5">Expected</p>
                <p className="font-semibold">{tankVariance.expected.toLocaleString()} gal</p>
              </div>
              <div className="bg-muted/40 rounded-md p-2.5 text-center">
                <p className="text-muted-foreground mb-0.5">Actual</p>
                <p className="font-semibold">{tankVariance.actual.toLocaleString()} gal</p>
              </div>
              <div className={`rounded-md p-2.5 text-center ${tankVariance.variance !== 0 ? "bg-amber-50 dark:bg-amber-950/20" : "bg-muted/40"}`}>
                <p className="text-muted-foreground mb-0.5">Variance</p>
                <p className={`font-semibold ${tankVariance.variance !== 0 ? "text-amber-600" : ""}`}>
                  {tankVariance.variance > 0 ? "+" : ""}{tankVariance.variance.toLocaleString()} gal
                </p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Tax Breakdown */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">Tax Breakdown</h4>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Federal Tax</span>
                <span>{fmtDollar(taxBreakdown.federal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">State Tax</span>
                <span>{fmtDollar(taxBreakdown.state)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Local Tax</span>
                <span>{fmtDollar(taxBreakdown.local)}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between font-semibold">
                <span>Total Tax</span>
                <span>{fmtDollar(taxBreakdown.total)}</span>
              </div>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
};
