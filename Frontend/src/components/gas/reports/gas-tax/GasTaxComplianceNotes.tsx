import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Info } from "lucide-react";

const notes = [
  {
    icon: AlertTriangle,
    color: "text-warning",
    text: "Tax rate changed from $0.180 to $0.184/gal effective Jan 1, 2025 (State excise).",
  },
  {
    icon: Info,
    color: "text-muted-foreground",
    text: "Rounding: Tax amounts are rounded to the nearest cent per transaction, then aggregated.",
  },
  {
    icon: Info,
    color: "text-muted-foreground",
    text: "Filing period: Q2 2025 (Apr 1 – Jun 30). Due date: Jul 31, 2025.",
  },
];

export const GasTaxComplianceNotes = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-semibold">Compliance Notes</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {notes.map((n, i) => (
        <div key={i} className="flex items-start gap-2 text-xs">
          <n.icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${n.color}`} />
          <span className="text-muted-foreground">{n.text}</span>
        </div>
      ))}
    </CardContent>
  </Card>
);
