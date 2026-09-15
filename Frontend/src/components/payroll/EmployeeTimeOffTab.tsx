import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import {
  TimeOffRequest,
  TimeOffType,
  addTimeOffRequest,
  calcBusinessDays,
  getEmployeeBalances,
  getEmployeeRequests,
} from "@/lib/timeoffStore";

const TYPES: TimeOffType[] = ["Vacation", "Sick Leave", "Personal Day", "Unpaid Leave", "Other"];

const statusBadge = (status: TimeOffRequest["status"]) => {
  if (status === "approved") return <Badge className="bg-emerald-600 text-white text-[10px]">Approved</Badge>;
  if (status === "rejected") return <Badge variant="destructive" className="text-[10px]">Rejected</Badge>;
  return <Badge variant="secondary" className="text-[10px]">Pending</Badge>;
};

export const EmployeeTimeOffTab = ({ employee }: { employee: string }) => {
  const [version, setVersion] = useState(0);
  const [type, setType] = useState<TimeOffType | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    const refresh = () => setVersion((v) => v + 1);
    window.addEventListener("timeoff-updated", refresh);
    return () => window.removeEventListener("timeoff-updated", refresh);
  }, []);

  const balances = useMemo(() => getEmployeeBalances(employee), [employee, version]);
  const requests = useMemo(() => getEmployeeRequests(employee), [employee, version]);

  const days = startDate && endDate ? calcBusinessDays(startDate, endDate) : 0;
  const valid = !!type && !!startDate && !!endDate && new Date(endDate) >= new Date(startDate);

  const submit = () => {
    if (!valid) return;
    addTimeOffRequest({ employee, type: type as TimeOffType, startDate, endDate, days, reason });
    toast.success(`Request submitted for approval (${days} day${days === 1 ? "" : "s"})`);
    setType("");
    setStartDate("");
    setEndDate("");
    setReason("");
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Time Off Balance</p>
        <div className="grid grid-cols-2 gap-2">
          {balances.map((b) => (
            <div key={b.type} className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">{b.type}</p>
              <p className="text-lg font-bold text-foreground">
                {b.remaining === null ? "—" : b.remaining}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  {b.allowance === null ? "no cap" : `of ${b.allowance} days left`}
                </span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Used {b.used}{b.pending > 0 ? ` · ${b.pending} pending` : ""}
              </p>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground">Request Time Off</p>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as TimeOffType)}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>End Date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        {days > 0 && (
          <p className="text-xs text-muted-foreground">{days} working day{days === 1 ? "" : "s"}</p>
        )}
        <div className="space-y-1.5">
          <Label>Reason (optional)</Label>
          <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Add a short reason…" />
        </div>
        <Button size="sm" disabled={!valid} onClick={submit}>
          <CalendarPlus className="w-4 h-4 mr-1" /> Submit Request
        </Button>
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Request History</p>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No time-off requests yet.</p>
        ) : (
          requests.map((r) => (
            <div key={r.id} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{r.type}</span>
                {statusBadge(r.status)}
              </div>
              <p className="text-xs text-muted-foreground">
                {r.startDate} → {r.endDate} · {r.days} day{r.days === 1 ? "" : "s"}
              </p>
              {r.decisionNotes && <p className="text-xs text-muted-foreground mt-1">Note: {r.decisionNotes}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
