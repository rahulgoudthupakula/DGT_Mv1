import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Clock, TrendingUp } from "lucide-react";

const alerts = [
  { icon: AlertTriangle, text: "1 delivery uninvoiced for 5+ days (Shell Supply – Diesel, Feb 9)", variant: "destructive" as const },
  { icon: Clock, text: "1 overdue unpaid invoice: INV-8791 – BP Products ($10,830)", variant: "destructive" as const },
  { icon: TrendingUp, text: "Cost spike: Premium cost up $0.05/gal vs previous invoice", variant: "default" as const },
];

export const PurchaseLogAlerts = () => (
  <div className="space-y-2">
    {alerts.map((a, i) => (
      <Alert key={i} variant={a.variant} className="py-2">
        <a.icon className="h-4 w-4" />
        <AlertDescription className="text-xs ml-2">{a.text}</AlertDescription>
      </Alert>
    ))}
  </div>
);
