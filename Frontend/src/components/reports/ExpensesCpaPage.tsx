import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingDown } from "lucide-react";

const expenses = [
  { category: "Cost of Goods Sold", subcategory: "Grocery Purchases", mtd: 42500.00, ytd: 187000.00, budget: 45000.00 },
  { category: "Cost of Goods Sold", subcategory: "Gas Fuel Cost", mtd: 98700.00, ytd: 412000.00, budget: 100000.00 },
  { category: "Operating Expenses", subcategory: "Payroll & Benefits", mtd: 18200.00, ytd: 76500.00, budget: 18000.00 },
  { category: "Operating Expenses", subcategory: "Utilities", mtd: 3100.00, ytd: 12800.00, budget: 3200.00 },
  { category: "Operating Expenses", subcategory: "Insurance", mtd: 1250.00, ytd: 5000.00, budget: 1250.00 },
  { category: "Operating Expenses", subcategory: "Maintenance & Repairs", mtd: 780.00, ytd: 2900.00, budget: 1000.00 },
  { category: "Administrative", subcategory: "Accounting & Legal", mtd: 500.00, ytd: 2000.00, budget: 500.00 },
  { category: "Administrative", subcategory: "Software & Subscriptions", mtd: 320.00, ytd: 1280.00, budget: 350.00 },
];

export const ExpensesCpaPage = () => {
  const totalMtd = expenses.reduce((s, e) => s + e.mtd, 0);
  const totalYtd = expenses.reduce((s, e) => s + e.ytd, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expenses – CPA View</h1>
          <p className="text-sm text-muted-foreground">Categorized expense ledger for accounting and tax purposes</p>
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
          { label: "Total Expenses (MTD)", value: `$${totalMtd.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
          { label: "Total Expenses (YTD)", value: `$${totalYtd.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
          { label: "Budget Variance", value: "-$620.00", note: "Under budget" },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-4 flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-destructive opacity-70" />
              <div>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="text-2xl font-bold text-foreground">{c.value}</p>
                {c.note && <p className="text-xs text-muted-foreground">{c.note}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Expense Breakdown</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Subcategory</TableHead>
                <TableHead className="text-right">MTD Actual</TableHead>
                <TableHead className="text-right">YTD Actual</TableHead>
                <TableHead className="text-right">Monthly Budget</TableHead>
                <TableHead>vs Budget</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((e, i) => {
                const diff = e.budget - e.mtd;
                const over = diff < 0;
                return (
                  <TableRow key={i}>
                    <TableCell><Badge variant="outline">{e.category}</Badge></TableCell>
                    <TableCell className="font-medium">{e.subcategory}</TableCell>
                    <TableCell className="text-right">${e.mtd.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">${e.ytd.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">${e.budget.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <span className={over ? "text-destructive font-medium" : "text-green-600 font-medium"}>
                        {over ? `+$${Math.abs(diff).toFixed(2)} over` : `-$${diff.toFixed(2)} under`}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
