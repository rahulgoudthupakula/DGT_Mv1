import { Card, CardContent } from "@/components/ui/card";
import { Fuel, DollarSign, TrendingUp, TrendingDown } from "lucide-react";

interface GasSalesSummaryCardsProps {
  totalGallons: number;
  totalSales: number;
  avgPricePerGal: number;
  trendPercent: number;
}

const fmt = (v: number, d = 2) =>
  (v ?? 0).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

const cards = [
  { key: "gallons", label: "Total Gallons Sold", icon: Fuel, color: "text-blue-600" },
  { key: "sales", label: "Total Sales", icon: DollarSign, color: "text-emerald-600" },
  { key: "avgPrice", label: "Avg Price / Gal", icon: DollarSign, color: "text-amber-600" },
  { key: "trend", label: "Sales Trend", icon: TrendingUp, color: "text-violet-600" },
] as const;

export const GasSalesSummaryCards = ({
  totalGallons,
  totalSales,
  avgPricePerGal,
  trendPercent,
}: GasSalesSummaryCardsProps) => {
  const trendUp = trendPercent >= 0;
  const TrendIcon = trendUp ? TrendingUp : TrendingDown;

  const values: Record<string, string> = {
    gallons: fmt(totalGallons, 0),
    sales: "$" + fmt(totalSales),
    avgPrice: "$" + fmt(avgPricePerGal, 3),
    trend: `${trendUp ? "+" : ""}${fmt(trendPercent, 1)}%`,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c) => {
        const Icon = c.key === "trend" ? TrendIcon : c.icon;
        return (
          <Card key={c.key}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${c.key === "trend" ? (trendUp ? "text-emerald-600" : "text-destructive") : c.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground leading-tight">{c.label}</p>
                <p className={`text-lg font-bold leading-tight ${c.key === "trend" ? (trendUp ? "text-emerald-600" : "text-destructive") : ""}`}>
                  {values[c.key]}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
