import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface GasSalesPriceStripProps {
  minPrice: number;
  maxPrice: number;
  priceChangeCount: number;
  onViewPriceHistory: () => void;
}

const dollar = (v: number) =>
  "$" + (v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });

export const GasSalesPriceStrip = ({ minPrice, maxPrice, priceChangeCount, onViewPriceHistory }: GasSalesPriceStripProps) => (
  <Card>
    <CardContent className="p-3 flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-6 text-xs">
        <span className="text-muted-foreground">
          Min Price: <span className="font-semibold text-foreground">{dollar(minPrice)}</span>
        </span>
        <span className="text-muted-foreground">
          Max Price: <span className="font-semibold text-foreground">{dollar(maxPrice)}</span>
        </span>
        <span className="text-muted-foreground">
          Price Changes: <span className="font-semibold text-foreground">{priceChangeCount}</span>
        </span>
      </div>
      <Button variant="link" size="sm" className="text-xs gap-1 h-auto p-0" onClick={onViewPriceHistory}>
        View Gas Price History <ArrowRight className="h-3 w-3" />
      </Button>
    </CardContent>
  </Card>
);
