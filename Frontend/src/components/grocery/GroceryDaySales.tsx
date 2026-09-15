import {useStatistics} from "@/components/reports/statistics/useStatistics";
import {change,dollars} from "@/components/reports/statistics/statisticsData";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const chartConfig = {
  sales: {
    label: "Sales ($)",
    color: "hsl(232, 44%, 56%)",
  },
  transactions: {
    label: "Transactions",
    color: "hsl(142, 71%, 45%)",
  },
};

export const GroceryDaySales = ({storeId}:{storeId:string}) => {
  const report=useStatistics(storeId);
  const {from:dateFrom,to:dateTo,setFrom:setDateFrom,setTo:setDateTo}=report;
  const {dailySalesData,hourlyTrend,categoryData,topSellingItems,totals,prior}=report.stats;
  const comparison=(now:number|null,before:number|null)=>{const value=change(now,before);return <p className={"text-xs "+(value==null?"text-muted-foreground":value<0?"text-destructive":"text-green-600")}>{value==null?"No comparable prior-period value":`${value>=0?'+':''}${value.toFixed(1)}% from last period`}</p>;};

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">From:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    aria-label="From date" variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    defaultMonth={dateFrom} disabled={report.today?{after:report.today}:undefined}
                    onSelect={(date) => date && setDateFrom(date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">To:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    aria-label="To date" variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    defaultMonth={dateTo} disabled={report.today?{after:report.today}:undefined}
                    onSelect={(date) => date && setDateTo(date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button onClick={report.apply} disabled={!report.valid} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Apply Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {report.notice}
      <p className="text-xs text-muted-foreground">Merchandise sales exclude fuel and lottery. Transactions count completed purchase receipts; refunds reduce sales and quantities. Comparisons use the preceding equal-length period.</p>
      {report.ready && <>
      {!report.stats.hasGrocery&&<p className="text-sm text-muted-foreground">No merchandise sales for this period.</p>}
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{dollars(totals.sales)}</div>
            {comparison(totals.sales,prior.sales)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totals.transactions.toLocaleString()}</div>
            {comparison(totals.transactions,prior.transactions)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Transaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{dollars(totals.avg)}</div>
            {comparison(totals.avg,prior.avg)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Items Sold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totals.items.toLocaleString()}</div>
            {comparison(totals.items,prior.items)}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Sales Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={dailySalesData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="sales"
                  fill="hsl(232, 44%, 56%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Hourly Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hourly Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={hourlyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="hour" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(232, 44%, 56%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(232, 44%, 56%)" }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Pie Chart and Top Selling Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {report.stats.categoryPieValid?<ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) =>
                      percent>=0.05?`${String(name).length>16?String(name).slice(0,15)+"…":name} ${(percent * 100).toFixed(0)}%`:""
                    }
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value:number)=>dollars(value)} />
                </PieChart>
              </ResponsiveContainer>:<p className="text-sm text-muted-foreground p-4">Sales mix is unavailable when totals are zero or a category has net refunds.</p>}
            </div>
          </CardContent>
        </Card>

        {/* Top Selling Items Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!topSellingItems.length&&<TableRow><TableCell colSpan={5}>No items sold for this period.</TableCell></TableRow>}
                {topSellingItems.map((item) => (
                  <TableRow key={item.rank}>
                    <TableCell className="font-medium">{item.rank}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.category}
                    </TableCell>
                    <TableCell className="text-right">{item.qty}</TableCell>
                    <TableCell className="text-right">
                      ${item.revenue.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      </>}
    </div>
  );
};
