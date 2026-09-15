import { DollarSign, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const cards = [
  {
    label: "Total Payable",
    value: "$24,850.00",
    icon: DollarSign,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    label: "Paid Amount",
    value: "$18,200.00",
    icon: CheckCircle2,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    label: "Outstanding",
    value: "$6,650.00",
    icon: AlertCircle,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    label: "Overdue",
    value: "$2,100.00",
    icon: Clock,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
];

export const PaymentSummaryCards = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
              <div className={`p-1.5 rounded-md ${card.bgColor}`}>
                <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
              </div>
            </div>
            <p className="text-lg font-bold text-foreground">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
