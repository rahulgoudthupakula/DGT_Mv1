import { AlertTriangle, TrendingDown, FileCheck } from "lucide-react";

const alerts = [
  { icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10", msg: "Negative value impact spike detected on Feb 01 — Regular, Tank #1 (−$5,838)" },
  { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", msg: "Cost layer change: Premium unit cost changed from $3.22 → $3.35 on Feb 02 delivery" },
  { icon: FileCheck, color: "text-muted-foreground", bg: "bg-muted/40", msg: "Adjustment ADJ-0042 posted on Feb 02 — Premium, Tank #2 (−120 gal)" },
];

export const InventoryCostAlerts = () => (
  <div className="space-y-2">
    {alerts.map((a, i) => (
      <div key={i} className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs ${a.bg}`}>
        <a.icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${a.color}`} />
        <span className="text-foreground">{a.msg}</span>
      </div>
    ))}
  </div>
);
