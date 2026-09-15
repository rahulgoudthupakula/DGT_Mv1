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
import { Download, Search, X } from "lucide-react";


const statusColor = (s: string) => s === "Reconciled" ? "default" : s === "Settled" ? "secondary" : "outline";

export const TenderBatchLogReport = ({storeId}:{storeId:string}) => {
  const report=useTenderReport(storeId,"tender",false);
  const [tenderType, setTenderType] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedRow, setSelectedRow] = useState<BatchRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(()=>{setDrawerOpen(false);setSelectedRow(null);},[report.data]);

  const hasActiveFilters = tenderType !== "all" || status !== "all" || search !== "";
  const clearFilters = () => { setTenderType("all"); setStatus("all"); setSearch(""); };

  const filtered = report.rows.filter((r) => {
    if (tenderType !== "all" && r.kind !== tenderType) return false;
    if (status !== "all" && r.status.toLowerCase() !== status) return false;
    if (search && !r.batchId.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalAmount = sumMoney(filtered.map(r=>r.totalAmount));
  const totalFees = sumMoney(filtered.map(r=>r.fees));
  const totalNet = sumMoney(filtered.map(r=>r.netDeposit??0));
  const totalTxns = sumMoney(filtered.map(r=>r.transactionCount));

  return (
    <div className="space-y-5">
      <Card className="sticky top-0 z-10 shadow-sm">
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap items-center gap-3">
            {report.controls}
            <Select value={tenderType} onValueChange={setTenderType}>
              <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Tender Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenders</SelectItem>
                <SelectItem value="ebt">EBT (SNAP / Cash)</SelectItem>
                <SelectItem value="fleet">Fleet Cards</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
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
              <Button disabled={report.loading} onClick={()=>exportTenderReport("TenderBatchLogReport-"+report.data?.end,[["Date", "date"], ["Batch ID", "batchId"], ["Tender Type", "tenderType"], ["Gross Sales", "salesAmount"], ["Refunds", "refunds"], ["Net Sales", "netAmount"], ["Transactions", "transactionCount"], ["Fees", "fees"], ["Estimated Fee", "estimatedFee"], ["Processor Amount", "processorAmount"], ["Adjustment", "adjustment"], ["Chargebacks", "chargebacks"], ["Statement Discount", "statementDiscount"], ["Expected Net", "expectedNet"], ["Net Deposit", "netDeposit"], ["Settlement Date", "settlementDate"], ["Settlement Reference", "settlementReference"], ["Status", "status"]],filtered)} variant="outline" size="sm" className="h-8 text-xs"><Download className="h-3.5 w-3.5 mr-1" />Export</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {report.notice}


      {!report.loading && <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Amount", value: fmt(totalAmount) },
          { label: "Total Transactions", value: String(totalTxns??0) },
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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Batch ID</TableHead>
                <TableHead className="text-xs">Tender Type</TableHead>
                <TableHead className="text-xs text-right">Txns</TableHead>
                <TableHead className="text-xs text-right">Amount $</TableHead>
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
                  <TableCell className="text-xs">{row.tenderType}</TableCell>
                  <TableCell className="text-xs text-right">{row.transactionCount}</TableCell>
                  <TableCell className="text-xs text-right">{fmt(row.totalAmount)}</TableCell>
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
