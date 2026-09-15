import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface Props {
  open: boolean;
  onClose: () => void;
  row: any | null;
}

export const SalesVatDrawer = ({ open, onClose, row }: Props) => {
  if (!row) return null;

  const label = row.date ? `${row.date} — ${row.vatRate}%` : `VAT ${row.vatRate}%`;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">VAT Detail — {label}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* POS Batches */}
          <div>
            <h4 className="text-sm font-semibold mb-3">POS Sales Batches</h4>
            <div className="space-y-2 text-sm">
              {[
                { batch: "B-20250601-01", gallons: row.date ? 2800 : 28400, time: "06:00–14:00" },
                { batch: "B-20250601-02", gallons: row.date ? 1720 : 24000, time: "14:00–22:00" },
              ].map((b) => (
                <div key={b.batch} className="flex items-center justify-between p-2 bg-muted/40 rounded">
                  <div>
                    <p className="font-medium text-foreground">{b.batch}</p>
                    <p className="text-xs text-muted-foreground">{b.time}</p>
                  </div>
                  <span className="font-medium">{b.gallons.toLocaleString()} gal</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Fuel Types Included */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Fuel Types Included</h4>
            <div className="flex flex-wrap gap-2">
              {["Regular", "Plus", "Premium", "Diesel"].slice(0, row.vatRate <= 10 ? 2 : 4).map((f) => (
                <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* VAT Rate Details */}
          <div>
            <h4 className="text-sm font-semibold mb-3">VAT Rate Details</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Rate</p>
                <p className="font-medium">{row.vatRate}%</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Effective Date</p>
                <p className="font-medium">Jan 1, 2025</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Category</p>
                <p className="font-medium">Standard Rate</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Status</p>
                <Badge variant="outline" className="text-xs">Active</Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Manual Corrections */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Manual Corrections</h4>
            {row.adjustments && row.adjustments !== 0 ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-muted/40 rounded">
                  <div>
                    <p className="font-medium text-foreground">Rate Reclassification</p>
                    <p className="text-xs text-muted-foreground">Ref: COR-0601-01</p>
                  </div>
                  <span className="font-medium text-destructive">
                    ${(row.adjustments ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No corrections for this period.</p>
            )}
          </div>

          <Separator />

          {/* Reference IDs */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Reference IDs</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">VAT Filing Ref</p>
                <p className="font-medium">VAT-2025-Q2-0018</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">POS Report ID</p>
                <p className="font-medium">POS-RPT-0601</p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
