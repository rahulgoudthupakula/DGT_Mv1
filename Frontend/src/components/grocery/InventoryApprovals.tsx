import { useQuery,useQueryClient } from "@tanstack/react-query";
import { request as apiRequest } from "@/lib/backend";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Clock, ArrowRightLeft, AlertTriangle, PackageX, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { useToast } from "@/hooks/use-toast";
import {
  type ApprovalRequest,
  type ApprovalStatus,
} from "@/lib/approvalsStore";

const typeMeta: Record<ApprovalRequest["type"], { label: string; icon: typeof ArrowRightLeft }> = {
  transfer: { label: "Store Transfer", icon: ArrowRightLeft },
  shrinkage: { label: "Shrinkage & Waste", icon: AlertTriangle },
  reduction: { label: "Reduce Inventory", icon: PackageX },
};

const statusBadge = (status: ApprovalStatus) => {
  if (status === "pending")
    return <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 bg-amber-50"><Clock className="h-3 w-3" />Pending</Badge>;
  if (status === "approved")
    return <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-300 bg-emerald-50"><CheckCircle2 className="h-3 w-3" />Approved</Badge>;
  return <Badge variant="outline" className="gap-1 text-red-600 border-red-300 bg-red-50"><XCircle className="h-3 w-3" />Rejected</Badge>;
};

export const InventoryApprovals = ({storeId}:{storeId:string}) => {
  const client=useQueryClient();const path=`/access/stores/${encodeURIComponent(storeId)}/reductions`;
  const query=useQuery({queryKey:['reductions',storeId],queryFn:()=>apiRequest<{requests:any[]}>(path)});
  const requests=(query.data?.requests??[]).map(r=>({id:String(r.reduction_request_id),itemName:r.product_name,scanCode:r.product_sku,quantity:r.quantity,reason:r.reason,reasonLabel:r.reason.replaceAll("-", " "),decisionNotes:r.rejection_reason,type:r.route==='transfers'?'transfer':r.route==='shrinkage'?'shrinkage':'reduction',status:r.status.toLowerCase(),requestedAt:r.created_at,decidedAt:r.status==='PENDING'?undefined:r.updated_at,transferStore:r.destination_name,canReview:r.canReview} as ApprovalRequest&{canReview:boolean}));
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<"all" | ApprovalStatus>("pending");
  const [search, setSearch] = useState("");
  const [decision, setDecision] = useState<{ request: ApprovalRequest; action: "approved" | "rejected" } | null>(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.itemName.toLowerCase().includes(q) ||
        r.scanCode.toLowerCase().includes(q) ||
        r.reasonLabel.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    });
  }, [requests, statusFilter, search]);

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  const {
    paginated: paginatedData, page, totalPages, pageSize, totalItems, hasPrev, hasNext, nextPage, prevPage,
  } = usePagination(filtered, 10);

  const applyDecision = async () => {
    if (!decision || processing) return;
    const { request, action } = decision;
    setProcessing(true);
    try {
      await apiRequest(`${path}/${request.id}/decision`,{method:'POST',body:JSON.stringify({status:action.toUpperCase(),note:decisionNotes})});
      await Promise.all(['reductions','pricebook-items','current-stock','stock-movements'].map(key => client.invalidateQueries({queryKey:[key,storeId]})));
      toast({
        title: action === "approved" ? "Request approved" : "Request rejected",
        description:
          action === "approved"
            ? request.type === "transfer"
              ? `${request.itemName} sent to Store to Store Transfers.`
              : request.type === "shrinkage"
                ? `${request.itemName} recorded in Inventory Shrinkage & Waste.`
                : `${request.itemName} reduction approved.`
            : `${request.itemName} request was rejected.`,
      });
      setDecision(null);
      setDecisionNotes("");
    } catch (e) {
      console.error(e);
      toast({ title: "Could not complete the action", description: e instanceof Error?e.message:"Please try again.", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {query.isPending && <p role="status" className="text-sm text-muted-foreground">Loading adjustment requests…</p>}
      {query.isError && <div role="alert" className="text-sm text-destructive">{query.error instanceof Error ? query.error.message : "Could not load requests."} <Button variant="outline" size="sm" onClick={() => query.refetch()}>Retry</Button></div>}
      <p className="text-sm text-muted-foreground">Approve or reject pending inventory adjustments. Approval records the stock movement and reduces the balance. Admin adjustments are approved automatically. Other employees’ requests require an authorized reviewer.</p>
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:border-amber-300" onClick={() => setStatusFilter("pending")}>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending Approval</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-emerald-300" onClick={() => setStatusFilter("approved")}>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">{approvedCount}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-red-300" onClick={() => setStatusFilter("rejected")}>
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{rejectedCount}</p>
              <p className="text-xs text-muted-foreground">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search item, code, reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs w-[240px]"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="h-9 w-[160px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        {(search || statusFilter !== "pending") && (
          <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => { setSearch(""); setStatusFilter("pending"); }}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Requests table */}
      <div className="border border-border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[11px]">Request</TableHead>
              <TableHead className="text-[11px]">Item</TableHead>
              <TableHead className="text-[11px]">Scan Code</TableHead>
              <TableHead className="text-[11px] text-right">Qty</TableHead>
              <TableHead className="text-[11px]">Type</TableHead>
              <TableHead className="text-[11px]">Reason / Destination</TableHead>
              <TableHead className="text-[11px]">Requested</TableHead>
              <TableHead className="text-[11px]">Status</TableHead>
              <TableHead className="text-[11px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-10">
                  {query.isPending ? "Loading requests…" : query.isError ? "Requests could not be loaded." : `No ${statusFilter === "all" ? "" : statusFilter + " "}requests found.`}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((r) => {
                const meta = typeMeta[r.type];
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs font-medium">{r.id}</TableCell>
                    <TableCell className="text-xs">{r.itemName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.scanCode}</TableCell>
                    <TableCell className="text-xs text-right">{r.quantity}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-xs">
                        <meta.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        {meta.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      {r.reasonLabel}
                      {r.type === "transfer" && r.transferStore && (
                        <span className="block text-[11px] text-muted-foreground">→ {r.transferStore}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(r.requestedAt), "MMM dd, yyyy h:mm a")}
                    </TableCell>
                    <TableCell>{statusBadge(r.status)}{r.decisionNotes && <p className="mt-1 text-xs text-muted-foreground">{r.decisionNotes}</p>}</TableCell>
                    <TableCell className="text-right">
                      {r.status === "pending" && r.canReview ? (
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                            onClick={() => { setDecision({ request: r, action: "approved" }); setDecisionNotes(""); }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => { setDecision({ request: r, action: "rejected" }); setDecisionNotes(""); }}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          {r.status === "pending" ? "Awaiting authorized reviewer" : r.decidedAt ? format(new Date(r.decidedAt), "MMM dd, yyyy") : "—"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrev={prevPage}
        onNext={nextPage}
      />

      {/* Decision dialog */}
      <Dialog open={!!decision} onOpenChange={(o) => { if (!o && !processing) setDecision(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {decision?.action === "approved" ? "Approve Request" : "Reject Request"}
            </DialogTitle>
            <DialogDescription>
              {decision?.action === "approved"
                ? decision?.request.type === "transfer"
                  ? "This will record the transfer in Store to Store Transfers."
                  : decision?.request.type === "shrinkage"
                    ? "This will record the item in Inventory Shrinkage & Waste."
                    : "This will approve the inventory reduction."
                : "This request will be marked as rejected and no changes will be made."}
            </DialogDescription>
          </DialogHeader>
          {decision && (
            <div className="space-y-3 py-2">
              <div className="rounded-md border border-border p-3 text-xs space-y-1">
                <p><span className="text-muted-foreground">Item:</span> <span className="font-medium">{decision.request.itemName}</span></p>
                <p><span className="text-muted-foreground">Quantity:</span> <span className="font-medium">{decision.request.quantity}</span></p>
                <p><span className="text-muted-foreground">Reason:</span> <span className="font-medium">{decision.request.reasonLabel}</span></p>
                {decision.request.type === "transfer" && decision.request.transferStore && (
                  <p><span className="text-muted-foreground">Destination:</span> <span className="font-medium">{decision.request.transferStore}</span></p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Notes (optional)</Label>
                <Textarea
                  rows={2}
                  maxLength={255}
                  disabled={processing}
                  className="text-sm resize-none"
                  placeholder="Add a note for this decision…"
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" disabled={processing} onClick={() => setDecision(null)}>Cancel</Button>
            <Button
              onClick={applyDecision}
              disabled={processing}
              variant={decision?.action === "rejected" ? "destructive" : "default"}
            >
              {processing ? "Processing…" : decision?.action === "approved" ? "Confirm Approval" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
