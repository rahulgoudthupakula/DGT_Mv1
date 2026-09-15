import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp } from "lucide-react";

const incomeLines = [
  { category: "Financial Services", source: "Money Order Fees", mtd: 1840.00, ytd: 7200.00 },
  { category: "Financial Services", source: "Check Cashing Fees", mtd: 3120.00, ytd: 13500.00 },
  { category: "Financial Services", source: "Bill Pay Commissions", mtd: 540.00, ytd: 2200.00 },
  { category: "Financial Services", source: "Wire Transfer Fees", mtd: 890.00, ytd: 3600.00 },
  { category: "ATM", source: "ATM Surcharge Income", mtd: 1120.00, ytd: 4400.00 },
  { category: "Lottery", source: "Lottery Commission", mtd: 2280.00, ytd: 9100.00 },
  { category: "Rental / Other", source: "Redbox / Kiosk Rent", mtd: 200.00, ytd: 800.00 },
  { category: "Rental / Other", source: "Car Wash Commission", mtd: 680.00, ytd: 2720.00 },
];

export const OtherIncomeCpaPage = () => {
  const totalMtd = incomeLines.reduce((s, l) => s + l.mtd, 0);
  const totalYtd = incomeLines.reduce((s, l) => s + l.ytd, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Other Income – CPA View</h1>
          <p className="text-sm text-muted-foreground">Non-merchandise and non-fuel income sources for accounting</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="feb-2024">
            <SelectTrigger className="w-36 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="feb-2024">February 2024</SelectItem>
              <SelectItem value="jan-2024">January 2024</SelectItem>
              <SelectItem value="q1-2024">Q1 2024</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Other Income (MTD)", value: `$${totalMtd.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
          { label: "Total Other Income (YTD)", value: `$${totalYtd.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
          { label: "Income Sources", value: incomeLines.length.toString() },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-4 flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary opacity-70" />
              <div>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="text-2xl font-bold text-foreground">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Other Income Breakdown</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">MTD Income</TableHead>
                <TableHead className="text-right">YTD Income</TableHead>
                <TableHead className="text-right">% of Total MTD</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomeLines.map((l, i) => (
                <TableRow key={i}>
                  <TableCell><Badge variant="outline">{l.category}</Badge></TableCell>
                  <TableCell className="font-medium">{l.source}</TableCell>
                  <TableCell className="text-right">${l.mtd.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right">${l.ytd.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{((l.mtd / totalMtd) * 100).toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex justify-end">
            <div className="bg-muted/50 px-4 py-2 rounded-lg">
              <span className="text-sm text-muted-foreground">Total MTD: </span>
              <span className="font-bold">${totalMtd.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
