import { stockRefreshOptions } from "@/lib/stockRefresh";
import { matchesFilter } from "@/lib/filterSelection";
import { SearchMultiFilter } from "@/components/shared/SearchMultiFilter";
import { RecentFilterSelect, RecentFilterContent } from "@/components/shared/RecentFilterSelect";
import { DepartmentFilter } from "@/components/shared/DepartmentFilter";
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Links approved reductions to vendor return slips. Creating a slip and changing its status are
 * separate backend operations; the approved reduction remains the stock history source.
 */
import {useQuery} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import { useEffect, useRef, useState } from "react";
import { Search, Package, Upload, FileText, Send, Clock, Check, CreditCard, X, Printer, AlertCircle } from "lucide-react";
import { loadApprovals } from "@/lib/approvalsStore";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface InventoryItem {
  id: string;
  scanCode: string;
  itemName: string;
  vendor: string;
  vendorNames?: string[];
  primaryVendorId?: number|null;
  vendorIds?: number[];
  department?: string;
  currentStock: number;
  returnQty: number;
  netCost: number;
  reason: string;
}

const mockInventoryItems: InventoryItem[] = [
  {
    id: "1",
    scanCode: "012345678901",
    itemName: "Organic Milk 1 Gallon",
    vendor: "Dairy Fresh Co",
    currentStock: 24,
    returnQty: 0,
    netCost: 3.99,
    reason: "",
  },
  {
    id: "2",
    scanCode: "012345678902",
    itemName: "Whole Wheat Bread",
    vendor: "Baker's Best",
    currentStock: 15,
    returnQty: 0,
    netCost: 2.49,
    reason: "",
  },
  {
    id: "3",
    scanCode: "012345678903",
    itemName: "Greek Yogurt 32oz",
    vendor: "Dairy Fresh Co",
    currentStock: 30,
    returnQty: 0,
    netCost: 4.99,
    reason: "",
  },
  {
    id: "4",
    scanCode: "012345678904",
    itemName: "Orange Juice 64oz",
    vendor: "Citrus Grove",
    currentStock: 18,
    returnQty: 0,
    netCost: 3.49,
    reason: "",
  },
  {
    id: "5",
    scanCode: "012345678905",
    itemName: "Cheddar Cheese Block",
    vendor: "Dairy Fresh Co",
    currentStock: 12,
    returnQty: 0,
    netCost: 5.99,
    reason: "",
  },
];

const departments = ["All Departments", "Dairy", "Bakery", "Beverages", "Snacks", "Frozen", "Produce"];
const vendors = ["All Vendors", "Dairy Fresh Co", "Baker's Best", "Citrus Grove", "Snack World", "Fresh Farms"];
const returnReasons = ["Expired (vendor returnable)", "Damaged (vendor returnable)", "Vendor Recall"];
const suggestedReason=(reason:string)=>({'expired-returnable':returnReasons[0],'damaged-returnable':returnReasons[1],'vendor-recall':returnReasons[2]}[reason]??reason);
type ReturnDraft={requestId:string;itemName:string;scanCode:string;returnQty:number;netCost:number;reason:string};
const returnMethods = ["Pickup", "Drop-off", "Credit without return"];

type ReturnStatus = "pending" | "credit_received";

interface ReturnRecord {
  id: string;
  items: InventoryItem[];
  vendorName: string;
  reason: string;
  method: string;
  rmaNumber: string;
  status: ReturnStatus;
  createdAt: Date;
  totalCredit: number;
  notes?: string;
}

// Items appear here only after their reduce request is approved in Approvals.
const loadApprovedReturnables = (): InventoryItem[] =>
  loadApprovals()
    .filter(
      (r) =>
        r.status === "approved" &&
        r.type === "reduction" &&
        (r.reason === "damaged-returnable" || r.reason === "expired-returnable")
    )
    .map((r) => ({
      id: r.id,
      scanCode: r.scanCode,
      itemName: r.itemName,
      vendor: "—",
      currentStock: r.quantity,
      returnQty: 0,
      netCost: 0,
      reason: r.reasonLabel,
    }));

export const ReturnableInventory = ({storeId}:{storeId:string}) => {
  const approved=useQuery({queryKey:['reductions',storeId],...stockRefreshOptions,queryFn:()=>request<{requests:any[];items:any[]}>(`/access/stores/${encodeURIComponent(storeId)}/reductions`)});
  const slipPath=`/access/stores/${encodeURIComponent(storeId)}/reductions/return-slips`;
  const slips=useQuery({queryKey:['return-slips',storeId],...stockRefreshOptions,queryFn:()=>request<{returns:any[];vendors:{vendor_id:number;vendor_name:string}[];canManage:boolean;timezone:string}>(slipPath)});
  const [saving,setSaving]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const [disposal,setDisposal]=useState<InventoryItem|null>(null),[disposalNote,setDisposalNote]=useState('');
  const [openSlipId,setOpenSlipId]=useState<string|null>(null);
  const [scanCode, setScanCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string[]>([]);
  const [date, setDate] = useState<Date>();
  const [trackingFrom,setTrackingFrom]=useState(''),[trackingTo,setTrackingTo]=useState('');

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectionVendorId,setSelectionVendorId]=useState('');

  useEffect(() => {
    // A reduction is ready for return only until its paperwork has been created.
    if(!approved.data||!slips.data){setInventoryItems([]);return;}
    const createdReturns=new Set(slips.data.returns.flatMap(record=>[record.reduction_request_id,...(record.items??[]).map((item:any)=>item.reduction_request_id)].filter(id=>id!=null).map(String)));
    const waitingItems:InventoryItem[]=(approved.data.requests??[]).filter(r=>r.status==='APPROVED'&&r.route==='returnable'&&!createdReturns.has(String(r.reduction_request_id))).map(r=>{const item=approved.data.items.find(i=>Number(i.id)===Number(r.product_id));return {id:String(r.reduction_request_id),scanCode:r.product_sku,itemName:r.product_name,vendor:item?.vendor??'',vendorNames:item?.vendorNames??[item?.vendor??''],department:item?.department??'',currentStock:Number(item?.inventoryCount??0),returnQty:Number(r.quantity),netCost:Number(item?.netCost??0),reason:r.reason,primaryVendorId:item?.primaryVendorId??null,vendorIds:(item?.vendorIds??[]).map(Number)};});
    setInventoryItems(waitingItems);
    setSelectedItems(previous=>previous.filter(id=>waitingItems.some(item=>item.id===id)));
  }, [approved.data,slips.data]);

  // Return details
  const [returnDrafts,setReturnDrafts]=useState<ReturnDraft[]>([]);
  const [showReturnDetails,setShowReturnDetails]=useState(false);
  const detailsRef=useRef<HTMLDivElement>(null);
  const [returnMethod, setReturnMethod] = useState("");
  const [rmaNumber, setRmaNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Return slip modal
  const [showReturnSlip, setShowReturnSlip] = useState(false);
  const [currentReturnSlip, setCurrentReturnSlip] = useState<ReturnRecord | null>(null);
  const [creditConfirmation,setCreditConfirmation]=useState<ReturnRecord|null>(null);

  // Return records for status tracking
  const returnRecords:ReturnRecord[]=(slips.data?.returns??[]).map(r=>({id:String(r.return_id),vendorName:r.vendor_name,reason:[...new Set((r.items??[]).map((item:any)=>item.reason).filter(Boolean))].join(', '),method:r.return_type,rmaNumber:r.reference_number??'',status:(['CLOSED','CREDIT_RECEIVED'].includes(r.status)?'credit_received':'pending') as ReturnStatus,createdAt:new Date(r.created_at),items:(r.items??[]).map((i:any)=>({id:String(i.return_item_id),scanCode:i.product_sku,itemName:i.product_name,vendor:r.vendor_name,currentStock:0,returnQty:Number(i.qty),netCost:Number(i.unit_cost),reason:i.reason})),totalCredit:(r.items??[]).reduce((n:number,i:any)=>n+Number(i.qty)*Number(i.unit_cost),0)}));

  useEffect(()=>{if(openSlipId){const record=returnRecords.find(r=>r.id===openSlipId);if(record){setCurrentReturnSlip(record);setShowReturnSlip(true);setOpenSlipId(null);}}},[openSlipId,slips.data]);
  const handleReturnQtyChange = (id: string, qty: number) => {
    setInventoryItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, returnQty: Math.max(0, Math.min(qty, item.currentStock)) } : item
      )
    );
  };

  const handleReasonChange = (id: string, reason: string) => {
    setInventoryItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, reason } : item))
    );
  };

  const linkedToVendor=(item:InventoryItem,vendorId:string)=>!!vendorId&&(item.vendorIds??[]).includes(Number(vendorId));
  const canSelectItem=(item:InventoryItem)=>selectedItems.includes(item.id)||(!saving&&!showReturnDetails&&(selectionVendorId?linkedToVendor(item,selectionVendorId):selectedItems.length===0&&(item.vendorIds?.length??0)>0));
  const changeReturnVendor=(vendorId:string)=>{
    setSelectionVendorId(vendorId);setSelectedItems(previous=>previous.filter(id=>inventoryItems.some(item=>item.id===id&&linkedToVendor(item,vendorId))));setReturnDrafts([]);setShowReturnDetails(false);setError('');
  };
  const clearReturnSelection=()=>{setSelectedItems([]);setSelectionVendorId('');setReturnDrafts([]);setShowReturnDetails(false);setError('');};
  const toggleItemSelection=(id:string)=>{
    if(saving||showReturnDetails)return;
    const item=inventoryItems.find(item=>item.id===id);if(!item)return;
    if(selectedItems.includes(id)){const next=selectedItems.filter(value=>value!==id);setSelectedItems(next);if(!next.length)setSelectionVendorId('');return;}
    if(!canSelectItem(item))return;
    if(!selectedItems.length&&!selectionVendorId)setSelectionVendorId(item.primaryVendorId!=null?String(item.primaryVendorId):item.vendorIds?.length===1?String(item.vendorIds[0]):'');
    setSelectedItems(previous=>[...previous,id]);setError('');
  };
  const startReturnProcess=()=>{
    const items=inventoryItems.filter(item=>selectedItems.includes(item.id));if(!items.length)return;
    if(!selectionVendorId||items.some(item=>!linkedToVendor(item,selectionVendorId))){setError('Choose one vendor linked to every selected item.');return;}
    setError('');setMessage('');setReturnMethod('');setRmaNumber('');setNotes('');
    setReturnDrafts(items.map(item=>({requestId:item.id,itemName:item.itemName,scanCode:item.scanCode,returnQty:item.returnQty,netCost:item.netCost,reason:suggestedReason(item.reason)})));
    setShowReturnDetails(true);
  };
  useEffect(()=>{if(showReturnDetails)detailsRef.current?.scrollIntoView({behavior:'smooth',block:'start'});},[showReturnDetails,returnDrafts.length]);
  const handleCreateReturn=async()=>{
    if(saving)return;
    if(!returnDrafts.length||!returnMethod||!selectionVendorId||returnDrafts.some(row=>!row.reason)){setError('Choose a vendor, return method and reason for each item.');return;}
    setSaving(true);setError('');
    try{
      const saved=await request<{id:number}>(`${slipPath}/group`,{method:'POST',body:JSON.stringify({vendorId:Number(selectionVendorId),method:returnMethod,reference:rmaNumber,items:returnDrafts.map(row=>({requestId:Number(row.requestId),reason:row.reason}))})});
      await slips.refetch();clearReturnSelection();setOpenSlipId(String(saved.id));
    }catch(e){setError(e instanceof Error?e.message:'Could not save the return');}finally{setSaving(false);}
  };
  const moveToShrinkage=async()=>{
    if(!disposal||saving||!disposalNote.trim())return;
    setSaving(true);setError('');
    try{await request(`/access/stores/${encodeURIComponent(storeId)}/reductions/${disposal.id}/move-to-shrinkage`,{method:'POST',body:JSON.stringify({note:disposalNote.trim()})});await approved.refetch();clearReturnSelection();setDisposal(null);setMessage('Moved to Shrinkage & Waste. Stock was not reduced again.');}
    catch(e){setError(e instanceof Error?e.message:'Could not move this item.');}finally{setSaving(false);}
  };
  const updateStatus=async(id:string,status:string)=>{if(saving)return;setSaving(true);setError('');try{await request(`${slipPath}/${id}/status`,{method:'POST',body:JSON.stringify({status})});await slips.refetch();return true;}catch(e){setError(e instanceof Error?e.message:'Could not record credit received.');return false;}finally{setSaving(false);}};

  const getStatusBadge=(status:ReturnStatus)=><Badge variant="outline" className={cn("inline-flex items-center gap-1",status==='credit_received'?"bg-green-100 text-green-800 border-green-200":"bg-yellow-100 text-yellow-800 border-yellow-200")}>{status==='credit_received'?<CreditCard className="w-3 h-3"/>:<Clock className="w-3 h-3"/>}{status==='credit_received'?'Credit Received':'Pending'}</Badge>;
  const trackingDate=(date:Date)=>{
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:slips.data?.timezone??'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
    return ['year','month','day'].map(type=>parts.find(part=>part.type===type)?.value??'').join('-');
  };
  const invalidTrackingRange=!!trackingFrom&&!!trackingTo&&trackingFrom>trackingTo;
  const trackingRecords=returnRecords.filter(record=>{const created=trackingDate(record.createdAt);return !invalidTrackingRange&&(!trackingFrom||created>=trackingFrom)&&(!trackingTo||created<=trackingTo);});

  const filteredItems = inventoryItems.filter((item) => {
    const matchesScanCode = !scanCode || item.scanCode.includes(scanCode);
    const matchesItemName = !itemName || item.itemName.toLowerCase().includes(itemName.toLowerCase());
    const matchesVendor = !selectionVendorId || linkedToVendor(item,selectionVendorId);
    return matchesScanCode && matchesItemName && matchesVendor && (matchesFilter(selectedDepartment,item.department));
  });

  const { paginated: paginatedReturnable, page: retPage, totalPages: retTotalPages, totalItems: retTotalItems, pageSize: retPageSize, hasPrev: retHasPrev, hasNext: retHasNext, nextPage: retNextPage, prevPage: retPrevPage } =
    usePagination(filteredItems, 10);

  const totalExpectedCredit = inventoryItems
    .filter((item) => item.returnQty > 0)
    .reduce((sum, item) => sum + item.returnQty * item.netCost, 0);


  return (
    <div className="space-y-6">
      {(error||slips.error)&&<p role="alert" className="text-sm text-destructive">{error||String(slips.error)}</p>}
      {message&&<p role="status" className="text-sm text-success">{message}</p>}
      <Dialog open={!!disposal} onOpenChange={open=>{if(!open&&!saving){setDisposal(null);setError('');}}}><DialogContent><DialogHeader><DialogTitle>Move to Shrinkage &amp; Waste?</DialogTitle><DialogDescription>{disposal?.itemName} — {disposal?.returnQty} units. This removes the item from the return queue without requesting vendor credit. Its stock reduction has already been recorded and will not be repeated.</DialogDescription></DialogHeader><Label htmlFor="disposal-note">Why are you disposing of this item?</Label><Input id="disposal-note" maxLength={200} value={disposalNote} onChange={e=>setDisposalNote(e.target.value)}/>{error&&<p role="alert" className="text-destructive">{error}</p>}<DialogFooter><Button variant="outline" disabled={saving} onClick={()=>setDisposal(null)}>Cancel</Button><Button variant="destructive" disabled={saving||!disposalNote.trim()} onClick={moveToShrinkage}>{saving?'Moving…':'Move to Shrinkage'}</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={!!creditConfirmation} onOpenChange={open=>{if(!open&&!saving){setCreditConfirmation(null);setError('');}}}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Confirm Credit Received</DialogTitle><DialogDescription>Confirm that you received the vendor credit. This closes the return automatically and keeps it in tracking.</DialogDescription></DialogHeader>
          {creditConfirmation&&<div className="rounded-lg border bg-muted/20 p-3 space-y-2 text-sm"><p><span className="text-muted-foreground">Return:</span> #{creditConfirmation.id}</p><p><span className="text-muted-foreground">Vendor:</span> {creditConfirmation.vendorName}</p><p className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Expected credit</span><span className="font-semibold text-green-500">${creditConfirmation.totalCredit.toFixed(2)}</span></p></div>}
          {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter><Button variant="outline" disabled={saving} onClick={()=>{setCreditConfirmation(null);setError('');}}>Cancel</Button><Button disabled={saving||!slips.data?.canManage} onClick={async()=>{if(creditConfirmation&&await updateStatus(creditConfirmation.id,'CREDIT_RECEIVED'))setCreditConfirmation(null);}}>{saving?'Saving…':'Confirm Credit Received'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Return Slip Modal */}
      {showReturnSlip && currentReturnSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div id="return-slip-print" className="bg-card border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <style>{`@media print {body * {visibility:hidden} #return-slip-print,#return-slip-print * {visibility:visible} #return-slip-print {position:absolute;left:0;top:0;width:100%;max-height:none;overflow:visible} #return-slip-print button {display:none}}`}</style>
            {/* Slip Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-bold text-foreground">Return Slip</h2>
                <p className="text-sm text-muted-foreground">{currentReturnSlip.status.replace(/_/g," ")}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowReturnSlip(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-6 space-y-5">
              {/* Draft Banner */}
              <div className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 shrink-0" />
                This return slip is saved in Return Status Tracking.
              </div>

              {/* Return Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Return ID</p>
                    <p className="font-mono font-semibold">{currentReturnSlip.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Date Created</p>
                    <p className="font-medium">{format(currentReturnSlip.createdAt, "MMM dd, yyyy – hh:mm a")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Return Reason</p>
                    <p className="font-medium">{currentReturnSlip.reason || "—"}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">RMA / Reference #</p>
                    <p className="font-mono font-medium">{currentReturnSlip.rmaNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Return Method</p>
                    <p className="font-medium">{currentReturnSlip.method || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
                    {getStatusBadge(currentReturnSlip.status)}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Items Table */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Return Items</p>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs">Scan Code</TableHead>
                        <TableHead className="text-xs">Item Name</TableHead>
                        <TableHead className="text-xs">Vendor</TableHead>
                        <TableHead className="text-xs text-center">Return Qty</TableHead>
                        <TableHead className="text-xs text-right">Net Cost</TableHead>
                        <TableHead className="text-xs text-right">Credit</TableHead>
                        <TableHead className="text-xs">Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentReturnSlip.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-xs">{item.scanCode}</TableCell>
                          <TableCell className="text-sm font-medium">{item.itemName}</TableCell>
                          <TableCell className="text-sm">{item.vendor}</TableCell>
                          <TableCell className="text-center text-sm">{item.returnQty}</TableCell>
                          <TableCell className="text-right text-sm">${item.netCost.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-sm font-semibold text-success">
                            ${(item.returnQty * item.netCost).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-xs">{item.reason || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-end">
                <div className="rounded-lg bg-muted/50 border px-5 py-3 text-sm text-right space-y-0.5">
                  <p className="text-muted-foreground text-xs">Total Expected Credit</p>
                  <p className="text-xl font-bold text-success">${currentReturnSlip.totalCredit.toFixed(2)}</p>
                </div>
              </div>

              {/* Notes */}
              {currentReturnSlip.notes && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm bg-muted/30 rounded-md px-3 py-2 border">{currentReturnSlip.notes}</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between gap-3 p-6 border-t bg-muted/20">
              <Button variant="outline" size="sm" className="gap-2" onClick={()=>window.print()}>
                <Printer className="w-4 h-4" />
                Print Slip
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowReturnSlip(false)}>
                  Close
                </Button>
                <Button disabled size="sm" className="gap-2">
                  <Send className="w-4 h-4" />
                  Submit to Vendor
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reduce Inventory - Returnable</h1>
          <p className="text-muted-foreground text-sm">
            Process returns for damaged/expired items eligible for vendor credit
          </p>
        </div>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="scanCode" className="text-xs">Scan Code</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="scanCode"
                  placeholder="Enter scan code..."
                  value={scanCode}
                  onChange={(e) => setScanCode(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="itemName" className="text-xs">Item Name</Label>
              <div className="relative">
                <Package className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="itemName"
                  placeholder="Search item..."
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">
                Vendor <span className="text-destructive">*</span>
              </Label>
              <SearchMultiFilter storeId={storeId} filterType="vendor" singleSelect disabled={saving} values={selectionVendorId?[selectionVendorId]:[]} onValuesChange={values=>changeReturnVendor(values[0]??'')} options={(slips.data?.vendors??[]).map(vendor=>({value:String(vendor.vendor_id),label:vendor.vendor_name}))} allLabel="All Vendors" className="h-9 text-sm" />
              <p className="text-xs text-muted-foreground">Filters items and sets the vendor for this return.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Department</Label>
              <DepartmentFilter storeId={storeId} values={selectedDepartment} onValuesChange={setSelectedDepartment} extraNames={(approved.data?.items??[]).map(item=>String(item.department??''))} className="h-9 text-sm" />
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between flex-wrap gap-2">
          <div><CardTitle className="text-base">Inventory Items</CardTitle><p className="text-sm text-muted-foreground mt-1">Items waiting for a return slip. Created returns are shown in Return Status Tracking below.</p></div>
          <div className="flex items-center gap-2 flex-wrap"><Button variant="outline" disabled={saving||(!selectionVendorId&&!selectedItems.length)} onClick={clearReturnSelection}>Clear Selection</Button><Button disabled={!selectedItems.length||!selectionVendorId||saving||!slips.data||showReturnDetails} onClick={startReturnProcess}>Start Return Process</Button></div>
        </CardHeader>
        <CardContent>
          {selectionVendorId&&<p className="text-sm text-muted-foreground mb-3">Only items linked to {(slips.data?.vendors??[]).find(vendor=>String(vendor.vendor_id)===selectionVendorId)?.vendor_name??'the selected vendor'} can be selected for this return.</p>}
          {selectedItems.length>0&&!selectionVendorId&&<p className="text-sm text-destructive mb-3">Choose a vendor in Filters before selecting more items.</p>}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      className="rounded border-input"
                      disabled={!selectionVendorId||saving||showReturnDetails}
                      onChange={e=>{const eligible=filteredItems.filter(item=>linkedToVendor(item,selectionVendorId));const next=e.target.checked?[...new Set([...selectedItems,...eligible.map(item=>item.id)])]:selectedItems.filter(id=>!eligible.some(item=>item.id===id));setSelectedItems(next);if(!next.length)setSelectionVendorId('');}}
                      checked={!!selectionVendorId&&filteredItems.some(item=>linkedToVendor(item,selectionVendorId))&&filteredItems.filter(item=>linkedToVendor(item,selectionVendorId)).every(item=>selectedItems.includes(item.id))}
                    />
                  </TableHead>
                  <TableHead className="text-xs font-semibold">Scan Code</TableHead>
                  <TableHead className="text-xs font-semibold">Item Name</TableHead>
                  <TableHead className="text-xs font-semibold">Vendor</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Current Stock</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Return Qty</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Remaining Stock</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Net Cost</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Expected Credit</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedReturnable.length===0&&<TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">{approved.isPending||slips.isPending?'Loading returnable items…':inventoryItems.length?'No items match the current filters.':'No items are waiting for a return slip.'}</TableCell></TableRow>}
                {paginatedReturnable.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell>
                      <input
                        type="checkbox"
                        className="rounded border-input"
                        checked={selectedItems.includes(item.id)}
                        disabled={saving||showReturnDetails||!canSelectItem(item)}
                        title={!(item.vendorIds?.length)?'Link an active vendor to this item before returning it.':!canSelectItem(item)?'This item is not linked to the selected return vendor.':undefined}
                        onChange={() => toggleItemSelection(item.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.scanCode}</TableCell>
                    <TableCell className="text-sm font-medium">{item.itemName}</TableCell>
                    <TableCell className="text-sm">{item.vendor}</TableCell>
                    <TableCell className="text-right text-sm">{item.currentStock}</TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        min={0}
                        max={item.currentStock}
                        value={item.returnQty}
                        disabled onChange={(e) => handleReturnQtyChange(item.id, parseInt(e.target.value) || 0)}
                        className="w-20 h-8 text-center text-sm mx-auto"
                      />
                    </TableCell>
                    <TableCell className="text-right text-sm">{item.currentStock}</TableCell>
                    <TableCell className="text-right text-sm">${item.netCost.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-sm font-medium text-success">
                      ${(item.returnQty * item.netCost).toFixed(2)}
                    </TableCell>
                    <TableCell><Button variant="outline" size="sm" disabled={saving||showReturnDetails||!slips.data?.canManage} onClick={()=>{setDisposal(item);setDisposalNote('');setError('');}}>Move to Shrinkage</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            page={retPage}
            totalPages={retTotalPages}
            totalItems={retTotalItems}
            pageSize={retPageSize}
            hasPrev={retHasPrev}
            hasNext={retHasNext}
            onPrev={retPrevPage}
            onNext={retNextPage}
          />
          <div className="flex justify-end px-4 py-3 border-t">
            <div className="text-sm">
              <span className="text-muted-foreground">Total Expected Credit: </span>
              <span className="font-bold text-success">${totalExpectedCredit.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Return Details */}
      {showReturnDetails&&<div ref={detailsRef} className="space-y-4 scroll-mt-4"><Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Return Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{returnDrafts.length} selected item(s). Review the selected vendor and items. All selected items will be included in one return slip under one RMA.</p>
          {!slips.data?.canManage&&<p className="text-sm text-muted-foreground mb-4">A manager or administrator with return-management access must create the return slips.</p>}

          <section className="mb-6 space-y-4" aria-label="Return items">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Return Items</h3>
            <div className="rounded-xl border overflow-x-auto">
              <Table className="min-w-[680px]">
                <TableHeader><TableRow className="bg-muted/30">{['Scan Code','Item Name','Vendor','Return Qty','Net Cost','Credit','Reason'].map(label=><TableHead key={label} className={`px-4 py-3 font-semibold ${['Return Qty','Net Cost','Credit'].includes(label)?'text-right':''}`}>{label}</TableHead>)}</TableRow></TableHeader>
                <TableBody>{returnDrafts.map(row=><TableRow key={row.requestId} className="odd:bg-muted/20"><TableCell className="px-4 py-5 font-mono text-sm">{row.scanCode||'—'}</TableCell><TableCell className="px-4 py-5 font-semibold">{row.itemName}</TableCell><TableCell className="px-4 py-5">{(slips.data?.vendors??[]).find(vendor=>String(vendor.vendor_id)===selectionVendorId)?.vendor_name??'—'}</TableCell><TableCell className="px-4 py-5 text-right">{row.returnQty}</TableCell><TableCell className="px-4 py-5 text-right whitespace-nowrap">${row.netCost.toFixed(2)}</TableCell><TableCell className="px-4 py-5 text-right font-semibold text-green-500 whitespace-nowrap">${(row.returnQty*row.netCost).toFixed(2)}</TableCell><TableCell className="px-4 py-5">{row.reason}</TableCell></TableRow>)}</TableBody>
              </Table>
            </div>
            <div className="ml-auto w-fit min-w-60 max-w-full rounded-xl border bg-muted/20 px-5 py-4 text-right"><p className="text-sm text-muted-foreground">Total Expected Credit</p><p className="mt-1 text-2xl font-bold text-green-500">${returnDrafts.reduce((total,row)=>total+row.returnQty*row.netCost,0).toFixed(2)}</p></div>
          </section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Return Method <span className="text-destructive">*</span>
              </Label>
              <Select value={returnMethod} onValueChange={setReturnMethod}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {returnMethods.map((method) => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rma" className="text-xs">Vendor RMA / Reference #</Label>
              <Input
                id="rma"
                placeholder="Enter RMA number..."
                value={rmaNumber}
                onChange={(e) => setRmaNumber(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            {/* Updated attachment label */}
            <div className="space-y-1.5">
              <Label className="text-xs">Attachment (photo where return products placed)</Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-9 text-xs">
                  <Upload className="w-4 h-4 mr-1" />
                  Upload File
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            <Label htmlFor="notes" className="text-xs">Additional Notes</Label>
            <Textarea disabled title="Additional notes are not connected yet"
              id="notes"
              placeholder="Enter any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-sm"
              rows={3}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button disabled={saving||!slips.data?.canManage||!returnMethod||!selectionVendorId||returnDrafts.some(row=>!row.reason)} onClick={handleCreateReturn} className="gap-2">
              <FileText className="w-4 h-4" />
              Generate Return Slip
            </Button>
            <Button variant="ghost" disabled={saving} onClick={()=>setShowReturnDetails(false)}>Cancel</Button>
          </div>
        </CardContent>
      </Card></div>}

      {/* Status Tracking */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Return Status Tracking</CardTitle>
          <div className="mt-3 flex flex-wrap items-end gap-3"><label className="space-y-1 text-xs"><span>Created From</span><Input type="date" value={trackingFrom} max={trackingTo||undefined} onChange={e=>setTrackingFrom(e.target.value)}/></label><label className="space-y-1 text-xs"><span>Created To</span><Input type="date" value={trackingTo} min={trackingFrom||undefined} onChange={e=>setTrackingTo(e.target.value)}/></label><Button variant="outline" disabled={!trackingFrom&&!trackingTo} onClick={()=>{setTrackingFrom('');setTrackingTo('');}}>Clear Dates</Button></div>
          {invalidTrackingRange&&<p role="alert" className="text-sm text-destructive">From date must be on or before To date.</p>}
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold">Return ID</TableHead>
                  <TableHead className="text-xs font-semibold">Items</TableHead>
                  <TableHead className="text-xs font-semibold">Vendor Name</TableHead>
                  <TableHead className="text-xs font-semibold">RMA #</TableHead>
                  <TableHead className="text-xs font-semibold">Reason</TableHead>
                  <TableHead className="text-xs font-semibold">Method</TableHead>
                  <TableHead className="text-xs font-semibold">Created</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Expected Credit</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trackingRecords.length===0&&<TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">{trackingFrom||trackingTo?'No returns match the selected dates.':'No returns created yet.'}</TableCell></TableRow>}
                {trackingRecords.map((record) => (
                  <TableRow key={record.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs font-medium">{record.id}</TableCell>
                    <TableCell className="text-sm">{record.items.map(item=><div key={item.id}>{item.itemName} <span className="text-muted-foreground">× {item.returnQty}</span></div>)}</TableCell>
                    <TableCell className="text-sm font-medium">{record.vendorName || "—"}</TableCell>
                    <TableCell className="text-sm">{record.rmaNumber}</TableCell>
                    <TableCell className="text-sm">{record.reason || "—"}</TableCell>
                    <TableCell className="text-sm">{record.method || "—"}</TableCell>
                    <TableCell className="text-sm">{format(new Date(trackingDate(record.createdAt)+'T12:00:00'), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="text-right text-sm font-medium text-success">
                      ${record.totalCredit.toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}{record.status==='credit_received'&&<p className="text-xs text-muted-foreground mt-1">Closed automatically</p>}</TableCell>
                    <TableCell className="text-center">
                      {slips.data?.canManage&&record.status==='pending'&&<Button size="sm" variant="outline" className="mb-1" disabled={saving} onClick={()=>{setError('');setCreditConfirmation(record);}}>Mark Credit Received</Button>}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          setCurrentReturnSlip(record);
                          setShowReturnSlip(true);
                        }}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
