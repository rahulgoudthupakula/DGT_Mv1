import {useProfitData} from './ProfitData';
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowUp, ArrowDown, Minus, CircleAlert } from "lucide-react";

type ViewMode = "item" | "category";
type MarginReason = "cost_increase" | "price_override" | "shrink" | "no_rebate";

const reasonLabels: Record<MarginReason, { label: string; color: string }> = {
  cost_increase: { label: "Cost increase", color: "text-destructive" },
  price_override: { label: "Price override", color: "text-[hsl(var(--warning))]" },
  shrink: { label: "Shrink", color: "text-destructive" },
  no_rebate: { label: "No rebate", color: "text-muted-foreground" },
};

interface MarginItem {
  name: string;
  unitsSold: number;
  netSales: number;
  avgCost: number;
  avgPrice: number;
  grossProfit: number;
  margin: number;
  rebateImpact: number;
  trend: "up" | "down" | "flat";
  lowMarginReasons?: MarginReason[];
}

interface CategoryMargin {
  name: string;
  itemCount: number;
  unitsSold: number;
  netSales: number;
  cogs: number;
  grossProfit: number;
  margin: number;
  rebateImpact: number;
  trend: "up" | "down" | "flat";
  lowMarginReasons?: MarginReason[];
}

interface VendorMargin {
  name: string;
  skuCount: number;
  unitsSold: number;
  netSales: number;
  totalCost: number;
  grossProfit: number;
  margin: number;
  rebateImpact: number;
  trend: "up" | "down" | "flat";
  lowMarginReasons?: MarginReason[];
}







const TrendIcon = ({ trend }: { trend: "up" | "down" | "flat" }) => {
  if (trend === "up") return <ArrowUp className="h-3.5 w-3.5 text-[hsl(var(--success))]" />;
  if (trend === "down") return <ArrowDown className="h-3.5 w-3.5 text-destructive" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
};

const getMarginBadge = (margin: number) => {
 if(margin==null)return null;
  if (margin < 0) return <Badge variant="destructive" className="text-[10px] px-1.5">Negative</Badge>;
  if (margin < 20) return <Badge variant="outline" className="text-[10px] px-1.5 border-destructive/50 text-destructive">Low</Badge>;
  return null;
};

const MarginReasonIndicator = ({ reasons }: { reasons: MarginReason[] }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-0.5 cursor-help ml-1.5">
            <CircleAlert className="h-3.5 w-3.5 text-destructive" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[200px]">
          <p className="text-[10px] font-semibold mb-1">Low margin reasons:</p>
          <div className="space-y-0.5">
            {reasons.map((reason) => (
              <div key={reason} className="flex items-center gap-1.5">
                <span className={`text-[10px] ${reasonLabels[reason].color}`}>●</span>
                <span className="text-[10px]">{reasonLabels[reason].label}</span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const NameCellContent = ({ name, margin, reasons }: { name: string; margin: number; reasons?: MarginReason[] }) => (
  <div className="flex items-center gap-1">
    {name}
    {getMarginBadge(margin)}
    {reasons && reasons.length > 0 && <MarginReasonIndicator reasons={reasons} />}
  </div>
);

export const ProfitMarginView = () => {
 const report=useProfitData();const mockItemData:MarginItem[]=report.items;const mockCategoryData:CategoryMargin[]=report.categories;const mockVendorData:VendorMargin[]=[];
  const [viewMode, setViewMode] = useState<ViewMode>("item");
  const itemPagination = usePagination(mockItemData, 10);
  const catPagination = usePagination(mockCategoryData, 10);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)}>
          <ToggleGroupItem value="item" className="text-xs h-8 px-3">Item View</ToggleGroupItem>
          <ToggleGroupItem value="category" className="text-xs h-8 px-3">Category View</ToggleGroupItem>
        </ToggleGroup>
        <p className="text-xs text-muted-foreground">
          Viewing by: <span className="font-medium capitalize">{viewMode}</span>
        </p>
      </div>

      <div className="rounded-md border">
        {viewMode === "item" && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Item</TableHead>
                  <TableHead className="text-xs text-right">Units Sold</TableHead>
                  <TableHead className="text-xs text-right">Net Sales $</TableHead>
                  <TableHead className="text-xs text-right">Avg Cost $</TableHead>
                  <TableHead className="text-xs text-right">Avg Price $</TableHead>
                  <TableHead className="text-xs text-right">Gross Profit $</TableHead>
                  <TableHead className="text-xs text-right">Margin %</TableHead>
                  <TableHead className="text-xs text-right">Rebate $</TableHead>
                  <TableHead className="text-xs text-center">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemPagination.paginated.map((item, i) => (
                  <TableRow key={i} className={item.margin != null && item.margin < 20 ? "bg-destructive/5" : ""}>
                    <TableCell className="text-xs font-medium">
                      <NameCellContent name={item.name} margin={item.margin} reasons={item.lowMarginReasons} />
                    </TableCell>
                    <TableCell className="text-xs text-right">{item.unitsSold}</TableCell>
                    <TableCell className="text-xs text-right">${item.netSales.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-xs text-right">${(item.avgCost?.toFixed(2)??"—")}</TableCell>
                    <TableCell className="text-xs text-right">${(item.avgPrice?.toFixed(2)??"—")}</TableCell>
                    <TableCell className="text-xs text-right font-medium">${(item.grossProfit?.toLocaleString("en-US", { minimumFractionDigits: 2 })??"—")}</TableCell>
                    <TableCell className={`text-xs text-right font-semibold ${item.margin != null && item.margin < 20 ? "text-destructive" : "text-[hsl(var(--success))]"}`}>
                      {(item.margin?.toFixed(1)??"—")}%
                    </TableCell>
                    <TableCell className="text-xs text-right text-muted-foreground">
                      {item.rebateImpact > 0 ? `$${(item.rebateImpact?.toFixed(2)??"—")}` : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">{item.margin==null?"—":<TrendIcon trend={item.trend} />}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              page={itemPagination.page} totalPages={itemPagination.totalPages} totalItems={itemPagination.totalItems}
              pageSize={itemPagination.pageSize} hasPrev={itemPagination.hasPrev} hasNext={itemPagination.hasNext}
              onPrev={itemPagination.prevPage} onNext={itemPagination.nextPage}
            />
          </>
        )}

        {viewMode === "category" && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs text-right">Items</TableHead>
                  <TableHead className="text-xs text-right">Units Sold</TableHead>
                  <TableHead className="text-xs text-right">Net Sales $</TableHead>
                  <TableHead className="text-xs text-right">COGS $</TableHead>
                  <TableHead className="text-xs text-right">Gross Profit $</TableHead>
                  <TableHead className="text-xs text-right">Margin %</TableHead>
                  <TableHead className="text-xs text-right">Rebate $</TableHead>
                  <TableHead className="text-xs text-center">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {catPagination.paginated.map((cat, i) => (
                  <TableRow key={i} className={cat.margin != null && cat.margin < 20 ? "bg-destructive/5" : ""}>
                    <TableCell className="text-xs font-medium">
                      <NameCellContent name={cat.name} margin={cat.margin} reasons={cat.lowMarginReasons} />
                    </TableCell>
                    <TableCell className="text-xs text-right text-muted-foreground">{cat.itemCount}</TableCell>
                    <TableCell className="text-xs text-right">{(cat.unitsSold?.toLocaleString()??"—")}</TableCell>
                    <TableCell className="text-xs text-right">${cat.netSales.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-xs text-right text-muted-foreground">${(cat.cogs?.toLocaleString("en-US", { minimumFractionDigits: 2 })??"—")}</TableCell>
                    <TableCell className="text-xs text-right font-medium">${(cat.grossProfit?.toLocaleString("en-US", { minimumFractionDigits: 2 })??"—")}</TableCell>
                    <TableCell className={`text-xs text-right font-semibold ${cat.margin != null && cat.margin < 20 ? "text-destructive" : "text-[hsl(var(--success))]"}`}>
                      {(cat.margin?.toFixed(1)??"—")}%
                    </TableCell>
                    <TableCell className="text-xs text-right text-muted-foreground">
                      {cat.rebateImpact > 0 ? `$${(cat.rebateImpact?.toFixed(2)??"—")}` : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">{cat.margin==null?"—":<TrendIcon trend={cat.trend} />}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              page={catPagination.page} totalPages={catPagination.totalPages} totalItems={catPagination.totalItems}
              pageSize={catPagination.pageSize} hasPrev={catPagination.hasPrev} hasNext={catPagination.hasNext}
              onPrev={catPagination.prevPage} onNext={catPagination.nextPage}
            />
          </>
        )}
      </div>
    </div>
  );
};
