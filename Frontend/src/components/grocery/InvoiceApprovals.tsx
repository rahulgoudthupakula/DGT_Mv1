import { useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/backend";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Check, X, AlertTriangle, FileCheck, Clock } from "lucide-react";

type ApprovalStatus = "Pending" | "Approved" | "Rejected";

type ApprovalInvoice = {
  id: string;
  invoiceNumber: string;
  vendorName: string;
  invoiceDate: string;
  dueDate: string;
  poNumber: string;
  total: number;
  submittedBy: string;
  submittedAt: string;
  alerts: string[];
  status: ApprovalStatus;
  decisionNote?: string;
};

const statusStyles: Record<ApprovalStatus,string>={Pending:'bg-amber-100 text-amber-800',Approved:'bg-green-100 text-green-800',Rejected:'bg-red-100 text-red-800'};
export const InvoiceApprovals = ({storeId}:{storeId:string}) => {
  const { toast } = useToast();
  const client=useQueryClient();
  const path=`/access/stores/${encodeURIComponent(storeId)}/invoice-entry`;
  const query=useQuery({queryKey:['invoice-entry',storeId],enabled:!!storeId,queryFn:()=>request<{invoices:Partial<ApprovalInvoice>[]}>(path)});
  const invoices:ApprovalInvoice[]=(query.data?.invoices??[]).map(i=>({dueDate:'',poNumber:'',submittedBy:'',submittedAt:'',alerts:[],...i,id:String(i.id)} as ApprovalInvoice));
  const [saving,setSaving]=useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Pending");
  const [decision, setDecision] = useState<{
    invoice: ApprovalInvoice;
    action: "Approved" | "Rejected";
  } | null>(null);
  const [note, setNote] = useState("");

  const filtered = useMemo(
    () =>
      invoices.filter((inv) => {
        const q = search.toLowerCase();
        const matchesSearch =
          !q ||
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.vendorName.toLowerCase().includes(q) ||
          inv.poNumber.toLowerCase().includes(q);
        const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [invoices, search, statusFilter]
  );

  const pending = invoices.filter((i) => i.status === "Pending");
  const pendingValue = pending.reduce((s, i) => s + i.total, 0);
  const withAlerts = pending.filter((i) => i.alerts.length > 0).length;

  const confirmDecision = async () => {
    if(!decision || saving || decision.action!=='Approved')return;
    setSaving(true);
    try{await request(`${path}/${decision.invoice.id}/approve`,{method:'POST'});await client.invalidateQueries();toast({title:'Invoice approved; stock updated'});setDecision(null);setNote('');}
    catch(e){toast({title:e instanceof Error?e.message:'Approval failed',variant:'destructive'});}
    finally{setSaving(false);}
  };
  if(query.isError)return <p role="alert">{query.error.message}</p>;
  if(query.isLoading)return <p>Loading invoices…</p>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-xs text-muted-foreground">Awaiting Approval</p>
              <p className="text-xl font-semibold">{pending.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <FileCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Pending Value</p>
              <p className="text-xl font-semibold">${pendingValue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-xs text-muted-foreground">With Alerts</p>
              <p className="text-xl font-semibold">{withAlerts}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoice #, vendor, PO..."
                className="pl-9 h-8 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Invoices for Approval</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs">Invoice #</TableHead>
                <TableHead className="text-xs">Vendor</TableHead>
                <TableHead className="text-xs">Invoice Date</TableHead>
                <TableHead className="text-xs">Due Date</TableHead>
                <TableHead className="text-xs">Purchase Order Number</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
                <TableHead className="text-xs">Submitted By</TableHead>
                <TableHead className="text-xs text-center">Alerts</TableHead>
                <TableHead className="text-xs text-center">Status</TableHead>
                <TableHead className="text-xs text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No invoices found matching your filters
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-muted/20">
                    <TableCell className="text-sm font-medium">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-sm">{inv.vendorName}</TableCell>
                    <TableCell className="text-sm">{inv.invoiceDate}</TableCell>
                    <TableCell className="text-sm">{inv.dueDate}</TableCell>
                    <TableCell className="text-sm text-primary">{inv.poNumber}</TableCell>
                    <TableCell className="text-sm text-right font-medium">
                      ${inv.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-xs">
                      <p>{inv.submittedBy}</p>
                      <p className="text-muted-foreground">{inv.submittedAt}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      {inv.alerts.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-wrap justify-center gap-1">
                          {inv.alerts.map((a) => (
                            <Badge
                              key={a}
                              variant="outline"
                              className="text-[10px] border-amber-300 text-amber-700"
                            >
                              {a}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={statusStyles[inv.status]}>{inv.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {inv.status === "Pending" ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setDecision({ invoice: inv, action: "Approved" });
                              setNote("");
                            }}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled title="Invoice rejection is not connected yet" className="text-destructive"
                            onClick={() => {
                              setDecision({ invoice: inv, action: "Rejected" });
                              setNote("");
                            }}
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {inv.decisionNote ?? "—"}
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

      <Dialog open={!!decision} onOpenChange={(open) => {if(!open&&!saving)setDecision(null);}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {decision?.action === "Approved" ? "Approve Invoice" : "Reject Invoice"}
            </DialogTitle>
          </DialogHeader>
          {decision && (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-muted/30 p-3 space-y-1">
                <p className="font-medium">{decision.invoice.invoiceNumber}</p>
                <p className="text-muted-foreground text-xs">
                  {decision.invoice.vendorName} · ${decision.invoice.total.toFixed(2)} ·{" "}
                  {decision.invoice.poNumber}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  {decision.action === "Approved" ? "Note (optional)" : "Reason"}
                </label>
                <Textarea disabled title="Decision notes are not connected yet"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    decision.action === "Approved"
                      ? "Add a note for the audit trail"
                      : "Why is this invoice being rejected?"
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => setDecision(null)}>
              Cancel
            </Button>
            <Button
              variant={decision?.action === "Rejected" ? "destructive" : "default"}
              disabled={saving || decision?.action === "Rejected" && !note.trim()}
              onClick={confirmDecision}
            >
              {decision?.action === "Approved" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
