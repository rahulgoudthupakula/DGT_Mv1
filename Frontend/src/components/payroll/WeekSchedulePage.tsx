import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, ChevronLeft, ChevronRight, Clock, Printer, Download, Copy, AlertTriangle, Trash2, Undo2 } from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const OT_THRESHOLD = 40;

const EMPLOYEES = [
  "Maria Lopez",
  "James Carter",
  "Aisha Patel",
  "Tom Nguyen",
  "Sarah Kim",
];

type Shift = { start: string; end: string; role: string };
type Schedule = Record<string, Record<string, Shift | null>>;

const initialSchedule: Schedule = {
  "Maria Lopez":  { Mon: { start: "09:00", end: "17:00", role: "Cashier" }, Tue: { start: "09:00", end: "17:00", role: "Cashier" }, Wed: null, Thu: { start: "12:00", end: "20:00", role: "Cashier" }, Fri: { start: "09:00", end: "17:00", role: "Cashier" }, Sat: null, Sun: null },
  "James Carter": { Mon: { start: "06:00", end: "14:00", role: "Deli Cook" }, Tue: { start: "06:00", end: "14:00", role: "Deli Cook" }, Wed: { start: "06:00", end: "14:00", role: "Deli Cook" }, Thu: null, Fri: { start: "06:00", end: "14:00", role: "Deli Cook" }, Sat: { start: "08:00", end: "16:00", role: "Deli Cook" }, Sun: null },
  "Aisha Patel":  { Mon: { start: "08:00", end: "17:00", role: "Manager" }, Tue: { start: "08:00", end: "17:00", role: "Manager" }, Wed: { start: "08:00", end: "17:00", role: "Manager" }, Thu: { start: "08:00", end: "17:00", role: "Manager" }, Fri: { start: "08:00", end: "17:00", role: "Manager" }, Sat: null, Sun: null },
  "Tom Nguyen":   { Mon: null, Tue: { start: "14:00", end: "22:00", role: "Stock Clerk" }, Wed: { start: "14:00", end: "22:00", role: "Stock Clerk" }, Thu: { start: "14:00", end: "22:00", role: "Stock Clerk" }, Fri: null, Sat: { start: "10:00", end: "18:00", role: "Stock Clerk" }, Sun: { start: "10:00", end: "18:00", role: "Stock Clerk" } },
  "Sarah Kim":    { Mon: { start: "08:00", end: "16:00", role: "Asst. Manager" }, Tue: null, Wed: { start: "08:00", end: "16:00", role: "Asst. Manager" }, Thu: { start: "08:00", end: "16:00", role: "Asst. Manager" }, Fri: { start: "08:00", end: "16:00", role: "Asst. Manager" }, Sat: { start: "09:00", end: "17:00", role: "Asst. Manager" }, Sun: null },
};

const roleColor: Record<string, string> = {
  "Cashier":       "bg-blue-100 text-blue-800 border-blue-200",
  "Deli Cook":     "bg-orange-100 text-orange-800 border-orange-200",
  "Manager":       "bg-purple-100 text-purple-800 border-purple-200",
  "Asst. Manager": "bg-violet-100 text-violet-800 border-violet-200",
  "Stock Clerk":   "bg-green-100 text-green-800 border-green-200",
};

const calcHours = (start: string, end: string) => {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
};

const weekLabel = (offset: number) => {
  const now = new Date();
  const mon = new Date(now);
  mon.setDate(now.getDate() - now.getDay() + 1 + offset * 7);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(mon)} – ${fmt(sun)}`;
};

export const WeekSchedulePage = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekSchedules, setWeekSchedules] = useState<Record<number, Schedule>>({ 0: initialSchedule });
  const [undoStack, setUndoStack] = useState<Array<{ offset: number; snapshot: Schedule }>>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [shiftForm, setShiftForm] = useState({ employee: "", day: "", start: "09:00", end: "17:00", role: "" });
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);

  const schedule: Schedule = weekSchedules[weekOffset] ?? {};

  const setScheduleForWeek = (offset: number, s: Schedule) =>
    setWeekSchedules((prev) => ({ ...prev, [offset]: s }));

  const handleField = (k: string, v: string) => setShiftForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!shiftForm.employee || !shiftForm.day) return;
    setScheduleForWeek(weekOffset, {
      ...schedule,
      [shiftForm.employee]: {
        ...(schedule[shiftForm.employee] ?? {}),
        [shiftForm.day]: { start: shiftForm.start, end: shiftForm.end, role: shiftForm.role },
      },
    });
    setSheetOpen(false);
    setShiftForm({ employee: "", day: "", start: "09:00", end: "17:00", role: "" });
  };

  const handleDeleteShift = (emp: string, day: string) => {
    // Save snapshot before deleting
    setUndoStack((stack) => [...stack, { offset: weekOffset, snapshot: JSON.parse(JSON.stringify(schedule)) }]);
    setScheduleForWeek(weekOffset, {
      ...schedule,
      [emp]: { ...(schedule[emp] ?? {}), [day]: null },
    });
  };

  const handleUndo = () => {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;
    setScheduleForWeek(last.offset, last.snapshot);
    setWeekOffset(last.offset);
    setUndoStack((stack) => stack.slice(0, -1));
  };

  const totalHours = (emp: string) =>
    DAYS.reduce((sum, d) => {
      const s = schedule[emp]?.[d];
      return sum + (s ? calcHours(s.start, s.end) : 0);
    }, 0);

  const dayTotal = (day: string) =>
    EMPLOYEES.reduce((sum, emp) => {
      const s = schedule[emp]?.[day];
      return sum + (s ? calcHours(s.start, s.end) : 0);
    }, 0);

  const isOvertime = (emp: string) => totalHours(emp) > OT_THRESHOLD;
  const overtimeEmployees = EMPLOYEES.filter(isOvertime);

  const handleCopyWeek = () => {
    setScheduleForWeek(weekOffset + 1, JSON.parse(JSON.stringify(schedule)));
    setWeekOffset((o) => o + 1);
    setCopyDialogOpen(false);
  };

  const handleExportCSV = () => {
    const header = ["Employee", ...DAYS, "Total Hours"].join(",");
    const rows = EMPLOYEES.map((emp) => {
      const cells = DAYS.map((d) => {
        const s = schedule[emp]?.[d];
        return s ? `"${s.start}-${s.end}"` : `""`;
      });
      return [emp, ...cells, totalHours(emp).toFixed(1)].join(",");
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `week-schedule-${weekLabel(weekOffset).replace(/\s/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground">Week Schedule</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleUndo} disabled={undoStack.length === 0}>
            <Undo2 className="w-3.5 h-3.5 mr-1.5" /> Undo{undoStack.length > 0 ? ` (${undoStack.length})` : ""}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCopyDialogOpen(true)}>
            <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Week
          </Button>
          <Button size="sm" onClick={() => setSheetOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add Shift
          </Button>
        </div>
      </div>

      {/* Week Navigator */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((o) => o - 1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium text-foreground min-w-[160px] text-center">{weekLabel(weekOffset)}</span>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((o) => o + 1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        {weekOffset !== 0 && (
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setWeekOffset(0)}>
            Today
          </Button>
        )}
      </div>

      {/* Overtime Warnings */}
      {overtimeEmployees.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Overtime Warning</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {overtimeEmployees.map((e) => `${e} (${totalHours(e).toFixed(1)}h)`).join(", ")}
              {" "}{overtimeEmployees.length === 1 ? "is" : "are"} scheduled over {OT_THRESHOLD} hrs — overtime pay will apply.
            </p>
          </div>
        </div>
      )}

      {/* Schedule Grid */}
      <Card className="border-dashboard-border overflow-x-auto print:shadow-none">
        <CardContent className="p-0">
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-dashboard-border bg-muted/40">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-36">Employee</th>
                {DAYS.map((d) => (
                  <th key={d} className="text-center px-2 py-3 font-semibold text-muted-foreground">
                    <div>{d}</div>
                    <div className="text-[10px] font-normal text-muted-foreground/60 mt-0.5">{dayTotal(d).toFixed(1)}h</div>
                  </th>
                ))}
                <th className="text-center px-3 py-3 font-semibold text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {EMPLOYEES.map((emp, i) => {
                const hrs = totalHours(emp);
                const ot = hrs > OT_THRESHOLD;
                return (
                  <tr key={emp} className={`border-b border-dashboard-border/50 ${i % 2 === 0 ? "" : "bg-muted/10"} ${ot ? "bg-amber-50/60" : ""}`}>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-foreground">{emp}</span>
                        {ot && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                      </div>
                    </td>
                    {DAYS.map((d) => {
                      const shift = schedule[emp]?.[d];
                      return (
                        <td key={d} className="px-1 py-2 text-center align-middle">
                          {shift ? (
                            <div className={`group relative rounded border px-1.5 py-1 ${roleColor[shift.role] ?? "bg-muted text-foreground border-border"}`}>
                              {/* Edit area */}
                              <div
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => {
                                  setShiftForm({ employee: emp, day: d, start: shift.start, end: shift.end, role: shift.role });
                                  setSheetOpen(true);
                                }}
                              >
                                <div className="font-semibold text-[10px]">{shift.start}–{shift.end}</div>
                                <div className="text-[9px] opacity-70">{calcHours(shift.start, shift.end)}h</div>
                              </div>
                              {/* Delete button — visible on hover */}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteShift(emp, d); }}
                                className="absolute -top-1.5 -right-1.5 hidden group-hover:flex items-center justify-center w-4 h-4 rounded-full bg-destructive text-destructive-foreground shadow-sm hover:opacity-90 transition-opacity print:hidden"
                                title="Remove shift"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              className="w-full h-9 rounded border border-dashed border-border/40 hover:border-primary/40 hover:bg-muted/40 transition-colors flex items-center justify-center text-muted-foreground/30 hover:text-muted-foreground print:hidden"
                              onClick={() => {
                                setShiftForm({ employee: emp, day: d, start: "09:00", end: "17:00", role: "" });
                                setSheetOpen(true);
                              }}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center">
                      <Badge
                        variant={ot ? "destructive" : "secondary"}
                        className={`text-[10px] font-mono ${ot ? "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100" : ""}`}
                      >
                        <Clock className="w-2.5 h-2.5 mr-1" />
                        {hrs.toFixed(1)}h{ot ? " OT" : ""}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-4">
        {[
          { label: "Total Shifts", value: EMPLOYEES.reduce((s, e) => s + DAYS.filter((d) => schedule[e]?.[d]).length, 0) },
          { label: "Total Hours", value: `${EMPLOYEES.reduce((s, e) => s + totalHours(e), 0).toFixed(1)}h` },
          { label: "Employees Scheduled", value: EMPLOYEES.filter((e) => DAYS.some((d) => schedule[e]?.[d])).length },
          { label: "OT Employees", value: overtimeEmployees.length, warn: overtimeEmployees.length > 0 },
        ].map(({ label, value, warn }) => (
          <Card key={label} className={`border-dashboard-border ${warn ? "border-amber-300 bg-amber-50/40" : ""}`}>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground font-normal">{label}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <span className={`text-2xl font-bold ${warn ? "text-amber-700" : "text-foreground"}`}>{value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Copy Week Confirmation */}
      <AlertDialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Copy Week Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              This will copy <strong>{weekLabel(weekOffset)}</strong> to <strong>{weekLabel(weekOffset + 1)}</strong>.
              Any existing shifts in the next week will be overwritten.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCopyWeek}>Copy & Go to Next Week</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add / Edit Shift Sheet */}
      <Sheet open={sheetOpen} onOpenChange={(o) => { setSheetOpen(o); if (!o) setShiftForm({ employee: "", day: "", start: "09:00", end: "17:00", role: "" }); }}>
        <SheetContent className="sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>{shiftForm.employee && shiftForm.day ? `Edit Shift — ${shiftForm.employee} · ${shiftForm.day}` : "Add Shift"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-5">
            <div className="space-y-1.5">
              <Label className="text-xs">Employee</Label>
              <Select value={shiftForm.employee} onValueChange={(v) => handleField("employee", v)}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{EMPLOYEES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Day</Label>
              <Select value={shiftForm.day} onValueChange={(v) => handleField("day", v)}>
                <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                <SelectContent>{DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Start Time</Label>
                <Input type="time" value={shiftForm.start} onChange={(e) => handleField("start", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">End Time</Label>
                <Input type="time" value={shiftForm.end} onChange={(e) => handleField("end", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Select value={shiftForm.role} onValueChange={(v) => handleField("role", v)}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {["Cashier", "Deli Cook", "Manager", "Asst. Manager", "Stock Clerk"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {shiftForm.start && shiftForm.end && (
              <div className="rounded-md bg-muted/40 border border-border p-3 text-xs text-muted-foreground">
                Duration: <span className="text-foreground font-medium">{calcHours(shiftForm.start, shiftForm.end).toFixed(1)} hours</span>
              </div>
            )}
          </div>
          <SheetFooter className="mt-6 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setSheetOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave}>Save Shift</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};
