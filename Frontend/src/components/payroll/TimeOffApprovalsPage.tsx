import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import {
  TimeOffRequest,
  loadTimeOffRequests,
  updateTimeOffRequest,
} from "@/lib/timeoffStore";

const statusBadge = (status: TimeOffRequest["status"]) => {
  if (status === "approved") return <Badge className="bg-emerald-600 text-white text-[10px]">Approved</Badge>;
  if (status === "rejected") return <Badge variant="destructive" className="text-[10px]">Rejected</Badge>;
  return <Badge variant="secondary" className="text-[10px]">Pending</Badge>;
};

type Decision = { request: TimeOffRequest; action: "approved" | "rejected" };

export const TimeOffApprovalsPage = () => {
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [decision, setDecision] = useState<Decision | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const refresh = () => setRequests(loadTimeOffRequests());
    refresh();
    window.addEventListener("timeoff-updated", refresh);
    return () => window.removeEventListener("timeoff-updated", refresh);
  }, []);

  const visible = filter === "pending" ? requests.filter((r) => r.status === "pending") : requests;
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  const openDecision = (request: TimeOffRequest, action: "approved" | "rejected") => {
    setDecision({ request, action });
    setNotes("");
  };

  const confirmDecision = () => {
    if (!decision) return;
    updateTimeOffRequest(decision.request.id, {
      status: decision.action,
      decidedAt: new Date().toISOString(),
      decisionNotes: notes.trim() || undefined,
    });
    toast.success(
      `${decision.request.employee}'s request ${decision.action === "approved" ? "approved" : "rejected"}`
    );
    setDecision(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Time Off Approvals</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and decide on employee time-off requests.</p>
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as "pending" | "all")}>
          <TabsList>
            <TabsTrigger value="pending">
              Pending {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px]">{pendingCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All Requests</TabsTrigger>
          </TabsList>
        </Tabs>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <ClipboardCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    {filter === "pending" ? "No pending requests to review." : "No time-off requests yet."}
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((r) => (
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
                    <TableCell className="text-right">
                      {r.status === "pending" ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-emerald-600 hover:text-emerald-700"
                            title="Approve"
                            onClick={() => openDecision(r, "approved")}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            title="Reject"
                            onClick={() => openDecision(r, "rejected")}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {r.decisionNotes || "—"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!decision} onOpenChange={(open) => { if (!open) setDecision(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {decision?.action === "approved" ? "Approve" : "Reject"} Time Off Request
            </DialogTitle>
            <DialogDescription>
              {decision?.request.employee} — {decision?.request.type},{" "}
              {decision?.request.startDate} → {decision?.request.endDate} ({decision?.request.days} day
              {decision?.request.days === 1 ? "" : "s"})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note for the employee…"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecision(null)}>Cancel</Button>
            <Button
              variant={decision?.action === "rejected" ? "destructive" : "default"}
              onClick={confirmDecision}
            >
              Confirm {decision?.action === "approved" ? "Approval" : "Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
