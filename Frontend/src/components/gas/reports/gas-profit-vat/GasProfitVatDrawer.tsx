import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface Props {
  open: boolean;
  onClose: () => void;
  row: any | null;
}

export const GasProfitVatDrawer = ({ open, onClose, row }: Props) => {
  if (!row) return null;

  const label = row.date ? `${row.date} — ${row.vatRate}%` : `VAT ${row.vatRate}%`;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">Profit Detail — {label}</SheetTitle>
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

          {/* VAT Rate Info */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Applicable VAT Rate</h4>
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

          {/* Cost Layers */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Cost Layers Used</h4>
            <div className="space-y-2 text-sm">
              {[
                { method: "FIFO Layer 1", cost: "$2.85/gal", gallons: "3,200 gal", date: "May 28" },
                { method: "FIFO Layer 2", cost: "$2.92/gal", gallons: "1,800 gal", date: "Jun 01" },
              ].map((l) => (
                <div key={l.method} className="flex items-center justify-between p-2 bg-muted/40 rounded">
                  <div>
                    <p className="font-medium text-foreground">{l.method}</p>
                    <p className="text-xs text-muted-foreground">{l.date} — {l.gallons}</p>
                  </div>
                  <span className="font-medium">{l.cost}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Tank Variance */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Tank Variance Impact</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Variance (gal)</p>
                <p className="font-medium text-destructive">-18 gal</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Cost Impact</p>
                <p className="font-medium text-destructive">-$52.20</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Source</p>
                <p className="font-medium">Tank Reconciliation</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Status</p>
                <Badge variant="secondary" className="text-xs">Reviewed</Badge>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
