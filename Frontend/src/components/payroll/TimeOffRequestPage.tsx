import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CalendarPlus, CalendarOff } from "lucide-react";
import { toast } from "sonner";
import {
  TimeOffRequest,
  TimeOffType,
  addTimeOffRequest,
  calcBusinessDays,
  loadTimeOffRequests,
} from "@/lib/timeoffStore";

const TIME_OFF_TYPES: TimeOffType[] = ["Vacation", "Sick Leave", "Personal Day", "Unpaid Leave", "Other"];

const EMPLOYEES = ["Maria Lopez", "James Carter", "Aisha Patel", "Sarah Kim", "Tom Nguyen"];

const statusBadge = (status: TimeOffRequest["status"]) => {
  if (status === "approved") return <Badge className="bg-emerald-600 text-white text-[10px]">Approved</Badge>;
  if (status === "rejected") return <Badge variant="destructive" className="text-[10px]">Rejected</Badge>;
  return <Badge variant="secondary" className="text-[10px]">Pending</Badge>;
};

export const TimeOffRequestPage = () => {
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [open, setOpen] = useState(false);

  const [employee, setEmployee] = useState("");
  const [type, setType] = useState<TimeOffType | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    const refresh = () => setRequests(loadTimeOffRequests());
    refresh();
    window.addEventListener("timeoff-updated", refresh);
    return () => window.removeEventListener("timeoff-updated", refresh);
  }, []);

  const days = startDate && endDate ? calcBusinessDays(startDate, endDate) : 0;
  const valid = employee && type && startDate && endDate && days > 0 && new Date(endDate) >= new Date(startDate);

  const resetForm = () => {
    setEmployee("");
    setType("");
    setStartDate("");
    setEndDate("");
    setReason("");
  };

  const handleSubmit = () => {
    if (!valid) return;
    addTimeOffRequest({
      employee,
      type: type as TimeOffType,
      startDate,
      endDate,
      days,
      reason: reason.trim(),
    });
    toast.success(`Time-off request submitted for ${employee}`);
    resetForm();
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Time Off Request</h1>
          <p className="text-sm text-muted-foreground mt-1">Submit and track employee time-off requests.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <CalendarPlus className="w-4 h-4 mr-1.5" /> New Request
        </Button>
      </div>

      <Card className="border-dashboard-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="text-right">Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <CalendarOff className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No time-off requests yet. Click "New Request" to submit one.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell className="font-medium">{r.employee}</TableCell>
                    <TableCell>{r.type}</TableCell>
                    <TableCell className="text-sm">
                      {r.startDate} → {r.endDate}
                    </TableCell>
                    <TableCell className="text-right font-mono">{r.days}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-48 truncate">
                      {r.reason || "—"}
                    </TableCell>
                    <TableCell className="text-center">{statusBadge(r.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Time Off Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Employee</Label>
              <Select value={employee} onValueChange={setEmployee}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {EMPLOYEES.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as TimeOffType)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {TIME_OFF_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
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
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} />
              </div>
            </div>
            {startDate && endDate && (
              <p className="text-sm text-muted-foreground">
                Duration: <span className="font-semibold text-foreground">{days} working day{days === 1 ? "" : "s"}</span>
              </p>
            )}
            <div className="space-y-1.5">
              <Label>Reason (optional)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Add a note for the approver…"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!valid}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
