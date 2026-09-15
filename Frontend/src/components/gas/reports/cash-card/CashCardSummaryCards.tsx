import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Banknote, CreditCard, PieChart } from "lucide-react";

const cards = [
  { label: "Total Gas Sales", value: "$48,320", icon: DollarSign, accent: "text-primary" },
  { label: "Cash Sales", value: "$18,540", icon: Banknote, accent: "text-primary" },
  { label: "Card Sales", value: "$29,780", icon: CreditCard, accent: "text-primary" },
  { label: "Cash / Card Split", value: "38% / 62%", icon: PieChart, accent: "text-muted-foreground" },
];

export const CashCardSummaryCards = () => (
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
