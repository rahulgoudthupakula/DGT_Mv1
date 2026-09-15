import { AlertTriangle, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface GasProfitVarianceStripProps {
  varianceGallons: number;
  lossImpact: number;
  onViewTankReport: () => void;
}

export const GasProfitVarianceStrip = ({
  varianceGallons,
  lossImpact,
  onViewTankReport,
}: GasProfitVarianceStripProps) => {
  const hasVariance = varianceGallons !== 0;

  return (
    <Card className={hasVariance ? "border-amber-300/50 bg-amber-50/30 dark:bg-amber-950/10" : ""}>
      <CardContent className="py-3 px-4 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4">
          {hasVariance && <AlertTriangle className="h-4 w-4 text-amber-500" />}
          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-muted-foreground">Total Variance: </span>
              <span className={`font-semibold ${hasVariance ? "text-amber-600" : ""}`}>
                {varianceGallons.toLocaleString()} gal
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Loss Impact: </span>
              <span className={`font-semibold ${lossImpact !== 0 ? "text-destructive" : ""}`}>
                ${Math.abs(lossImpact).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onViewTankReport}>
          <ExternalLink className="h-3 w-3" />
          View Tank Report
        </Button>
      </CardContent>
    </Card>
  );
};
