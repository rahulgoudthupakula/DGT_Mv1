import {useQuery} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import {type ClosingDay,type ClosingMeta,closingPath,exportClosing} from '../closingData';
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type View = "sales" | "collections";

export const DailySummaryReport = ({storeId,monthly=false}:{storeId:string;monthly?:boolean}) => {
  const [view, setView] = useState<View>("sales");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const meta=useQuery({queryKey:['closing-meta',storeId],queryFn:()=>request<ClosingMeta>(closingPath(storeId)+'/meta')});
  useEffect(()=>{if(meta.data){const last=meta.data.latest??meta.data.today;const date=new Date(last+'T12:00:00');setStartDate(new Date(date.getFullYear(),date.getMonth(),1));setEndDate(date);}},[meta.data?.latest,storeId]);
  const start=startDate?format(startDate,'yyyy-MM-dd'):'';const end=endDate?format(endDate,'yyyy-MM-dd'):start;
  const q=useQuery({queryKey:['closing-report',storeId,start,end],queryFn:()=>request<ClosingDay[]>(closingPath(storeId)+`?start=${start}&end=${end}`),enabled:!!start&&!!end});
  const days=q.data??[];
  const salesData=days.map(d=>({date:d.date,taxable:Number(d.source.breakdown.taxable),nonTaxable:Number(d.source.breakdown.nonTaxable),gasSales:Number(d.source.breakdown.gasSales),lottery:Number(d.source.breakdown.lottery),totalSales:Number(d.source.stats.netSales)-Number(d.source.stats.tax),tax:Number(d.source.stats.tax),zReading:Number(d.source.stats.netSales)}));
  const collectionsData=days.map(d=>{const tender=(codes:string[])=>d.source.tenders.filter(t=>codes.includes(t.code)).reduce((s,t)=>s+Number(t.amount),0);return {date:d.date,cash:tender(['CASH']),credit:tender(['CREDIT_CARD']),ebt:tender(['EBT','SNAP']),fleet:tender(['FLEET']),checks:tender(['CHECK','CHECKS']),other:d.source.tenders.filter(t=>!['CASH','CREDIT_CARD','EBT','SNAP','FLEET','CHECK','CHECKS'].includes(t.code)).reduce((s,t)=>s+Number(t.amount),0),deposits:Number(d.totalDeposits||0),variance:Number(d.variance??0),counted:d.variance!==null};});
  const totalSales = salesData.reduce((s, r) => s + r.totalSales, 0);
  const totalTax = salesData.reduce((s, r) => s + r.tax, 0);
  const avgPerDay = salesData.length?totalSales / salesData.length:0;

  const totalCollected = collectionsData.reduce((s, r) => s + r.cash + r.credit + r.ebt + r.fleet + r.checks + r.other, 0);
  const overShort = collectionsData.reduce((s, r) => s + r.variance, 0);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Choose up to 31 days. Closed days use saved totals. Total Collected includes all payment methods. Fields awaiting a source show a dash. {monthly?'The totals below summarize the selected month.':''}</p>
      {days.some(d=>d.isSample)&&<p className="text-sm text-amber-700">Sample cash activity for testing; sales and payments are recorded workbook data.</p>}
      {q.isFetching&&<p>Loading report…</p>}{q.error&&<p role="alert">{q.error.message}</p>}
      <div className="flex gap-2"><Button variant="outline" onClick={()=>window.print()}>Print</Button><Button variant="outline" disabled={!days.length} onClick={()=>exportClosing(days)}>Export</Button></div>
      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-3 flex flex-wrap items-center gap-3">
          <DatePicker label="Date From" date={startDate} onSelect={setStartDate} />
          <DatePicker label="Date To" date={endDate} onSelect={setEndDate} />
          <div className="ml-auto">
            <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as View)} className="border rounded-md">
              <ToggleGroupItem value="sales" className="text-xs px-3 h-8">Sales Summary</ToggleGroupItem>
              <ToggleGroupItem value="collections" className="text-xs px-3 h-8">Collections Summary</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-4 p-0">
          {view === "sales" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Taxable</TableHead>
                  <TableHead className="text-right">Non-Taxable</TableHead>
                  <TableHead className="text-right">Gas Sales</TableHead>
                  <TableHead className="text-right">Lottery</TableHead>
                  <TableHead className="text-right">Services</TableHead>
                  <TableHead className="text-right">Total Sales</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Z Reading</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.map((r) => (
                  <TableRow key={r.date}>
                    <TableCell className="font-medium">{r.date}</TableCell>
                    <TableCell className="text-right">${r.taxable.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${r.nonTaxable.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${r.gasSales.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${r.lottery.toFixed(2)}</TableCell>
                    <TableCell className="text-right" title="Service sales source not connected">—</TableCell>
                    <TableCell className="text-right font-semibold">${r.totalSales.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${r.tax.toFixed(2)}</TableCell>
                    <TableCell className="text-right" title="POS Z reading not connected">—</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6} className="font-semibold">Totals</TableCell>
                  <TableCell className="text-right font-bold">${totalSales.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold">${totalTax.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold">—</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">Average per Day</TableCell>
                  <TableCell className="text-right text-muted-foreground">${avgPerDay.toFixed(2)}</TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableFooter>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Cash</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">EBT</TableHead>
                  <TableHead className="text-right">Fleet</TableHead>
                  <TableHead className="text-right">Checks</TableHead>
                  <TableHead className="text-right">Deposits</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collectionsData.map((r) => (
                  <TableRow key={r.date}>
                    <TableCell className="font-medium">{r.date}</TableCell>
                    <TableCell className="text-right">${r.cash.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${r.credit.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${r.ebt.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${r.fleet.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${r.checks.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${r.deposits.toFixed(2)}</TableCell>
                    <TableCell className={cn("text-right font-semibold", r.variance < 0 ? "text-destructive" : "text-green-600")}>{r.counted?`$${r.variance.toFixed(2)}`:'—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6} className="font-semibold">Total Collected</TableCell>
                  <TableCell className="text-right font-bold">${totalCollected.toFixed(2)}</TableCell>
                  <TableCell />
                </TableRow>
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">Total Deposited</TableCell>
                  <TableCell className="text-right text-muted-foreground">${collectionsData.reduce((sum,row)=>sum+row.deposits,0).toFixed(2)}</TableCell>
                  <TableCell />
                </TableRow>
                <TableRow>
                  <TableCell colSpan={6} className="font-semibold">Over / Short</TableCell>
                  <TableCell />
                  <TableCell className={cn("text-right font-bold", overShort < 0 ? "text-destructive" : "text-green-600")}>${overShort.toFixed(2)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const DatePicker = ({ label, date, onSelect }: { label: string; date?: Date; onSelect: (d?: Date) => void }) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" className={cn("w-[160px] justify-start text-left text-xs h-8", !date && "text-muted-foreground")}>
        <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
        {date ? format(date, "MM/dd/yyyy") : label}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar mode="single" selected={date} onSelect={onSelect} initialFocus className="p-3 pointer-events-auto" />
    </PopoverContent>
  </Popover>
);
