import { AlertTriangle, TrendingDown, RefreshCw, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Alert {
  id: number;
  icon: React.ReactNode;
  message: string;
  severity: "warning" | "error" | "info";
}

const alerts: Alert[] = [
  { id: 1, icon: <Truck className="h-3.5 w-3.5" />, message: "Diesel price changed but no recent delivery recorded", severity: "warning" },
  { id: 2, icon: <TrendingDown className="h-3.5 w-3.5" />, message: "Diesel margin ($0.249) is below $0.30 threshold", severity: "error" },
  { id: 3, icon: <RefreshCw className="h-3.5 w-3.5" />, message: "Diesel had 3 price changes in the last 48 hours", severity: "warning" },
];

const severityStyles = {
  warning: "border-yellow-500/30 bg-yellow-500/5 text-yellow-700",
  error: "border-destructive/30 bg-destructive/5 text-destructive",
  info: "border-blue-500/30 bg-blue-500/5 text-blue-700",
};

export const GasPriceAlerts = () => {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <span className="text-xs font-semibold text-foreground">Alerts & Flags</span>
        <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-600 border-0">{alerts.length}</Badge>
      </div>
      <div className="space-y-1.5">
        {alerts.map((alert) => (
          <div key={alert.id} className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs cursor-pointer hover:opacity-80 transition-opacity ${severityStyles[alert.severity]}`}>
            {alert.icon}
            <span>{alert.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
