import { Card, CardContent } from "@/components/ui/card";
import { Package, DollarSign, Tag, Zap } from "lucide-react";

interface SalesSummaryData {
  unitsSold: number;
  netSales: number;
  avgSellingPrice: number;
  salesVelocity: number;
}

interface SalesComparison {
  unitsSoldChange: number;
  netSalesChange: number;
  avgPriceChange: number;
  velocityChange: number;
}

interface SalesSummaryCardsProps {
  data: SalesSummaryData;
  comparison: SalesComparison;
}

const ChangeIndicator = ({ value }: { value: number }) => {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <span className={`text-[10px] font-medium ${isPositive ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
      {isPositive ? "▲" : "▼"} {Math.abs(value).toFixed(1)}%
    </span>
  );
};

export const SalesSummaryCards = ({ data, comparison }: SalesSummaryCardsProps) => {
  const cards = [
    {
      label: "Units Sold",
      value: data.unitsSold.toLocaleString(),
      icon: Package,
      change: comparison.unitsSoldChange,
    },
    {
      label: "Net Sales",
      value: `$${data.netSales.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      change: comparison.netSalesChange,
    },
    {
      label: "Avg Selling Price",
      value: `$${data.avgSellingPrice.toFixed(2)}`,
      icon: Tag,
      change: comparison.avgPriceChange,
    },
    {
      label: "Sales Velocity",
      value: `${data.salesVelocity.toFixed(1)} /day`,
      icon: Zap,
      change: comparison.velocityChange,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-muted-foreground font-medium">{card.label}</span>
              <card.icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">{card.value}</span>
              <ChangeIndicator value={card.change} />
            </div>
            
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
