import { Package, ArrowRightLeft, AlertTriangle, Warehouse } from "lucide-react";

interface InventoryImpactData {
  openingInventory: number;
  closingInventory: number;
  inventoryChange: number;
  shrinkAdjustments: number;
}

interface InventoryImpactRowProps {
  data: InventoryImpactData;
}

export const InventoryImpactRow = ({ data }: InventoryImpactRowProps) => {
  const items = [
    {
      label: "Opening Inventory",
      value: data.openingInventory,
      icon: Warehouse,
    },
    {
      label: "Closing Inventory",
      value: data.closingInventory,
      icon: Package,
    },
    {
      label: "Inventory Change",
      value: data.inventoryChange,
      icon: ArrowRightLeft,
      highlight: true,
    },
    {
      label: "Shrink / Adjustments",
      value: data.shrinkAdjustments,
      icon: AlertTriangle,
      isNegative: true,
    },
  ];

  return (
    <div className="rounded-lg border bg-muted/30 px-4 py-2.5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => {
          const isNeg = item.value < 0;
          return (
            <div key={item.label} className="flex items-center gap-2.5">
              <item.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</p>
                <p className={`text-sm font-semibold ${
                  item.isNegative || isNeg ? "text-destructive" : 
                  item.highlight && isNeg ? "text-destructive" : 
                  item.highlight && !isNeg ? "text-[hsl(var(--success))]" : ""
                }`}>
                  {isNeg ? "-" : ""}${item.value==null?"—":Math.abs(item.value).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
