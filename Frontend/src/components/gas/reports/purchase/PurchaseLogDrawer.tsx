import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { PurchaseLogRow } from "./PurchaseLogTable";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  row: PurchaseLogRow | null;
}

const fmt = (v: number, d = 0) => v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

const linkedDeliveries = [
  { bol: "BOL-24501", gallons: 8200, tank: "Tank #1", reconciled: true },
];

const payments = [
  { date: "Feb 11, 2025", method: "EFT", amount: 15000, ref: "EFT-44201" },
  { date: "Feb 13, 2025", method: "Check", amount: 6156, ref: "CHK-3302" },
];

export const PurchaseLogDrawer = ({ open, onOpenChange, row }: Props) => {
  if (!row) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">Purchase Detail — {row.vendor}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Header */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><span className="text-muted-foreground">Vendor / Fuel</span><p className="font-medium text-foreground">{row.vendor}</p></div>
            <div><span className="text-muted-foreground">Date</span><p className="font-medium text-foreground">{row.date}</p></div>
            <div><span className="text-muted-foreground">Amount</span><p className="font-medium text-foreground">${fmt(row.amount)}</p></div>
            <div><span className="text-muted-foreground">Status</span><p><Badge variant={row.status === "Paid" ? "default" : row.status === "Partial" ? "secondary" : "destructive"} className="text-[10px]">{row.status}</Badge></p></div>
          </div>

          <Separator />

          {/* A) Linked Deliveries */}
          <div>
            <h4 className="text-xs font-semibold text-foreground mb-3">Linked Deliveries</h4>
            <div className="space-y-2">
              {linkedDeliveries.map((d) => (
                <div key={d.bol} className="flex items-center justify-between text-xs bg-muted/30 rounded-md px-3 py-2">
                  <div>
                    <span className="font-medium text-primary">{d.bol}</span>
                    <span className="text-muted-foreground ml-2">• {fmt(d.gallons)} gal • {d.tank}</span>
                  </div>
                  <Badge variant={d.reconciled ? "default" : "outline"} className="text-[10px]">{d.reconciled ? "Reconciled" : "Pending"}</Badge>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* B) Cost Breakdown */}
          <div>
            <h4 className="text-xs font-semibold text-foreground mb-3">Cost Breakdown</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Purchased Cost</span><span className="text-foreground">${fmt(row.purchasedCost)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Freight</span><span className="text-foreground">${fmt(row.freightCost)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Misc / VAT</span><span className="text-foreground">${fmt(row.miscCostVat)}</span></div>
              <Separator />
              <div className="flex justify-between font-semibold"><span className="text-foreground">Total</span><span className="text-foreground">${fmt(row.amount)}</span></div>
            </div>
          </div>

          <Separator />

          {/* C) Payment History */}
          <div>
            <h4 className="text-xs font-semibold text-foreground mb-3">Payment History</h4>
            {row.paidAmount > 0 ? (
              <div className="space-y-2">
                {payments.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-muted/30 rounded-md px-3 py-2">
                    <div>
                      <span className="text-foreground">{p.date}</span>
                      <span className="text-muted-foreground ml-2">• {p.method} • {p.ref}</span>
                    </div>
                    <span className="font-medium text-foreground">${fmt(p.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No payments recorded.</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
