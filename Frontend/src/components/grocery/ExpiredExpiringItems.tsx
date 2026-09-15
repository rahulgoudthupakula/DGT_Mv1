import { useState } from "react";
import { usePagination } from "@/hooks/use-pagination";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { TablePagination } from "@/components/ui/table-pagination";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  AlertTriangle, 
  Search, 
  Download, 
  MoreHorizontal, 
  Trash2, 
  RotateCcw, 
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

// Mock data for expiring items
const mockExpiringItems = [
  {
    id: "1",
    itemName: "Organic Milk 1 Gallon",
    scanCode: "0123456789012",
    department: "Dairy",
    vendor: "Dairy Fresh Co",
    batchNo: "BATCH-2024-001",
    expiryDate: "2026-01-24",
    qtyOnHand: 15,
    unitCost: 4.50,
    status: "expired",
    returnable: true,
  },
  {
    id: "2",
    itemName: "Greek Yogurt Vanilla",
    scanCode: "0123456789013",
    department: "Dairy",
    vendor: "Dairy Fresh Co",
    batchNo: "BATCH-2024-002",
    expiryDate: "2026-01-27",
    qtyOnHand: 24,
    unitCost: 3.25,
    status: "warning",
    returnable: true,
  },
  {
    id: "3",
    itemName: "Fresh Bread Loaf",
    scanCode: "0123456789014",
    department: "Bakery",
    vendor: "Local Bakery",
    batchNo: "BATCH-2024-003",
    expiryDate: "2026-01-28",
    qtyOnHand: 8,
    unitCost: 2.99,
    status: "warning",
    returnable: false,
  },
  {
    id: "4",
    itemName: "Sliced Turkey Deli",
    scanCode: "0123456789015",
    department: "Deli",
    vendor: "Premium Meats",
    batchNo: "BATCH-2024-004",
    expiryDate: "2026-01-30",
    qtyOnHand: 12,
    unitCost: 6.99,
    status: "caution",
    returnable: false,
  },
  {
    id: "5",
    itemName: "Fresh Orange Juice",
    scanCode: "0123456789016",
    department: "Beverages",
    vendor: "Citrus Farms",
    batchNo: "BATCH-2024-005",
    expiryDate: "2026-02-02",
    qtyOnHand: 20,
    unitCost: 5.49,
    status: "caution",
    returnable: true,
  },
  {
    id: "6",
    itemName: "Cottage Cheese 16oz",
    scanCode: "0123456789017",
    department: "Dairy",
    vendor: "Dairy Fresh Co",
    batchNo: "BATCH-2024-006",
    expiryDate: "2026-01-25",
    qtyOnHand: 6,
    unitCost: 4.29,
    status: "expired",
    returnable: true,
  },
];

// Mock audit history data
const mockAuditHistory = [
  {
    id: "1",
    itemName: "Organic Milk 1 Gallon",
    action: "Disposed",
    qtyAffected: 5,
    user: "John Smith",
    timestamp: "2026-01-25 10:30 AM",
    notes: "Expired - disposed per policy",
  },
  {
    id: "2",
    itemName: "Greek Yogurt Strawberry",
    action: "Returned to Vendor",
    qtyAffected: 12,
    user: "Sarah Johnson",
    timestamp: "2026-01-24 02:15 PM",
    notes: "Vendor accepted return for credit",
  },
  {
    id: "3",
    itemName: "Fresh Bread Loaf",
    action: "Reduced Stock",
    qtyAffected: 3,
    user: "Mike Wilson",
    timestamp: "2026-01-24 09:45 AM",
    notes: "Donated to food bank",
  },
];

const departments = ["All Departments", "Dairy", "Bakery", "Deli", "Beverages", "Produce", "Frozen"];
const vendors = ["All Vendors", "Dairy Fresh Co", "Local Bakery", "Premium Meats", "Citrus Farms"];
const categories = ["All Categories", "Perishables", "Fresh", "Refrigerated", "Frozen"];

interface ExpiredExpiringItemsProps {
  onMoveToReduceInventory?: (returnable: boolean) => void;
}

export const ExpiredExpiringItems = ({ onMoveToReduceInventory }: ExpiredExpiringItemsProps = {}) => {
  const [activeTab, setActiveTab] = useState("items");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDaysToExpiry, setFilterDaysToExpiry] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("All Departments");
  const [filterVendor, setFilterVendor] = useState("All Vendors");
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [noteItem, setNoteItem] = useState<{ id: string; itemName: string } | null>(null);
  const [noteText, setNoteText] = useState("");
  const [confirmItem, setConfirmItem] = useState<typeof mockExpiringItems[number] | null>(null);

  const handleMoveToReduce = (item: typeof mockExpiringItems[number]) => {
    setConfirmItem(item);
  };

  const confirmMoveToReduce = () => {
    if (!confirmItem) return;
    const dest = confirmItem.returnable ? "Returnable" : "Non-Returnable";
    toast({
      title: "Moved to Reduce Inventory",
      description: `${confirmItem.itemName} sent to Reduce Inventory (${dest}).`,
    });
    onMoveToReduceInventory?.(confirmItem.returnable);
    setConfirmItem(null);
  };

  const saveNote = () => {
    if (!noteItem) return;
    toast({
      title: "Note added",
      description: `Note saved for ${noteItem.itemName}.`,
    });
    setNoteItem(null);
    setNoteText("");
  };

  // Calculate days left until expiry
  const calculateDaysLeft = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get status based on days left
  const getItemStatus = (daysLeft: number) => {
    if (daysLeft <= 0) return "expired";
    if (daysLeft <= 3) return "warning";
    if (daysLeft <= 7) return "caution";
    return "safe";
  };

  // Filter items
  const filteredItems = mockExpiringItems.filter((item) => {
    const daysLeft = calculateDaysLeft(item.expiryDate);
    const itemStatus = getItemStatus(daysLeft);
    
    const matchesSearch =
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.scanCode.includes(searchTerm);
    
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "expired" && itemStatus === "expired") ||
      (filterStatus === "expiring" && (itemStatus === "warning" || itemStatus === "caution"));
    
    const matchesDaysToExpiry =
      filterDaysToExpiry === "all" ||
      (filterDaysToExpiry === "expired" && daysLeft <= 0) ||
      (filterDaysToExpiry === "3days" && daysLeft <= 3 && daysLeft > 0) ||
      (filterDaysToExpiry === "7days" && daysLeft <= 7 && daysLeft > 0) ||
      (filterDaysToExpiry === "14days" && daysLeft <= 14 && daysLeft > 0);
    
    const matchesDepartment =
      filterDepartment === "All Departments" || item.department === filterDepartment;
    
    const matchesVendor =
      filterVendor === "All Vendors" || item.vendor === filterVendor;

    return matchesSearch && matchesStatus && matchesDaysToExpiry && matchesDepartment && matchesVendor;
  });

  const { paginated: paginatedExpiring, page: expPage, totalPages: expTotalPages, totalItems: expTotalItems, pageSize: expPageSize, hasPrev: expHasPrev, hasNext: expHasNext, nextPage: expNextPage, prevPage: expPrevPage } =
    usePagination(filteredItems, 10);

  // Toggle item selection
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  // Toggle all items
  const toggleAllItems = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map((item) => item.id));
    }
  };

  // Get status badge styling
  const getStatusBadge = (daysLeft: number) => {
    if (daysLeft <= 0) {
      return (
        <Badge className="bg-destructive text-destructive-foreground">
          <AlertCircle className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    }
    if (daysLeft <= 3) {
      return (
        <Badge className="bg-orange-500 text-white">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {daysLeft} days
        </Badge>
      );
    }
    if (daysLeft <= 7) {
      return (
        <Badge className="bg-yellow-500 text-white">
          <Clock className="w-3 h-3 mr-1" />
          {daysLeft} days
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        {daysLeft} days
      </Badge>
    );
  };

  // Get row background color based on status
  const getRowClassName = (daysLeft: number) => {
    if (daysLeft <= 0) return "bg-destructive/10";
    if (daysLeft <= 3) return "bg-orange-500/10";
    if (daysLeft <= 7) return "bg-yellow-500/10";
    return "";
  };

  // Calculate summary stats
  const expiredCount = filteredItems.filter(item => calculateDaysLeft(item.expiryDate) <= 0).length;
  const warningCount = filteredItems.filter(item => {
    const days = calculateDaysLeft(item.expiryDate);
    return days > 0 && days <= 3;
  }).length;
  const cautionCount = filteredItems.filter(item => {
    const days = calculateDaysLeft(item.expiryDate);
    return days > 3 && days <= 7;
  }).length;

  const totalRiskValue = filteredItems.reduce((sum, item) => sum + (item.qtyOnHand * item.unitCost), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expired & Expiring Items</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Expiry Monitoring & Action Center
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-destructive/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-destructive">{expiredCount}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-500/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">1-3 Days Left</p>
                <p className="text-2xl font-bold text-orange-500">{warningCount}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">4-7 Days Left</p>
                <p className="text-2xl font-bold text-yellow-600">{cautionCount}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Risk Value</p>
                <p className="text-2xl font-bold text-foreground">${totalRiskValue.toFixed(2)}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="items">Items ({filteredItems.length})</TabsTrigger>
          <TabsTrigger value="history">History & Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by item name or scan code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="expiring">Expiring Soon</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterDaysToExpiry} onValueChange={setFilterDaysToExpiry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Days to Expiry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Days</SelectItem>
                    <SelectItem value="expired">Already Expired</SelectItem>
                    <SelectItem value="3days">≤ 3 days</SelectItem>
                    <SelectItem value="7days">≤ 7 days</SelectItem>
                    <SelectItem value="14days">≤ 14 days</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterVendor} onValueChange={setFilterVendor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor} value={vendor}>
                        {vendor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedItems.length} item(s) selected
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Bulk Reduce
                    </Button>
                    <Button variant="outline" size="sm">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Bulk Return
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export Selected
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Items Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                        onCheckedChange={toggleAllItems}
                      />
                    </TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Scan Code</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Batch/Lot</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Days Left</TableHead>
                    <TableHead className="text-right">Qty on Hand</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Risk Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedExpiring.map((item) => {
                    const daysLeft = calculateDaysLeft(item.expiryDate);
                    const riskValue = item.qtyOnHand * item.unitCost;
                    return (
                      <TableRow key={item.id} className={getRowClassName(daysLeft)}>
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={() => toggleItemSelection(item.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{item.itemName}</TableCell>
                        <TableCell className="font-mono text-xs">{item.scanCode}</TableCell>
                        <TableCell>{item.department}</TableCell>
                        <TableCell>{item.vendor}</TableCell>
                        <TableCell className="text-xs">{item.batchNo}</TableCell>
                        <TableCell>{new Date(item.expiryDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={`font-semibold ${
                            daysLeft <= 0 ? "text-destructive" :
                            daysLeft <= 3 ? "text-orange-500" :
                            daysLeft <= 7 ? "text-yellow-600" : "text-foreground"
                          }`}>
                            {daysLeft <= 0 ? `${Math.abs(daysLeft)} days ago` : `${daysLeft} days`}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{item.qtyOnHand}</TableCell>
                        <TableCell className="text-right">${item.unitCost.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">${riskValue.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(daysLeft)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="z-50 bg-popover">
                            <DropdownMenuItem onClick={() => handleMoveToReduce(item)}>
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Move to Reduce Inventory
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setNoteItem({ id: item.id, itemName: item.itemName });
                                setNoteText("");
                              }}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Add Notes
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                        No items matching the current filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <TablePagination
                page={expPage}
                totalPages={expTotalPages}
                totalItems={expTotalItems}
                pageSize={expPageSize}
                hasPrev={expHasPrev}
                hasNext={expHasNext}
                onPrev={expPrevPage}
                onNext={expNextPage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Action History & Audit Trail</CardTitle>
              <CardDescription>
                Complete log of all actions taken on expired and expiring items
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className="text-right">Qty Affected</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAuditHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.itemName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.action}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{record.qtyAffected}</TableCell>
                      <TableCell>{record.user}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {record.timestamp}
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {record.notes}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!noteItem} onOpenChange={(o) => !o && setNoteItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note{noteItem ? ` — ${noteItem.itemName}` : ""}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Enter note..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteItem(null)}>Cancel</Button>
            <Button onClick={saveNote} disabled={!noteText.trim()}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmItem} onOpenChange={(o) => !o && setConfirmItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to Reduce Inventory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to move this item to Reduce Inventory?
            </p>
            {confirmItem && (
              <div className="rounded-md bg-muted p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Item</span>
                  <span className="font-medium text-foreground">{confirmItem.itemName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destination</span>
                  <Badge variant={confirmItem.returnable ? "default" : "secondary"}>
                    {confirmItem.returnable ? "Returnable" : "Non-Returnable"}
                  </Badge>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmItem(null)}>Cancel</Button>
            <Button onClick={confirmMoveToReduce}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
