import { Card, CardContent } from "@/components/ui/card";
import { Droplets, TrendingDown, TrendingUp, Fuel, Truck } from "lucide-react";

interface TankSummaryCardsProps {
  tank: string;
}

const summaryData: Record<string, {
  opening: number;
  delivered: number;
  sales: number;
  closing: number;
  variance: number;
  variancePct: number;
}> = {
  "T-01": { opening: 5800, delivered: 4000, sales: 4600, closing: 5200, variance: 0, variancePct: 0 },
  "T-02": { opening: 3200, delivered: 0, sales: 1400, closing: 1800, variance: 0, variancePct: 0 },
  "T-03": { opening: 5500, delivered: 0, sales: 1400, closing: 4100, variance: 0, variancePct: 0 },
  "T-04": { opening: 2100, delivered: 0, sales: 1300, closing: 800, variance: 0, variancePct: 0 },
};

// Compute variance
Object.values(summaryData).forEach((d) => {
  const expected = d.opening + d.delivered - d.sales;
  d.variance = d.closing - expected;
  d.variancePct = expected !== 0 ? (d.variance / expected) * 100 : 0;
});

const getVarianceStatus = (pct: number) => {
  const abs = Math.abs(pct);
  if (abs <= 0.5) return { color: "text-emerald-600", bg: "bg-emerald-500/10", label: "Within tolerance" };
  if (abs <= 1) return { color: "text-amber-600", bg: "bg-amber-500/10", label: "Warning" };
  return { color: "text-red-600", bg: "bg-red-500/10", label: "Critical" };
};

export const TankSummaryCards = ({ tank }: TankSummaryCardsProps) => {
  const data = summaryData[tank] || summaryData["T-01"];
  const status = getVarianceStatus(data.variancePct);

  const cards = [
    { label: "Opening Level", value: `${data.opening.toLocaleString()} gal`, icon: Droplets, color: "text-muted-foreground" },
    { label: "Delivered", value: `${data.delivered.toLocaleString()} gal`, icon: Truck, color: "text-primary" },
    { label: "Sales", value: `${data.sales.toLocaleString()} gal`, icon: Fuel, color: "text-muted-foreground" },
    { label: "Closing Level", value: `${data.closing.toLocaleString()} gal`, icon: Droplets, color: "text-muted-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{c.label}</span>
              <c.icon className={`h-4 w-4 ${c.color}/60`} />
            </div>
            <div className="text-xl font-bold text-foreground">{c.value}</div>
          </CardContent>
        </Card>
      ))}

      {/* Variance card */}
      <Card className={`border-border ${status.bg}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Variance</span>
            {data.variance >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </div>
          <div className={`text-xl font-bold ${status.color}`}>
            {data.variance >= 0 ? "+" : ""}{data.variance.toLocaleString()} gal
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-medium ${status.color}`}>
              {data.variancePct >= 0 ? "+" : ""}{data.variancePct.toFixed(2)}%
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${status.bg} ${status.color} font-medium`}>
              {status.label}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
