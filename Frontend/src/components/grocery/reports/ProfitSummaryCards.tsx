import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Percent, ArrowUp, ArrowDown } from "lucide-react";

interface SummaryData {
  netSales: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
}

interface ComparisonData {
  netSalesChange: number;
  cogsChange: number;
  grossProfitChange: number;
  grossMarginChange: number;
}

interface ProfitSummaryCardsProps {
  data: SummaryData;
  comparison?: ComparisonData;
}

const ChangeIndicator = ({ change }: { change: number }) => {
  if (Math.abs(change) < 0.1) return null;
  const isPositive = change > 0;
  return (
    <div className={`flex items-center gap-0.5 text-[11px] font-medium ${
      isPositive ? "text-[hsl(var(--success))]" : "text-destructive"
    }`}>
      {isPositive ? (
        <ArrowUp className="h-3 w-3" />
      ) : (
        <ArrowDown className="h-3 w-3" />
      )}
      {Math.abs(change).toFixed(1)}%
      <span className="text-muted-foreground font-normal ml-0.5">vs prev</span>
    </div>
  );
};

export const ProfitSummaryCards = ({ data, comparison }: ProfitSummaryCardsProps) => {
  const cards = [
    {
      label: "Net Sales",
      value: `$${data.netSales?.toLocaleString("en-US", { minimumFractionDigits: 2 })??"—"}`,
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
      change: comparison?.netSalesChange,
    },
    {
      label: "COGS",
      value: `$${data.cogs?.toLocaleString("en-US", { minimumFractionDigits: 2 })??"—"}`,
      icon: TrendingDown,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      change: comparison ? -comparison.cogsChange : undefined, // invert: lower COGS = good
    },
    {
      label: "Gross Profit",
      value: `$${data.grossProfit?.toLocaleString("en-US", { minimumFractionDigits: 2 })??"—"}`,
      icon: TrendingUp,
      color: "text-[hsl(var(--success))]",
      bgColor: "bg-[hsl(var(--success))]/10",
      change: comparison?.grossProfitChange,
    },
    {
      label: "Gross Margin",
      value: `${(data.grossMargin?.toFixed(1)??"—")}%`,
      icon: Percent,
      color: data.grossMargin >= 25 ? "text-[hsl(var(--success))]" : "text-[hsl(var(--warning))]",
      bgColor: data.grossMargin >= 25 ? "bg-[hsl(var(--success))]/10" : "bg-[hsl(var(--warning))]/10",
      change: comparison?.grossMarginChange,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-lg font-bold">{card.value}</p>
                
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
