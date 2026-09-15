import { useState } from "react";
import {useQuery} from "@tanstack/react-query";
import {request} from "@/lib/backend";
import {Input} from "@/components/ui/input";
import {posTables,exportReportTable,type PosReport} from "./posReportData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from "@/components/ui/table";
import {
  Receipt, BarChart3, Fuel, ShoppingCart, Clock, CreditCard,
  FileText, TrendingUp, History, PenLine, CalendarIcon, Printer,
  Download, FileSpreadsheet, Filter,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ZReportPage } from "./ZReportPage";

const fmt = (n: number|null) => n==null?"—":
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type PosTab =
  | "z-report"
  | "department-sales"
  | "gas-sales"
  | "item-sales"
  | "item-sales-time"
  | "fuel-credit-card"
  | "tax-sales"
  | "profit"
  | "item-history"
  | "manual-ringups";

const reportTabs = [
  { id: "z-report", label: "Z-Report", icon: Receipt },
  { id: "department-sales", label: "Department Sales", icon: BarChart3 },
  { id: "gas-sales", label: "Gas Sales", icon: Fuel },
  { id: "item-sales", label: "Item Sales", icon: ShoppingCart },
  { id: "item-sales-time", label: "Item Sales by Date/Hour", icon: Clock },
  { id: "fuel-credit-card", label: "Fuel Sales by CC", icon: CreditCard },
  { id: "tax-sales", label: "Tax Sales Report", icon: FileText },
  { id: "profit", label: "Profit", icon: TrendingUp },
  { id: "item-history", label: "Item Sales History", icon: History },
  { id: "manual-ringups", label: "Manual Ring-ups", icon: PenLine },
];

export const PosReportsHub = ({storeId}:{storeId:string}) => {
  const [activeTab, setActiveTab] = useState<PosTab>("z-report");
  const [gasSalesView, setGasSalesView] = useState("summary");
  const [profitView, setProfitView] = useState("actual");
  const [itemTimeView, setItemTimeView] = useState("by-hour");
  const [deptSalesView, setDeptSalesView] = useState("dept-summary");
  const [from,setFrom]=useState(''),[to,setTo]=useState(''),[range,setRange]=useState({from:'',to:''}),[error,setError]=useState('');
  const params=new URLSearchParams();if(range.from)params.set('start',range.from);if(range.to)params.set('end',range.to);
  const query=useQuery({queryKey:['pos-reports',storeId,range],queryFn:()=>request<PosReport>(`/access/stores/${encodeURIComponent(storeId)}/pos-reports?${params}`),enabled:!!storeId});
  const today=query.data?.today??format(new Date(),'yyyy-MM-dd');
  const data=query.data;
  const empty:PosReport={start:today,end:today,today,timezone:'UTC',rows:[],payments:[],closing:{},closingMeta:{}};
  const {deptSummaryData,deptByDateData,deptByWeekData,deptByMonthData,vatByDeptData,gasSalesSummaryData,gasSalesByDateData,gasSalesByWeekData,gasSalesByMonthData,gasSalesByHourData,itemSalesData,itemSalesByHourData,fuelByCCData,taxSalesData,profitData,itemSalesHistoryData,manualRingupData,unallocatedFuelReceipts}=posTables(data??empty,deptSalesView.startsWith('merch-'),itemTimeView,profitView==='scanned');
  const galFmt = (n:number|null) => n==null?'—':n.toLocaleString('en-US',{minimumFractionDigits:1,maximumFractionDigits:3});
  const knownSum=(rows:any[],key:string):number|null=>rows.some(r=>r[key]==null)?null:rows.reduce((s,r)=>s+r[key],0);
  const apply=(event:React.FormEvent)=>{event.preventDefault();if(!from||!to||from>to||to>today){setError('Choose From and To dates in order, ending today or earlier.');return;}setError('');setRange({from,to});};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">POS Reports</h1>

      </div>

      <form onSubmit={apply} className="flex flex-wrap items-end gap-3 print:hidden">
        <div><label htmlFor="pos-from" className="text-sm">From date</label><Input id="pos-from" type="date" max={today} value={from} onChange={e=>setFrom(e.target.value)}/></div>
        <div><label htmlFor="pos-to" className="text-sm">To date</label><Input id="pos-to" type="date" max={today} value={to} onChange={e=>setTo(e.target.value)}/></div>
        <Button type="submit">Apply</Button><Button type="button" variant="outline" onClick={()=>{setFrom('');setTo('');setRange({from:'',to:''});setError('');}}>Latest sales date</Button>
      </form>
      {error&&<p role="alert">{error}</p>}
      {query.isPending?<p>Loading POS reports…</p>:query.error?<p role="alert">{query.error.message}</p>:<>
      <p className="text-sm text-muted-foreground">{data?.start} to {data?.end} · {data?.timezone}. Sales exclude tax and subtract discounts and completed returns. Z-Report uses the ending date.</p>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PosTab)}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
          {reportTabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5"
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* 1) Z-Report */}
        <TabsContent value="z-report" className="mt-6">
          <ZReportPage data={data!} />
        </TabsContent>

        {/* 2) Department Sales */}
        <TabsContent value="department-sales" className="mt-6 space-y-4"><p className="text-sm text-muted-foreground">Discount includes all recorded discounts; promotion amounts are not separately allocated. Week view groups weekdays within the selected range.</p>
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={deptSalesView} onValueChange={setDeptSalesView}>
              <SelectTrigger className="w-[260px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dept-summary">Dept Sales Summary</SelectItem>
                <SelectItem value="dept-by-date">Dept Sales by Date</SelectItem>
                <SelectItem value="dept-by-week">Dept Sales by Week</SelectItem>
                <SelectItem value="dept-by-month">Dept Sales by Month</SelectItem>
                <SelectItem value="merch-summary">Merchandise Sales Summary</SelectItem>
                <SelectItem value="merch-by-date">Merchandise Sales by Date</SelectItem>
                <SelectItem value="merch-by-week">Merchandise Sales by Week</SelectItem>
                <SelectItem value="merch-by-month">Merchandise Sales by Month</SelectItem>
                <SelectItem value="vat-by-dept">VAT by Department</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card data-pos-card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">
                {deptSalesView === "dept-summary" ? "Department Sales — Summary" :
                 deptSalesView === "dept-by-date" ? "Department Sales — By Date" :
                 deptSalesView === "dept-by-week" ? "Department Sales — By Week" :
                 deptSalesView === "dept-by-month" ? "Department Sales — By Month" :
                 deptSalesView === "merch-summary" ? "Merchandise Sales — Summary" :
                 deptSalesView === "merch-by-date" ? "Merchandise Sales — By Date" :
                 deptSalesView === "merch-by-week" ? "Merchandise Sales — By Week" :
                 deptSalesView === "merch-by-month" ? "Merchandise Sales — By Month" :
                 "VAT by Department"}
              </CardTitle>
              <div className="flex gap-2">
                <Button onClick={()=>window.print()} variant="outline" size="sm" className="gap-1.5"><Printer className="h-3.5 w-3.5" />Print</Button>
                <Button onClick={e=>exportReportTable(e.currentTarget)} variant="outline" size="sm" className="gap-1.5"><FileSpreadsheet className="h-3.5 w-3.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Summary tables (dept-summary & merch-summary) */}
              {(deptSalesView === "dept-summary" || deptSalesView === "merch-summary") && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Gross Sales</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead className="text-right">Promotions</TableHead>
                      <TableHead className="text-right">Refund</TableHead>
                      <TableHead className="text-right">Net Sales</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deptSummaryData.map((r) => (
                      <TableRow key={r.dept}>
                        <TableCell className="font-medium">{r.dept}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.gross)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.discount)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.promotions)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.refund)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.net)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-semibold">Total</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{fmt(deptSummaryData.reduce((a, b) => a + b.gross, 0))}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{fmt(deptSummaryData.reduce((a, b) => a + b.discount, 0))}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{fmt(knownSum(deptSummaryData,"promotions"))}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{fmt(deptSummaryData.reduce((a, b) => a + b.refund, 0))}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{fmt(deptSummaryData.reduce((a, b) => a + b.net, 0))}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              )}

              {/* By Date tables (dept-by-date & merch-by-date) */}
              {(deptSalesView === "dept-by-date" || deptSalesView === "merch-by-date") && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Qty Sold</TableHead>
                      <TableHead className="text-right">Sales ($)</TableHead>
                      <TableHead className="text-right">Total ($)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deptByDateData.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.date}</TableCell>
                        <TableCell>{r.day}</TableCell>
                        <TableCell className="font-medium">{r.dept}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.qty}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.sales)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* By Week tables (dept-by-week & merch-by-week) */}
              {(deptSalesView === "dept-by-week" || deptSalesView === "merch-by-week") && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Qty Sold</TableHead>
                      <TableHead className="text-right">Sales ($)</TableHead>
                      <TableHead className="text-right">Total ($)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deptByWeekData.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.day}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.count}</TableCell>
                        <TableCell className="font-medium">{r.dept}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.qty}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.sales)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* By Month tables (dept-by-month & merch-by-month) */}
              {(deptSalesView === "dept-by-month" || deptSalesView === "merch-by-month") && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Year</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Qty Sold</TableHead>
                      <TableHead className="text-right">Sales ($)</TableHead>
                      <TableHead className="text-right">Total ($)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deptByMonthData.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.month}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.year}</TableCell>
                        <TableCell className="font-medium">{r.dept}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.qty}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.sales)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* VAT by Department */}
              {deptSalesView === "vat-by-dept" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Taxable Sales</TableHead>
                      <TableHead className="text-right">Non-Taxable Sales</TableHead>
                      <TableHead className="text-right">Total Sales</TableHead>
                      <TableHead className="text-right">Tax Collected</TableHead>
                      <TableHead className="text-right">Taxable Ex. VAT</TableHead>
                      <TableHead className="text-right">Total Ex. Tax</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                      <TableHead className="text-right">Gross Profit</TableHead>
                      <TableHead className="text-right">Profit Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vatByDeptData.map((r) => (
                      <TableRow key={r.dept}>
                        <TableCell className="font-medium">{r.dept}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.taxableSales)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.nonTaxableSales)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.totalSales)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.taxCollected)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.taxableSalesExVat)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.totalSalesExTax)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.totalCost)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.grossProfit)}</TableCell>
                        <TableCell className="text-right tabular-nums">{(r.profitMargin?.toFixed(2)??"—")}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3) Gas Sales */}
        <TabsContent value="gas-sales" className="mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={gasSalesView} onValueChange={setGasSalesView}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Gas Sales Summary</SelectItem>
                <SelectItem value="by-date">By Date</SelectItem>
                <SelectItem value="by-week">By Day of Week</SelectItem>
                <SelectItem value="by-month">By Month</SelectItem>
                <SelectItem value="by-hour">By Hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card data-pos-card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">
                Gas Sales — {gasSalesView === "summary" ? "Summary" : gasSalesView === "by-week" ? "By Day of Week" : gasSalesView.replace("by-", "By ").replace(/\b\w/g, l => l.toUpperCase())}
              </CardTitle>
              <div className="flex gap-2">
                <Button onClick={()=>window.print()} variant="outline" size="sm" className="gap-1.5"><Printer className="h-3.5 w-3.5" />Print</Button>
                <Button onClick={e=>exportReportTable(e.currentTarget)} variant="outline" size="sm" className="gap-1.5"><FileSpreadsheet className="h-3.5 w-3.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Summary */}
              {gasSalesView === "summary" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grade Name</TableHead>
                      <TableHead>Grade ID</TableHead>
                      <TableHead className="text-right">Gallons</TableHead>
                      <TableHead className="text-right">Gross Amount</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead className="text-right">Net Amount</TableHead>
                      <TableHead className="text-right">Avg Sales Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gasSalesSummaryData.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.grade}</TableCell>
                        <TableCell>{r.gradeId}</TableCell>
                        <TableCell className="text-right tabular-nums">{galFmt(r.gallons)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.gross)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.discount)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.net)}</TableCell>
                        <TableCell className="text-right tabular-nums">${(r.avgPrice?.toFixed(3)??"—")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-semibold">Total</TableCell>
                      <TableCell />
                      <TableCell className="text-right font-semibold tabular-nums">{galFmt(knownSum(gasSalesSummaryData,"gallons"))}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{fmt(gasSalesSummaryData.reduce((a, b) => a + b.gross, 0))}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{fmt(gasSalesSummaryData.reduce((a, b) => a + b.discount, 0))}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{fmt(gasSalesSummaryData.reduce((a, b) => a + b.net, 0))}</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableFooter>
                </Table>
              )}

              {/* By Date — per grade: volume, gross, discount, net */}
              {gasSalesView === "by-date" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead className="text-right">Volume</TableHead>
                      <TableHead className="text-right">Gross Amount</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead className="text-right">Net Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gasSalesByDateData.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.date}</TableCell>
                        <TableCell>{r.day}</TableCell>
                        <TableCell className="font-medium">{r.grade}</TableCell>
                        <TableCell className="text-right tabular-nums">{galFmt(r.volume)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.gross)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.discount)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.net)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3} className="font-semibold">Total</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{galFmt(knownSum(gasSalesByDateData,"volume"))}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{fmt(gasSalesByDateData.reduce((a, b) => a + b.gross, 0))}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{fmt(gasSalesByDateData.reduce((a, b) => a + b.discount, 0))}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{fmt(gasSalesByDateData.reduce((a, b) => a + b.net, 0))}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              )}

              {/* By Day of Week — per grade: volume, gross, discount, net */}
              {gasSalesView === "by-week" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead className="text-right">Volume</TableHead>
                      <TableHead className="text-right">Gross Amount</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead className="text-right">Net Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gasSalesByWeekData.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.day}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.count}</TableCell>
                        <TableCell className="font-medium">{r.grade}</TableCell>
                        <TableCell className="text-right tabular-nums">{galFmt(r.volume)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.gross)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.discount)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.net)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3} className="font-semibold">Total</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{galFmt(knownSum(gasSalesByWeekData,"volume"))}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{fmt(gasSalesByWeekData.reduce((a, b) => a + b.gross, 0))}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{fmt(gasSalesByWeekData.reduce((a, b) => a + b.discount, 0))}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{fmt(gasSalesByWeekData.reduce((a, b) => a + b.net, 0))}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              )}

              {/* By Month — per grade: volume, gross, discount, net */}
              {gasSalesView === "by-month" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Year</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead className="text-right">Volume</TableHead>
                      <TableHead className="text-right">Gross Amount</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead className="text-right">Net Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gasSalesByMonthData.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.month}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.year}</TableCell>
                        <TableCell className="font-medium">{r.grade}</TableCell>
                        <TableCell className="text-right tabular-nums">{galFmt(r.volume)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.gross)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.discount)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.net)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3} className="font-semibold">Total</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{galFmt(knownSum(gasSalesByMonthData,"volume"))}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{fmt(gasSalesByMonthData.reduce((a, b) => a + b.gross, 0))}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{fmt(gasSalesByMonthData.reduce((a, b) => a + b.discount, 0))}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{fmt(gasSalesByMonthData.reduce((a, b) => a + b.net, 0))}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              )}

              {/* By Hour */}
              {gasSalesView === "by-hour" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hour of Day</TableHead>
                      <TableHead className="text-right">No. of Days</TableHead>
                      <TableHead className="text-right">Txn Count</TableHead>
                      <TableHead className="text-right">Total Gallons</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Avg $/Gal</TableHead>
                      <TableHead className="text-right">Avg Sales</TableHead>
                      <TableHead className="text-right">Avg Ticket</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gasSalesByHourData.map((r) => (
                      <TableRow key={r.hour}>
                        <TableCell className="font-medium">{r.hour}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.days}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.txns}</TableCell>
                        <TableCell className="text-right tabular-nums">{galFmt(r.gallons)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.amount)}</TableCell>
                        <TableCell className="text-right tabular-nums">${(r.avgPerGal?.toFixed(3)??"—")}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.avgSales)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(r.avgTicket)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-semibold">Total</TableCell>
                      <TableCell />
                      <TableCell className="text-right font-semibold tabular-nums">{gasSalesByHourData.reduce((a, b) => a + b.txns, 0)}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{galFmt(knownSum(gasSalesByHourData,"gallons"))}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{fmt(gasSalesByHourData.reduce((a, b) => a + b.amount, 0))}</TableCell>
                      <TableCell colSpan={3} />
                    </TableRow>
                  </TableFooter>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4) Item Sales */}
        <TabsContent value="item-sales" className="mt-6">
          <Card data-pos-card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Item Sales</CardTitle>
              <div className="flex gap-2">
                <Button onClick={()=>window.print()} variant="outline" size="sm" className="gap-1.5"><Printer className="h-3.5 w-3.5" />Print</Button>
                <Button onClick={e=>exportReportTable(e.currentTarget)} variant="outline" size="sm" className="gap-1.5"><FileSpreadsheet className="h-3.5 w-3.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>UPC</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">Avg Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemSalesData.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.upc}</TableCell>
                      <TableCell className="font-medium">{r.desc}</TableCell>
                      <TableCell>{r.dept}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.qty}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.sales)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.avgPrice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="font-semibold">Total</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {itemSalesData.reduce((a, b) => a + b.qty, 0)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {fmt(itemSalesData.reduce((a, b) => a + b.sales, 0))}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5) Item Sales by Date / Hour */}
        <TabsContent value="item-sales-time" className="mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={itemTimeView} onValueChange={setItemTimeView}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="by-date">By Date</SelectItem>
                <SelectItem value="by-hour">By Hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card data-pos-card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">
                Item Sales — {itemTimeView === "by-hour" ? "By Hour" : "By Date"}
              </CardTitle>
              <div className="flex gap-2">
                <Button onClick={()=>window.print()} variant="outline" size="sm" className="gap-1.5"><Printer className="h-3.5 w-3.5" />Print</Button>
                <Button onClick={e=>exportReportTable(e.currentTarget)} variant="outline" size="sm" className="gap-1.5"><FileSpreadsheet className="h-3.5 w-3.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{itemTimeView === "by-hour" ? "Hour" : "Date"}</TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                    <TableHead className="text-right">Items Sold</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemSalesByHourData.map((r) => (
                    <TableRow key={r.hour}>
                      <TableCell className="font-medium">{r.hour}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.txns}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.items}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.sales)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-semibold">Total</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {itemSalesByHourData.reduce((a, b) => a + b.txns, 0)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {itemSalesByHourData.reduce((a, b) => a + b.items, 0)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {fmt(itemSalesByHourData.reduce((a, b) => a + b.sales, 0))}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6) Fuel Sales by Credit Card */}
        <TabsContent value="fuel-credit-card" className="mt-6"><p className="text-sm text-muted-foreground">Fuel line sales attributed only to a single tender/brand. Split or missing tender allocation excludes {unallocatedFuelReceipts} fuel receipts; amounts exclude tax.</p>
          <Card data-pos-card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Fuel Sales by Credit Card</CardTitle>
              <div className="flex gap-2">
                <Button onClick={()=>window.print()} variant="outline" size="sm" className="gap-1.5"><Printer className="h-3.5 w-3.5" />Print</Button>
                <Button onClick={e=>exportReportTable(e.currentTarget)} variant="outline" size="sm" className="gap-1.5"><FileSpreadsheet className="h-3.5 w-3.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Card Type</TableHead>
                    <TableHead className="text-right">Gallons</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Txns</TableHead>
                    <TableHead className="text-right">Avg Txn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fuelByCCData.map((r) => (
                    <TableRow key={r.card}>
                      <TableCell className="font-medium">{r.card}</TableCell>
                      <TableCell className="text-right tabular-nums">{galFmt(r.gallons)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.amount)}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.txns}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.avgTxn)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-semibold">Total</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {galFmt(knownSum(fuelByCCData,"gallons"))}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {fmt(fuelByCCData.reduce((a, b) => a + b.amount, 0))}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {fuelByCCData.reduce((a, b) => a + b.txns, 0)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 7) Tax Sales Report */}
        <TabsContent value="tax-sales" className="mt-6"><p className="text-sm text-muted-foreground">Recorded sales tax by department; effective rate is tax collected / taxable sales. Jurisdiction and included fuel excise taxes are not recorded separately.</p>
          <Card data-pos-card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Tax Sales Report</CardTitle>
              <div className="flex gap-2">
                <Button onClick={()=>window.print()} variant="outline" size="sm" className="gap-1.5"><Printer className="h-3.5 w-3.5" />Print</Button>
                <Button onClick={e=>exportReportTable(e.currentTarget)} variant="outline" size="sm" className="gap-1.5"><FileSpreadsheet className="h-3.5 w-3.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tax Category</TableHead>
                    <TableHead className="text-right">Taxable Amount</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Tax Collected</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxSalesData.map((r) => (
                    <TableRow key={r.category}>
                      <TableCell className="font-medium">{r.category}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.taxableAmt)}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.rate}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.taxCollected)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="font-semibold">Total Tax Collected</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {fmt(taxSalesData.reduce((a, b) => a + b.taxCollected, 0))}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 8) Profit */}
        <TabsContent value="profit" className="mt-6 space-y-4"><p className="text-sm text-muted-foreground">Historical sale costs are required for profit and margins. Scanned-item identification is not recorded.</p>
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={profitView} onValueChange={setProfitView}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="actual">Profit by Actual Sales</SelectItem>
                <SelectItem value="scanned">Profit by Scanned Item</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card data-pos-card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">
                {profitView === "actual" ? "Profit by Actual Sales" : "Profit by Scanned Item"}
              </CardTitle>
              <div className="flex gap-2">
                <Button onClick={()=>window.print()} variant="outline" size="sm" className="gap-1.5"><Printer className="h-3.5 w-3.5" />Print</Button>
                <Button onClick={e=>exportReportTable(e.currentTarget)} variant="outline" size="sm" className="gap-1.5"><FileSpreadsheet className="h-3.5 w-3.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead className="text-right">Margin %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitData.map((r) => (
                    <TableRow key={r.dept}>
                      <TableCell className="font-medium">{r.dept}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.sales)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.cost)}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">{fmt(r.profit)}</TableCell>
                      <TableCell className="text-right tabular-nums">{(r.margin?.toFixed(1)??"—")}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-semibold">Total</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {profitView==='scanned'?'—':fmt(profitData.reduce((a, b) => a + b.sales, 0))}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      —
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      —
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 9) Item Sales History */}
        <TabsContent value="item-history" className="mt-6"><p className="text-sm text-muted-foreground">Selected-period quantities and latest recorded sale price. Historical cost and sale-to-vendor attribution are unavailable.</p>
          <Card data-pos-card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Item Sales History</CardTitle>
              <div className="flex gap-2">
                <Button onClick={()=>window.print()} variant="outline" size="sm" className="gap-1.5"><Printer className="h-3.5 w-3.5" />Print</Button>
                <Button onClick={e=>exportReportTable(e.currentTarget)} variant="outline" size="sm" className="gap-1.5"><FileSpreadsheet className="h-3.5 w-3.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scan Code</TableHead>
                    <TableHead>UPC</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Sales Count</TableHead>
                    <TableHead>Last Sold Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemSalesHistoryData.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{r.scanCode}</TableCell>
                      <TableCell className="font-mono text-xs">{r.upc}</TableCell>
                      <TableCell className="font-medium">{r.description}</TableCell>
                      <TableCell>{r.department}</TableCell>
                      <TableCell>{r.vendor}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.price)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.cost)}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.salesCount}</TableCell>
                      <TableCell>{r.lastSoldDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 10) Manual Ring-ups */}
        <TabsContent value="manual-ringups" className="mt-6"><p className="text-sm text-muted-foreground">Manual ring-ups cannot be identified until the POS records an explicit entry-method marker. Missing barcodes are not treated as manual sales.</p>
          <Card data-pos-card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Manual Ring-ups</CardTitle>
              <div className="flex gap-2">
                <Button onClick={()=>window.print()} variant="outline" size="sm" className="gap-1.5"><Printer className="h-3.5 w-3.5" />Print</Button>
                <Button onClick={e=>exportReportTable(e.currentTarget)} variant="outline" size="sm" className="gap-1.5"><FileSpreadsheet className="h-3.5 w-3.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Register</TableHead>
                    <TableHead>Cashier</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manualRingupData.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.time}</TableCell>
                      <TableCell>{r.register}</TableCell>
                      <TableCell className="font-medium">{r.cashier}</TableCell>
                      <TableCell>{r.dept}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.amount)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{r.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="font-semibold">Total Manual Ring-ups</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      —
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs></>}
    </div>
  );
};
