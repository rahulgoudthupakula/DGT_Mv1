import {useQuery} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import { useEffect, useState } from "react";
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
const returnReasons = ["Expired (vendor returnable)", "Damaged in transit", "Vendor recall"];
const returnMethods = ["Pickup", "Drop-off", "Credit without return"];

type ReturnStatus = "draft" | "pending" | "sent" | "credit_received" | "closed";

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
  const approved=useQuery({queryKey:['reductions',storeId],queryFn:()=>request<{requests:any[];items:any[]}>(`/access/stores/${encodeURIComponent(storeId)}/reductions`)});
  const slipPath=`/access/stores/${encodeURIComponent(storeId)}/reductions/return-slips`;
  const slips=useQuery({queryKey:['return-slips',storeId],queryFn:()=>request<{returns:any[];vendors:{vendor_id:number;vendor_name:string}[];canManage:boolean}>(slipPath)});
  const [saving,setSaving]=useState(false),[error,setError]=useState('');
  const [openSlipId,setOpenSlipId]=useState<string|null>(null);
  const [scanCode, setScanCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("All Vendors");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [date, setDate] = useState<Date>();

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    setInventoryItems((approved.data?.requests??[]).filter(r=>r.status==='APPROVED'&&r.route==='returnable').map(r=>{const item=approved.data?.items.find(i=>Number(i.id)===Number(r.product_id));return {id:String(r.reduction_request_id),scanCode:r.product_sku,itemName:r.product_name,vendor:item?.vendor??'',department:item?.department??'',currentStock:Number(item?.inventoryCount??0),returnQty:Number(r.quantity),netCost:Number(item?.netCost??0),reason:r.reason};}));
  }, [approved.data]);
  const vendors=['All Vendors',...(slips.data?.vendors??[]).map(v=>v.vendor_name)];
  const departments=['All Departments',...new Set((approved.data?.items??[]).map(i=>String(i.department??'')).filter(Boolean))];
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Return details
  const [returnReason, setReturnReason] = useState("");
  const [returnMethod, setReturnMethod] = useState("");
  const [returnVendorName, setReturnVendorName] = useState("");
  const [rmaNumber, setRmaNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Return slip modal
  const [showReturnSlip, setShowReturnSlip] = useState(false);
  const [currentReturnSlip, setCurrentReturnSlip] = useState<ReturnRecord | null>(null);

  // Return records for status tracking
  const returnRecords:ReturnRecord[]=(slips.data?.returns??[]).map(r=>({id:String(r.return_id),vendorName:r.vendor_name,reason:r.items?.[0]?.reason??'',method:r.return_type,rmaNumber:r.reference_number??'',status:r.status.toLowerCase() as ReturnStatus,createdAt:new Date(r.created_at),items:(r.items??[]).map((i:any)=>({id:String(i.return_item_id),scanCode:i.product_sku,itemName:i.product_name,vendor:r.vendor_name,currentStock:0,returnQty:Number(i.qty),netCost:Number(i.unit_cost),reason:i.reason})),totalCredit:(r.items??[]).reduce((n:number,i:any)=>n+Number(i.qty)*Number(i.unit_cost),0)}));

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

  const toggleItemSelection = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCreateReturn = async () => {
    if(saving)return;
    if(selectedItems.length!==1){setError('Select one approved item for this return slip.');return;}
    const existing=slips.data?.returns.find(r=>String(r.reduction_request_id)===selectedItems[0]);if(existing){setOpenSlipId(String(existing.return_id));return;}
    const vendor=slips.data?.vendors.find(v=>v.vendor_name===returnVendorName);
    if(!vendor||!returnReason||!returnMethod){setError('Choose vendor, reason and return method.');return;}
    setSaving(true);setError('');
    try{const saved=await request<{id:number}>(slipPath,{method:'POST',body:JSON.stringify({requestId:Number(selectedItems[0]),vendorId:vendor.vendor_id,reason:returnReason,method:returnMethod,reference:rmaNumber})});await slips.refetch();setOpenSlipId(String(saved.id));}
    catch(e){setError(e instanceof Error?e.message:'Could not save return');}finally{setSaving(false);}
  };
  const updateStatus=async(id:string,status:string)=>{if(saving)return;setSaving(true);setError('');try{await request(`${slipPath}/${id}/status`,{method:'POST',body:JSON.stringify({status})});await slips.refetch();}catch(e){setError(String(e));}finally{setSaving(false);}};

  const getStatusBadge = (status: ReturnStatus) => {
    const styles: Record<ReturnStatus, string> = {
      draft: "bg-muted text-muted-foreground border-border",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      sent: "bg-blue-100 text-blue-800 border-blue-200",
      credit_received: "bg-green-100 text-green-800 border-green-200",
      closed: "bg-gray-100 text-gray-800 border-gray-200",
    };
    const labels: Record<ReturnStatus, string> = {
      draft: "Draft",
      pending: "Pending",
      sent: "Sent",
      credit_received: "Credit Received",
      closed: "Closed",
    };
    const icons: Record<ReturnStatus, JSX.Element> = {
      draft: <FileText className="w-3 h-3" />,
      pending: <Clock className="w-3 h-3" />,
      sent: <Send className="w-3 h-3" />,
      credit_received: <CreditCard className="w-3 h-3" />,
      closed: <Check className="w-3 h-3" />,
    };
    return (
      <Badge variant="outline" className={cn("flex items-center gap-1", styles[status])}>
        {icons[status]}
        {labels[status]}
      </Badge>
    );
  };

  const filteredItems = inventoryItems.filter((item) => {
    const matchesScanCode = !scanCode || item.scanCode.includes(scanCode);
    const matchesItemName = !itemName || item.itemName.toLowerCase().includes(itemName.toLowerCase());
    const matchesVendor = selectedVendor === "All Vendors" || item.vendor === selectedVendor;
    return matchesScanCode && matchesItemName && matchesVendor && (selectedDepartment === "All Departments" || item.department === selectedDepartment);
  });

  const { paginated: paginatedReturnable, page: retPage, totalPages: retTotalPages, totalItems: retTotalItems, pageSize: retPageSize, hasPrev: retHasPrev, hasNext: retHasNext, nextPage: retNextPage, prevPage: retPrevPage } =
    usePagination(filteredItems, 10);

  const totalExpectedCredit = inventoryItems
    .filter((item) => item.returnQty > 0)
    .reduce((sum, item) => sum + item.returnQty * item.netCost, 0);


  return (
    <div className="space-y-6">
      {(error||slips.error)&&<p role="status">{error||String(slips.error)}</p>}
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
                    {getStatusBadge("draft")}
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
              <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      className="rounded border-input"
                      onChange={(e) => {
                        if (e.target.checked) setSelectedItems(filteredItems.map((i) => i.id));
                        else setSelectedItems([]);
                      }}
                      checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedReturnable.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell>
                      <input
                        type="checkbox"
                        className="rounded border-input"
                        checked={selectedItems.includes(item.id)}
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Return Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Vendor Name <span className="text-destructive">*</span>
              </Label>
              <Select value={returnVendorName} onValueChange={setReturnVendorName}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.filter(v => v !== "All Vendors").map((vendor) => (
                    <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Select value={returnReason} onValueChange={setReturnReason}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {returnReasons.map((reason) => (
                    <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Button className="gap-2" disabled={saving||!slips.data?.canManage} onClick={handleCreateReturn}>
              <Package className="w-4 h-4" />
              Create Return
            </Button>
            <Button disabled={saving||!slips.data?.canManage} onClick={handleCreateReturn} variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              Generate Return Slip
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Tracking */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Return Status Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold">Return ID</TableHead>
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
                {returnRecords.map((record) => (
                  <TableRow key={record.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs font-medium">{record.id}</TableCell>
                    <TableCell className="text-sm font-medium">{record.vendorName || "—"}</TableCell>
                    <TableCell className="text-sm">{record.rmaNumber}</TableCell>
                    <TableCell className="text-sm">{record.reason || "—"}</TableCell>
                    <TableCell className="text-sm">{record.method || "—"}</TableCell>
                    <TableCell className="text-sm">{format(record.createdAt, "MMM dd, yyyy")}</TableCell>
                    <TableCell className="text-right text-sm font-medium text-success">
                      ${record.totalCredit.toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}{slips.data?.canManage&&record.status!=='closed'&&<select aria-label={`Update return ${record.id} status`} value="" disabled={saving} onChange={e=>{if(e.target.value&&window.confirm('Record this status change?'))updateStatus(record.id,e.target.value);}} className="mt-2 border rounded p-1 text-xs"><option value="">Update status</option>{record.status==='draft'&&<option value="PENDING">Pending</option>}{record.status==='pending'&&<option value="SENT">Sent</option>}{['pending','sent'].includes(record.status)&&<option value="CREDIT_RECEIVED">Credit received</option>}{record.status==='credit_received'&&<option value="CLOSED">Closed</option>}</select>}</TableCell>
                    <TableCell className="text-center">
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
