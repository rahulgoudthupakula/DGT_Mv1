import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/backend";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Package, DollarSign, TrendingDown, Layers } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { InventoryByItemTable } from "./InventoryByItemTable";
import { InventoryByItemDrawer } from "./InventoryByItemDrawer";

export interface PricebookValuationItem {
  id: string;
  itemName: string;
  sku: string;
  category: string;
  department: string;
  vendors: {id:number;name:string}[];
  onHandQty: number | null;
  currentUnitCost: number | null;
  inventoryValue: number | null;
  lastPurchaseCost: number;
  lastPurchaseDate: string;
  stockAgeDays: number;
  status: "Normal" | "Slow-moving" | "Expiring";
  purchaseHistory: { date: string; vendor: string; qty: number; unitCost: number }[];
  movements: { date: string; type: string; qty: number; note: string }[];
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type RiskFilter = "all" | "expiring" | "negative" | "zero-sales";

export const InventoryByItem = ({storeId}:{storeId:string}) => {
  const query=useQuery({queryKey:['current-stock',storeId],queryFn:()=>request<{items:PricebookValuationItem[];store:{name:string;timezone:string}}>(`/access/stores/${storeId}/current-stock`),enabled:!!storeId,refetchInterval:30000});
  const items=(query.data?.items??[]).map(i=>({...i,purchaseHistory:[],movements:[]}));
  const departments=[...new Set(items.map(i=>i.department))];
  const vendors=[...new Map(items.flatMap(i=>i.vendors).map(v=>[String(v.id),v])).values()];

  const [asOfDate, setAsOfDate] = useState<Date | undefined>();
  const [department, setDepartment] = useState("all");
  const [vendor, setVendor] = useState("all");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [selectedItem, setSelectedItem] = useState<PricebookValuationItem | null>(null);

  const filteredItems = items.filter((item) => {
    if (department !== "all" && item.department !== department) return false;
    if (vendor !== "all" && !item.vendors.some(v=>String(v.id)===vendor)) return false;
    if (riskFilter === "expiring" && item.status !== "Expiring") return false;
    if (riskFilter === "negative" && (item.onHandQty == null || item.onHandQty >= 0)) return false;
    if (riskFilter === "zero-sales" && item.status !== "Slow-moving") return false;
    return true;
  });

  const totalQty = filteredItems.reduce((sum,item)=>sum+(item.onHandQty??0),0);
  const valued=filteredItems.filter(i=>i.inventoryValue!=null);
  const totalValue=valued.reduce((sum,i)=>sum+Math.round(i.inventoryValue!*100),0)/100;
  return (
    <div className="space-y-5">
      {query.isPending&&<p>Loading current stock…</p>}{query.error&&<p role="alert">{query.error.message}</p>}
      <p className="text-xs text-muted-foreground">{query.data?.store.name??''} · Current recorded quantities. Blank quantities have not been recorded. Inventory value = recorded quantity × current item cost.</p>
      {/* Filters */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Inventory Valuation Filters
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled
                  className={cn(
                    "justify-start text-left font-normal h-9 text-xs",
                    !asOfDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                  {asOfDate ? format(asOfDate, "MM/dd/yyyy") : "As of date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={asOfDate}
                  onSelect={setAsOfDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Select value="current" disabled>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Store" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">{query.data?.store.name??"Selected store"}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={vendor} onValueChange={setVendor}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {vendors.map(v=><SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value="current-cost" disabled>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Valuation Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-cost">Current Item Cost</SelectItem>
                <SelectItem value="last-purchase">Last Purchase Cost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-[11px] text-muted-foreground font-medium">Recorded Inventory Qty</p>
            </div>
            <p className="text-xl font-bold">{filteredItems.some(i=>i.onHandQty!=null)?totalQty.toLocaleString():""}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-[11px] text-muted-foreground font-medium">Total Inventory Value</p>
            </div>
            <p className="text-xl font-bold">{valued.length?`$${fmt(totalValue)}`:""}</p>{valued.length<filteredItems.length&&<p className="text-xs text-muted-foreground">{filteredItems.length-valued.length} items missing quantity or cost</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-[11px] text-muted-foreground font-medium">Average Cost / Unit</p>
            </div>
            <p className="text-xl font-bold"></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
              <p className="text-[11px] text-muted-foreground font-medium">At-Risk Inventory $</p>
            </div>
            <p className="text-xl font-bold text-destructive"></p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Quick filter:</span>
        {([
          { key: "all", label: "All Items" },
          { key: "expiring", label: "Expiring Soon" },
          { key: "negative", label: "Negative Stock" },
          { key: "zero-sales", label: "Zero Sales (Slow)" },
        ] as { key: RiskFilter; label: string }[]).map((f) => (
          <Button
            key={f.key}
            disabled={f.key!=="all"}
            variant={riskFilter === f.key ? "default" : "outline"}
            size="sm"
            className="h-7 text-[11px] px-3"
            onClick={() => setRiskFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <InventoryByItemTable items={filteredItems} onItemClick={setSelectedItem} />
      <InventoryByItemDrawer storeId={storeId} timezone={query.data?.store.timezone} item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
};
