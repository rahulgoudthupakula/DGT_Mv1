import {usePurchaseReports} from './usePurchaseReports';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  PurchaseInvoiceSummaryTable,
  type PurchaseInvoice,
} from "./PurchaseInvoiceSummaryTable";



const mockAdjustment = 0;

const fmt = (n: number) =>
  `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const fmtSigned = (n: number) =>
  `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export const PurchaseInvoiceReport = ({storeId}:{storeId:string}) => {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const query=usePurchaseReports(storeId,startDate,endDate);
  const mockData=query.data?.invoices??[];

  const totals = mockData.reduce(
    (acc, row) => ({
      netPurchase: acc.netPurchase + row.netPurchase,
      rebateAmount: acc.rebateAmount + (row.rebateAmount??0),
      pendingAmount: acc.pendingAmount + (row.pendingAmount??0),
    }),
    { netPurchase: 0, rebateAmount: 0, pendingAmount: 0 }
  );

  const totalAfterAdj = totals.netPurchase + mockAdjustment;

  return (
    <div className="space-y-5">
      {query.isPending&&<p>Loading approved purchases…</p>}{query.error&&<p role="alert" className="text-destructive">{String(query.error)}</p>}
      <p className="text-xs text-muted-foreground">Approved grocery invoices only. Payment splits, earned rebates and unallocated adjustments show — where unavailable.</p>
      {/* Date filter */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal h-9 text-xs w-[160px]",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                  {startDate ? format(startDate, "MM/dd/yyyy") : "From date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal h-9 text-xs w-[160px]",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                  {endDate ? format(endDate, "MM/dd/yyyy") : "To date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Badge variant="secondary" className="text-[10px] gap-1">
              <FileText className="h-3 w-3" />
              {mockData.length} invoices
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Summary Table */}
      <Card>
        <CardContent className="pt-5">
          <PurchaseInvoiceSummaryTable data={mockData} />
        </CardContent>
      </Card>

      {/* Bottom summary */}
      <div className="flex items-center gap-6 rounded-md border px-4 py-3">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Adjustment</p>
          <p className={cn("text-sm font-bold", mockAdjustment < 0 ? "text-destructive" : "text-[hsl(var(--success))]")}>
            —
          </p>
        </div>
        <Separator orientation="vertical" className="h-8" />
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Net Purchase After Adjustment</p>
          <p className={cn("text-sm font-bold", totalAfterAdj >= 0 ? "text-[hsl(var(--success))]" : "text-destructive")}>
            —
          </p>
        </div>
        <Separator orientation="vertical" className="h-8" />
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Rebates Earned</p>
          <p className="text-sm font-bold text-[hsl(var(--success))]">—</p>
        </div>
        <Separator orientation="vertical" className="h-8" />
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Pending</p>
          <p className="text-sm font-bold text-[hsl(var(--warning))]">{mockData.some(r=>r.pendingAmount===null)?'—':fmt(totals.pendingAmount)}</p>
        </div>
      </div>
    </div>
  );
};
