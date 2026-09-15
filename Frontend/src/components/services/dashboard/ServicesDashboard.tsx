import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  ArrowRight,
  X,
  DollarSign,
  FileText,
  TrendingUp,
  Hash,
  AlertTriangle,
  ShieldAlert,
  RotateCcw,
  Ban,
  Gauge,
  ArrowUpRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { useAppNavigation } from "@/contexts/NavigationContext";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

// --- Mock data ---
const serviceBreakdown = [
  { service: "Money Order", volume: 48500, fees: 1940, commission: 776, pct: 26 },
  { service: "Bill Pay", volume: 37200, fees: 1116, commission: 446, pct: 20 },
  { service: "Money Transfer", volume: 62300, fees: 2180, commission: 872, pct: 34 },
  { service: "ATM", volume: 38000, fees: 1520, commission: 608, pct: 20 },
];

const settlementSnapshot = [
  { provider: "Western Union", pending: 12400, lastDate: "2024-01-18", status: "Current" },
  { provider: "MoneyGram", pending: 8200, lastDate: "2024-01-10", status: "Overdue" },
  { provider: "US Postal", pending: 5600, lastDate: "2024-01-15", status: "Pending" },
  { provider: "Cardtronics", pending: 0, lastDate: "2024-01-20", status: "Current" },
  { provider: "PayNearMe", pending: 9800, lastDate: "2024-01-05", status: "Overdue" },
];

const qcFlags = [
  { label: "High-Value Transactions", count: 7, icon: ShieldAlert, color: "text-orange-600" },
  { label: "Reversals / Voids", count: 3, icon: RotateCcw, color: "text-red-600" },
  { label: "Unsettled Transactions", count: 14, icon: Ban, color: "text-yellow-600" },
  { label: "ATM Variance", count: 1, icon: Gauge, color: "text-violet-600" },
];

const dailyVolume = [
  { day: "Mon", volume: 28400 },
  { day: "Tue", volume: 31200 },
  { day: "Wed", volume: 26800 },
  { day: "Thu", volume: 34100 },
  { day: "Fri", volume: 38600 },
  { day: "Sat", volume: 22300 },
  { day: "Sun", volume: 14500 },
];

const commissionTrend = [
  { day: "Mon", commission: 420 },
  { day: "Tue", commission: 510 },
  { day: "Wed", commission: 380 },
  { day: "Thu", commission: 560 },
  { day: "Fri", commission: 620 },
  { day: "Sat", commission: 340 },
  { day: "Sun", commission: 210 },
];

const providers = ["Western Union", "MoneyGram", "US Postal", "Cardtronics", "PayNearMe"];
const serviceTypes = ["Money Order", "Bill Pay", "Money Transfer", "ATM"];

const settlementStatusStyle = (status: string) => {
  switch (status) {
    case "Overdue":
      return "bg-red-100 text-red-800 border-red-300";
    case "Pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    default:
      return "bg-green-100 text-green-800 border-green-300";
  }
};

export const ServicesDashboard = () => {
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterService, setFilterService] = useState("all");
  const { navigateTo } = useAppNavigation();

  const hasActiveFilters = filterProvider !== "all" || filterService !== "all";
  const clearFilters = () => { setFilterProvider("all"); setFilterService("all"); };

  const totalVolume = serviceBreakdown.reduce((a, b) => a + b.volume, 0);
  const totalFees = serviceBreakdown.reduce((a, b) => a + b.fees, 0);
  const totalCommission = serviceBreakdown.reduce((a, b) => a + b.commission, 0);
  const totalTx = 847;
  const unsettled = settlementSnapshot.reduce((a, b) => a + b.pending, 0);

  const serviceNavMap: Record<string, string> = {
    "Money Order": "Money order",
    "Bill Pay": "Bill pay",
    "Money Transfer": "Money transfer",
    "ATM": "ATM",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Services Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
          <Button
            size="sm"
            onClick={() => navigateTo("Financial and Payment Services", "Reports", "Service Settlements")}
          >
            Go to Settlements <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 sticky top-0 z-10 bg-background py-2">
        <Input type="date" className="w-36 h-9 text-xs" />
        <span className="text-xs text-muted-foreground">to</span>
        <Input type="date" className="w-36 h-9 text-xs" />
        <Select value={filterProvider} onValueChange={setFilterProvider}>
          <SelectTrigger className="w-40 h-9 text-xs">
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            {providers.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterService} onValueChange={setFilterService}>
          <SelectTrigger className="w-40 h-9 text-xs">
            <SelectValue placeholder="Service Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {serviceTypes.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-9 text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={clearFilters}>
            <X className="h-3.5 w-3.5" />Clear filters
          </Button>
        )}
      </div>

      {/* Row 1 — KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Service Volume", value: fmt(totalVolume), icon: DollarSign, color: "text-blue-600" },
          { label: "Fees Collected", value: fmt(totalFees), icon: FileText, color: "text-emerald-600" },
          { label: "Commission Earned", value: fmt(totalCommission), icon: TrendingUp, color: "text-violet-600" },
          { label: "# Transactions", value: totalTx.toLocaleString(), icon: Hash, color: "text-sky-600" },
          { label: "Unsettled Amount", value: fmt(unsettled), icon: AlertTriangle, color: "text-red-600" },
        ].map((c) => (
          <Card key={c.label} className="shadow-sm">
            <CardContent className="p-4 flex items-start gap-3">
              <c.icon className={`w-5 h-5 mt-0.5 ${c.color}`} />
              <div>
                <p className="text-[11px] text-muted-foreground">{c.label}</p>
                <p className="text-lg font-bold">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 2 — Service Breakdown */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Service Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-[11px]">
                <TableHead>Service</TableHead>
                <TableHead className="text-right">Volume $</TableHead>
                <TableHead className="text-right">Fees $</TableHead>
                <TableHead className="text-right">Commission $</TableHead>
                <TableHead className="text-right">% Contribution</TableHead>
                <TableHead className="text-center w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceBreakdown.map((s) => (
                <TableRow
                  key={s.service}
                  className="text-xs cursor-pointer hover:bg-muted/60"
                  onClick={() => navigateTo("Financial and Payment Services", serviceNavMap[s.service])}
                >
                  <TableCell className="font-medium">{s.service}</TableCell>
                  <TableCell className="text-right">{fmt(s.volume)}</TableCell>
                  <TableCell className="text-right">{fmt(s.fees)}</TableCell>
                  <TableCell className="text-right">{fmt(s.commission)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${s.pct}%` }} />
                      </div>
                      <span>{s.pct}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
              {/* Totals */}
              <TableRow className="text-xs font-semibold bg-muted/30">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{fmt(totalVolume)}</TableCell>
                <TableCell className="text-right">{fmt(totalFees)}</TableCell>
                <TableCell className="text-right">{fmt(totalCommission)}</TableCell>
                <TableCell className="text-right">100%</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Row 3 — Settlement Snapshot + Row 4 — QC Panel */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Settlement Snapshot */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Settlement Snapshot</CardTitle>
              <Button
                variant="link"
                size="sm"
                className="text-xs h-auto p-0"
                onClick={() => navigateTo("Financial and Payment Services", "Reports", "Service Settlements")}
              >
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="text-[11px]">
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-right">Pending $</TableHead>
                  <TableHead>Last Settlement</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlementSnapshot.map((s) => (
                  <TableRow key={s.provider} className="text-xs">
                    <TableCell className="font-medium">{s.provider}</TableCell>
                    <TableCell className="text-right">{s.pending > 0 ? fmt(s.pending) : "—"}</TableCell>
                    <TableCell>{s.lastDate}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${settlementStatusStyle(s.status)}`}>
                        {s.status === "Overdue" && "🔴 "}
                        {s.status === "Pending" && "🟡 "}
                        {s.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Risk & QC Panel */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Risk & QC Flags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {qcFlags.map((f) => (
              <div
                key={f.label}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/70 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <f.icon className={`w-4 h-4 ${f.color}`} />
                  <span className="text-xs font-medium">{f.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs font-bold">{f.count}</Badge>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Row 5 — Trends */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Daily Volume */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Service Volume by Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyVolume}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Commission Trend */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Commission Trend</CardTitle>
              <Badge variant="outline" className="text-[10px]">
                Top: Money Transfer
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={commissionTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Line type="monotone" dataKey="commission" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
