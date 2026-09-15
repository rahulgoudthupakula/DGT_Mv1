import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MarginData {
  fuelType: string;
  deliveryCost: number;
  currentPrice: number;
  margin: number;
  trend: "up" | "down" | "flat";
}

const marginData: MarginData[] = [
  { fuelType: "Regular", deliveryCost: 2.95, currentPrice: 3.299, margin: 0.349, trend: "up" },
  { fuelType: "Plus", deliveryCost: 3.15, currentPrice: 3.599, margin: 0.449, trend: "flat" },
  { fuelType: "Premium", deliveryCost: 3.42, currentPrice: 3.899, margin: 0.479, trend: "up" },
  { fuelType: "Diesel", deliveryCost: 3.55, currentPrice: 3.799, margin: 0.249, trend: "down" },
];

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === "up") return <TrendingUp className="h-3 w-3 text-emerald-600" />;
  if (trend === "down") return <TrendingDown className="h-3 w-3 text-destructive" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
};

export const MarginInsightStrip = () => {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-xs font-semibold text-foreground mb-3">Margin Insight</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {marginData.map((item) => (
          <div key={item.fuelType} className="space-y-1">
            <p className="text-xs font-medium text-foreground">{item.fuelType}</p>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span>Cost: <span className="font-mono">${item.deliveryCost.toFixed(3)}</span></span>
              <span>Margin: <span className={`font-mono font-semibold ${item.margin < 0.3 ? "text-destructive" : "text-emerald-600"}`}>${item.margin.toFixed(3)}</span></span>
              <TrendIcon trend={item.trend} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
