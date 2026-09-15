import {useTenderReport} from "./useTenderReport";
import {fmt,sumMoney,exportTenderReport,type BalanceRow} from "./tenderReportData";
import {BalanceDetails} from "./TenderReportDetails";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, X } from "lucide-react";


export const CreditCardBalanceReport = ({storeId}:{storeId:string}) => {
  const report=useTenderReport(storeId,"card",true);
  const [processor, setProcessor] = useState("all");
  const [selectedRow, setSelectedRow] = useState<BalanceRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(()=>{setDrawerOpen(false);setSelectedRow(null);},[report.data]);

  const hasActiveFilters = processor !== "all";
  const clearFilters = () => { setProcessor("all"); };

  const filtered = report.balances.filter((r) => {
    if (processor !== "all" && r.groupId !== processor) return false;
    return true;
  });

  const totalSales = sumMoney(filtered.map(r=>r.totalSales));
  const totalFees = sumMoney(filtered.map(r=>r.totalFees));
  const totalDeposited = sumMoney(filtered.map(r=>r.totalDeposited));
  const totalPending = sumMoney(filtered.map(r=>r.pendingDeposit));

  return (
    <div className="space-y-5">
      <Card className="sticky top-0 z-10 shadow-sm">
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap items-center gap-3">
            {report.controls}
            <Select value={processor} onValueChange={setProcessor}>
              <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Processor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Processors</SelectItem>
                {Array.from(new Map(report.rows.map(r=>[r.groupId,r.processor]))).map(([id,label])=><SelectItem key={id} value={id}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-muted-foreground" onClick={clearFilters}>
                <X className="h-3.5 w-3.5" />Clear filters
              </Button>
            )}
            <div className="ml-auto">
              <Button disabled={report.loading} onClick={()=>exportTenderReport("CreditCardBalanceReport-"+report.data?.end,[["Processor", "processor"], ["Batches", "totalBatches"], ["Net Sales", "totalSales"], ["Fees", "totalFees"], ["Adjustment", "adjustment"], ["Chargebacks", "chargebacks"], ["Statement Discount", "statementDiscount"], ["Processor Difference", "processorDifference"], ["Expected Net", "expectedNet"], ["Deposited", "totalDeposited"], ["Pending", "pendingDeposit"], ["Variance (Received - Expected)", "variance"], ["Contains Estimated Fees", "estimatedFees"]],filtered)} variant="outline" size="sm" className="h-8 text-xs"><Download className="h-3.5 w-3.5 mr-1" />Export</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {report.notice}


      {!report.loading && <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Sales", value: fmt(totalSales) },
          { label: "Total Fees", value: fmt(totalFees) },
          { label: "Total Deposited", value: fmt(totalDeposited) },
          { label: "Pending Deposit", value: fmt(totalPending) },
        ].map((c, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-lg font-bold mt-1">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Processor</TableHead>
                <TableHead className="text-xs text-right">Batches</TableHead>
                <TableHead className="text-xs text-right">Total Sales $</TableHead>
                <TableHead className="text-xs text-right">Fees $</TableHead>
                <TableHead className="text-xs text-right">Deposited $</TableHead>
                <TableHead className="text-xs text-right">Pending $</TableHead>
                <TableHead className="text-xs text-right">Variance $</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!filtered.length&&<TableRow><TableCell colSpan={10} className="text-xs text-muted-foreground">No batches match these filters.</TableCell></TableRow>}
              {filtered.map((row, i) => (
                <TableRow key={i} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedRow(row); setDrawerOpen(true); }}>
                  <TableCell className="text-xs font-medium">{row.processor}</TableCell>
                  <TableCell className="text-xs text-right">{row.totalBatches}</TableCell>
                  <TableCell className="text-xs text-right">{fmt(row.totalSales)}</TableCell>
                  <TableCell className="text-xs text-right">{fmt(row.totalFees)}</TableCell>
                  <TableCell className="text-xs text-right">{fmt(row.totalDeposited)}</TableCell>
                  <TableCell className="text-xs text-right">{fmt(row.pendingDeposit)}</TableCell>
                  <TableCell className="text-xs text-right">{fmt(row.variance)}</TableCell>
                  <TableCell><Button variant="ghost" size="sm" className="h-6 text-[10px]">View</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      </>}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[420px] sm:max-w-[420px] overflow-y-auto">
          <SheetHeader><SheetTitle className="text-base">{selectedRow?.processor} — Balance Details</SheetTitle></SheetHeader>
          {selectedRow && (
            <BalanceDetails row={selectedRow}/>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
