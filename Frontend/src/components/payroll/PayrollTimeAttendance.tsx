import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { addDays, format } from "date-fns";

type Employee = { id: number; name: string; scheduled: number; worked: number; regular: number; overtime: number; timeOff: number; openPunches: number; unmatchedShifts: number };
type Punch = { id: number; clockIn: string; clockOut: string | null; worked: number | null; overtime: number; source: string };
type Attendance = { week: string; timezone: string; settings: { threshold: number; version: string }; canConfigure: boolean; employees: Employee[]; punches?: Punch[] };
const hours = (value: number) => `${Number(value).toFixed(2)}h`;

export function PayrollTimeAttendance({ storeId }: { storeId: string }) {
  const [week, setWeek] = useState("");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [configure, setConfigure] = useState(false);
  const [threshold, setThreshold] = useState("40");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const client = useQueryClient();
  const base = `/access/stores/${encodeURIComponent(storeId)}/attendance`;
  const query = useQuery({ queryKey: ["attendance", storeId, week], queryFn: ({ signal }) => request<Attendance>(`${base}${week ? `?week=${week}` : ""}`, { signal }), refetchInterval: 30_000 });
  const data = query.data;
  const selectedWeek = week || data?.week || "";
  const detail = useQuery({ queryKey: ["attendance-detail", storeId, employee?.id, selectedWeek], enabled: !!employee && !!selectedWeek, queryFn: ({ signal }) => request<Attendance>(`${base}/${employee!.id}?week=${selectedWeek}`, { signal }), refetchInterval: 30_000 });
  const move = (days: number) => { if (selectedWeek) setWeek(format(addDays(new Date(`${selectedWeek}T12:00:00`), days), "yyyy-MM-dd")); };
  const dateTime = (value: string) => new Intl.DateTimeFormat(undefined, { timeZone: data?.timezone, dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  const save = async () => {
    setError(""); setSaving(true);
    try {
      await request(`${base}/settings`, { method: "PUT", body: JSON.stringify({ weeklyOvertimeHours: Number(threshold), version: data?.settings.version }) });
      await client.invalidateQueries({ queryKey: ["attendance", storeId] });
      await client.invalidateQueries({ queryKey: ["attendance-detail", storeId] });
      setConfigure(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save settings."); }
    finally { setSaving(false); }
  };
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-2xl font-bold">Time &amp; Attendance</h2>{data?.canConfigure && <Button variant="outline" onClick={() => { setThreshold(String(data.settings.threshold)); setError(""); setConfigure(true); }}>Overtime settings</Button>}</div>
    <div className="flex flex-wrap items-center gap-3"><Button aria-label="Previous week" variant="outline" onClick={() => move(-7)} disabled={!selectedWeek}><ChevronLeft /></Button><label className="flex items-center gap-2">Week of <Input type="date" aria-label="Choose attendance week" className="w-auto" value={selectedWeek} onChange={e => setWeek(e.target.value)} /></label><Button aria-label="Next week" variant="outline" onClick={() => move(7)} disabled={!selectedWeek}><ChevronRight /></Button><span className="text-muted-foreground">Sunday–Saturday · {data?.timezone}</span></div>
    <p className="text-sm text-muted-foreground">Actual hours come from POS/timeclock work intervals. Open punches are excluded until clock-out arrives. Approved time off is shown separately and does not count toward overtime.</p>
    {query.isPending && <p>Loading attendance…</p>}
    {query.error && <p role="alert" className="text-red-600">{query.error.message} <button className="underline" onClick={() => query.refetch()}>Retry</button></p>}
    {data && <><p className="text-sm">Weekly overtime starts after {data.settings.threshold} worked hours.</p><div className="overflow-x-auto rounded-xl border"><Table><TableHeader><TableRow>{["Employee", "Scheduled", "Worked", "Regular", "Overtime", "Approved leave", "Needs review", "Actions"].map(v => <TableHead key={v}>{v}</TableHead>)}</TableRow></TableHeader><TableBody>
      {data.employees.map(e => <TableRow key={e.id}><TableCell className="font-medium">{e.name}</TableCell><TableCell>{hours(e.scheduled)}</TableCell><TableCell>{hours(e.worked)}</TableCell><TableCell>{hours(e.regular)}</TableCell><TableCell>{hours(e.overtime)}</TableCell><TableCell>{hours(e.timeOff)}</TableCell><TableCell>{e.openPunches > 0 && <p className="text-red-600">{e.openPunches} missing clock-out</p>}{e.unmatchedShifts > 0 && <p className="text-red-600">{e.unmatchedShifts} scheduled shifts without punches</p>}{!e.openPunches && !e.unmatchedShifts && "—"}</TableCell><TableCell><Button variant="ghost" onClick={() => setEmployee(e)}><Eye className="mr-2 h-4 w-4" />View punches</Button></TableCell></TableRow>)}
      {!data.employees.length && <TableRow><TableCell colSpan={8}>No employees for this week.</TableCell></TableRow>}
    </TableBody></Table></div>{data.employees.length > 0 && data.employees.every(e => !e.worked && !e.openPunches) && <p className="text-muted-foreground">No completed punches received for this week. Waiting for attendance data from the connector.</p>}</>}
    <Dialog open={!!employee} onOpenChange={open => { if (!open) setEmployee(null); }}><DialogContent className="max-w-3xl max-h-[85vh] overflow-auto"><DialogHeader><DialogTitle>{employee?.name} — Punches</DialogTitle></DialogHeader>
      {detail.isPending && <p>Loading punches…</p>}{detail.error && <p role="alert" className="text-red-600">{detail.error.message}</p>}
      {detail.data && <><p className="text-sm text-muted-foreground">Times shown in {data?.timezone}. Hours include only the portion inside this week.</p><Table><TableHeader><TableRow><TableHead>Clock in</TableHead><TableHead>Clock out</TableHead><TableHead>Worked</TableHead><TableHead>Overtime</TableHead></TableRow></TableHeader><TableBody>{detail.data.punches?.map(p => <TableRow key={p.id}><TableCell>{dateTime(p.clockIn)}</TableCell><TableCell>{p.clockOut ? dateTime(p.clockOut) : <span className="text-red-600">Missing clock-out</span>}</TableCell><TableCell>{p.worked === null ? "—" : hours(p.worked)}</TableCell><TableCell>{hours(p.overtime)}</TableCell></TableRow>)}</TableBody></Table>{!detail.data.punches?.length && <p>No punches received for this employee this week.</p>}</>}
    </DialogContent></Dialog>
    <Dialog open={configure} onOpenChange={setConfigure}><DialogContent><DialogHeader><DialogTitle>Weekly overtime threshold</DialogTitle></DialogHeader><label htmlFor="overtime-hours">Worked hours per Sunday–Saturday week</label><Input id="overtime-hours" type="number" min="0.01" max="168" step="0.01" value={threshold} onChange={e => setThreshold(e.target.value)} /><p className="text-sm text-muted-foreground">Applies to attendance calculations for this store, including past weeks. It does not change payroll records.</p>{error && <p role="alert" className="text-red-600">{error}</p>}<Button disabled={saving || !Number.isFinite(Number(threshold)) || Number(threshold) <= 0 || Number(threshold) > 168} onClick={save}>{saving ? "Saving…" : "Save"}</Button></DialogContent></Dialog>
  </div>;
}
