import { Fuel, DollarSign, TrendingUp, Droplets, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const kpis = [
  {
    label: "Gallons Sold",
    value: "12,480",
    icon: Fuel,
    change: "+3.2%",
    positive: true,
  },
  {
    label: "Sales $",
    value: "$43,680",
    icon: DollarSign,
    change: "+5.1%",
    positive: true,
  },
  {
    label: "Cost $ (Delivered)",
    value: "$38,940",
    icon: BarChart3,
    change: "+4.8%",
    positive: false,
  },
  {
    label: "Gross Margin",
    value: "$4,740",
    subValue: "10.8%",
    icon: TrendingUp,
    change: "+0.3%",
    positive: true,
  },
  {
    label: "Inventory on Hand",
    value: "18,250 gal",
    icon: Droplets,
    change: "-2.1%",
    positive: false,
  },
];

export const GasKpiCards = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                {kpi.label}
              </span>
              <kpi.icon className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <div className="text-xl font-bold text-foreground">{kpi.value}</div>
            <div className="flex items-center gap-2 mt-1">
              {kpi.subValue && (
                <span className="text-xs text-muted-foreground">{kpi.subValue}</span>
              )}
              <span
                className={`text-[11px] font-medium ${
                  kpi.positive ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {kpi.change}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
