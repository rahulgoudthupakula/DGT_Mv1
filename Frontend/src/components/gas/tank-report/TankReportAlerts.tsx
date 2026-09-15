import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, TrendingDown, Truck, Bell } from "lucide-react";

const alerts = [
  {
    icon: Clock,
    text: "Missing closing reading for Tank T-04 (yesterday)",
    severity: "error" as const,
  },
  {
    icon: Truck,
    text: "Delivery BOL #78432 not yet reconciled with invoice",
    severity: "warning" as const,
  },
  {
    icon: TrendingDown,
    text: "Tank T-04 has repeated losses for 3 consecutive days",
    severity: "error" as const,
  },
  {
    icon: AlertTriangle,
    text: "Variance trend increasing for Tank T-02 this week (+0.3% → +0.8%)",
    severity: "warning" as const,
  },
];

const severityStyles = {
  error: "bg-destructive/10 text-destructive",
  warning: "bg-amber-500/10 text-amber-700",
};

export const TankReportAlerts = () => {
  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Bell className="h-4.5 w-4.5 text-primary" />
            Alerts & Flags
          </CardTitle>
          <span className="text-[11px] text-muted-foreground">{alerts.length} active</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <button
              key={i}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-left transition-colors hover:opacity-80 ${severityStyles[alert.severity]}`}
            >
              <alert.icon className="h-3.5 w-3.5 shrink-0" />
              <span>{alert.text}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
