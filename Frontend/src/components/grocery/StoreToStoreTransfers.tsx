import {request} from '@/lib/backend';
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ArrowRightLeft, ArrowUpRight, ArrowDownLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StoreTransferRow {
  id: string;
  direction: "sent" | "received";
  item_name: string;
  scan_code: string;
  quantity: number;
  received:number;
  destinationProduct:number|null;
  counterparty_store: string;
  status: "pending" | "confirmed" | "sent";
  transferred_at: string;
  confirmed_at: string | null;
  notes: string | null;
}

export const StoreToStoreTransfers = ({storeId}:{storeId:string}) => {
  const { toast } = useToast();
  const [records, setRecords] = useState<StoreTransferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [direction, setDirection] = useState<"all" | "sent" | "received">("all");
  const [confirmTarget, setConfirmTarget] = useState<StoreTransferRow | null>(null);
  const [confirmNotes, setConfirmNotes] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkNotes, setBulkNotes] = useState("");

  const [items,setItems]=useState<{product_id:number;product_name:string;product_sku:string}[]>([]),[canReceive,setCanReceive]=useState(false);
  const [targetProduct,setTargetProduct]=useState(''),[totalReceived,setTotalReceived]=useState('');
  const path=`/access/stores/${encodeURIComponent(storeId)}/reductions/transfers`;
  const fetchRecords = async () => {
    try{const data=await request<{transfers:any[];items:typeof items;canReceive:boolean}>(path);setItems(data.items);setCanReceive(data.canReceive);setRecords(data.transfers.map(r=>({id:String(r.reduction_request_id),item_name:r.product_name,scan_code:r.product_sku,quantity:Number(r.quantity),received:Number(r.qty_received),destinationProduct:r.destination_product_id,notes:null,direction:r.destination===storeId?'received':'sent',counterparty_store:r.destination===storeId?r.dgt_id:r.destination,status:r.transfer_status==='COMPLETED'?'confirmed':r.destination===storeId?'pending':'sent',transferred_at:r.updated_at,confirmed_at:null})));}catch(e){toast({title:'Could not load records',description:String(e),variant:'destructive'});}finally{setLoading(false);}
  };
  useEffect(()=>{fetchRecords();},[storeId]);


  const toggleSelect = (id:string) => setSelectedIds(prev=>{const next=new Set(prev);if(next.has(id))next.delete(id);else next.add(id);return next;});
  const handleConfirmReceipt = async () => {if(!confirmTarget||confirming)return;setConfirming(true);try{await request(`${path}/${confirmTarget.id}/receive`,{method:'POST',body:JSON.stringify({productId:Number(targetProduct),totalReceived:Number(totalReceived)})});await fetchRecords();setConfirmTarget(null);toast({title:'Receipt recorded'});}catch(e){toast({title:'Could not receive',description:String(e),variant:'destructive'});}finally{setConfirming(false);}};
  const handleBulkConfirm = () => {};

  const filtered = records.filter(r => {
    const q = query.toLowerCase();
    const matchesQ =
      !q ||
      r.item_name.toLowerCase().includes(q) ||
      r.scan_code.toLowerCase().includes(q) ||
      r.counterparty_store.toLowerCase().includes(q);
    const matchesDir = direction === "all" || r.direction === direction;
    return matchesQ && matchesDir;
  });

  const totalQty = filtered.reduce((sum, r) => sum + r.quantity, 0);
  const sentCount = records.filter(r => r.direction === "sent").length;
  const receivedCount = records.filter(r => r.direction === "received").length;
  const pendingCount = records.filter(r => r.direction === "received" && r.status === "pending").length;

  const pendingInFiltered = filtered.filter(r => r.direction === "received" && r.status === "pending");
  const allPendingSelected =
    pendingInFiltered.length > 0 && pendingInFiltered.every(r => selectedIds.has(r.id));
  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      if (allPendingSelected) {
        const next = new Set(prev);
        pendingInFiltered.forEach(r => next.delete(r.id));
        return next;
      }
      const next = new Set(prev);
      pendingInFiltered.forEach(r => next.add(r.id));
      return next;
    });
  };
  const selectedRecords = records.filter(r => selectedIds.has(r.id));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-primary" />
              Store to Store Transfers
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Live record of all items sent to or received from other stores.
              {pendingCount > 0 && (
                <span className="ml-1 text-amber-600 font-medium">
                  {pendingCount} pending receipt{pendingCount === 1 ? "" : "s"} to confirm.
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Showing</p>
            <p className="text-lg font-semibold">
              {filtered.length} <span className="text-xs text-muted-foreground font-normal">/ {totalQty} units</span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              <span className="text-emerald-600 font-medium">{sentCount} sent</span>
              {" · "}
              <span className="text-blue-600 font-medium">{receivedCount} received</span>
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs value={direction} onValueChange={v => setDirection(v as "all" | "sent" | "received")}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
                <TabsTrigger value="sent" className="text-xs px-3 flex items-center gap-1.5">
                  <ArrowUpRight className="h-3 w-3" /> Sent
                </TabsTrigger>
                <TabsTrigger value="received" className="text-xs px-3 flex items-center gap-1.5">
                  <ArrowDownLeft className="h-3 w-3" /> Received
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {selectedIds.size > 0 && (
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setBulkOpen(true)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Confirm {selectedIds.size} Selected
                </Button>
              )}
              <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search item, scan code, or store..."
                className="pl-8 h-8 text-xs"
              />
              </div>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs w-[36px]">
                    {pendingInFiltered.length > 0 && (
                      <Checkbox disabled
                        checked={allPendingSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all pending receipts"
                      />
                    )}
                  </TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Direction</TableHead>
                  <TableHead className="text-xs">Item Name</TableHead>
                  <TableHead className="text-xs">Scan Code</TableHead>
                  <TableHead className="text-xs text-center">Sent quantity</TableHead><TableHead>Received</TableHead><TableHead>Unresolved</TableHead>
                  <TableHead className="text-xs">From / To Store</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-xs text-muted-foreground py-8">
                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading transfers...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-xs text-muted-foreground py-8">
                      No store to store transfers yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>
                        {canReceive && r.direction === "received" && r.status === "pending" ? (
                          <Checkbox disabled
                            checked={selectedIds.has(r.id)}
                            onCheckedChange={() => toggleSelect(r.id)}
                            aria-label={`Select ${r.item_name}`}
                          />
                        ) : null}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(r.transferred_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.direction === "sent" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-medium dark:bg-emerald-500/15 dark:text-emerald-400">
                            <ArrowUpRight className="h-3 w-3" /> Sent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-medium dark:bg-blue-500/15 dark:text-blue-400">
                            <ArrowDownLeft className="h-3 w-3" /> Received
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-medium">{r.item_name}</TableCell>
                      <TableCell className="text-xs font-mono">{r.scan_code}</TableCell>
                      <TableCell className="text-xs text-center">{r.quantity}</TableCell><TableCell>{r.received}</TableCell><TableCell>{r.quantity-r.received}</TableCell>
                      <TableCell className="text-xs">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium">
                          <ArrowRightLeft className="h-3 w-3" />
                          {r.direction === "sent" ? "To " : "From "}{r.counterparty_store}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.status === "confirmed" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            Confirmed
                            {r.confirmed_at && (
                              <span className="text-muted-foreground font-normal ml-1">
                                {new Date(r.confirmed_at).toLocaleDateString()}
                              </span>
                            )}
                          </span>
                        ) : r.status === "sent" ? (
                          <span className="text-muted-foreground">{r.received>0?"Partial":"In transit"}</span>
                        ) : (
                          <span className="text-amber-600 font-medium">{r.received>0?"Partial":"In transit"}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {canReceive && r.direction === "received" && r.status === "pending" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                              setConfirmTarget(r);setTargetProduct(r.destinationProduct?String(r.destinationProduct):'');setTotalReceived('');
                              setConfirmNotes("");
                            }}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Receive items
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmTarget !== null} onOpenChange={(o) => {if(!o&&!confirming)setConfirmTarget(null);}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Receive items</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div>
                  Confirm that you received this transfer from{" "}
                  <strong className="text-foreground">{confirmTarget?.counterparty_store}</strong>:
                </div>
                {confirmTarget && (
                  <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground">Item</span><span className="font-medium text-foreground">{confirmTarget.item_name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Scan Code</span><span className="font-mono text-foreground">{confirmTarget.scan_code}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Quantity</span><span className="font-medium text-foreground">{confirmTarget.quantity}</span></div>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label htmlFor="destination-product">Matching item in this store</label>
                  <select id="destination-product" className="border rounded w-full p-2" value={targetProduct} disabled={!!confirmTarget?.destinationProduct||confirming} onChange={e=>setTargetProduct(e.target.value)}><option value="">Select matching item</option>{items.map(i=><option key={i.product_id} value={i.product_id}>{i.product_name} ({i.product_sku})</option>)}</select>
                  <label htmlFor="received-total">Total received so far (previously {confirmTarget?.received})</label>
                  <Input id="received-total" type="number" step="0.001" value={totalReceived} disabled={confirming} onChange={e=>setTotalReceived(e.target.value)}/>
                  <p>Only the additional quantity is added. Any shortage remains unresolved. If the item is missing, create it in this store's Items page first.</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirming}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={e=>{e.preventDefault();handleConfirmReceipt();}} disabled={confirming||!targetProduct||!totalReceived}>
              {confirming ? (<><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Confirming...</>) : "Receive items"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkOpen} onOpenChange={(o) => !o && setBulkOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm {selectedRecords.length} Receipt{selectedRecords.length === 1 ? "" : "s"}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div>
                  Mark the following received transfers as confirmed. The notes below will be applied to all selected items.
                </div>
                <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedRecords.map(r => (
                    <div key={r.id} className="flex justify-between gap-3">
                      <span className="font-medium text-foreground truncate">{r.item_name}</span>
                      <span className="text-muted-foreground whitespace-nowrap">
                        {r.quantity} · from {r.counterparty_store}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Notes (optional, applied to all)</label>
                  <Textarea
                    placeholder="Add any discrepancies or comments..."
                    value={bulkNotes}
                    onChange={e => setBulkNotes(e.target.value)}
                    rows={3}
                    className="text-xs"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={true}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkConfirm} disabled={true}>
              {confirming ? (<><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Confirming...</>) : `Confirm ${selectedRecords.length}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};