import { DollarSign, RefreshCw, Percent, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const fmt = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const mockPerformance = {
  profit30d: 18450.0,
  inventoryTurnover: 4.2,
  grossMargin: 28.5,
  cashFlowTrend: 5200.0,
};

export const NetWorthPerformance = () => (
  <div>
    <h2 className="text-lg font-semibold mb-3">Performance Snapshot</h2>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2 bg-[hsl(var(--success))]/10">
              <DollarSign className="h-4 w-4 text-[hsl(var(--success))]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">30-day Profit</p>
              <p className="text-lg font-bold">{fmt(mockPerformance.profit30d)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2 bg-primary/10">
              <RefreshCw className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Inventory Turnover</p>
              <p className="text-lg font-bold">{mockPerformance.inventoryTurnover}x</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2 bg-[hsl(var(--warning))]/10">
              <Percent className="h-4 w-4 text-[hsl(var(--warning))]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gross Margin</p>
              <p className="text-lg font-bold">{mockPerformance.grossMargin}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg p-2 bg-[hsl(var(--success))]/10">
              <TrendingUp className="h-4 w-4 text-[hsl(var(--success))]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cash Flow Trend</p>
              <p className="text-lg font-bold text-[hsl(var(--success))]">+{fmt(mockPerformance.cashFlowTrend)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);
