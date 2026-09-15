import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Check,
  X,
  FileText,
  Download,
  ShoppingCart,
  RotateCcw,
  ChevronDown,
  Snowflake,
  Package,
  Plus,
  Search,
  Barcode,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderGuideItem {
  id: string;
  itemName: string;
  scanCode: string;
  avgDailySales: number;
  salesInPeriod: number;
  currentStock: number;
  daysOfStockLeft: number;
  suggestedOrderQty: number;
  orderQty: number;
  lastOrderDate: string;
  vendor: string;
  department: string;
  casePackSize: number;
  minOrderQty: number;
  stockStatus: "out" | "low" | "healthy" | "expiring";
  salesTrend: "up" | "down" | "stable";
  isIgnored: boolean;
  isSeasonal: boolean;
  isDiscontinued: boolean;
}

const departments = ["Dairy", "Produce", "Frozen", "Bakery", "Meat", "Beverages", "Snacks", "Grocery"];
const vendors = ["Sysco", "US Foods", "McLane", "Core-Mark", "UNFI", "KeHE"];

const TARGET_DAYS = 14;

const PRODUCT_CATALOG = [
  { scanCode: "049000028928", itemName: "Coca-Cola 12oz Can", department: "Beverages", vendor: "Core-Mark", casePackSize: 24, minOrderQty: 24, avgDailySales: 20 },
  { scanCode: "049000050923", itemName: "Coca-Cola 20oz Bottle", department: "Beverages", vendor: "Core-Mark", casePackSize: 24, minOrderQty: 24, avgDailySales: 15 },
  { scanCode: "049000006582", itemName: "Diet Coke 12oz Can", department: "Beverages", vendor: "Core-Mark", casePackSize: 24, minOrderQty: 24, avgDailySales: 12 },
  { scanCode: "049000028904", itemName: "Coke Zero Sugar 12oz", department: "Beverages", vendor: "Core-Mark", casePackSize: 24, minOrderQty: 24, avgDailySales: 10 },
  { scanCode: "012000001086", itemName: "Pepsi 12oz Can", department: "Beverages", vendor: "McLane", casePackSize: 24, minOrderQty: 24, avgDailySales: 18 },
  { scanCode: "012000161155", itemName: "Mountain Dew 20oz", department: "Beverages", vendor: "McLane", casePackSize: 24, minOrderQty: 24, avgDailySales: 14 },
  { scanCode: "028400090100", itemName: "Doritos Nacho Cheese 9oz", department: "Snacks", vendor: "McLane", casePackSize: 12, minOrderQty: 12, avgDailySales: 8 },
  { scanCode: "028400315561", itemName: "Lay's Classic Chips 8oz", department: "Snacks", vendor: "McLane", casePackSize: 12, minOrderQty: 12, avgDailySales: 7 },
  { scanCode: "038000849800", itemName: "Kellogg's Corn Flakes 18oz", department: "Grocery", vendor: "UNFI", casePackSize: 12, minOrderQty: 12, avgDailySales: 4 },
  { scanCode: "070038591344", itemName: "Gatorade Lemon-Lime 32oz", department: "Beverages", vendor: "Core-Mark", casePackSize: 12, minOrderQty: 12, avgDailySales: 11 },
  { scanCode: "016000275287", itemName: "Cheerios Original 8.9oz", department: "Grocery", vendor: "UNFI", casePackSize: 12, minOrderQty: 12, avgDailySales: 5 },
  { scanCode: "044000032036", itemName: "Oreo Cookies 14.3oz", department: "Snacks", vendor: "McLane", casePackSize: 12, minOrderQty: 12, avgDailySales: 6 },
];

export const OrderGuide = () => {
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [includePromotions, setIncludePromotions] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Add Items to Order Guide state
  const [showAddItems, setShowAddItems] = useState(false);
  const [addItemSearch, setAddItemSearch] = useState("");
  const [addDepartment, setAddDepartment] = useState("");
  const [addVendor, setAddVendor] = useState("");
  const [searchResults, setSearchResults] = useState<typeof PRODUCT_CATALOG>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [items, setItems] = useState<OrderGuideItem[]>([
    {
      id: "1",
      itemName: "Organic Milk 1 Gallon",
      scanCode: "123456789",
      avgDailySales: 8,
      salesInPeriod: 112,
      currentStock: 12,
      daysOfStockLeft: 1.5,
      suggestedOrderQty: 100,
      orderQty: 100,
      lastOrderDate: "2025-01-20",
      vendor: "Sysco",
      department: "Dairy",
      casePackSize: 4,
      minOrderQty: 4,
      stockStatus: "low",
      salesTrend: "up",
      isIgnored: false,
      isSeasonal: false,
      isDiscontinued: false,
    },
    {
      id: "2",
      itemName: "Fresh Bread Loaf",
      scanCode: "987654321",
      avgDailySales: 15,
      salesInPeriod: 210,
      currentStock: 45,
      daysOfStockLeft: 3,
      suggestedOrderQty: 165,
      orderQty: 168,
      lastOrderDate: "2025-01-22",
      vendor: "McLane",
      department: "Bakery",
      casePackSize: 6,
      minOrderQty: 6,
      stockStatus: "low",
      salesTrend: "stable",
      isIgnored: false,
      isSeasonal: false,
      isDiscontinued: false,
    },
    {
      id: "3",
      itemName: "Ground Beef 1lb",
      scanCode: "456789123",
      avgDailySales: 5,
      salesInPeriod: 70,
      currentStock: 0,
      daysOfStockLeft: 0,
      suggestedOrderQty: 70,
      orderQty: 72,
      lastOrderDate: "2025-01-18",
      vendor: "Sysco",
      department: "Meat",
      casePackSize: 12,
      minOrderQty: 12,
      stockStatus: "out",
      salesTrend: "up",
      isIgnored: false,
      isSeasonal: false,
      isDiscontinued: false,
    },
    {
      id: "4",
      itemName: "Fresh Strawberries",
      scanCode: "789123456",
      avgDailySales: 6,
      salesInPeriod: 84,
      currentStock: 28,
      daysOfStockLeft: 4.7,
      suggestedOrderQty: 56,
      orderQty: 60,
      lastOrderDate: "2025-01-21",
      vendor: "US Foods",
      department: "Produce",
      casePackSize: 12,
      minOrderQty: 12,
      stockStatus: "expiring",
      salesTrend: "up",
      isIgnored: false,
      isSeasonal: true,
      isDiscontinued: false,
    },
    {
      id: "5",
      itemName: "Orange Juice 64oz",
      scanCode: "321654987",
      avgDailySales: 4,
      salesInPeriod: 56,
      currentStock: 72,
      daysOfStockLeft: 18,
      suggestedOrderQty: 0,
      orderQty: 0,
      lastOrderDate: "2025-01-15",
      vendor: "Core-Mark",
      department: "Beverages",
      casePackSize: 8,
      minOrderQty: 8,
      stockStatus: "healthy",
      salesTrend: "down",
      isIgnored: false,
      isSeasonal: false,
      isDiscontinued: false,
    },
    {
      id: "6",
      itemName: "Frozen Pizza Pepperoni",
      scanCode: "654987321",
      avgDailySales: 3,
      salesInPeriod: 42,
      currentStock: 35,
      daysOfStockLeft: 11.7,
      suggestedOrderQty: 7,
      orderQty: 8,
      lastOrderDate: "2025-01-19",
      vendor: "McLane",
      department: "Frozen",
      casePackSize: 8,
      minOrderQty: 8,
      stockStatus: "healthy",
      salesTrend: "stable",
      isIgnored: false,
      isSeasonal: false,
      isDiscontinued: false,
    },
  ]);

  const handleOrderQtyChange = (id: string, qty: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, orderQty: Math.max(0, qty) } : item))
    );
  };

  const handleToggleIgnore = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isIgnored: !item.isIgnored } : item))
    );
  };

  const handleToggleSeasonal = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isSeasonal: !item.isSeasonal } : item))
    );
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const activeItems = items.filter((i) => !i.isIgnored && !i.isDiscontinued);
    if (selectedItems.length === activeItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(activeItems.map((i) => i.id));
    }
  };

  const acceptAllSuggested = () => {
    setItems((prev) =>
      prev.map((item) => ({ ...item, orderQty: item.suggestedOrderQty }))
    );
  };

  const roundToCasePacks = () => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        orderQty: Math.ceil(item.orderQty / item.casePackSize) * item.casePackSize,
      }))
    );
  };

  const clearAllSuggestions = () => {
    setItems((prev) => prev.map((item) => ({ ...item, orderQty: 0 })));
  };

  // Search catalog
  const handleSearchItems = () => {
    const query = addItemSearch.toLowerCase().trim();
    let results = PRODUCT_CATALOG;
    if (query) {
      results = results.filter(
        (p) =>
          p.itemName.toLowerCase().includes(query) ||
          p.scanCode.includes(query)
      );
    }
    if (addDepartment && addDepartment !== "all") {
      results = results.filter((p) => p.department === addDepartment);
    }
    if (addVendor && addVendor !== "all") {
      results = results.filter((p) => p.vendor === addVendor);
    }
    setSearchResults(results);
    setHasSearched(true);
  };

  // Add a catalog item to the table
  const handleAddItemToGuide = (product: typeof PRODUCT_CATALOG[0]) => {
    const alreadyExists = items.some((i) => i.scanCode === product.scanCode);
    if (alreadyExists) return;
    const days = 14;
    const suggested = Math.max(0, TARGET_DAYS * product.avgDailySales);
    const newItem: OrderGuideItem = {
      id: `added-${product.scanCode}`,
      itemName: product.itemName,
      scanCode: product.scanCode,
      avgDailySales: product.avgDailySales,
      salesInPeriod: product.avgDailySales * days,
      currentStock: 0,
      daysOfStockLeft: 0,
      suggestedOrderQty: suggested,
      orderQty: suggested,
      lastOrderDate: "—",
      vendor: product.vendor,
      department: product.department,
      casePackSize: product.casePackSize,
      minOrderQty: product.minOrderQty,
      stockStatus: "out",
      salesTrend: "stable",
      isIgnored: false,
      isSeasonal: false,
      isDiscontinued: false,
    };
    setItems((prev) => [...prev, newItem]);
    setSearchResults((prev) => prev.filter((p) => p.scanCode !== product.scanCode));
  };

  const getStockStatusIndicator = (status: OrderGuideItem["stockStatus"]) => {
    switch (status) {
      case "out":
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">
            Out of Stock
          </Badge>
        );
      case "low":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">
            Low Stock
          </Badge>
        );
      case "expiring":
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200 text-[10px]">
            <Clock className="h-3 w-3 mr-1" />
            Expiring
          </Badge>
        );
      case "healthy":
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px]">
            Healthy
          </Badge>
        );
    }
  };

  const getSalesTrendIndicator = (trend: OrderGuideItem["salesTrend"]) => {
    switch (trend) {
      case "up":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <TrendingUp className="h-4 w-4 text-success" />
              </TooltipTrigger>
              <TooltipContent>Sales trending up</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case "down":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <TrendingDown className="h-4 w-4 text-destructive" />
              </TooltipTrigger>
              <TooltipContent>Sales trending down</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      default:
        return null;
    }
  };

  const filteredItems = items.filter((item) => {
    if (item.isDiscontinued) return false;
    if (departmentFilter && departmentFilter !== "all" && item.department !== departmentFilter) return false;
    if (vendorFilter && vendorFilter !== "all" && item.vendor !== vendorFilter) return false;
    return true;
  });

  const activeItems = filteredItems.filter((i) => !i.isIgnored);
  const totalOrderQty = activeItems.reduce((sum, item) => sum + item.orderQty, 0);
  const itemsNeedingOrder = activeItems.filter((i) => i.suggestedOrderQty > 0).length;


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customized Order Guide</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Recommended quantities based on historical sales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50 bg-popover">
              <DropdownMenuItem>
                <FileText className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="bg-primary hover:bg-primary/90">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Create Purchase Order
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
              <Label className="text-xs">Vendor</Label>
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All Vendors" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor} value={vendor}>
                      {vendor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Include Promotions</Label>
              <div className="flex items-center gap-2 h-9">
                <Switch
                  checked={includePromotions}
                  onCheckedChange={setIncludePromotions}
                />
                <span className="text-sm text-muted-foreground">
                  {includePromotions ? "Yes" : "No"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Target Days of Stock</Label>
              <div className="flex items-center gap-2 h-9 px-3 bg-muted rounded-md">
                <span className="text-sm font-medium">{TARGET_DAYS} days</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Items Needing Order</p>
              <p className="text-2xl font-bold text-foreground">{itemsNeedingOrder}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-amber-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Order Qty</p>
              <p className="text-2xl font-bold text-foreground">{totalOrderQty}</p>
            </div>
            <Package className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Out of Stock</p>
              <p className="text-2xl font-bold text-destructive">
                {activeItems.filter((i) => i.stockStatus === "out").length}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Low Stock</p>
              <p className="text-2xl font-bold text-amber-600">
                {activeItems.filter((i) => i.stockStatus === "low").length}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-amber-500" />
          </div>
        </Card>
      </div>

      {/* Add Items to Order Guide */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            setShowAddItems((v) => !v);
            if (showAddItems) {
              setSearchResults([]);
              setHasSearched(false);
              setAddItemSearch("");
              setAddDepartment("");
              setAddVendor("");
            }
          }}
        >
          <Plus className="h-4 w-4" />
          Add Items to Order Guide
        </Button>
      </div>

      {showAddItems && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Add Items to Order Guide</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  setShowAddItems(false);
                  setSearchResults([]);
                  setHasSearched(false);
                  setAddItemSearch("");
                  setAddDepartment("");
                  setAddVendor("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Item Code / Item Name */}
              <div className="space-y-1.5">
                <Label className="text-xs">Item Code / Item Name</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder='e.g. "Coke" or scan barcode'
                    value={addItemSearch}
                    onChange={(e) => setAddItemSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchItems()}
                    className="h-9 text-sm pl-8"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Department</Label>
                <Select value={addDepartment} onValueChange={setAddDepartment}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Vendor</Label>
                <Select value={addVendor} onValueChange={setAddVendor}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="All Vendors" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    <SelectItem value="all">All Vendors</SelectItem>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAddItemSearch("");
                  setAddDepartment("");
                  setAddVendor("");
                  setSearchResults([]);
                  setHasSearched(false);
                }}
              >
                Clear
              </Button>
              <Button size="sm" className="gap-1" onClick={handleSearchItems}>
                <Search className="h-3.5 w-3.5" />
                Search
              </Button>
            </div>

            {/* Search Results */}
            {hasSearched && (
              <div className="border rounded-md overflow-hidden bg-background">
                {searchResults.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No products found. Try a different search term.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs font-medium">Item Name</TableHead>
                        <TableHead className="text-xs font-medium">
                          <span className="flex items-center gap-1">
                            <Barcode className="h-3.5 w-3.5" />
                            Scan Code
                          </span>
                        </TableHead>
                        <TableHead className="text-xs font-medium">Department</TableHead>
                        <TableHead className="text-xs font-medium">Vendor</TableHead>
                        <TableHead className="text-xs font-medium text-center">Avg Daily Sales</TableHead>
                        <TableHead className="text-xs font-medium text-center">Case Pack</TableHead>
                        <TableHead className="text-xs font-medium text-center">Suggested Qty</TableHead>
                        <TableHead className="w-24" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResults.map((product) => {
                        const alreadyAdded = items.some((i) => i.scanCode === product.scanCode);
                        const suggested = TARGET_DAYS * product.avgDailySales;
                        return (
                          <TableRow key={product.scanCode} className={alreadyAdded ? "opacity-50" : ""}>
                            <TableCell className="text-xs font-medium">{product.itemName}</TableCell>
                            <TableCell className="text-xs font-mono text-muted-foreground">{product.scanCode}</TableCell>
                            <TableCell className="text-xs">{product.department}</TableCell>
                            <TableCell className="text-xs">{product.vendor}</TableCell>
                            <TableCell className="text-xs text-center">{product.avgDailySales}</TableCell>
                            <TableCell className="text-xs text-center">{product.casePackSize}</TableCell>
                            <TableCell className="text-xs text-center font-medium text-primary">{suggested}</TableCell>
                            <TableCell className="text-right pr-3">
                              {alreadyAdded ? (
                                <Badge variant="outline" className="text-[10px] text-success border-success/30 bg-success/10">
                                  <Check className="h-3 w-3 mr-1" />
                                  Added
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  className="h-7 text-xs gap-1"
                                  onClick={() => handleAddItemToGuide(product)}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Add Item
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Order Guide Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Order Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedItems.length === activeItems.length && activeItems.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="text-xs font-medium">Item Name</TableHead>
                  <TableHead className="text-xs font-medium">Scan Code</TableHead>
                  <TableHead className="text-xs font-medium text-center">Avg Daily Sales</TableHead>
                  <TableHead className="text-xs font-medium text-center">Sales (14d)</TableHead>
                  <TableHead className="text-xs font-medium text-center">Current Stock</TableHead>
                  <TableHead className="text-xs font-medium text-center">Estimated Days Until Stockout</TableHead>
                  <TableHead className="text-xs font-medium text-center">Suggested Qty</TableHead>
                  <TableHead className="text-xs font-medium text-center">Order Qty</TableHead>
                  <TableHead className="text-xs font-medium">Last Order</TableHead>
                  <TableHead className="text-xs font-medium">Vendor</TableHead>
                  <TableHead className="text-xs font-medium text-center">Status</TableHead>
                  <TableHead className="text-xs font-medium text-center">Adjustments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className={cn(
                      item.isIgnored && "opacity-50 bg-muted/30",
                      item.stockStatus === "out" && "bg-destructive/5"
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => handleSelectItem(item.id)}
                        disabled={item.isIgnored}
                      />
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      <div className="flex items-center gap-2">
                        {item.itemName}
                        {getSalesTrendIndicator(item.salesTrend)}
                        {item.isSeasonal && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Snowflake className="h-3.5 w-3.5 text-blue-500" />
                              </TooltipTrigger>
                              <TooltipContent>Seasonal item</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{item.scanCode}</TableCell>
                    <TableCell className="text-xs text-center">{item.avgDailySales}</TableCell>
                    <TableCell className="text-xs text-center">{item.salesInPeriod}</TableCell>
                    <TableCell
                      className={cn(
                        "text-xs text-center font-medium",
                        item.currentStock === 0 && "text-destructive"
                      )}
                    >
                      {item.currentStock}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-xs text-center",
                        item.daysOfStockLeft <= 3 && "text-destructive font-medium",
                        item.daysOfStockLeft > 3 && item.daysOfStockLeft <= 7 && "text-amber-600"
                      )}
                    >
                      {item.daysOfStockLeft.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-xs text-center font-medium text-primary">
                      {item.suggestedOrderQty}
                    </TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        min={0}
                        value={item.orderQty}
                        onChange={(e) => handleOrderQtyChange(item.id, parseInt(e.target.value) || 0)}
                        className={cn(
                          "h-7 text-xs w-16 text-center",
                          item.orderQty !== item.suggestedOrderQty && "border-amber-400 bg-amber-50"
                        )}
                        disabled={item.isIgnored}
                      />
                    </TableCell>
                    <TableCell className="text-xs">{item.lastOrderDate}</TableCell>
                    <TableCell className="text-xs">{item.vendor}</TableCell>
                    <TableCell className="text-center">
                      {getStockStatusIndicator(item.stockStatus)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={item.isIgnored ? "default" : "ghost"}
                                size="icon"
                                className={cn(
                                  "h-7 w-7",
                                  item.isIgnored && "bg-muted-foreground hover:bg-muted-foreground/80"
                                )}
                                onClick={() => handleToggleIgnore(item.id)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {item.isIgnored ? "Include item" : "Ignore item"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={item.isSeasonal ? "default" : "ghost"}
                                size="icon"
                                className={cn(
                                  "h-7 w-7",
                                  item.isSeasonal && "bg-blue-500 hover:bg-blue-600"
                                )}
                                onClick={() => handleToggleSeasonal(item.id)}
                              >
                                <Snowflake className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {item.isSeasonal ? "Remove seasonal flag" : "Mark as seasonal"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Accept All Suggested — bottom of table */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={roundToCasePacks}>
                <Package className="h-4 w-4 mr-1" />
                Round to Case Packs
              </Button>
              <Button variant="outline" size="sm" onClick={clearAllSuggestions}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>
            <Button size="sm" onClick={acceptAllSuggested} className="gap-2 bg-primary hover:bg-primary/90">
              <Check className="h-4 w-4" />
              Accept All Suggested
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Learning Logic Info */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground">Order Learning</h4>
              <p className="text-xs text-muted-foreground mt-1">
                The system tracks your suggested vs. final ordered quantities to improve future recommendations
                and detect chronic over/under ordering patterns.
              </p>
              <p className="text-xs font-medium text-foreground mt-2">
                Formula: (Target Days × Avg Daily Sales) – Current Stock
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
