import {
  AlertTriangle,
  Gauge,
  TrendingDown,
  Droplets,
  FileWarning,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AlertItem {
  icon: React.ElementType;
  message: string;
  severity: "error" | "warning" | "info";
  time: string;
}

const alerts: AlertItem[] = [
  {
    icon: Gauge,
    message: "Missing tank reading today — Diesel (T-04)",
    severity: "error",
    time: "Now",
  },
  {
    icon: TrendingDown,
    message: "Negative variance: Regular delivery vs expected (-120 gal)",
    severity: "warning",
    time: "6:15 AM",
  },
  {
    icon: Droplets,
    message: "Low tank threshold crossed — Plus (T-02) at 22%",
    severity: "error",
    time: "5:30 AM",
  },
  {
    icon: FileWarning,
    message: "Delivery pending invoice — Diesel Direct (Feb 08)",
    severity: "warning",
    time: "Yesterday",
  },
  {
    icon: Activity,
    message: "Unusual loss detected — Diesel (T-04), suspected shrink/leak",
    severity: "error",
    time: "Yesterday",
  },
];

const severityStyles = {
  error: "bg-red-500/10 border-red-200 text-red-700",
  warning: "bg-amber-500/10 border-amber-200 text-amber-700",
  info: "bg-blue-500/10 border-blue-200 text-blue-700",
};

export const GasExceptionsAlerts = () => {
  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4.5 w-4.5 text-destructive" />
            Exceptions & Alerts
          </CardTitle>
          <span className="text-[11px] text-muted-foreground">
            {alerts.filter((a) => a.severity === "error").length} critical
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((alert, i) => (
          <button
            key={i}
            className={`w-full flex items-start gap-2.5 p-2.5 rounded-md border text-left transition-colors hover:opacity-80 cursor-pointer ${
              severityStyles[alert.severity]
            }`}
          >
            <alert.icon className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium leading-tight">{alert.message}</p>
              <p className="text-[10px] opacity-70 mt-0.5">{alert.time}</p>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
};
