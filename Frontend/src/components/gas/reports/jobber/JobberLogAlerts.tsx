import { AlertTriangle, Clock, FileWarning } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const alerts = [
  { type: "error" as const, icon: AlertTriangle, message: "Variance > tolerance: BOL-24495 Regular Tank #1 (−85 gal)", time: "Feb 8" },
  { type: "warning" as const, icon: Clock, message: "2 deliveries not reconciled (>48 hrs)", time: "Feb 7–9" },
  { type: "error" as const, icon: FileWarning, message: "2 deliveries missing invoice #", time: "Action needed" },
];

export const JobberLogAlerts = () => (
  <div className="flex flex-wrap gap-3">
    {alerts.map((a, i) => (
      <div
        key={i}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
          a.type === "error"
            ? "bg-destructive/10 border-destructive/30 hover:bg-destructive/15"
            : "bg-warning/10 border-warning/30 hover:bg-warning/15"
        }`}
      >
        <a.icon className={`h-4 w-4 shrink-0 ${a.type === "error" ? "text-destructive" : "text-warning"}`} />
        <span className="text-xs font-medium text-foreground">{a.message}</span>
        <Badge variant="outline" className="text-[10px] ml-1">{a.time}</Badge>
      </div>
    ))}
  </div>
);
