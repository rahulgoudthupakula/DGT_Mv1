import { useEffect, useMemo, useState } from "react";
import { getApprovedTimeOffDays } from "@/lib/timeoffStore";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Upload, Eye, Clock, LogIn, LogOut, AlertCircle } from "lucide-react";

type PunchEntry = {
  date: string;
  day: string;
  clockIn: string | null;
  clockOut: string | null;
  totalHrs: number | null;
  note?: string;
};

type Employee = {
  id: number;
  name: string;
  scheduled: number;
  worked: number;
  ot: number;
  callOff: number;
  ncns: number;
  punches: PunchEntry[];
  timeOffHrs?: number;
};

const timesheets: Employee[] = [
  {
    id: 1, name: "Maria Lopez", scheduled: 40, worked: 42, ot: 2, callOff: 0, ncns: 0,
    punches: [
      { date: "Feb 3", day: "Mon", clockIn: "8:58 AM", clockOut: "5:02 PM", totalHrs: 8.1 },
      { date: "Feb 4", day: "Tue", clockIn: "9:01 AM", clockOut: "5:00 PM", totalHrs: 8.0 },
      { date: "Feb 5", day: "Wed", clockIn: "8:55 AM", clockOut: "7:10 PM", totalHrs: 10.3 },
      { date: "Feb 6", day: "Thu", clockIn: "9:00 AM", clockOut: "5:05 PM", totalHrs: 8.1 },
      { date: "Feb 7", day: "Fri", clockIn: "8:50 AM", clockOut: "6:30 PM", totalHrs: 9.7 },
      { date: "Feb 10", day: "Mon", clockIn: "9:02 AM", clockOut: "5:00 PM", totalHrs: 8.0 },
    ],
  },
  {
    id: 2, name: "James Carter", scheduled: 40, worked: 38, ot: 0, callOff: 1, ncns: 0,
    punches: [
      { date: "Feb 3", day: "Mon", clockIn: "9:05 AM", clockOut: "5:00 PM", totalHrs: 7.9 },
      { date: "Feb 4", day: "Tue", clockIn: "9:00 AM", clockOut: "5:00 PM", totalHrs: 8.0 },
      { date: "Feb 5", day: "Wed", clockIn: null, clockOut: null, totalHrs: null, note: "Call Off" },
      { date: "Feb 6", day: "Thu", clockIn: "9:00 AM", clockOut: "5:00 PM", totalHrs: 8.0 },
      { date: "Feb 7", day: "Fri", clockIn: "8:58 AM", clockOut: "5:05 PM", totalHrs: 8.1 },
      { date: "Feb 10", day: "Mon", clockIn: "9:00 AM", clockOut: "5:00 PM", totalHrs: 8.0 },
    ],
  },
  {
    id: 3, name: "Aisha Patel", scheduled: 40, worked: 40, ot: 0, callOff: 0, ncns: 0,
    punches: [
      { date: "Feb 3", day: "Mon", clockIn: "9:00 AM", clockOut: "5:00 PM", totalHrs: 8.0 },
      { date: "Feb 4", day: "Tue", clockIn: "9:00 AM", clockOut: "5:00 PM", totalHrs: 8.0 },
      { date: "Feb 5", day: "Wed", clockIn: "9:00 AM", clockOut: "5:00 PM", totalHrs: 8.0 },
      { date: "Feb 6", day: "Thu", clockIn: "9:00 AM", clockOut: "5:00 PM", totalHrs: 8.0 },
      { date: "Feb 7", day: "Fri", clockIn: "9:00 AM", clockOut: "5:00 PM", totalHrs: 8.0 },
    ],
  },
  {
    id: 4, name: "Sarah Kim", scheduled: 40, worked: 45, ot: 5, callOff: 0, ncns: 0,
    punches: [
      { date: "Feb 3", day: "Mon", clockIn: "8:00 AM", clockOut: "7:00 PM", totalHrs: 11.0 },
      { date: "Feb 4", day: "Tue", clockIn: "8:00 AM", clockOut: "6:30 PM", totalHrs: 10.5 },
      { date: "Feb 5", day: "Wed", clockIn: "8:00 AM", clockOut: "5:30 PM", totalHrs: 9.5 },
      { date: "Feb 6", day: "Thu", clockIn: "8:00 AM", clockOut: "5:00 PM", totalHrs: 9.0 },
      { date: "Feb 7", day: "Fri", clockIn: "8:00 AM", clockOut: "5:00 PM", totalHrs: 9.0 },
    ],
  },
  {
    id: 5, name: "Tom Nguyen", scheduled: 32, worked: 0, ot: 0, callOff: 0, ncns: 1,
    punches: [
      { date: "Feb 3", day: "Mon", clockIn: "9:00 AM", clockOut: "5:00 PM", totalHrs: 8.0 },
      { date: "Feb 4", day: "Tue", clockIn: "9:00 AM", clockOut: "5:00 PM", totalHrs: 8.0 },
      { date: "Feb 5", day: "Wed", clockIn: "9:00 AM", clockOut: "5:00 PM", totalHrs: 8.0 },
      { date: "Feb 6", day: "Thu", clockIn: "9:00 AM", clockOut: "5:00 PM", totalHrs: 8.0 },
      { date: "Feb 10", day: "Mon", clockIn: null, clockOut: null, totalHrs: null, note: "No Call No Show" },
    ],
  },
];

const formatDay = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    day: d.toLocaleDateString("en-US", { weekday: "short" }),
  };
};

export const PayrollTimeAttendance = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setVersion((v) => v + 1);
    window.addEventListener("timeoff-updated", refresh);
    return () => window.removeEventListener("timeoff-updated", refresh);
  }, []);

  // Approved time off feeds directly into each employee's sheet.
  const rows = useMemo(
    () =>
      timesheets.map((t) => {
        const off = getApprovedTimeOffDays(t.name);
        const timeOffHrs = off.length * 8;
        const punches: PunchEntry[] = [
          ...t.punches,
          ...off.map((o) => ({ ...formatDay(o.date), clockIn: null, clockOut: null, totalHrs: null, note: `Approved ${o.type}` })),
        ];
        return { ...t, timeOffHrs, punches };
      }),
    [version]
  );

  // Keep the open drawer in sync with fresh approvals.
  const active = selectedEmployee ? rows.find((r) => r.id === selectedEmployee.id) ?? selectedEmployee : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Time & Attendance</h1>
        <Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-1" /> Import from POS / Timeclock</Button>
      </div>

      <div className="flex items-center gap-3">
        <Select defaultValue="current">
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Feb 1 – Feb 15, 2026</SelectItem>
            <SelectItem value="prev">Jan 16 – Jan 31, 2026</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-dashboard-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="text-right">Scheduled Hrs</TableHead>
                <TableHead className="text-right">Working Hrs</TableHead>
                <TableHead className="text-right">OT Hrs</TableHead>
                <TableHead className="text-right">Time Off Hrs</TableHead>
                <TableHead className="text-center">Call Off</TableHead>
                <TableHead className="text-center">No Call No Show</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-right font-mono">{t.scheduled}</TableCell>
                  <TableCell className="text-right font-mono">
                    {t.worked > 0 ? t.worked : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {t.ot > 0
                      ? <Badge variant="secondary" className="text-[10px] ml-auto">{t.ot} hrs OT</Badge>
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {t.timeOffHrs > 0 ? t.timeOffHrs : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    {t.callOff > 0
                      ? <Badge variant="secondary" className="text-[10px]">{t.callOff}</Badge>
                      : <span className="text-muted-foreground text-sm">—</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    {t.ncns > 0
                      ? <Badge variant="destructive" className="text-[10px]">{t.ncns}</Badge>
                      : <span className="text-muted-foreground text-sm">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="View punches"
                      onClick={() => setSelectedEmployee(t)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Punch Log Drawer */}
      <Sheet open={!!selectedEmployee} onOpenChange={(open) => { if (!open) setSelectedEmployee(null); }}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Punch Log — {active?.name}
            </SheetTitle>
            <p className="text-sm text-muted-foreground">Feb 1 – Feb 15, 2026</p>
          </SheetHeader>

          {/* Summary strip */}
          {active && (
            <div className="grid grid-cols-4 gap-2 mb-5">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-0.5">Scheduled</p>
                <p className="text-lg font-bold text-foreground">{active.scheduled}<span className="text-xs font-normal text-muted-foreground ml-0.5">hrs</span></p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-0.5">Worked</p>
                <p className="text-lg font-bold text-foreground">{active.worked || "0"}<span className="text-xs font-normal text-muted-foreground ml-0.5">hrs</span></p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-0.5">OT</p>
                <p className={`text-lg font-bold ${active.ot > 0 ? "text-amber-600" : "text-foreground"}`}>
                  {active.ot || "0"}<span className="text-xs font-normal text-muted-foreground ml-0.5">hrs</span>
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-0.5">Time Off</p>
                <p className="text-lg font-bold text-foreground">
                  {active.timeOffHrs || "0"}<span className="text-xs font-normal text-muted-foreground ml-0.5">hrs</span>
                </p>
              </div>
            </div>
          )}

          <Separator className="mb-4" />

          {/* Daily punches */}
          <div className="space-y-2">
            {active?.punches.map((p, i) => {
              const isTimeOff = p.note?.startsWith("Approved");
              return (
              <div key={i} className={`rounded-lg border p-3 ${p.note ? (isTimeOff ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5") : "border-border bg-card"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground w-7">{p.day}</span>
                    <span className="text-sm font-medium text-foreground">{p.date}</span>
                  </div>
                  {p.note ? (
                    <Badge variant={isTimeOff ? "secondary" : "destructive"} className="text-[10px] flex items-center gap-1">
                      <AlertCircle className="w-2.5 h-2.5" />{p.note}
                    </Badge>
                  ) : (
                    <span className="text-xs font-mono font-semibold text-foreground">{p.totalHrs?.toFixed(1)} hrs</span>
                  )}
                </div>
                {!p.note && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <LogIn className="w-3 h-3 text-emerald-600" />
                      <span className="font-mono">{p.clockIn}</span>
                    </span>
                    <span className="text-border">→</span>
                    <span className="flex items-center gap-1">
                      <LogOut className="w-3 h-3 text-rose-500" />
                      <span className="font-mono">{p.clockOut}</span>
                    </span>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
