import { ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const fmt = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface NetWorthHeroCardProps {
  netWorth: number;
  changeVsLastMonth: number;
}

export const NetWorthHeroCard = ({ netWorth, changeVsLastMonth }: NetWorthHeroCardProps) => (
  <Card className="bg-primary/5 border-primary/20">
    <CardContent className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Net Worth</p>
          <p className="text-4xl font-bold">{fmt(netWorth)}</p>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
          changeVsLastMonth >= 0
            ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"
            : "bg-destructive/10 text-destructive"
        )}>
          {changeVsLastMonth >= 0 ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
          {fmt(Math.abs(changeVsLastMonth))} vs Last Month
        </div>
      </div>
    </CardContent>
  </Card>
);
