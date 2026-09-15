import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Info, CalendarClock } from "lucide-react";

const notes = [
  { icon: AlertTriangle, color: "text-warning", title: "VAT Rate Change", desc: "15% → 16% effective Jul 1, 2025. Update POS tax tables before cutover." },
  { icon: Info, color: "text-muted-foreground", title: "Rounding Rule", desc: "VAT amounts rounded to nearest cent per line item (standard rounding)." },
  { icon: CalendarClock, color: "text-primary", title: "Filing Reminder", desc: "Q2 2025 VAT return due by Jul 31, 2025. Current period: Apr 1 – Jun 30." },
];

export const SalesVatComplianceNotes = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-semibold">Controls & Compliance Notes</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {notes.map((n, i) => (
        <div key={i} className="flex items-start gap-3 text-sm">
          <n.icon className={`h-4 w-4 mt-0.5 shrink-0 ${n.color}`} />
          <div>
            <p className="font-medium">{n.title}</p>
            <p className="text-muted-foreground text-xs">{n.desc}</p>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);
