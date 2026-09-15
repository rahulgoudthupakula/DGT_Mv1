import {useTenderReport} from "./useTenderReport";
import {fmt,sumMoney,exportTenderReport,type BatchRow} from "./tenderReportData";
import {SettlementDetails} from "./TenderReportDetails";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Search, CreditCard, X } from "lucide-react";


const statusColor = (s: string) => s === "Reconciled" ? "default" : s === "Settled" ? "secondary" : "outline";

export const CreditCardBatchLogReport = ({storeId}:{storeId:string}) => {
  const report=useTenderReport(storeId,"card",false);
  const [processor, setProcessor] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedRow, setSelectedRow] = useState<BatchRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(()=>{setDrawerOpen(false);setSelectedRow(null);},[report.data]);

  const hasActiveFilters = processor !== "all" || status !== "all" || search !== "";
  const clearFilters = () => { setProcessor("all"); setStatus("all"); setSearch(""); };

  const filtered = report.rows.filter((r) => {
    if (processor !== "all" && r.groupId !== processor) return false;
    if (status !== "all" && r.status.toLowerCase() !== status) return false;
    if (search && !r.batchId.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalSales = sumMoney(filtered.map(r=>r.salesAmount));
  const totalRefunds = sumMoney(filtered.map(r=>r.refunds));
  const totalFees = sumMoney(filtered.map(r=>r.fees));
  const totalNet = sumMoney(filtered.map(r=>r.netDeposit??0));


  return (
    <div className="space-y-5">
      {/* Filters */}
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
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="settled">Settled</SelectItem>
                <SelectItem value="reconciled">Reconciled</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Batch ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-7 h-8 w-[150px] text-xs" />
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-muted-foreground" onClick={clearFilters}>
                <X className="h-3.5 w-3.5" />Clear filters
              </Button>
            )}
            <div className="ml-auto">
              <Button disabled={report.loading} onClick={()=>exportTenderReport("CreditCardBatchLogReport-"+report.data?.end,[["Date", "date"], ["Batch ID", "batchId"], ["Processor", "processor"], ["Gross Sales", "salesAmount"], ["Refunds", "refunds"], ["Net Sales", "netAmount"], ["Transactions", "transactionCount"], ["Fees", "fees"], ["Estimated Fee", "estimatedFee"], ["Processor Amount", "processorAmount"], ["Adjustment", "adjustment"], ["Chargebacks", "chargebacks"], ["Statement Discount", "statementDiscount"], ["Expected Net", "expectedNet"], ["Net Deposit", "netDeposit"], ["Settlement Date", "settlementDate"], ["Settlement Reference", "settlementReference"], ["Status", "status"]],filtered)} variant="outline" size="sm" className="h-8 text-xs"><Download className="h-3.5 w-3.5 mr-1" />Export</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {report.notice}


      {/* Summary Cards */}
      {!report.loading && <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Sales", value: fmt(totalSales), icon: CreditCard },
          { label: "Total Refunds", value: fmt(totalRefunds) },
          { label: "Total Fees", value: fmt(totalFees) },
          { label: "Net Deposit", value: fmt(totalNet) },
        ].map((c, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-lg font-bold mt-1">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Batch ID</TableHead>
                <TableHead className="text-xs">Processor</TableHead>
                <TableHead className="text-xs text-right">Sales $</TableHead>
                <TableHead className="text-xs text-right">Refunds $</TableHead>
                <TableHead className="text-xs text-right">Net Amount $</TableHead>
                <TableHead className="text-xs text-right">Fees $</TableHead>
                <TableHead className="text-xs text-right">Net Deposit $</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!filtered.length&&<TableRow><TableCell colSpan={10} className="text-xs text-muted-foreground">No batches match these filters.</TableCell></TableRow>}
              {filtered.map((row, i) => (
                <TableRow key={i} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedRow(row); setDrawerOpen(true); }}>
                  <TableCell className="text-xs">{row.date}</TableCell>
                  <TableCell className="text-xs font-medium">{row.batchId}</TableCell>
                  <TableCell className="text-xs">{row.processor}</TableCell>
                  <TableCell className="text-xs text-right">{fmt(row.salesAmount)}</TableCell>
                  <TableCell className="text-xs text-right">{fmt(row.refunds)}</TableCell>
                  <TableCell className="text-xs text-right">{fmt(row.netAmount)}</TableCell>
                  <TableCell className="text-xs text-right">{fmt(row.fees)}</TableCell>
                  <TableCell className="text-xs text-right font-semibold">{fmt(row.netDeposit)}</TableCell>
                  <TableCell><Badge variant={statusColor(row.status)} className="text-[10px]">{row.status}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="sm" className="h-6 text-[10px]">View</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Drawer */}
      </>}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[420px] sm:max-w-[420px] overflow-y-auto">
          <SheetHeader><SheetTitle className="text-base">Batch Details — {selectedRow?.batchId}</SheetTitle></SheetHeader>
          {selectedRow && (
            <SettlementDetails row={selectedRow}/>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
