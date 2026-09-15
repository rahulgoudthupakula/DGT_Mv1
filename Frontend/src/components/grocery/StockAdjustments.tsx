import { useQuery,useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/backend";
import { useState } from "react";
import { Search, Pencil, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { useToast } from "@/hooks/use-toast";
import { addApprovalRequests } from "@/lib/approvalsStore";

// Sample data for dropdowns
const departments = [
  "All Departments",
  "Beverages",
  "Snacks",
  "Dairy",
  "Frozen Foods",
  "Bakery",
  "Meat",
  "Produce",
  "Canned Goods",
  "Household",
];

const taxTypes = ["All Tax Types", "Taxable", "Non-Taxable", "Exempt"];

const vendors = [
  "All Vendors",
  "Coca-Cola",
  "PepsiCo",
  "Frito-Lay",
  "Nestle",
  "General Mills",
  "Kellogg's",
  "Procter & Gamble",
  "Unilever",
];

const sortOptions = [
  { value: "item-name", label: "Item Name" },
  { value: "min-price", label: "Min Price" },
  { value: "max-price", label: "Max Price" },
  { value: "min-margin", label: "Min Margin" },
  { value: "max-margin", label: "Max Margin" },
  { value: "less-inventory", label: "Min Inventory Count" },
  { value: "more-inventory", label: "Max Inventory Count" },
];

const reasonOptions = [
  { value: "damaged-returnable", label: "Damaged (Returnable)", returnable: true },
  { value: "expired-returnable", label: "Expired (Returnable)", returnable: true },
  { value: "vendor-recall", label: "Vendor Recall", returnable: true },
  { value: "damaged-non-returnable", label: "Damaged (Non-Returnable)", returnable: false },
  { value: "expired-non-returnable", label: "Expired (Non-Returnable)", returnable: false },
  { value: "theft", label: "Theft / Shrinkage", returnable: false },
  { value: "spoilage", label: "Spoilage", returnable: false },
  { value: "counting-error", label: "Counting Error", returnable: false },
  { value: "store-to-store-transfer", label: "Store to Store Transfer", returnable: false },
];

const SHRINKAGE_REASONS = new Set([
  "vendor-recall",
  "theft",
  "spoilage",
  "counting-error",
]);

const transferStoreOptions = [
  "Store #1 – Main",
  "Store #2 – Downtown",
  "Store #3 – Westside",
  "Store #4 – Airport",
];

interface ReduceRequestRow {
  id: number;
  itemName: string;
  scanCode: string;
  currentCount: number;
  updatedCount: number;
  reason: string;
  transferStore?: string;
}

// Inventory item type
interface InventoryItem {
  id: number;
  scanCode: string;
  itemName: string;
  department: string;
  vendor: string;
  inventoryCount: number;
  netCost: number;
  price: number;
  rebate: number;
  marginAfterRebate: number;
  taxType: string;
  reason: string;
}

// Sample inventory data
const initialInventoryData: InventoryItem[] = [
  {
    id: 1,
    scanCode: "123456789012",
    itemName: "Coca-Cola 2L",
    department: "Beverages",
    vendor: "Coca-Cola",
    inventoryCount: 48,
    netCost: 1.85,
    price: 2.99,
    rebate: 0.15,
    marginAfterRebate: 28.5,
    taxType: "Taxable",
    reason: "",
  },
  {
    id: 2,
    scanCode: "234567890123",
    itemName: "Doritos Nacho Cheese",
    department: "Snacks",
    vendor: "Frito-Lay",
    inventoryCount: 24,
    netCost: 2.80,
    price: 4.49,
    rebate: 0.20,
    marginAfterRebate: 33.2,
    taxType: "Taxable",
    reason: "",
  },
  {
    id: 3,
    scanCode: "345678901234",
    itemName: "Milk 1 Gallon",
    department: "Dairy",
    vendor: "Local Dairy",
    inventoryCount: 12,
    netCost: 3.20,
    price: 3.99,
    rebate: 0.00,
    marginAfterRebate: 19.8,
    taxType: "Non-Taxable",
    reason: "",
  },
  {
    id: 4,
    scanCode: "456789012345",
    itemName: "Bread White Loaf",
    department: "Bakery",
    vendor: "Wonder Bread",
    inventoryCount: 18,
    netCost: 1.85,
    price: 2.49,
    rebate: 0.10,
    marginAfterRebate: 25.7,
    taxType: "Non-Taxable",
    reason: "",
  },
  {
    id: 5,
    scanCode: "567890123456",
    itemName: "Pepsi 12-Pack",
    department: "Beverages",
    vendor: "PepsiCo",
    inventoryCount: 36,
    netCost: 5.20,
    price: 6.99,
    rebate: 0.25,
    marginAfterRebate: 25.6,
    taxType: "Taxable",
    reason: "",
  },
  {
    id: 6,
    scanCode: "678901234567",
    itemName: "Ice Cream Vanilla",
    department: "Frozen Foods",
    vendor: "Nestle",
    inventoryCount: 8,
    netCost: 3.80,
    price: 5.49,
    rebate: 0.18,
    marginAfterRebate: 30.8,
    taxType: "Taxable",
    reason: "",
  },
  {
    id: 7,
    scanCode: "789012345678",
    itemName: "Ground Beef 1lb",
    department: "Meat",
    vendor: "Local Farm",
    inventoryCount: 15,
    netCost: 6.20,
    price: 7.99,
    rebate: 0.00,
    marginAfterRebate: 22.4,
    taxType: "Non-Taxable",
    reason: "",
  },
  {
    id: 8,
    scanCode: "890123456789",
    itemName: "Bananas 1lb",
    department: "Produce",
    vendor: "Fresh Farms",
    inventoryCount: 50,
    netCost: 0.35,
    price: 0.59,
    rebate: 0.02,
    marginAfterRebate: 40.7,
    taxType: "Non-Taxable",
    reason: "",
  },
];

export const StockAdjustments = ({storeId}:{storeId:string}) => {
  const client=useQueryClient();const path=`/access/stores/${encodeURIComponent(storeId)}/reductions`;
  const query=useQuery({queryKey:['reductions',storeId],queryFn:()=>request<{items:(InventoryItem&{taxable:boolean})[];canSubmit:boolean;stores:{dgt_id:string;store_name:string}[]}>(path)});
  const inventoryData=(query.data?.items??[]).map(i=>({...i,taxType:i.taxable?'Taxable':'Non-Taxable',reason:'',rebate:null,marginAfterRebate:null}));
  const departments=['All Departments',...new Set(inventoryData.map(i=>i.department))];
  const vendors=['All Vendors',...new Set(inventoryData.map(i=>i.vendor).filter(Boolean))];
  const transferStoreOptions=(query.data?.stores??[]).map(s=>s.dgt_id);
  const [saving,setSaving]=useState(false);
  const { toast } = useToast();

  const [scanCode, setScanCode] = useState("");
  const [department, setDepartment] = useState("All Departments");
  const [taxType, setTaxType] = useState("All Tax Types");
  const [vendor, setVendor] = useState("All Vendors");
  const [sortBy, setSortBy] = useState("item-name");


  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedItem, setEditedItem] = useState<InventoryItem | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Reduce request modal
  const [showReduceModal, setShowReduceModal] = useState(false);
  const [reduceRows, setReduceRows] = useState<ReduceRequestRow[]>([]);
  const [transferPromptId, setTransferPromptId] = useState<number | null>(null);
  const [pendingTransferStore, setPendingTransferStore] = useState<string>("");

  // Derived filtered + sorted data
  const filteredData = inventoryData
    .filter((item) => {
      const matchesScanCode = scanCode === "" || item.scanCode.toLowerCase().includes(scanCode.toLowerCase()) || item.itemName.toLowerCase().includes(scanCode.toLowerCase());
      const matchesDepartment = department === "All Departments" || item.department === department;
      const matchesTaxType = taxType === "All Tax Types" || item.taxType === taxType;
      const matchesVendor = vendor === "All Vendors" || item.vendor === vendor;
      return matchesScanCode && matchesDepartment && matchesTaxType && matchesVendor;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "item-name": return a.itemName.localeCompare(b.itemName);
        case "min-price": return a.price - b.price;
        case "max-price": return b.price - a.price;
        case "min-margin": return a.marginAfterRebate - b.marginAfterRebate;
        case "max-margin": return b.marginAfterRebate - a.marginAfterRebate;
        case "less-inventory": return a.inventoryCount - b.inventoryCount;
        case "more-inventory": return b.inventoryCount - a.inventoryCount;
        default: return 0;
      }
    });

  const { paginated: paginatedData, page, totalPages, totalItems, pageSize, hasPrev, hasNext, nextPage, prevPage } =
    usePagination(filteredData, 10);

  const toggleEditMode = () => {
    setIsEditMode(prev => !prev);
    setSelectedIds(new Set());
    setEditingId(null);
    setEditedItem(null);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map(i => i.id)));
    }
  };

  const toggleSelectItem = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleOpenReduceModal = () => {
    const rows: ReduceRequestRow[] = filteredData
      .filter(i => selectedIds.has(i.id))
      .map(i => ({
        id: i.id,
        itemName: i.itemName,
        scanCode: i.scanCode,
        currentCount: i.inventoryCount,
        updatedCount: i.inventoryCount,
        reason: "",
      }));
    setReduceRows(rows);
    setShowReduceModal(true);
  };

  const handleReduceRowChange = (id: number, field: keyof ReduceRequestRow, value: string | number) => {
    setReduceRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      if (field === "reason" && value !== "store-to-store-transfer") {
        updated.transferStore = undefined;
      }
      return updated;
    }));
    if (field === "reason" && value === "store-to-store-transfer") {
      setPendingTransferStore("");
      setTransferPromptId(id);
    }
  };

  const handleSubmitReduceRequest = async () => {
    if(saving)return;setSaving(true);
    try{const results=await request<{pending:boolean}[]>(`${path}/batch`,{method:'POST',body:JSON.stringify(reduceRows.map(r=>({productId:r.id,quantity:r.currentCount-r.updatedCount,reason:r.reason,destination:r.reason==='store-to-store-transfer'?r.transferStore:null})))});
      await Promise.all(['reductions','pricebook-items','current-stock','stock-movements'].map(key=>client.invalidateQueries({queryKey:[key,storeId]})));const approved=results.every(r=>!r.pending);toast({title:approved?'Adjustment approved':'Sent for approval',description:approved?'Movement recorded and stock updated.':'Stock stays unchanged until approval.'});setShowReduceModal(false);setIsEditMode(false);setSelectedIds(new Set());
    }catch(e){toast({title:'Could not submit',description:e instanceof Error?e.message:'Try again',variant:'destructive'});}finally{setSaving(false);}
  };

  const handleEditClick = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditedItem({ ...item });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedItem(null);
  };

  const handleSaveClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmSave = () => { setShowConfirmDialog(false);setEditingId(null);setEditedItem(null);toast({title:'Use Reduce Inventory to submit a reason and quantity for approval.'}); };

  const handleEditChange = (field: keyof InventoryItem, value: string | number) => {
    if (editedItem) {
      setEditedItem({ ...editedItem, [field]: value });
    }
  };

  return (
    <div className="space-y-6">
      {query.error&&<p role="alert">{String(query.error)}</p>}
      {/* Reduce Inventory Request Modal */}
      {showReduceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-base font-semibold text-foreground">Request Reduce Inventory</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{reduceRows.length} item(s) selected</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowReduceModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Item Name</TableHead>
                      <TableHead className="text-xs">Scan Code</TableHead>
                      <TableHead className="text-xs text-center">Current Count</TableHead>
                      <TableHead className="text-xs text-center">Updated Count</TableHead>
                      <TableHead className="text-xs w-[220px]">Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reduceRows.map(row => (
                      <TableRow key={row.id}>
                        <TableCell className="text-xs font-medium">{row.itemName}</TableCell>
                        <TableCell className="text-xs font-mono">{row.scanCode}</TableCell>
                        <TableCell className="text-xs text-center">{row.currentCount}</TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min={0}
                            max={row.currentCount}
                            value={row.updatedCount}
                            onChange={e => handleReduceRowChange(row.id, "updatedCount", parseFloat(e.target.value) || 0)}
                            className="h-7 text-xs w-16 text-center mx-auto"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.reason}
                            onValueChange={val => handleReduceRowChange(row.id, "reason", val)}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="Select reason" />
                            </SelectTrigger>
                            <SelectContent>
                              {reasonOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {row.reason === "store-to-store-transfer" && (
                            <button
                              type="button"
                              onClick={() => {
                                setPendingTransferStore(row.transferStore ?? "");
                                setTransferPromptId(row.id);
                              }}
                              className={`mt-1 text-[11px] underline ${row.transferStore ? "text-foreground" : "text-destructive"}`}
                            >
                              {row.transferStore ? `→ ${row.transferStore}` : "Select destination store"}
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                <span>Items with <strong className="text-foreground">returnable</strong> reasons will be routed to <em>Reduce Inventory [Returnable]</em>, others to <em>Reduce Inventory [Non-Returnable]</em>.</span>
              </div>
            </div>

            <Separator />
            <div className="flex justify-end gap-2 p-6">
              <Button variant="outline" size="sm" onClick={() => setShowReduceModal(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={saving || !query.data?.canSubmit || reduceRows.some(r => !r.reason || r.updatedCount<0 || r.updatedCount>=r.currentCount || (r.reason === "store-to-store-transfer" && !r.transferStore))}
                onClick={handleSubmitReduceRequest}
              >
                Submit Request
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Store Selection Dialog */}
      <Dialog
        open={transferPromptId !== null}
        onOpenChange={(open) => {
          if (!open) {
            // If user dismissed without selecting a store, clear the reason so validation stays consistent
            setReduceRows(prev => prev.map(r => {
              if (r.id !== transferPromptId) return r;
              if (!r.transferStore) return { ...r, reason: "" };
              return r;
            }));
            setTransferPromptId(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Destination Store</DialogTitle>
            <DialogDescription>
              A destination store is required for Store to Store Transfer.
            </DialogDescription>
          </DialogHeader>
          <Select value={pendingTransferStore} onValueChange={setPendingTransferStore}>
            <SelectTrigger>
              <SelectValue placeholder="Select store" />
            </SelectTrigger>
            <SelectContent>
              {transferStoreOptions.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!pendingTransferStore && (
            <p className="text-[11px] text-destructive">Please select a destination store to continue.</p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setReduceRows(prev => prev.map(r => {
                  if (r.id !== transferPromptId) return r;
                  if (!r.transferStore) return { ...r, reason: "" };
                  return r;
                }));
                setTransferPromptId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!pendingTransferStore}
              onClick={() => {
                if (transferPromptId !== null) {
                  setReduceRows(prev => prev.map(r =>
                    r.id === transferPromptId ? { ...r, transferStore: pendingTransferStore } : r
                  ));
                }
                setTransferPromptId(null);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inventory Adjustment</h1>
        <p className="text-muted-foreground text-sm">
          Manage and adjust inventory stock levels
        </p>
      </div>

      {/* Filter Options */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Scan Code Input */}
            <div className="space-y-2">
              <Label htmlFor="scan-code" className="text-xs font-medium">
                Scan Code
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="scan-code"
                  placeholder="Enter scan code..."
                  value={scanCode}
                  onChange={(e) => setScanCode(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Department Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="department" className="text-xs font-medium">
                Department
              </Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tax Type Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="tax-type" className="text-xs font-medium">
                Tax Type
              </Label>
              <Select value={taxType} onValueChange={setTaxType}>
                <SelectTrigger id="tax-type">
                  <SelectValue placeholder="Select tax type" />
                </SelectTrigger>
                <SelectContent>
                  {taxTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vendor List Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="vendor" className="text-xs font-medium">
                Vendor
              </Label>
              <Select value={vendor} onValueChange={setVendor}>
                <SelectTrigger id="vendor">
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort By Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="sort-by" className="text-xs font-medium">
                Sort By
              </Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort-by">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Inventory Items</CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {filteredData.length} of {inventoryData.length} items
              </span>
              {isEditMode ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={!query.data?.canSubmit} onClick={toggleEditMode}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={selectedIds.size === 0}
                    onClick={handleOpenReduceModal}
                  >
                    Request Reduce Inventory
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  disabled={!query.data?.canSubmit} onClick={toggleEditMode}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {isEditMode && (
                    <TableHead className="w-10 text-center">
                      <Checkbox
                        checked={selectedIds.size === filteredData.length && filteredData.length > 0}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                        className="h-4 w-4"
                      />
                    </TableHead>
                  )}
                  <TableHead className="w-[130px]">Scan Code</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Inv. Count</TableHead>
                  <TableHead className="text-right">Net Cost</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Rebate</TableHead>
                  <TableHead className="text-right">Margin %</TableHead>
                  <TableHead>Tax Type</TableHead>
                  {editingId !== null && <TableHead className="w-[220px]">Reason</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
              {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isEditMode ? 12 : 11} className="text-center py-8 text-muted-foreground text-sm">
                      No items match the current filters.
                    </TableCell>
                  </TableRow>
                ) : paginatedData.map((item) => {
                  const isEditing = editingId === item.id;
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <TableRow key={item.id} className={isEditing ? "bg-muted/30" : isSelected ? "bg-muted/20" : ""}>
                      {isEditMode && (
                        <TableCell className="text-center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelectItem(item.id)}
                            aria-label={`Select ${item.itemName}`}
                            className="h-4 w-4"
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-mono text-xs">{item.scanCode}</TableCell>
                      <TableCell className="font-medium text-xs">{item.itemName}</TableCell>
                      <TableCell className="text-xs">{item.department}</TableCell>
                      <TableCell className="text-xs">{item.vendor}</TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editedItem?.inventoryCount ?? 0}
                            onChange={(e) => handleEditChange("inventoryCount", parseFloat(e.target.value) || 0)}
                            className="h-7 text-xs w-16 text-right ml-auto"
                          />
                        ) : (
                          <span className={item.inventoryCount < 15 ? "text-destructive font-medium text-xs" : "text-xs"}>
                            {item.inventoryCount}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs">{item.netCost==null?"":`$${item.netCost.toFixed(2)}`}</TableCell>
                      <TableCell className="text-right text-xs">{item.price==null?"":`$${item.price.toFixed(2)}`}</TableCell>
                      <TableCell className="text-right text-xs">{item.rebate==null?"":`$${item.rebate.toFixed(2)}`}</TableCell>
                      <TableCell className="text-right text-xs">{item.marginAfterRebate==null?"":`${item.marginAfterRebate.toFixed(1)}%`}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          item.taxType === "Taxable"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {item.taxType}
                        </span>
                      </TableCell>
                      {editingId !== null && (
                        <TableCell>
                          {isEditing ? (
                            <Select
                              value={editedItem?.reason ?? ""}
                              onValueChange={(value) => handleEditChange("reason", value)}
                            >
                              <SelectTrigger className="h-7 text-xs w-full">
                                <SelectValue placeholder="Select reason" />
                              </SelectTrigger>
                              <SelectContent>
                                {reasonOptions.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
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
        </CardContent>
      </Card>

      {/* Confirm Save Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Update</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save these changes to the inventory item?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
              No
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};
