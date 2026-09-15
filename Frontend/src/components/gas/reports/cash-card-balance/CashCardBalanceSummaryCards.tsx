import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownLeft, ArrowUpRight, Wallet, Scale, AlertTriangle } from "lucide-react";

const cards = [
  { label: "Opening Balance", value: "$12,450", icon: Wallet, color: "text-muted-foreground" },
  { label: "Inflow (Gas Sales)", value: "$48,320", icon: ArrowDownLeft, color: "text-primary" },
  { label: "Outflow (Deposits/Settlements)", value: "$47,890", icon: ArrowUpRight, color: "text-primary" },
  { label: "Closing Balance", value: "$12,880", icon: Wallet, color: "text-primary" },
  { label: "Outstanding / Variance", value: "$430", icon: AlertTriangle, color: "text-[hsl(var(--warning,45_93%_47%))]", statusColor: "border-[hsl(45,93%,47%)]" },
];

export const CashCardBalanceSummaryCards = () => (
  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
    {cards.map((c) => (
      <Card key={c.label} className={c.statusColor ? `border-l-4 ${c.statusColor}` : ""}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">{c.label}</span>
            <c.icon className={`h-4 w-4 ${c.color}`} />
          </div>
          <p className="text-xl font-bold text-foreground">{c.value}</p>
        </CardContent>
      </Card>
    ))}
  </div>
);
