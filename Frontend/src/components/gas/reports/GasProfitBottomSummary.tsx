import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface BottomSummaryData {
  cashCardCommission: number;
  cashCardCommissionAdj: number;
  creditCardAdj: number;
  creditCardFees: number;
  creditCardBatchFees: number;
  freightCost: number;
  miscCost: number;
  fleetCardNetGainLoss: number;
  gasCommission: number;
  netProfit: number;
  netProfitPerVolume: number;
  gasInventoryAdj: number;
  netProfitAfterAdj: number;
  netProfitPerVolumeAfterAdj: number;
}

interface GasProfitBottomSummaryProps {
  data: BottomSummaryData;
}

const fmtDollar = (v: number) =>
  "$" + Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const signedDollar = (v: number) =>
  (v < 0 ? "-" : "") + fmtDollar(v);

const profitColor = (v: number) =>
  v >= 0 ? "text-emerald-600" : "text-destructive";

export const GasProfitBottomSummary = ({ data }: GasProfitBottomSummaryProps) => {
  const rows: { label: string; value: number; bold?: boolean; separator?: boolean }[] = [
    { label: "Total Cash Card Commission", value: data.cashCardCommission },
    { label: "Total Cash Card Commission Adjustments", value: data.cashCardCommissionAdj },
    { label: "Total Credit Card Adjustments", value: data.creditCardAdj },
    { label: "Total Credit Card Fees", value: data.creditCardFees },
    { label: "Total Credit Card Batch Fees", value: data.creditCardBatchFees },
    { label: "Total Freight Cost", value: data.freightCost },
    { label: "Total Miscellaneous Cost", value: data.miscCost },
    { label: "Fleet Card Net Gain/Loss", value: data.fleetCardNetGainLoss },
    { label: "Total Gas Commission", value: data.gasCommission },
    { label: "Net Profit", value: data.netProfit, bold: true, separator: true },
    { label: "Net Profit per Volume", value: data.netProfitPerVolume, bold: true },
    { label: "Total Gas Inventory Adjustments", value: data.gasInventoryAdj, separator: true },
    { label: "Net Profit After Adjustments", value: data.netProfitAfterAdj, bold: true },
    { label: "Net Profit per Volume After Adjustments", value: data.netProfitPerVolumeAfterAdj, bold: true },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-1.5">
          {rows.map((row, i) => (
            <div key={i}>
              {row.separator && <Separator className="my-2" />}
              <div className={`flex justify-between items-center text-xs py-1 ${row.bold ? "font-semibold" : ""}`}>
                <span className={row.bold ? "text-sm" : "text-muted-foreground"}>{row.label}</span>
                <span className={`${row.bold ? "text-sm" : ""} ${profitColor(row.value)}`}>
                  {signedDollar(row.value)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
