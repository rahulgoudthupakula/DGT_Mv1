import { useState, useMemo } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  DollarSign,
  Fuel,
  TrendingDown,
  CalendarDays,
  Plus,
  Eye,
  Pencil,
  Download,
} from "lucide-react";
import { CheckCashingEditDayPage } from "./store-edit/CheckCashingEditDayPage";

// --- Types ---
type DayStatus = "closed" | "draft" | "issue";

interface DayData {
  day: number;
  status: DayStatus;
  insideSales: number;
  gasVolume: number;
  shortOver: number;
  totalSales: number;
  totalTender: number;
  pendingSettlements: number;
}

// --- Mock helpers ---
const VARIANCE_THRESHOLD = 10;

const mockDays = (daysInMonth: number): DayData[] => {
  const days: DayData[] = [];
  const today = new Date().getDate();
  for (let d = 1; d <= Math.min(daysInMonth, today); d++) {
    const insideSales = 1800 + Math.random() * 1200;
    const gasVolume = 1200 + Math.random() * 1500;
    const shortOver = (Math.random() - 0.45) * 30;
    const totalSales = insideSales + gasVolume * 3.2;
    const totalTender = totalSales - shortOver;
    const status: DayStatus =
      Math.abs(shortOver) > VARIANCE_THRESHOLD
        ? "issue"
        : d < today - 1
          ? "closed"
          : "draft";
    days.push({
      day: d,
      status,
      insideSales: +insideSales.toFixed(2),
      gasVolume: +gasVolume.toFixed(0),
      shortOver: +shortOver.toFixed(2),
      totalSales: +totalSales.toFixed(2),
      totalTender: +totalTender.toFixed(2),
      pendingSettlements: Math.random() > 0.7 ? 1 : 0,
    });
  }
  return days;
};

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const StatusDot = ({ status }: { status: DayStatus }) => {
  const colors: Record<DayStatus, string> = {
    closed: "bg-success",
    draft: "bg-warning",
    issue: "bg-destructive",
  };
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${colors[status]}`} />;
};

export const CheckCashingClosingPage = () => {
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(now.getFullYear(), now.getMonth(), 1));
  const month = selectedDate.getMonth();
  const year = selectedDate.getFullYear();
  const [calOpen, setCalOpen] = useState(false);
  const [editDay, setEditDay] = useState<{ day: number; status: DayStatus } | null>(null);

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dayData = useMemo(() => mockDays(daysInMonth), [month, year, daysInMonth]);

  const dayMap = useMemo(() => {
    const m = new Map<number, DayData>();
    dayData.forEach((d) => m.set(d.day, d));
    return m;
  }, [dayData]);

  const totalMerch = dayData.reduce((s, d) => s + d.insideSales, 0);
  const totalGas = dayData.reduce((s, d) => s + d.gasVolume, 0);
  const totalSO = dayData.reduce((s, d) => s + d.shortOver, 0);
  const daysClosed = dayData.filter((d) => d.status === "closed").length;
  const daysDraft = dayData.filter((d) => d.status === "draft").length;
  const daysIssue = dayData.filter((d) => d.status === "issue").length;
  const daysNotStarted = daysInMonth - dayData.length;

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (editDay) {
    return (
      <CheckCashingEditDayPage
        day={editDay.day}
        month={month}
        year={year}
        status={editDay.status}
        onBack={() => setEditDay(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Check Cashing Daily Closing Report</h1>
      </div>

      <Card className="shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4 px-6">
          <div className="flex flex-wrap gap-4">
            <KpiMini icon={DollarSign} label="Total Month's Merchandise" value={`$${fmt(totalMerch)}`} />
            <KpiMini icon={Fuel} label="Monthly Gas Volume" value={`${totalGas.toLocaleString()} gal`} />
            <KpiMini
              icon={TrendingDown}
              label="Total Short/Over"
              value={`$${fmt(Math.abs(totalSO))}`}
              valueClass={totalSO > 0 ? "text-success" : totalSO < 0 ? "text-destructive" : "text-muted-foreground"}
            />
            <div className="flex items-center gap-3 bg-secondary/50 rounded-lg px-4 py-2.5">
              <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary/10">
                <CalendarDays className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground leading-none mb-1">Days Status</p>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="text-success">{daysClosed} Closed</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-warning">{daysDraft} Draft</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-destructive">{daysIssue} Issue</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-muted-foreground">{daysNotStarted} Open</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-sm"
              onClick={() => setSelectedDate(new Date(now.getFullYear(), now.getMonth(), 1))}
            >
              Today
            </Button>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("h-9 px-3 text-sm justify-start font-normal gap-2")}
                >
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  {format(selectedDate, "MMMM yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => {
                    if (d) {
                      setSelectedDate(new Date(d.getFullYear(), d.getMonth(), 1));
                      setCalOpen(false);
                    }
                  }}
                  defaultMonth={selectedDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Inside Sales</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Gas Volume</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Short/Over</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const data = dayMap.get(day);
                const dayOfWeek = WEEKDAYS[new Date(year, month, day).getDay()];

                if (!data) {
                  return (
                    <tr key={day} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground">{day}</span>
                        <span className="ml-2 text-muted-foreground text-xs">{dayOfWeek}</span>
                      </td>
                      <td className="px-4 py-3" colSpan={4}>
                        <span className="text-muted-foreground text-xs">—</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                          <Plus className="h-3 w-3" /> Start Day
                        </Button>
                      </td>
                    </tr>
                  );
                }

                const hasIssue = data.status === "issue";

                return (
                  <HoverCard key={day} openDelay={200} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <tr
                        className={`border-b border-border cursor-pointer transition-colors hover:bg-muted/30 ${
                          hasIssue ? "bg-destructive/5" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <span className="font-semibold text-foreground">{day}</span>
                          <span className="ml-2 text-muted-foreground text-xs">{dayOfWeek}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <StatusDot status={data.status} />
                            <span className="text-xs capitalize text-muted-foreground">{data.status}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">
                          ${fmt(data.insideSales)}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {data.gasVolume.toLocaleString()} gal
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${
                          data.shortOver > 0
                            ? "text-success"
                            : data.shortOver < 0
                              ? "text-destructive"
                              : "text-muted-foreground"
                        }`}>
                          {data.shortOver >= 0 ? "+" : "-"}${fmt(Math.abs(data.shortOver))}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="outline" size="sm" className="h-7 text-xs px-2 gap-1">
                              <Eye className="h-3 w-3" /> Summary
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditDay({ day, status: data.status })}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    </HoverCardTrigger>
                    <HoverCardContent side="left" className="w-56 text-xs space-y-1">
                      <p className="font-semibold text-foreground">
                        {MONTHS[month]} {day}, {year}
                      </p>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Sales</span>
                        <span className="text-foreground">${fmt(data.totalSales)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Tender</span>
                        <span className="text-foreground">${fmt(data.totalTender)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Variance</span>
                        <span className={data.shortOver >= 0 ? "text-success" : "text-destructive"}>
                          ${fmt(Math.abs(data.shortOver))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Settlements Pending</span>
                        <span className="text-foreground">{data.pendingSettlements}</span>
                      </div>
                      {data.status !== "closed" && (
                        <Badge variant={data.status === "issue" ? "destructive" : "secondary"} className="mt-1 text-[10px]">
                          {data.status === "issue" ? "Needs Attention" : "Draft"}
                        </Badge>
                      )}
                    </HoverCardContent>
                  </HoverCard>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const KpiMini = ({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  valueClass?: string;
}) => (
  <div className="flex items-center gap-3 bg-secondary/50 rounded-lg px-4 py-2.5">
    <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary/10">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div>
      <p className="text-[11px] text-muted-foreground leading-none">{label}</p>
      <p className={`text-sm font-semibold leading-tight mt-0.5 ${valueClass || "text-foreground"}`}>{value}</p>
    </div>
  </div>
);
