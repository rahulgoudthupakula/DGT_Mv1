import { Fuel, Clock, ArrowRight } from "lucide-react";
import { useAppNavigation } from "@/contexts/NavigationContext";

interface FuelPrice {
  fuelType: string;
  price: number;
}

const prices: FuelPrice[] = [
  { fuelType: "Regular (87)", price: 3.499 },
  { fuelType: "Plus (89)", price: 3.799 },
  { fuelType: "Premium (93)", price: 4.099 },
  { fuelType: "Diesel", price: 3.899 },
];

export const GasPriceBox = () => {
  const { navigateTo } = useAppNavigation();

  return (
    <div
      className="flex items-center justify-between gap-4 px-4 py-2.5 rounded-lg border border-border bg-card cursor-pointer hover:bg-accent/40 transition-colors"
      onClick={() => navigateTo("Gas", "Gas price")}
    >
      <div className="flex items-center gap-5 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Fuel className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Gas Prices</span>
        </div>
        <div className="h-4 w-px bg-border" />
        {prices.map((p, i) => (
          <div key={p.fuelType} className="flex items-center gap-1">
            <span className="text-[11px] text-muted-foreground">{p.fuelType}:</span>
            <span className="text-sm font-bold text-foreground">${p.price.toFixed(3)}</span>
            {i < prices.length - 1 && <span className="text-border mx-1">•</span>}
          </div>
        ))}
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          Updated: Feb 09, 2026 — 8:00 AM
        </div>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
    </div>
  );
};
