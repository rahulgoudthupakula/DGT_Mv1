import {useGasSettings} from "./gasSettingsState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const alerts = [
  { key: "low_tank", label: "Low tank alert", desc: "Notify when tank level drops below threshold", dashboard: true, email: false },
  { key: "high_variance", label: "High variance alert", desc: "Flag when delivery variance exceeds tolerance", dashboard: true, email: true },
  { key: "repeated_loss", label: "Repeated loss alert", desc: "Warn on consecutive daily losses", dashboard: true, email: false },
  { key: "missing_reading", label: "Missing tank reading alert", desc: "Alert when daily reading is missing", dashboard: true, email: false },
];

export const AlertsNotifications = () => {const {draft,set,editable}=useGasSettings();return (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-semibold">Alerts & Notifications</CardTitle>
      <p className="text-xs text-muted-foreground">Saved preferences only. Dashboard alerts and email delivery are not active yet.</p>
    </CardHeader>
    <CardContent className="p-0">
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-2 border-b text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        <span>Alert</span>
        <span className="w-16 text-center">Dashboard</span>
        <span className="w-16 text-center">Email</span>
      </div>
      {alerts.map((a) => (
        <div key={a.label} className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center px-4 py-3 border-b last:border-0">
          <div>
            <p className="text-xs font-medium">{a.label}</p>
            <p className="text-[10px] text-muted-foreground">{a.desc}</p>
          </div>
          <div className="w-16 flex justify-center">
            <Switch aria-label={`${a.label} dashboard`} disabled={!editable} checked={Boolean(draft[a.key+"_dashboard"])} onCheckedChange={v=>set(a.key+"_dashboard",v)} />
          </div>
          <div className="w-16 flex justify-center">
            <Switch aria-label={`${a.label} email`} disabled={!editable} checked={Boolean(draft[a.key+"_email"])} onCheckedChange={v=>set(a.key+"_email",v)} />
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);};
