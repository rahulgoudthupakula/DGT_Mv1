import { AlertTriangle, Clock, FileWarning, TrendingDown, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const alerts = [
  {
    type: "error" as const,
    icon: FileWarning,
    message: "3 deliveries missing invoice #",
    time: "Action needed",
  },
  {
    type: "warning" as const,
    icon: Clock,
    message: "2 deliveries not reconciled (>48 hrs)",
    time: "Feb 7–8",
  },
  {
    type: "error" as const,
    icon: TrendingDown,
    message: "Variance above tolerance: Tank #2 Regular (-85 gal)",
    time: "Today",
  },
  {
    type: "warning" as const,
    icon: ShieldAlert,
    message: "Unusual loss suspected — Diesel Tank #4",
    time: "Feb 6",
  },
];

export const DeliveryAlerts = () => {
  return (
    <div className="flex flex-wrap gap-3">
      {alerts.map((alert, i) => (
        <div
          key={i}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
            alert.type === "error"
              ? "bg-destructive/10 border-destructive/30 hover:bg-destructive/15"
              : "bg-warning/10 border-warning/30 hover:bg-warning/15"
          }`}
        >
          <alert.icon
            className={`h-4 w-4 shrink-0 ${
              alert.type === "error" ? "text-destructive" : "text-warning"
            }`}
          />
          <span className="text-xs font-medium text-foreground">{alert.message}</span>
          <Badge variant="outline" className="text-[10px] ml-1">
            {alert.time}
          </Badge>
        </div>
      ))}
    </div>
  );
};
