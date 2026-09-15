import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

export const GasProfitVatInsightStrip = () => (
  <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg border text-sm">
    <div className="flex items-center gap-2">
      <TrendingUp className="h-4 w-4 text-green-600" />
      <span className="text-muted-foreground">Best by Profit/Gal:</span>
      <span className="font-semibold">10% VAT — $0.633/gal</span>
    </div>
    <div className="flex items-center gap-2">
      <TrendingDown className="h-4 w-4 text-amber-600" />
      <span className="text-muted-foreground">Worst by Profit/Gal:</span>
      <span className="font-semibold">5% VAT — $0.485/gal</span>
    </div>
    <div className="flex items-center gap-2">
      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground">No VAT band has negative profit this period.</span>
    </div>
  </div>
);
