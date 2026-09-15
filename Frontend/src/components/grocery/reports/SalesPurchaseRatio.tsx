import {useRatioReports} from './useRatioReports';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export const SalesPurchaseRatio = ({storeId}:{storeId:string}) => {
  const [from,setFrom]=useState("");
  const [to,setTo]=useState("");
  const [range,setRange]=useState({from:"",to:""});
  const [error,setError]=useState("");
  const today=format(new Date(),"yyyy-MM-dd");
  const apply=(event:React.FormEvent)=>{
    event.preventDefault();
    if((from&&!to)||(!from&&to)){setError("Choose both From and To dates.");return;}
    if(from>to){setError("From date must be on or before To date.");return;}
    if(to>today){setError("To date cannot be in the future.");return;}
    setError("");setRange({from,to});
  };
  return <div className="space-y-5">
    <Card><CardContent className="pt-5">
      <form onSubmit={apply} className="flex flex-wrap items-end gap-3">
        <div className="space-y-1"><label htmlFor="ratio-from" className="text-sm font-medium">From date</label>
          <Input id="ratio-from" type="date" max={today} value={from} onChange={e=>setFrom(e.target.value)} /></div>
        <div className="space-y-1"><label htmlFor="ratio-to" className="text-sm font-medium">To date</label>
          <Input id="ratio-to" type="date" max={today} value={to} onChange={e=>setTo(e.target.value)} /></div>
        <Button type="submit">Apply</Button>
        <Button type="button" variant="outline" onClick={()=>{setFrom("");setTo("");setRange({from:"",to:""});setError("");}}>All dates</Button>
      </form>
      {error&&<p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
      <p className="mt-3 text-sm text-muted-foreground">{range.from?`${range.from} to ${range.to} (inclusive)`:"All available dates through today"}. The same date range applies to sales and approved purchases.</p>
    </CardContent></Card>
    <RatioResults storeId={storeId} start={range.from?new Date(range.from+"T12:00:00"):undefined} end={range.to?new Date(range.to+"T12:00:00"):undefined}/>
  </div>;
};

const RatioResults = ({storeId,start,end}:{storeId:string;start?:Date;end?:Date}) => {
 const report=useRatioReports(storeId,start,end);const mockTrendData=report.trend;const mockSummary=report;


  if(report.pending)return <p>Loading ratios…</p>;if(report.error)return <p role="alert">{String(report.error)}</p>;
  return (
    <div className="space-y-5">
      {/* KPI Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-3">
            <p className="text-sm font-medium text-muted-foreground">
              Sales / Purchase Ratio
            </p>
            <p className="text-5xl font-bold tracking-tight">
              {(mockSummary.ratio?.toFixed(2)??"—")}
            </p>

          </div>
        </CardContent>
      </Card>

      {/* Explanation */}
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            "For every <span className="font-semibold text-foreground">$1</span>{" "}
            spent on inventory,{" "}
            <span className="font-semibold text-foreground">
              ${(mockSummary.ratio?.toFixed(2)??"—")}
            </span>{" "}
            was sold during this period."
          </p>
        </CardContent>
      </Card>

      {/* Trend Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ratio Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockTrendData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="ratio"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{r:3}}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Summary Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Total Sales</TableCell>
                <TableCell className="text-right">
                  ${mockSummary.totalSales.toLocaleString()}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Total Purchases</TableCell>
                <TableCell className="text-right">
                  ${mockSummary.totalPurchases.toLocaleString()}
                </TableCell>
              </TableRow>
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell className="font-semibold">Ratio</TableCell>
                <TableCell className="text-right font-semibold">
                  {(mockSummary.ratio?.toFixed(2)??"—")}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
