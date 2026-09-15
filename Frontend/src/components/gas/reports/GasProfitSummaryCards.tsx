import { Card, CardContent } from "@/components/ui/card";
import { Fuel, DollarSign, Receipt, TrendingUp, BarChart3 } from "lucide-react";

interface GasProfitSummaryCardsProps {
  totalGallons: number;
  totalSales: number;
  totalFuelCost: number;
  totalTax: number;
  netProfit: number;
  profitPercent: number;
}

const kpiCards = [
  { key: "gallons", label: "Total Gallons Sold", icon: Fuel, format: "gal" },
  { key: "sales", label: "Total Sales $", icon: DollarSign, format: "$" },
  { key: "cost", label: "Total Fuel Cost $", icon: BarChart3, format: "$" },
  { key: "tax", label: "Total Tax $", icon: Receipt, format: "$" },
  { key: "profit", label: "Net Gas Profit", icon: TrendingUp, format: "$%" },
] as const;

export const GasProfitSummaryCards = ({
  totalGallons,
  totalSales,
  totalFuelCost,
  totalTax,
  netProfit,
  profitPercent,
}: GasProfitSummaryCardsProps) => {
  const values: Record<string, string> = {
    gallons: totalGallons.toLocaleString(undefined, { maximumFractionDigits: 0 }) + " gal",
    sales: "$" + totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    cost: "$" + totalFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    tax: "$" + totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    profit: "$" + netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {kpiCards.map((card) => {
        const Icon = card.icon;
        const isProfit = card.key === "profit";
        return (
          <Card key={card.key} className={isProfit ? "border-primary/30 bg-primary/5" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${isProfit ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-xs text-muted-foreground">{card.label}</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className={`text-lg font-bold ${isProfit ? (netProfit >= 0 ? "text-emerald-600" : "text-destructive") : ""}`}>
                  {values[card.key]}
                </p>
                {isProfit && (
                  <span className={`text-xs font-medium ${profitPercent >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                    ({profitPercent.toFixed(1)}%)
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
