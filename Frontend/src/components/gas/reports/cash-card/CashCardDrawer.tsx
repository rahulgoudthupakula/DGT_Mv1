import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import type { CashCardRow } from "./CashCardTable";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  row: CashCardRow | null;
}

const fmtDollar = (v: number | undefined) => "$" + (v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const CashCardDrawer = ({ open, onOpenChange, row }: Props) => {
  if (!row) return null;

  const totalSales = row.cashAmount + row.cardAmount;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">Detail — {row.date} / {row.fuelType}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><span className="text-muted-foreground">Date</span><p className="font-medium text-foreground">{row.date}</p></div>
            <div><span className="text-muted-foreground">Fuel Type</span><p className="font-medium text-foreground">{row.fuelType}</p></div>
          </div>

          <Separator />

          {/* A) Tender Breakdown */}
          <div className="space-y-2">
            <h5 className="text-xs font-semibold">Tender Breakdown</h5>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Cash Total</span><span className="text-foreground font-medium">{fmtDollar(row.cashAmount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Card Total</span><span className="text-foreground font-medium">{fmtDollar(row.cardAmount)}</span></div>
              <Separator />
              <div className="flex justify-between font-semibold"><span>Total Sales</span><span>{fmtDollar(totalSales)}</span></div>
            </div>
          </div>

          <Separator />

          {/* B) Card Summary */}
          <div className="space-y-2">
            <h5 className="text-xs font-semibold">Card Summary</h5>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">No. of Cards</span><span className="text-foreground">{row.cardCount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Card Amount</span><span className="text-foreground font-medium">{fmtDollar(row.cardAmount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Card Commission</span><span className="text-foreground font-medium">{fmtDollar(row.cardCommission)}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-muted-foreground">Net Card Amount</span><span className="text-foreground font-semibold">{fmtDollar(row.cardAmount - row.cardCommission)}</span></div>
            </div>
          </div>

          <Separator />

          {/* C) Reconciliation Snapshot */}
          <div className="space-y-2">
            <h5 className="text-xs font-semibold">Reconciliation Snapshot</h5>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">POS-Reported Total</span><span className="text-foreground font-medium">{fmtDollar(totalSales)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Bank/Accounting Total</span><span className="text-foreground font-medium">{fmtDollar(totalSales)}</span></div>
              <Separator />
              <div className="flex justify-between font-semibold"><span>Variance</span><span className="text-primary">$0.00</span></div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
