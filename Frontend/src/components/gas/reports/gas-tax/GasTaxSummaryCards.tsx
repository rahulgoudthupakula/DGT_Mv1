import { Card, CardContent } from "@/components/ui/card";
import { Fuel, DollarSign, TrendingDown, Receipt } from "lucide-react";

const cards = [
  { label: "Taxable Gallons", value: "124,580 gal", icon: Fuel, accent: "text-primary" },
  { label: "Total Gas Tax", value: "$22,424.40", icon: DollarSign, accent: "text-primary" },
  { label: "Avg Tax / Gallon", value: "$0.180", icon: TrendingDown, accent: "text-primary" },
  { label: "Tax Payable (Net)", value: "$21,890.15", icon: Receipt, accent: "text-muted-foreground" },
];

export const GasTaxSummaryCards = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {cards.map((c) => (
      <Card key={c.label}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">{c.label}</span>
            <c.icon className={`h-4 w-4 ${c.accent}`} />
          </div>
          <p className="text-xl font-bold text-foreground">{c.value}</p>
        </CardContent>
      </Card>
    ))}
  </div>
);
