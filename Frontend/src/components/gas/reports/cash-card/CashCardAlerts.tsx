import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, XCircle, Info } from "lucide-react";

const alerts = [
  { icon: XCircle, title: "Cash/Card Variance", desc: "Batch BATCH-0203-S2 has a $42 variance beyond the $25 tolerance.", variant: "destructive" as const },
  { icon: AlertTriangle, title: "Missing Batch", desc: "No batch data found for Feb 05 Shift 2 — verify POS upload.", variant: "default" as const },
  { icon: Info, title: "Unsettled Card Batch", desc: "BATCH-0204-S1 card batch has not been settled with processor.", variant: "default" as const },
];

export const CashCardAlerts = () => (
  <div className="space-y-2">
    {alerts.map((a, i) => (
      <Alert key={i} variant={a.variant}>
        <a.icon className="h-4 w-4" />
        <AlertTitle className="text-xs font-semibold">{a.title}</AlertTitle>
        <AlertDescription className="text-xs">{a.desc}</AlertDescription>
      </Alert>
    ))}
  </div>
);
