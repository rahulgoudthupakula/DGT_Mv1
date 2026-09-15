import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { BalanceRow } from "./CashCardBalanceTable";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  row: BalanceRow | null;
}

const fmt = (v: number | null | undefined) => {
  if (v === null || v === undefined) return "—";
  const abs = Math.abs(v);
  const str = "$" + abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v < 0 ? `(${str})` : str;
};

const CardSettlementDetail = ({ row }: { row: BalanceRow }) => (
  <div className="space-y-2">
    <h5 className="text-xs font-semibold">Card Settlement Detail</h5>
    <div className="space-y-1.5 text-xs">
      <div className="flex justify-between"><span className="text-muted-foreground">Processor</span><span className="text-foreground">Worldpay</span></div>
      <div className="flex justify-between"><span className="text-muted-foreground">Batch Count</span><span className="text-foreground">4</span></div>
      <div className="flex justify-between"><span className="text-muted-foreground">Gross Card Sales</span><span className="text-foreground font-medium">{fmt(row.gasSalesInflow)}</span></div>
      <div className="flex justify-between"><span className="text-muted-foreground">Fees</span><span className="text-foreground">{fmt(Math.round(row.gasSalesInflow * 0.025 * 100) / 100)}</span></div>
      <Separator />
      <div className="flex justify-between font-semibold"><span>Net Settlement</span><span>{fmt(Math.round(row.gasSalesInflow * 0.975 * 100) / 100)}</span></div>
      <div className="flex justify-between"><span className="text-muted-foreground">Settlement Date</span><span className="text-foreground">Feb 05, 2025</span></div>
      <div className="flex justify-between"><span className="text-muted-foreground">Reference #</span><span className="text-foreground">STL-20250205-001</span></div>
    </div>
  </div>
);

const CashDetail = ({ row }: { row: BalanceRow }) => {
  const cashOnHand = row.gasSalesInflow - row.depositsSettlements + row.refundsAdjustments + row.openingBalance;
  const shortOver = (row.actualClosing ?? cashOnHand) - cashOnHand;
  return (
    <div className="space-y-2">
      <h5 className="text-xs font-semibold">Cash Detail</h5>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between"><span className="text-muted-foreground">Cash Collected (POS)</span><span className="text-foreground font-medium">{fmt(row.gasSalesInflow)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Deposits Recorded</span><span className="text-foreground">{fmt(row.depositsSettlements)}</span></div>
        <Separator />
        <div className="flex justify-between"><span className="text-muted-foreground">Cash on Hand (System)</span><span className="text-foreground font-medium">{fmt(cashOnHand)}</span></div>
        <div className="flex justify-between font-semibold">
          <span>Short / Over</span>
          <span className={shortOver !== 0 ? "text-destructive" : "text-[hsl(142,71%,45%)]"}>
            {shortOver === 0 ? "Even" : fmt(shortOver)}
          </span>
        </div>
      </div>
    </div>
  );
};

export const CashCardBalanceDrawer = ({ open, onOpenChange, row }: Props) => {
  if (!row) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">{row.tenderType} Balance Detail</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Balance Summary */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><span className="text-muted-foreground">Tender Type</span><p className="font-medium text-foreground">{row.tenderType}</p></div>
            <div><span className="text-muted-foreground">Status</span><p><Badge variant="outline" className="text-[10px]">{row.status}</Badge></p></div>
          </div>

          <Separator />

          {/* Balance Flow */}
          <div className="space-y-2">
            <h5 className="text-xs font-semibold">Balance Flow</h5>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Opening Balance</span><span className="text-foreground font-medium">{fmt(row.openingBalance)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">+ Gas Sales Inflow</span><span className="text-foreground">{fmt(row.gasSalesInflow)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">± Refunds / Adjustments</span><span className="text-foreground">{fmt(row.refundsAdjustments)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">− Deposits / Settlements</span><span className="text-foreground">{fmt(row.depositsSettlements)}</span></div>
              <Separator />
              <div className="flex justify-between font-semibold"><span>Expected Closing</span><span>{fmt(row.expectedClosing)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Actual Closing</span><span className="text-foreground">{fmt(row.actualClosing)}</span></div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Variance</span>
                <span className={row.variance !== 0 ? "text-destructive" : "text-[hsl(142,71%,45%)]"}>
                  {row.variance === 0 ? "$0.00" : fmt(row.variance)}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tender-specific detail */}
          {row.tenderType === "Card" ? <CardSettlementDetail row={row} /> : <CashDetail row={row} />}
        </div>
      </SheetContent>
    </Sheet>
  );
};
