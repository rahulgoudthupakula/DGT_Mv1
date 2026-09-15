import { Card, CardContent } from "@/components/ui/card";
import { Fuel, DollarSign, Receipt, TrendingUp, BarChart3 } from "lucide-react";

const cards = [
  { label: "Total Gallons Sold", value: "108,100", icon: Fuel, color: "text-blue-600" },
  { label: "Net Sales (Excl. VAT)", value: "$407,450.00", icon: DollarSign, color: "text-emerald-600" },
  { label: "Total VAT", value: "$53,740.00", icon: Receipt, color: "text-amber-600" },
  { label: "Net Profit (After VAT)", value: "$62,280.00", icon: TrendingUp, color: "text-green-600" },
  { label: "Profit / Gallon", value: "$0.576", icon: BarChart3, color: "text-purple-600" },
];

export const GasProfitVatSummaryCards = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
    {cards.map((c) => (
      <Card key={c.label}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">{c.label}</span>
            <c.icon className={`h-4 w-4 ${c.color}`} />
          </div>
          <p className="text-lg font-bold">{c.value}</p>
        </CardContent>
      </Card>
    ))}
  </div>
);
