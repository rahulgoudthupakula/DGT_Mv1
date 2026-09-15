import { Card, CardContent } from "@/components/ui/card";
import { PackageOpen, DollarSign, PackageCheck, Landmark } from "lucide-react";

const cards = [
  { label: "Opening Inventory Volume", value: "12,500 gal", icon: PackageOpen, accent: "text-primary" },
  { label: "Opening Inventory Cost", value: "$34,250", icon: DollarSign, accent: "text-primary" },
  { label: "Closing Inventory Volume", value: "15,030 gal", icon: PackageCheck, accent: "text-primary" },
  { label: "Closing Inventory Cost", value: "$41,934", icon: Landmark, accent: "text-primary" },
];

export const InventoryCostSummaryCards = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {cards.map((c) => (
      <Card key={c.label}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">{c.label}</span>
            <c.icon className={`h-4 w-4 ${c.accent}`} />
          </div>
          <p className="text-xl font-bold text-foreground">{c.value}</p>
        </CardContent>
      </Card>
    ))}
  </div>
);
