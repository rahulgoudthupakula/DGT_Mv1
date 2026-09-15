import {useQuery} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import { useEffect, useState } from "react";
import { usePagination } from "@/hooks/use-pagination";
import { loadApprovals } from "@/lib/approvalsStore";
import { TablePagination } from "@/components/ui/table-pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
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
import { CalendarIcon, Search, Upload, AlertTriangle, TrendingDown, Trash2, Edit, Check, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface InventoryItem {
  id: string;
  scanCode: string;
  itemName: string;
  department: string;
  currentStock: number;
  reduceQty: number;
  netCost: number;
  recordedLoss?: number;
  reason: string;
}

interface ReductionRecord {
  id: string;
  date: string;
  scanCode: string;
  itemName: string;
  reduceQty: number;
  lossValue: number;
  reason: string;
  status: "Pending Approval" | "Approved" | "Rejected" | "Processed";
  notes: string;
}

const reasons = [
  "Spoilage",
  "Expired",
  "Theft",
  "Internal Use",
  "Shrinkage",
  "Damaged (Non-returnable)",
  "Other",
];

const departments = [
  "Dairy",
  "Produce",
  "Frozen",
  "Bakery",
  "Meat",
  "Beverages",
  "Snacks",
  "Grocery",
];

// Items appear here only after their reduce request is approved in Approvals.
const loadApprovedNonReturnables = (): InventoryItem[] =>
  loadApprovals()
    .filter(
      (r) =>
        r.status === "approved" &&
        r.type === "reduction" &&
        (r.reason === "damaged-non-returnable" || r.reason === "expired-non-returnable")
    )
    .map((r) => ({
      id: r.id,
      scanCode: r.scanCode,
      itemName: r.itemName,
      department: "—",
      currentStock: r.quantity,
      reduceQty: 0,
      netCost: 0,
      reason: r.reasonLabel,
    }));

export const NonReturnableInventory = ({storeId}:{storeId:string}) => {
  const approved=useQuery({queryKey:['reductions',storeId],queryFn:()=>request<{requests:any[];items:any[]}>(`/access/stores/${encodeURIComponent(storeId)}/reductions`)});
  const [date, setDate] = useState<Date>();
  const [scanCodeFilter, setScanCodeFilter] = useState("");
  const [itemNameFilter, setItemNameFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [requireManagerApproval, setRequireManagerApproval] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedItem, setEditedItem] = useState<InventoryItem | null>(null);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);

  // Form state for reduction details
  const [reductionReason, setReductionReason] = useState("");
  const [reductionNotes, setReductionNotes] = useState("");

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    setInventoryItems((approved.data?.requests??[]).filter(r=>r.status==='APPROVED'&&r.route==='non-returnable').map(r=>{const item=approved.data?.items.find(i=>Number(i.id)===Number(r.product_id));return {id:String(r.reduction_request_id),scanCode:r.product_sku,itemName:r.product_name,vendor:item?.vendor??'',department:item?.department??'',currentStock:Number(item?.inventoryCount??0),reduceQty:Number(r.quantity),netCost:r.recorded_unit_cost==null?NaN:Number(r.recorded_unit_cost),recordedLoss:r.recorded_loss==null?undefined:Number(r.recorded_loss),reason:r.reason};}));
  }, [approved.data]);

  const [reductionRecords] = useState<ReductionRecord[]>([]);

  const handleReduceQtyChange = (id: string, qty: number) => {
    setInventoryItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, reduceQty: Math.max(0, Math.min(qty, item.currentStock)) } : item
      )
    );
  };

  const handleItemReasonChange = (id: string, reason: string) => {
    setInventoryItems((items) =>
      items.map((item) => (item.id === id ? { ...item, reason } : item))
    );
  };

  const handleSubmitReduction = (item: InventoryItem) => {
    if (!item.reason) {
      return;
    }
    if ((item.reason === "Theft" || item.reason === "Other") && !reductionNotes) {
      return;
    }
    setSelectedItem(item);
    setShowConfirmDialog(true);
  };

  const confirmReduction = () => {
    if (selectedItem) {
      // In real app, this would submit to backend
      setInventoryItems((items) =>
        items.map((item) =>
          item.id === selectedItem.id
            ? { ...item, currentStock: item.currentStock - item.reduceQty, reduceQty: 0, reason: "" }
            : item
        )
      );
      setReductionReason("");
      setReductionNotes("");
    }
    setShowConfirmDialog(false);
    setSelectedItem(null);
  };

  const startEditing = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditedItem({ ...item });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditedItem(null);
  };

  const confirmUpdate = () => {
    if (editedItem) {
      setInventoryItems((items) =>
        items.map((item) => (item.id === editedItem.id ? editedItem : item))
      );
    }
    setEditingId(null);
    setEditedItem(null);
    setShowUpdateConfirm(false);
  };

  const deleteItem = (id: string) => {
    setInventoryItems((items) => items.filter((item) => item.id !== id));
  };

  const getStatusBadge = (status: ReductionRecord["status"]) => {
    const variants: Record<ReductionRecord["status"], string> = {
      "Pending Approval": "bg-amber-100 text-amber-800 border-amber-200",
      Approved: "bg-blue-100 text-blue-800 border-blue-200",
      Rejected: "bg-red-100 text-red-800 border-red-200",
      Processed: "bg-green-100 text-green-800 border-green-200",
    };
    return (
      <Badge variant="outline" className={variants[status]}>
        {status}
      </Badge>
    );
  };

  const calculateLossValue = (qty: number, cost: number) => qty * cost;
  const calculateRemainingStock = (current: number, reduce: number) => current - reduce;

  const totalLossValue = inventoryItems.reduce(
    (sum, item) => sum + (item.recordedLoss??0),
    0
  );

  const { paginated: paginatedInventory, page: invPage, totalPages: invTotalPages, totalItems: invTotalItems, pageSize: invPageSize, hasPrev: invHasPrev, hasNext: invHasNext, nextPage: invNextPage, prevPage: invPrevPage } =
    usePagination(inventoryItems, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reduce Inventory - Non-Returnable</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Record stock losses due to spoilage, theft, internal use, or shrinkage
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-destructive/10 px-3 py-2 rounded-lg">
            <TrendingDown className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">
              Stock ↓ immediately upon submission
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Scan Code</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search scan code..."
                  value={scanCodeFilter}
                  onChange={(e) => setScanCodeFilter(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Item Name</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search item..."
                  value={itemNameFilter}
                  onChange={(e) => setItemNameFilter(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Department</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Reason</Label>
              <Select value={reasonFilter} onValueChange={setReasonFilter}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All Reasons" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  <SelectItem value="all">All Reasons</SelectItem>
                  {reasons.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Inventory Items</CardTitle>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Total Recorded Loss: </span>
                <span className="font-semibold text-destructive">${totalLossValue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-medium">Scan Code</TableHead>
                  <TableHead className="text-xs font-medium">Item Name</TableHead>
                  <TableHead className="text-xs font-medium">Department</TableHead>
                  <TableHead className="text-xs font-medium text-center">Current Stock</TableHead>
                  <TableHead className="text-xs font-medium text-center">Reduce Qty</TableHead>
                  <TableHead className="text-xs font-medium text-center">Remaining Stock</TableHead>
                  <TableHead className="text-xs font-medium text-right">Net Cost</TableHead>
                  <TableHead className="text-xs font-medium text-right">Recorded Loss</TableHead>
                  <TableHead className="text-xs font-medium">Reason <span className="text-destructive">*</span></TableHead>
                  <TableHead className="text-xs font-medium text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInventory.map((item) => {
                  const isEditing = editingId === item.id;
                  const displayItem = isEditing && editedItem ? editedItem : item;
                  const remainingStock = displayItem.currentStock;
                  const lossValue = displayItem.recordedLoss;

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs font-mono">
                        {isEditing ? (
                          <Input
                            value={editedItem?.scanCode || ""}
                            onChange={(e) =>
                              setEditedItem((prev) => prev && { ...prev, scanCode: e.target.value })
                            }
                            className="h-7 text-xs w-24"
                          />
                        ) : (
                          displayItem.scanCode
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {isEditing ? (
                          <Input
                            value={editedItem?.itemName || ""}
                            onChange={(e) =>
                              setEditedItem((prev) => prev && { ...prev, itemName: e.target.value })
                            }
                            className="h-7 text-xs w-32"
                          />
                        ) : (
                          displayItem.itemName
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {isEditing ? (
                          <Select
                            value={editedItem?.department || ""}
                            onValueChange={(val) =>
                              setEditedItem((prev) => prev && { ...prev, department: val })
                            }
                          >
                            <SelectTrigger className="h-7 text-xs w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-50 bg-popover">
                              {departments.map((dept) => (
                                <SelectItem key={dept} value={dept}>
                                  {dept}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          displayItem.department
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-center">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editedItem?.currentStock || 0}
                            onChange={(e) =>
                              setEditedItem((prev) =>
                                prev && { ...prev, currentStock: parseInt(e.target.value) || 0 }
                              )
                            }
                            className="h-7 text-xs w-16 text-center"
                          />
                        ) : (
                          displayItem.currentStock
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min={0}
                          max={displayItem.currentStock}
                          value={displayItem.reduceQty}
                          onChange={(e) =>
                            isEditing
                              ? setEditedItem((prev) =>
                                  prev && { ...prev, reduceQty: parseInt(e.target.value) || 0 }
                                )
                              : handleReduceQtyChange(item.id, parseInt(e.target.value) || 0)
                          }
                          className="h-7 text-xs w-16 text-center"
                        />
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-xs text-center font-medium",
                          remainingStock < 10 && "text-amber-600"
                        )}
                      >
                        {remainingStock}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editedItem?.netCost || 0}
                            onChange={(e) =>
                              setEditedItem((prev) =>
                                prev && { ...prev, netCost: parseFloat(e.target.value) || 0 }
                              )
                            }
                            className="h-7 text-xs w-20 text-right"
                          />
                        ) : (
                          Number.isFinite(displayItem.netCost)?`$${displayItem.netCost.toFixed(2)}`:""
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-right font-medium text-destructive">
                        {lossValue==null?"":`$${lossValue.toFixed(2)}`}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={displayItem.reason}
                          onValueChange={(val) =>
                            isEditing
                              ? setEditedItem((prev) => prev && { ...prev, reason: val })
                              : handleItemReasonChange(item.id, val)
                          }
                        >
                          <SelectTrigger className={cn("h-7 text-xs w-28", displayItem.reduceQty > 0 && !displayItem.reason && "border-destructive")}>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent className="z-50 bg-popover">
                            {reasons.map((reason) => (
                              <SelectItem key={reason} value={reason}>
                                {reason}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {isEditing ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-success hover:text-success/80"
                                onClick={() => setShowUpdateConfirm(true)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={cancelEditing}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-primary hover:text-primary/80"
                                disabled onClick={() => startEditing(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive/80"
                                disabled onClick={() => deleteItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            page={invPage}
            totalPages={invTotalPages}
            totalItems={invTotalItems}
            pageSize={invPageSize}
            hasPrev={invHasPrev}
            hasNext={invHasNext}
            onPrev={invPrevPage}
            onNext={invNextPage}
          />
        </CardContent>
      </Card>

      {/* Reduction Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Reduction Details (Required)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs">Notes</Label>
              <Textarea
                placeholder="Add notes about this reduction..."
                value={reductionNotes}
                onChange={(e) => setReductionNotes(e.target.value)}
                className="h-9 min-h-[36px] text-sm resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Attachment (Optional)</Label>
              <Button variant="outline" className="w-full h-9 text-sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="flex items-center gap-3">
              <Switch
                id="manager-approval"
                checked={requireManagerApproval}
                onCheckedChange={setRequireManagerApproval}
              />
              <Label htmlFor="manager-approval" className="text-sm">
                Require Manager Approval
              </Label>
            </div>

            <Button
              className="bg-destructive hover:bg-destructive/90"
              disabled={true}
            >
              Submit Reduction
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reduction History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Reduction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-medium">Date</TableHead>
                  <TableHead className="text-xs font-medium">Scan Code</TableHead>
                  <TableHead className="text-xs font-medium">Item Name</TableHead>
                  <TableHead className="text-xs font-medium text-center">Reduce Qty</TableHead>
                  <TableHead className="text-xs font-medium text-right">Recorded Loss</TableHead>
                  <TableHead className="text-xs font-medium">Reason</TableHead>
                  <TableHead className="text-xs font-medium">Notes</TableHead>
                  <TableHead className="text-xs font-medium text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reductionRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="text-xs">{record.date}</TableCell>
                    <TableCell className="text-xs font-mono">{record.scanCode}</TableCell>
                    <TableCell className="text-xs font-medium">{record.itemName}</TableCell>
                    <TableCell className="text-xs text-center">{record.reduceQty}</TableCell>
                    <TableCell className="text-xs text-right font-medium text-destructive">
                      ${record.lossValue.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-xs">{record.reason}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                      {record.notes}
                    </TableCell>
                    <TableCell className="text-center">{getStatusBadge(record.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Stock Reduction</AlertDialogTitle>
            <AlertDialogDescription>
              This action will immediately reduce stock and post the loss. Are you sure you want to
              reduce <strong>{selectedItem?.reduceQty}</strong> units of{" "}
              <strong>{selectedItem?.itemName}</strong>?
              <br />
              <br />
              <span className="text-destructive font-medium">
                Loss Value: ${selectedItem ? calculateLossValue(selectedItem.reduceQty, selectedItem.netCost).toFixed(2) : "0.00"}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReduction}
              className="bg-destructive hover:bg-destructive/90"
            >
              Yes, Reduce Stock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Update Confirmation Dialog */}
      <AlertDialog open={showUpdateConfirm} onOpenChange={setShowUpdateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Update</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to save the changes to this item?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUpdateConfirm(false)}>No</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUpdate}>Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
