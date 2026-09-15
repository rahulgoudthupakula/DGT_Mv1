import { useState } from "react";
import { Fuel, BarChart3, PieChart, TrendingUp } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RPieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

interface GradeProfit {
  grade: string;
  shortName: string;
  profit: number;
  avgSalesPrice: number;
  adjCostPerUnit: number;
  totalVolSold: number;
  netProfit: number;
  borderColor: string;
}

const profitData: GradeProfit[] = [
  { grade: "Regular (87)", shortName: "Regular", profit: 0.182, avgSalesPrice: 3.299, adjCostPerUnit: 3.117, totalVolSold: 12480, netProfit: 2271.36, borderColor: "border-t-emerald-500" },
  { grade: "Plus (89)", shortName: "Plus", profit: 0.214, avgSalesPrice: 3.599, adjCostPerUnit: 3.385, totalVolSold: 4320, netProfit: 924.48, borderColor: "border-t-emerald-500" },
  { grade: "Premium (93)", shortName: "Premium", profit: 0.267, avgSalesPrice: 3.899, adjCostPerUnit: 3.632, totalVolSold: 3150, netProfit: 841.05, borderColor: "border-t-amber-500" },
  { grade: "Diesel", shortName: "Diesel", profit: 0.195, avgSalesPrice: 3.799, adjCostPerUnit: 3.604, totalVolSold: 5890, netProfit: 1148.55, borderColor: "border-t-destructive" },
];

const monthlyVolume = [
  { month: "Mar '25", Regular: 38200, Plus: 12100, Premium: 9800, Diesel: 18400 },
  { month: "Apr '25", Regular: 40500, Plus: 13200, Premium: 10100, Diesel: 19200 },
  { month: "May '25", Regular: 44800, Plus: 14500, Premium: 11200, Diesel: 20800 },
  { month: "Jun '25", Regular: 48200, Plus: 15800, Premium: 12400, Diesel: 22100 },
  { month: "Jul '25", Regular: 51400, Plus: 16900, Premium: 13100, Diesel: 23500 },
  { month: "Aug '25", Regular: 50100, Plus: 16200, Premium: 12800, Diesel: 22900 },
  { month: "Sep '25", Regular: 46300, Plus: 14800, Premium: 11600, Diesel: 21200 },
  { month: "Oct '25", Regular: 42100, Plus: 13500, Premium: 10500, Diesel: 19800 },
  { month: "Nov '25", Regular: 39800, Plus: 12400, Premium: 9900, Diesel: 18600 },
  { month: "Dec '25", Regular: 37500, Plus: 11800, Premium: 9400, Diesel: 17900 },
  { month: "Jan '26", Regular: 36200, Plus: 11200, Premium: 9100, Diesel: 17200 },
  { month: "Feb '26", Regular: 37800, Plus: 11600, Premium: 9500, Diesel: 17800 },
];

const revenueBreakdown = [
  { name: "Regular", value: 168420, color: "hsl(var(--primary))" },
  { name: "Plus", value: 58940, color: "hsl(142, 76%, 36%)" },
  { name: "Premium", value: 48650, color: "hsl(262, 83%, 58%)" },
  { name: "Diesel", value: 93280, color: "hsl(38, 92%, 50%)" },
];

const gasPriceTrend = [
  { month: "Mar '25", Regular: 3.199, Plus: 3.499, Premium: 3.799, Diesel: 3.699 },
  { month: "Apr '25", Regular: 3.219, Plus: 3.519, Premium: 3.819, Diesel: 3.719 },
  { month: "May '25", Regular: 3.259, Plus: 3.559, Premium: 3.859, Diesel: 3.749 },
  { month: "Jun '25", Regular: 3.299, Plus: 3.599, Premium: 3.899, Diesel: 3.799 },
  { month: "Jul '25", Regular: 3.339, Plus: 3.639, Premium: 3.939, Diesel: 3.839 },
  { month: "Aug '25", Regular: 3.319, Plus: 3.619, Premium: 3.919, Diesel: 3.819 },
  { month: "Sep '25", Regular: 3.279, Plus: 3.579, Premium: 3.879, Diesel: 3.779 },
  { month: "Oct '25", Regular: 3.249, Plus: 3.549, Premium: 3.849, Diesel: 3.749 },
  { month: "Nov '25", Regular: 3.229, Plus: 3.529, Premium: 3.829, Diesel: 3.729 },
  { month: "Dec '25", Regular: 3.239, Plus: 3.539, Premium: 3.839, Diesel: 3.739 },
  { month: "Jan '26", Regular: 3.259, Plus: 3.559, Premium: 3.859, Diesel: 3.759 },
  { month: "Feb '26", Regular: 3.299, Plus: 3.599, Premium: 3.899, Diesel: 3.799 },
];

const GRADE_COLORS = {
  Regular: "hsl(var(--primary))",
  Plus: "hsl(142, 76%, 36%)",
  Premium: "hsl(262, 83%, 58%)",
  Diesel: "hsl(38, 92%, 50%)",
};

type ActiveCard = "volume" | "revenue" | "price";

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "6px",
  fontSize: "12px",
};

export const GasStatisticsPage = () => {
  const today = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
  const [activeCard, setActiveCard] = useState<ActiveCard>("volume");

  const totalVolume = monthlyVolume.reduce((sum, m) => sum + m.Regular + m.Plus + m.Premium + m.Diesel, 0);
  const totalRevenue = revenueBreakdown.reduce((sum, r) => sum + r.value, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Gas Statistics</h2>
        <p className="text-sm text-muted-foreground">Sales volume, revenue breakdown, and pricing trends</p>
      </div>

      {/* Profit per gallon cards */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Profit / Gallon — as of {today}
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {profitData.map((g) => (
            <HoverCard key={g.grade} openDelay={150} closeDelay={100}>
              <HoverCardTrigger asChild>
                <div className={`rounded-lg border border-border ${g.borderColor} border-t-[3px] bg-card p-4 cursor-pointer hover:shadow-md transition-shadow`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Fuel className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">{g.shortName}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground tracking-tight">
                    ${g.profit.toFixed(3)}
                    <span className="text-xs font-normal text-muted-foreground ml-1">/gal</span>
                  </p>
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-64 p-0" side="bottom" align="start">
                <div className="p-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground border-b border-border pb-1.5">{g.grade} — Breakdown</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Sales Price</span>
                      <span className="font-mono font-medium text-foreground">${g.avgSalesPrice.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Adj Cost / Unit Sold</span>
                      <span className="font-mono font-medium text-foreground">${g.adjCostPerUnit.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Profit / Unit Sold</span>
                      <span className="font-mono font-semibold text-emerald-600">${g.profit.toFixed(3)}</span>
                    </div>
                    <div className="border-t border-border my-1" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Vol Sold</span>
                      <span className="font-mono font-medium text-foreground">{g.totalVolSold.toLocaleString()} gal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Net Profit</span>
                      <span className="font-mono font-semibold text-emerald-600">${g.netProfit.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          ))}
        </div>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Volume Card */}
        <div
          onClick={() => setActiveCard("volume")}
          className={`rounded-lg border-2 bg-card p-5 cursor-pointer transition-all ${activeCard === "volume" ? "border-primary shadow-md" : "border-border hover:shadow-md"}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Gas Volume Sold</p>
                <p className="text-xs text-muted-foreground">Last 12 months by grade</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-foreground">{(totalVolume / 1000).toFixed(0)}K</p>
              <p className="text-[10px] text-muted-foreground">total gallons</p>
            </div>
          </div>
        </div>

        {/* Revenue Card */}
        <div
          onClick={() => setActiveCard("revenue")}
          className={`rounded-lg border-2 bg-card p-5 cursor-pointer transition-all ${activeCard === "revenue" ? "border-success shadow-md" : "border-border hover:shadow-md"}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <PieChart className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Revenue Breakdown</p>
                <p className="text-xs text-muted-foreground">By grade — 12 months</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-foreground">${(totalRevenue / 1000).toFixed(0)}K</p>
              <p className="text-[10px] text-muted-foreground">total revenue</p>
            </div>
          </div>
        </div>

        {/* Price Card */}
        <div
          onClick={() => setActiveCard("price")}
          className={`rounded-lg border-2 bg-card p-5 cursor-pointer transition-all ${activeCard === "price" ? "border-warning shadow-md" : "border-border hover:shadow-md"}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Gas Price Trend</p>
                <p className="text-xs text-muted-foreground">Price movement — 12 months</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-foreground">$3.299</p>
              <p className="text-[10px] text-muted-foreground">reg. current</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Chart Panel */}
      <Card className={`animate-in fade-in-0 slide-in-from-top-2 duration-200 border-2 ${
        activeCard === "volume" ? "border-primary" : activeCard === "revenue" ? "border-success" : "border-warning"
      }`}>
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-sm font-semibold">
            {activeCard === "volume" && "Gas Volume Sold — Last 12 Months"}
            {activeCard === "revenue" && "Revenue Breakdown by Grade"}
            {activeCard === "price" && "Gas Price Trend — Last 12 Months"}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {activeCard === "volume" && (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={monthlyVolume} margin={{ top: 10, right: 10, left: -5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value.toLocaleString()} gal`]} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="Regular" fill={GRADE_COLORS.Regular} radius={[2, 2, 0, 0]} stackId="a" />
                <Bar dataKey="Plus" fill={GRADE_COLORS.Plus} radius={[0, 0, 0, 0]} stackId="a" />
                <Bar dataKey="Premium" fill={GRADE_COLORS.Premium} radius={[0, 0, 0, 0]} stackId="a" />
                <Bar dataKey="Diesel" fill={GRADE_COLORS.Diesel} radius={[2, 2, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {activeCard === "revenue" && (
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={320}>
                <RPieChart>
                  <Pie data={revenueBreakdown} cx="50%" cy="50%" innerRadius={70} outerRadius={120} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {revenueBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`$${value.toLocaleString()}`]} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                </RPieChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeCard === "price" && (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={gasPriceTrend} margin={{ top: 10, right: 10, left: -5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={["auto", "auto"]} tickFormatter={(v) => `$${v.toFixed(2)}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`$${value.toFixed(3)}`]} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                <Line type="monotone" dataKey="Regular" stroke={GRADE_COLORS.Regular} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Plus" stroke={GRADE_COLORS.Plus} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Premium" stroke={GRADE_COLORS.Premium} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Diesel" stroke={GRADE_COLORS.Diesel} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
