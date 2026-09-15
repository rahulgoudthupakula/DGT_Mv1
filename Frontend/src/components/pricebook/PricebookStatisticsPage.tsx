import {useStatistics} from "@/components/reports/statistics/useStatistics";
import {fraction,dollars,pct} from "@/components/reports/statistics/statisticsData";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const fmt$=dollars;
const fmtPct=pct;
const axisMoney=(v:number)=>Math.abs(v)>=1000?`$${(v/1000).toFixed(1)}k`:`$${v.toLocaleString("en-US",{maximumFractionDigits:0})}`;
const COLORS={merch:'hsl(var(--primary))',nonMerch:'hsl(160, 60%, 45%)'};

// ─── Custom tooltip ─────────────────────────────────────────────────────────
const DollarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-mono font-medium">{fmt$(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const PctTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-mono font-medium">{fmtPct(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────
export const PricebookStatisticsPage = ({storeId}:{storeId:string}) => {
  const report=useStatistics(storeId,true);
  const {from:startDate,to:endDate,setFrom:setStartDate,setTo:setEndDate}=report;
  const {data,grades,mix:pieData}=report.stats;

  // Tick limiter for x-axis when many days
  const tickInterval = data.length > 14 ? Math.ceil(data.length / 10) - 1 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Price Book Statistics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sales performance breakdown by category and fuel grade
          </p>
        </div>

        {/* Date filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                aria-label="From date" variant="outline"
                className={cn("h-9 text-xs gap-1.5 font-normal", !startDate && "text-muted-foreground")}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                {startDate ? format(startDate, "MM/dd/yyyy") : "From date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={startDate}
                defaultMonth={startDate} disabled={report.today?{after:report.today}:undefined}
                onSelect={(d) => d && setStartDate(d)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground text-xs">—</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                aria-label="To date" variant="outline"
                className={cn("h-9 text-xs gap-1.5 font-normal", !endDate && "text-muted-foreground")}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                {endDate ? format(endDate, "MM/dd/yyyy") : "To date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={endDate}
                defaultMonth={endDate} disabled={report.today?{after:report.today}:undefined}
                onSelect={(d) => d && setEndDate(d)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {report.notice}
      <p className="text-xs text-muted-foreground">Non-merchandise includes recorded lottery sales under the existing department rules. Fuel grades use the sold fuel items; no grade is guessed from price. Other financial-service activity is not included.</p>
      {report.ready && <>
      {!report.stats.hasSales&&<p className="text-sm text-muted-foreground">No recorded sales for this period.</p>}
      {/* KPI summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {pieData.map((item) => (
          <Card key={item.name} className="relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" style={{ background: item.color }} />
            <CardContent className="p-3 pl-4">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{item.name}</p>
              <p className="text-lg font-bold mt-0.5">{fmt$(item.value)}</p>
              <p className="text-xs text-muted-foreground">{fmtPct(item.pct)} of total</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 1 — Dollar charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1. Merchandise Sales $ */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">1. Merchandise Sales ($)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis tickFormatter={v=>String(v).slice(5).replace("-","/")} dataKey="date" tick={{ fontSize: 10 }} interval={tickInterval} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={axisMoney} />
                <Tooltip content={<DollarTooltip />} />
                <Bar dataKey="merch" name="Merchandise" fill={COLORS.merch} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 2. Non-Merchandise Sales $ */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">2. Non-Merchandise Sales ($)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis tickFormatter={v=>String(v).slice(5).replace("-","/")} dataKey="date" tick={{ fontSize: 10 }} interval={tickInterval} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={axisMoney} />
                <Tooltip content={<DollarTooltip />} />
                <Bar dataKey="nonMerch" name="Non-Merchandise" fill={COLORS.nonMerch} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 3. Fuel Sales $ — all grades stacked */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">3. Fuel Sales by Grade ($)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis tickFormatter={v=>String(v).slice(5).replace("-","/")} dataKey="date" tick={{ fontSize: 10 }} interval={tickInterval} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={axisMoney} />
              <Tooltip content={<DollarTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {grades.map(grade=><Bar key={grade.key} dataKey={grade.key} name={grade.name} stackId="fuel" fill={grade.color}/>)}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Row 2 — Percentage charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 4. Merchandise % */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">4. Merchandise Sales (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis tickFormatter={v=>String(v).slice(5).replace("-","/")} dataKey="date" tick={{ fontSize: 10 }} interval={tickInterval} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => (v * 100).toFixed(0) + "%"} domain={["auto", "auto"]} />
                <Tooltip content={<PctTooltip />} />
                <Line
                  type="monotone"
                  dataKey="merchPct"
                  name="Merchandise %"
                  stroke={COLORS.merch}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 5. Non-Merchandise % */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">5. Non-Merchandise Sales (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis tickFormatter={v=>String(v).slice(5).replace("-","/")} dataKey="date" tick={{ fontSize: 10 }} interval={tickInterval} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => (v * 100).toFixed(0) + "%"} domain={["auto", "auto"]} />
                <Tooltip content={<PctTooltip />} />
                <Line
                  type="monotone"
                  dataKey="nonMerchPct"
                  name="Non-Merchandise %"
                  stroke={COLORS.nonMerch}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 6. Fuel % — line chart per grade + pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">6. Fuel Sales by Grade (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis tickFormatter={v=>String(v).slice(5).replace("-","/")} dataKey="date" tick={{ fontSize: 10 }} interval={tickInterval} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => (v * 100).toFixed(0) + "%"} domain={["auto", "auto"]} />
                <Tooltip content={<PctTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {grades.map(grade=><Line key={grade.key} type="monotone" dataKey={d=>fraction(d[grade.key],d.total)} name={grade.name} stroke={grade.color} strokeWidth={2} dot={false} connectNulls={false}/>)}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie — overall sales mix */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Overall Sales Mix</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {report.stats.mixPieValid?<ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={pieData[i].color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmt$(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>:<p className="text-sm text-muted-foreground py-12">Sales mix is unavailable when totals are zero or a category has net refunds.</p>}
          </CardContent>
        </Card>
      </div>
      </>}
    </div>
  );
};
