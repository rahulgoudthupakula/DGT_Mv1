import {useSalesReports,salesGroups} from './useSalesReports';
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUp, ArrowDown, Minus, CircleAlert, TrendingDown, CheckCircle2 } from "lucide-react";
import { SalesItemDrawer } from "./SalesItemDrawer";
import type { GroupBy } from "./SalesFilters";

type ViewTab = "all" | "top20" | "bottom20";

/* ── Highlight type for smart indicators ── */
type HighlightType = "zero" | "drop" | "consistent" | null;

/* ── Item-level data ── */
interface SalesItemRow {
  name: string;
  scanCode: string;
  category: string;
  unitsSold: number;
  netSales: number;
  percentOfTotal: number;
  avgPrice: number;
  velocity: number;
  prevVelocity: number;
  adjustments: number;
  trend: "up" | "down" | "flat";
}

/* ── Category-level data ── */
interface SalesCategoryRow {
  category: string;
  itemCount: number;
  unitsSold: number;
  netSales: number;
  percentOfTotal: number;
  avgPrice: number;
  velocity: number;
  prevVelocity: number;
  trend: "up" | "down" | "flat";
}

/* ── Vendor-level data ── */
interface SalesVendorRow {
  vendor: string;
  skuCount: number;
  unitsSold: number;
  netSales: number;
  percentOfTotal: number;
  avgPrice: number;
  velocity: number;
  prevVelocity: number;
  trend: "up" | "down" | "flat";
}

/* ── Day-level data ── */
interface SalesDayRow {
  date: string;
  unitsSold: number;
  netSales: number;
  percentOfTotal: number;
  avgPrice: number;
  velocity: number;
  transactions: number;
  trend: "up" | "down" | "flat";
}

/* ── Mock Data ── */








/* ── Smart highlight logic ── */
const getItemHighlight = (item: SalesItemRow): HighlightType => {
  if (item.unitsSold === 0) return "zero";
  if (item.prevVelocity > 0 && item.velocity / item.prevVelocity < 0.7) return "drop";
  if (item.prevVelocity > 0 && Math.abs(item.velocity - item.prevVelocity) / item.prevVelocity < 0.05 && item.velocity > 10) return "consistent";
  return null;
};

const getHighlightStyles = (highlight: HighlightType) => {
  switch (highlight) {
    case "zero": return "bg-destructive/8 border-l-2 border-l-destructive";
    case "drop": return "bg-[hsl(var(--warning))]/8 border-l-2 border-l-[hsl(var(--warning))]";
    case "consistent": return "bg-[hsl(var(--success))]/8 border-l-2 border-l-[hsl(var(--success))]";
    default: return "";
  }
};

const HighlightBadge = ({ highlight }: { highlight: HighlightType }) => {
  switch (highlight) {
    case "zero":
      return (
        <Badge variant="outline" className="text-[9px] gap-0.5 px-1.5 py-0 text-destructive border-destructive/30">
          <CircleAlert className="h-2.5 w-2.5" /> Zero Sales
        </Badge>
      );
    case "drop":
      return (
        <Badge variant="outline" className="text-[9px] gap-0.5 px-1.5 py-0 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30">
          <TrendingDown className="h-2.5 w-2.5" /> Velocity Drop
        </Badge>
      );
    case "consistent":
      return (
        <Badge variant="outline" className="text-[9px] gap-0.5 px-1.5 py-0 text-[hsl(var(--success))] border-[hsl(var(--success))]/30">
          <CheckCircle2 className="h-2.5 w-2.5" /> Consistent
        </Badge>
      );
    default:
      return null;
  }
};

/* ── Drawer mock detail ── */
const mockItemDetail = (item: SalesItemRow & {dailySales?:{date:string;units:number;sales:number}[]}) => ({
 name:item.name,scanCode:item.scanCode,category:item.category,totalUnits:item.unitsSold,totalSales:item.netSales,avgPrice:item.avgPrice,
 dailySales:item.dailySales??[],priceChanges:[],vendors:[],inventoryMovements:[]
});

const TrendIcon = ({ trend }: { trend: "up" | "down" | "flat" }) => {
  if (trend === "up") return <ArrowUp className="h-3.5 w-3.5 text-[hsl(var(--success))]" />;
  if (trend === "down") return <ArrowDown className="h-3.5 w-3.5 text-destructive" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
};

const PercentBar = ({ value }: { value: number }) => (
  <div className="flex items-center justify-end gap-2">
    <div className="w-16 bg-muted rounded-full h-1.5">
      <div className="bg-primary rounded-full h-1.5" style={{ width: `${Math.min(value * 5, 100)}%` }} />
    </div>
    <span>{value}%</span>
  </div>
);

/* ── Highlight Legend ── */
const HighlightLegend = () => (
  <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
    <span className="flex items-center gap-1">
      <span className="w-2 h-2 rounded-full bg-destructive" /> Zero Sales
    </span>
    <span className="flex items-center gap-1">
      <span className="w-2 h-2 rounded-full bg-[hsl(var(--warning))]" /> Velocity Drop (&gt;30%)
    </span>
    <span className="flex items-center gap-1">
      <span className="w-2 h-2 rounded-full bg-[hsl(var(--success))]" /> Consistent Seller
    </span>
  </div>
);

interface SalesTableProps {
 storeId:string;departmentScope?:string;startDate?:Date;endDate?:Date;
  groupBy: GroupBy;
  itemSearch?: string;
}

export const SalesTable = ({ storeId,departmentScope,startDate,endDate,groupBy, itemSearch = "" }: SalesTableProps) => {
 const query=useSalesReports(storeId,startDate,endDate);
 const mockItemData=salesGroups((query.data?.rows??[]).filter(r=>!departmentScope||r.department.toLowerCase()===departmentScope),query.data?.start??"",query.data?.days??1);
 const mockCategoryData=salesGroups((query.data?.rows??[]).filter(r=>!departmentScope||r.department.toLowerCase()===departmentScope),query.data?.start??"",query.data?.days??1,true);
  const [viewTab, setViewTab] = useState<ViewTab>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReturnType<typeof mockItemDetail> | null>(null);

  const handleItemClick = (item: SalesItemRow) => {
    setSelectedItem(mockItemDetail(item));
    setDrawerOpen(true);
  };

  /* ── Item view data (computed unconditionally to preserve hook order) ── */
  const filtered = mockItemData.filter(
    (i) =>
      itemSearch === "" ||
      i.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      i.scanCode.includes(itemSearch)
  );
  const sorted = [...filtered].sort((a, b) => b.netSales - a.netSales);
  const displayData = viewTab === "top20"
    ? sorted.filter(i => i.unitsSold > 0).slice(0, 20)
    : viewTab === "bottom20"
      ? [...sorted].reverse().slice(0, 20)
      : sorted;

  const itemPagination = usePagination(displayData, 10);

  /* ── Render by group ── */
  if(query.isPending)return <p>Loading sales…</p>;
  if(query.error)return <p role="alert" className="text-destructive">{String(query.error)}</p>;
  if (groupBy === "category") return <CategoryTable data={mockCategoryData} viewTab={viewTab} setViewTab={setViewTab} itemSearch={itemSearch} />;
  if (groupBy === "vendor") return <VendorTable viewTab={viewTab} setViewTab={setViewTab} />;
  if (groupBy === "day") return <DayTable />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Sales Analysis</CardTitle>
          <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as ViewTab)}>
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs h-7 px-3">All Items</TabsTrigger>
              <TabsTrigger value="top20" className="text-xs h-7 px-3">Top 20</TabsTrigger>
              <TabsTrigger value="bottom20" className="text-xs h-7 px-3">Bottom 20</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-3 px-6 pt-0 pb-3">
          <div className="flex items-center justify-between pt-4">
            <HighlightLegend />
            <p className="text-xs text-muted-foreground">{displayData.length} items</p>
          </div>
        </div>

        <div className="border-t">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] w-8">#</TableHead>
                <TableHead className="text-[11px]">Item Name</TableHead>
                <TableHead className="text-[11px] text-right">Units Sold</TableHead>
                <TableHead className="text-[11px] text-right">Net Sales $</TableHead>
                <TableHead className="text-[11px] text-right">% of Total</TableHead>
                <TableHead className="text-[11px] text-right">Avg Price $</TableHead>
                <TableHead className="text-[11px] text-right">Velocity</TableHead>
                <TableHead className="text-[11px] text-center">Trend</TableHead>
                <TableHead className="text-[11px] text-right">Adj / Credits $</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemPagination.paginated.map((item, i) => {
                const highlight = getItemHighlight(item);
                const globalIndex = (itemPagination.page - 1) * itemPagination.pageSize + i + 1;
                return (
                  <TableRow
                    key={i}
                    className={`cursor-pointer hover:bg-muted/70 ${getHighlightStyles(highlight)}`}
                    onClick={() => handleItemClick(item)}
                  >
                    <TableCell className="text-xs text-muted-foreground">{globalIndex}</TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        <HighlightBadge highlight={highlight} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{item.category}</span>
                    </TableCell>
                    <TableCell className="text-xs text-right">{item.unitsSold}</TableCell>
                    <TableCell className="text-xs text-right font-medium">
                      ${item.netSales.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-xs text-right"><PercentBar value={item.percentOfTotal} /></TableCell>
                    <TableCell className="text-xs text-right">${item.avgPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-right">
                      <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                        {item.velocity.toFixed(1)}/d
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center"><TrendIcon trend={item.trend} /></div>
                    </TableCell>
                    <TableCell className="text-xs text-right text-muted-foreground">
                      {item.adjustments > 0 ? (
                        <span className="text-destructive">${item.adjustments.toFixed(2)}</span>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <TablePagination
          page={itemPagination.page}
          totalPages={itemPagination.totalPages}
          totalItems={itemPagination.totalItems}
          pageSize={itemPagination.pageSize}
          hasPrev={itemPagination.hasPrev}
          hasNext={itemPagination.hasNext}
          onPrev={itemPagination.prevPage}
          onNext={itemPagination.nextPage}
          onPageSizeChange={(size) => { itemPagination.setPage(1); itemPagination.goToPage(1); }}
        />

        <SalesItemDrawer open={drawerOpen} onOpenChange={setDrawerOpen} item={selectedItem} />
      </CardContent>
    </Card>
  );
};

/* ── Category Table ── */
const CategoryTable = ({ data:mockCategoryData,viewTab, setViewTab, itemSearch = "" }: {data:SalesCategoryRow[]; viewTab: ViewTab; setViewTab: (v: ViewTab) => void; itemSearch?: string }) => {
  const filtered = mockCategoryData.filter(
    (r) => itemSearch === "" || r.category.toLowerCase().includes(itemSearch.toLowerCase())
  );
  const sorted = [...filtered].sort((a, b) => b.netSales - a.netSales);
  const displayData = viewTab === "top20" ? sorted.slice(0, 20) : viewTab === "bottom20" ? [...sorted].reverse().slice(0, 20) : sorted;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Sales Analysis — by Category</CardTitle>
          <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as ViewTab)}>
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs h-7 px-3">All</TabsTrigger>
              <TabsTrigger value="top20" className="text-xs h-7 px-3">Top 20</TabsTrigger>
              <TabsTrigger value="bottom20" className="text-xs h-7 px-3">Bottom 20</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">{displayData.length} categories</p>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] w-8">#</TableHead>
                <TableHead className="text-[11px]">Category</TableHead>
                <TableHead className="text-[11px] text-right">Items</TableHead>
                <TableHead className="text-[11px] text-right">Units Sold</TableHead>
                <TableHead className="text-[11px] text-right">Net Sales $</TableHead>
                <TableHead className="text-[11px] text-right">% of Total</TableHead>
                <TableHead className="text-[11px] text-right">Avg Price $</TableHead>
                <TableHead className="text-[11px] text-right">Velocity</TableHead>
                <TableHead className="text-[11px] text-center">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="text-xs font-medium">{row.category}</TableCell>
                  <TableCell className="text-xs text-right">{row.itemCount}</TableCell>
                  <TableCell className="text-xs text-right">{row.unitsSold}</TableCell>
                  <TableCell className="text-xs text-right font-medium">
                    ${row.netSales.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-xs text-right"><PercentBar value={row.percentOfTotal} /></TableCell>
                  <TableCell className="text-xs text-right">${row.avgPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-xs text-right">
                    <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">{row.velocity.toFixed(1)}/d</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center"><TrendIcon trend={row.trend} /></div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

/* ── Vendor Table ── */
const VendorTable = ({ viewTab, setViewTab }: { viewTab: ViewTab; setViewTab: (v: ViewTab) => void }) => {
 const mockVendorData:SalesVendorRow[]=[];
  const sorted = [...mockVendorData].sort((a, b) => b.netSales - a.netSales);
  const displayData = viewTab === "top20" ? sorted.slice(0, 20) : viewTab === "bottom20" ? [...sorted].reverse().slice(0, 20) : sorted;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Sales Analysis — by Vendor</CardTitle>
          <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as ViewTab)}>
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs h-7 px-3">All</TabsTrigger>
              <TabsTrigger value="top20" className="text-xs h-7 px-3">Top 20</TabsTrigger>
              <TabsTrigger value="bottom20" className="text-xs h-7 px-3">Bottom 20</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">{displayData.length} vendors</p>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] w-8">#</TableHead>
                <TableHead className="text-[11px]">Vendor</TableHead>
                <TableHead className="text-[11px] text-right">SKUs</TableHead>
                <TableHead className="text-[11px] text-right">Units Sold</TableHead>
                <TableHead className="text-[11px] text-right">Net Sales $</TableHead>
                <TableHead className="text-[11px] text-right">% of Total</TableHead>
                <TableHead className="text-[11px] text-right">Avg Price $</TableHead>
                <TableHead className="text-[11px] text-right">Velocity</TableHead>
                <TableHead className="text-[11px] text-center">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="text-xs font-medium">{row.vendor}</TableCell>
                  <TableCell className="text-xs text-right">{row.skuCount}</TableCell>
                  <TableCell className="text-xs text-right">{row.unitsSold}</TableCell>
                  <TableCell className="text-xs text-right font-medium">
                    ${row.netSales.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-xs text-right"><PercentBar value={row.percentOfTotal} /></TableCell>
                  <TableCell className="text-xs text-right">${row.avgPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-xs text-right">
                    <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">{row.velocity.toFixed(1)}/d</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center"><TrendIcon trend={row.trend} /></div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

/* ── Day Table ── */
const DayTable = () => {
 const mockDayData:SalesDayRow[]=[];
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Sales Analysis — by Day</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">{mockDayData.length} days</p>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px]">Day</TableHead>
                <TableHead className="text-[11px] text-right">Units Sold</TableHead>
                <TableHead className="text-[11px] text-right">Net Sales $</TableHead>
                <TableHead className="text-[11px] text-right">% of Total</TableHead>
                <TableHead className="text-[11px] text-right">Avg Price $</TableHead>
                <TableHead className="text-[11px] text-right">Velocity</TableHead>
                <TableHead className="text-[11px] text-right">Transactions</TableHead>
                <TableHead className="text-[11px] text-center">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockDayData.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-medium">{row.date}</TableCell>
                  <TableCell className="text-xs text-right">{row.unitsSold}</TableCell>
                  <TableCell className="text-xs text-right font-medium">
                    ${row.netSales.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-xs text-right"><PercentBar value={row.percentOfTotal} /></TableCell>
                  <TableCell className="text-xs text-right">${row.avgPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-xs text-right">
                    <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">{row.velocity}/d</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-right">{row.transactions}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center"><TrendIcon trend={row.trend} /></div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
