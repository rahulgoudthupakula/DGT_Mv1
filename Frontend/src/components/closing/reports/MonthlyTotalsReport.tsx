import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type View = "sales" | "collections";

const salesBreakdown = [
  { category: "Cigarette Pack (Count)", amount: 438.00, indent: false },
  { category: "Cigarette Pack", amount: 5053.13, indent: false },
  { category: "Cigarette Ctn (Count)", amount: 0.00, indent: false },
  { category: "Cigarette Ctn", amount: 0.00, indent: false },
  { category: "Total Groceries", amount: 17447.27, indent: false, bold: true },
  { category: "Sales Tax", amount: 898.57, indent: false, bold: true },
  { category: "Total Gas Amount Sold", amount: 45703.56, indent: false, bold: true },
  { category: "Net Online Sales", amount: 243.00, indent: false },
  { category: "Instant (Lottery) Ticket Sales", amount: 1417.00, indent: false },
  { category: "Vending Machine Sales", amount: 0.00, indent: false },
  { category: "Amount of M.O. Sold", amount: 0.00, indent: false },
  { category: "M.O. Fee Collected", amount: 0.00, indent: false },
  { category: "Gas Card Amount", amount: 0.00, indent: false },
  { category: "Customer Collection", amount: 0.00, indent: false },
  { category: "Check Cashing Commission", amount: 0.00, indent: false },
  { category: "Other Income", amount: 0.00, indent: false },
  { category: "Loan Received", amount: 0.00, indent: false },
  { category: "Check Cashing Money from Bank", amount: 0.00, indent: false },
  { category: "Store Opening Amount", amount: 0.00, indent: false },
];

const collectionsBreakdown = [
  { tender: "Total Deposits", amount: 11198.03 },
  { tender: "Put In ATM", amount: 0.00 },
  { tender: "Cash Purchases", amount: 0.00 },
  { tender: "Pending Invoices Paid", amount: 0.00 },
  { tender: "Credit Card Amount", amount: 53578.82 },
  { tender: "Cash Expenses", amount: 0.00 },
  { tender: "Customer Credit", amount: 0.00 },
  { tender: "Net Online Cashes", amount: 722.00 },
  { tender: "Instant (Lottery) Ticket Cashes", amount: 0.00 },
  { tender: "Adjustment", amount: 0.00 },
  { tender: "Online Credit", amount: 0.00 },
  { tender: "Instant Credit", amount: 0.00 },
  { tender: "Jobber Card Amount Sold", amount: 0.00 },
  { tender: "Food Stamps", amount: 0.00 },
  { tender: "Credit Card 2 Amount", amount: 0.00 },
  { tender: "Loan Paid", amount: 223.00 },
  { tender: "Profit Withdrawn", amount: 0.00 },
  { tender: "Store Closing Cash", amount: 0.00 },
  { tender: "Store Closing Checks", amount: 0.00 },
  { tender: "Store Closing Amount", amount: 0.00 },
];

const totalSales = salesBreakdown.reduce((s, r) => s + r.amount, 0);
const totalCollections = collectionsBreakdown.reduce((s, r) => s + r.amount, 0);
const overShort = 12.45;

export const MonthlyTotalsReport = () => {
  const [view, setView] = useState<View>("sales");
  const [month, setMonth] = useState("02");
  const [year, setYear] = useState("2026");

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4 pb-3 flex flex-wrap items-center gap-3">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["01","02","03","04","05","06","07","08","09","10","11","12"].map((m) => (
                <SelectItem key={m} value={m}>{new Date(2026, parseInt(m) - 1).toLocaleString("default", { month: "long" })}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["2024","2025","2026"].map((y) => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
            </SelectContent>
          </Select>
          <div className="ml-auto">
            <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as View)} className="border rounded-md">
              <ToggleGroupItem value="sales" className="text-xs px-3 h-8">Monthly Sales</ToggleGroupItem>
              <ToggleGroupItem value="collections" className="text-xs px-3 h-8">Collections</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 p-0">
          {view === "sales" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesBreakdown.map((r) => (
                  <TableRow key={r.category}>
                    <TableCell className={cn("font-medium", r.bold && "font-semibold")}>{r.category}</TableCell>
                    <TableCell className={cn("text-right", r.bold && "font-semibold")}>${r.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold">Total Sales</TableCell>
                  <TableCell className="text-right font-bold">${totalSales.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tender</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collectionsBreakdown.map((r) => (
                  <TableRow key={r.tender}>
                    <TableCell className="font-medium">{r.tender}</TableCell>
                    <TableCell className="text-right">${r.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold">Total Collections</TableCell>
                  <TableCell className="text-right font-bold">${totalCollections.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Report Over / Short</TableCell>
                  <TableCell className={cn("text-right font-bold", overShort < 0 ? "text-destructive" : "text-accent-foreground")}>${overShort.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
