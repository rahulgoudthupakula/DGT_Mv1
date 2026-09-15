import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Fuel, TrendingDown, AlertCircle } from "lucide-react";

const cards = [
  { label: "Total Purchases", value: "$118,470", icon: DollarSign, accent: "text-primary" },
  { label: "Total Gallons Purchased", value: "42,100", icon: Fuel, accent: "text-primary" },
  { label: "Avg Cost / Gallon", value: "$2.814", icon: TrendingDown, accent: "text-primary" },
  { label: "Outstanding (Unpaid)", value: "$26,600", icon: AlertCircle, accent: "text-destructive" },
];

export const PurchaseLogSummaryCards = () => (
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
