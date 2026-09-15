import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, ExternalLink } from "lucide-react";

interface ReconciliationProps {
  tank: string;
}

const reconData: Record<string, {
  opening: number; deliveries: number; sales: number; adjustments: number; actualClosing: number;
}> = {
  "T-01": { opening: 5800, deliveries: 4000, sales: 4600, adjustments: 0, actualClosing: 5200 },
  "T-02": { opening: 3200, deliveries: 0, sales: 1400, adjustments: 0, actualClosing: 1800 },
  "T-03": { opening: 5500, deliveries: 0, sales: 1400, adjustments: 0, actualClosing: 4100 },
  "T-04": { opening: 2100, deliveries: 0, sales: 1300, adjustments: 0, actualClosing: 800 },
};

const getVarianceStatus = (variance: number, expected: number) => {
  const pct = expected !== 0 ? Math.abs(variance / expected) * 100 : 0;
  if (pct <= 0.5) return { color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-200" };
  if (pct <= 1) return { color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-200" };
  return { color: "text-red-600", bg: "bg-red-500/10", border: "border-red-200" };
};

export const TankReconciliation = ({ tank }: ReconciliationProps) => {
  const data = reconData[tank] || reconData["T-01"];
  const expected = data.opening + data.deliveries - data.sales + data.adjustments;
  const variance = data.actualClosing - expected;
  const status = getVarianceStatus(variance, expected);

  const rows = [
    { label: "Opening Level", value: data.opening, sign: "" },
    { label: "+ Deliveries", value: data.deliveries, sign: "+" },
    { label: "− Sales", value: data.sales, sign: "−" },
    { label: "± Adjustments", value: data.adjustments, sign: data.adjustments >= 0 ? "+" : "−" },
  ];

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <ClipboardCheck className="h-4.5 w-4.5 text-primary" />
          Reconciliation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/30 rounded-lg p-5 font-mono text-sm space-y-2 max-w-md">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between text-muted-foreground">
              <span>{r.label}</span>
              <span className="text-foreground font-medium">{r.value.toLocaleString()} gal</span>
            </div>
          ))}
          <div className="border-t border-border my-2" />
          <div className="flex justify-between text-muted-foreground">
            <span>Expected Closing</span>
            <span className="text-foreground font-semibold">{expected.toLocaleString()} gal</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Actual Closing</span>
            <span className="text-foreground font-semibold">{data.actualClosing.toLocaleString()} gal</span>
          </div>
          <div className="border-t border-border my-2" />
          <div className={`flex justify-between items-center rounded-md px-3 py-2 ${status.bg} border ${status.border}`}>
            <span className={`font-semibold ${status.color}`}>Variance</span>
            <span className={`font-bold ${status.color}`}>
              {variance >= 0 ? "+" : ""}{variance.toLocaleString()} gal
            </span>
          </div>
        </div>

        {Math.abs(variance) > 0 && Math.abs(variance / expected) * 100 > 0.5 && (
          <div className="mt-4 flex items-center gap-3">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <ExternalLink className="h-3 w-3" />
              Link to Inventory Adjustment
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
