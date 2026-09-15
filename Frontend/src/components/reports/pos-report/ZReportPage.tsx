import {type PosReport,exportReportTable} from "./posReportData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Printer, Download, FileSpreadsheet, Receipt,
} from "lucide-react";
import { format } from "date-fns";

const fmt = (n: number|null) => n==null?"—":
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const galFmt = (n: number|null) => n==null?"—":
  n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const ZReportPage = ({data}:{data:PosReport}) => {
 const c=data.closing,source=c.source??{},fields=source.closingDetails?.fields??{},breakdown=source.breakdown??{};
 const reportMeta={zNumber:'—',posBatchId:data.closingMeta.id??'—',closedBy:c.status==='CLOSED'?(data.closingMeta.reviewer?`User ID ${data.closingMeta.reviewer}`:'—'):'—',closedTime:'—',register:'All store registers',status:c.status==='CLOSED'?'Closed':c.status==='DRAFT'?'Draft':'Open'};
 const deliLines=data.rows.filter(r=>r.date===data.end&&r.department.trim().toLowerCase()==='deli');
 const deli=c.status==='CLOSED'?(fields['Deli Sales']??null):deliLines.reduce((s,r)=>s+r.direction*(r.gross-r.discount),0);
 const merchandiseSales=[{label:'Grocery Taxable',value:fields['Grocery – Tax']??null},{label:'Grocery Non-Tax',value:fields['Grocery – NonTax']??null},{label:'Cigarette Packs',value:fields['Cigarette Pack']??null},{label:'Cigarette Cartons',value:fields['Cigarette Carton']??null},{label:'Deli',value:deli}];
 const merchandiseTotal=breakdown.taxable==null||breakdown.nonTaxable==null?null:breakdown.taxable+breakdown.nonTaxable;
 merchandiseSales.push({label:'Other merchandise',value:merchandiseTotal==null||merchandiseSales.some(r=>r.value==null)?null:merchandiseTotal-merchandiseSales.reduce((s,r)=>s+r.value!,0)});
 const fuelGallons=['Regular','Plus','Super','Diesel'].map(grade=>({grade,value:fields[grade+' Volume']??null}));
 const fuelAmounts=['Regular','Plus','Super','Diesel'].map(grade=>({grade,value:fields[grade+' Amount Sold']??null}));
 const lotterySales=[{label:'Lottery sales',value:breakdown.lottery??null}];
 const tenderSummary=(source.tenders??[]).map((r:any)=>({label:r.name,value:r.amount}));
 const taxSummary=[{label:'Recorded sales tax',value:source.stats?.tax??null}];
 const cashControl={openingCash:c.openingCash,expectedCash:c.expectedCash,closingCash:c.actualCash};
 const batchControl: {processor:string;total:number;settlementId:string;status:string}[]=[];
 const sum=(rows:{value:number|null}[])=>rows.some(r=>r.value==null)?null:rows.reduce((s,r)=>s+r.value!,0);
 const totalMerch=merchandiseTotal,totalGallons=sum(fuelGallons),totalFuelAmt=sum(fuelAmounts),totalLottery=sum(lotterySales),totalTender=sum(tenderSummary),totalTax=sum(taxSummary),shortOver=c.cashVariance;
  return (
    <div className="space-y-5 max-w-5xl mx-auto print:max-w-none">
      {/* ── 1) Header ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-10 bg-background py-3 -mt-3 print:static">
        <div className="flex items-center gap-3 flex-wrap">
          <Receipt className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Z Report</h1>
          <Badge variant={reportMeta.status === "Closed" ? "default" : "secondary"}>
            {reportMeta.status}
          </Badge>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button onClick={()=>window.print()} variant="outline" size="sm" className="gap-1.5"><Printer className="h-3.5 w-3.5" />Print</Button>
          <Button onClick={()=>window.print()} title="Choose Save as PDF in the print dialog" variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" />PDF</Button>
          <Button onClick={e=>exportReportTable(e.currentTarget)} variant="outline" size="sm" className="gap-1.5"><FileSpreadsheet className="h-3.5 w-3.5" />CSV</Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">Business date: {data.end}. {c.status==='CLOSED'?'Saved daily-closing snapshot':'Open/draft daily-closing view'}{c.isSample?' · Sample closing data':''}. This is not a POS-issued Z report; Z number, close timestamp and processor batch linkage are unavailable.</p>
      {c.status==='CLOSED'&&deli==null&&<p className="text-sm text-muted-foreground">This saved closing does not contain a separate Deli breakdown; the merchandise total remains the saved total.</p>}
      {(source.closingDetails?.warnings??[]).map((warning:string)=><p key={warning} className="text-sm text-muted-foreground">{warning}</p>)}
      {/* ── 2) Info Strip ─────────────────────────── */}
      <Card>
        <CardContent className="py-3 px-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
            {[
              ["Z #", reportMeta.zNumber],
              ["Batch/Close ID", reportMeta.posBatchId],
              ["Closed By", reportMeta.closedBy],
              ["Closed Time", reportMeta.closedTime],
              ["Register", reportMeta.register],
            ].map(([lbl, val]) => (
              <div key={lbl}>
                <p className="text-muted-foreground text-xs">{lbl}</p>
                <p className="font-medium">{val}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── 3) Main 2-column layout ───────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* LEFT — Sales */}
        <div className="space-y-5">
          {/* A) Merchandise Sales */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">A) Merchandise Sales</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {merchandiseSales.map((r) => (
                    <TableRow key={r.label}>
                      <TableCell>{r.label}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-semibold">Total Merchandise</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{fmt(totalMerch)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          {/* B) Fuel Sales */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">B) Fuel Sales</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-0">
              {/* Gallons */}
              <div className="px-4 pt-2 pb-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Gallons by Grade</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grade</TableHead>
                    <TableHead className="text-right">Gallons</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fuelGallons.map((r) => (
                    <TableRow key={r.grade}>
                      <TableCell>{r.grade}</TableCell>
                      <TableCell className="text-right tabular-nums">{galFmt(r.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-semibold">Total</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{galFmt(totalGallons)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>

              <Separator />

              {/* Amounts */}
              <div className="px-4 pt-2 pb-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Amount by Grade</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grade</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fuelAmounts.map((r) => (
                    <TableRow key={r.grade}>
                      <TableCell>{r.grade}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-semibold">Total</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{fmt(totalFuelAmt)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          {/* C) Lottery Sales */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">C) Lottery Sales</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lotterySales.map((r) => (
                    <TableRow key={r.label}>
                      <TableCell>{r.label}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-semibold">Total Lottery</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{fmt(totalLottery)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — Tenders & Taxes */}
        <div className="space-y-5">
          {/* D) Tender Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">D) Tender Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tender Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenderSummary.map((r) => (
                    <TableRow key={r.label}>
                      <TableCell>{r.label}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-semibold">Total Tenders</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{fmt(totalTender)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          {/* E) Tax Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">E) Tax Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tax / Fee</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxSummary.map((r) => (
                    <TableRow key={r.label}>
                      <TableCell>{r.label}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-semibold">Total Taxes</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{fmt(totalTax)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── 4) Cash Control ───────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Variance / Cash Control</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Opening Cash</p>
              <p className="text-lg font-semibold tabular-nums">{fmt(cashControl.openingCash)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expected Cash</p>
              <p className="text-lg font-semibold tabular-nums">{fmt(cashControl.expectedCash)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Closing Cash (Counted)</p>
              <p className="text-lg font-semibold tabular-nums">{fmt(cashControl.closingCash)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Short / Over</p>
              <p className={`text-2xl font-bold tabular-nums ${shortOver == null ? "text-muted-foreground" : shortOver >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                {shortOver != null && shortOver >= 0 ? "+" : ""}{fmt(shortOver)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 5) Batch Control ──────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Batch Control</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Processor</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Settlement ID</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batchControl.length===0&&<TableRow><TableCell colSpan={4}>Processor settlements are not linked to this daily closing.</TableCell></TableRow>}
              {batchControl.map((b) => (
                <TableRow key={b.settlementId}>
                  <TableCell>{b.processor}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(b.total)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">{b.settlementId}</TableCell>
                  <TableCell>
                    <Badge variant={b.status === "Settled" ? "default" : "secondary"} className="text-xs">
                      {b.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {batchControl.some((b) => b.status === "Pending") && (
            <div className="px-4 py-2 bg-accent/50 text-xs text-accent-foreground flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent-foreground/60 animate-pulse" />
              Pending batches detected — settlement not yet confirmed
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 6) Footer ─────────────────────────────── */}
      <div className="border-t pt-4 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
        <div className="space-y-0.5">
          <p>System generated: {format(new Date(), "MMM d, yyyy h:mm a")}</p>
          <p>Data source: store daily-closing records and saved sales snapshot.</p>
        </div>
        <div className="text-right print:block hidden">
          <p className="mt-6 border-t border-foreground/30 pt-1 w-48 ml-auto">Authorized Signature</p>
        </div>
      </div>
    </div>
  );
};
