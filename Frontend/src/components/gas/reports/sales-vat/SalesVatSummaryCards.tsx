import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Percent, Receipt, TrendingDown } from "lucide-react";

const cards = [
  { label: "Total VATable Sales", value: "$128,450.00", icon: DollarSign, accent: "text-primary" },
  { label: "Total VAT", value: "$14,260.80", icon: Receipt, accent: "text-destructive" },
  { label: "Avg VAT Rate", value: "11.1%", icon: Percent, accent: "text-warning" },
  { label: "Net Sales (Excl. VAT)", value: "$114,189.20", icon: TrendingDown, accent: "text-emerald-600" },
];

export const SalesVatSummaryCards = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {cards.map((c) => (
      <Card key={c.label}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">{c.label}</span>
            <c.icon className={`h-4 w-4 ${c.accent}`} />
          </div>
          <p className="text-xl font-bold">{c.value}</p>
        </CardContent>
      </Card>
    ))}
  </div>
);
