import { Card, CardContent } from "@/components/ui/card";
import { Truck, Droplets, DollarSign, TrendingDown } from "lucide-react";

const cards = [
  { label: "Total Deliveries", value: "24", icon: Truck, accent: "text-primary" },
  { label: "Total Gallons Delivered", value: "198,450", icon: Droplets, accent: "text-primary" },
  { label: "Total Delivery Cost", value: "$512,385", icon: DollarSign, accent: "text-success" },
  { label: "Avg Cost / Gallon", value: "$2.582", icon: TrendingDown, accent: "text-warning" },
];

export const JobberLogSummaryCards = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {cards.map((c) => (
      <Card key={c.label} className="border border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{c.label}</span>
            <c.icon className={`h-4 w-4 ${c.accent}`} />
          </div>
          <p className="text-xl font-bold mt-1 text-foreground">{c.value}</p>
        </CardContent>
      </Card>
    ))}
  </div>
);
