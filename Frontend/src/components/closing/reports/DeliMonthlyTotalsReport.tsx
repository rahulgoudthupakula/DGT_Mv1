import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type View = "sales" | "collections";

const salesBreakdown = [
  { category: "Deli Sales", amount: 52100.00 },
  { category: "Deli Tax", amount: 3647.00 },
];
const totalDeliSales = salesBreakdown.reduce((s, r) => s + r.amount, 0);

const collectionsBreakdown = [
  { tender: "Cash", amount: 22400.00 },
  { tender: "Card", amount: 33347.00 },
];
const totalCollections = collectionsBreakdown.reduce((s, r) => s + r.amount, 0);
const overShort = totalCollections - totalDeliSales;

export const DeliMonthlyTotalsReport = () => {
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
                    <TableCell className="font-medium">{r.category}</TableCell>
                    <TableCell className="text-right">${r.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell className="text-right font-bold">${totalDeliSales.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
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
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell className="text-right font-bold">${totalCollections.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold">Over / Short</TableCell>
                  <TableCell className={cn("text-right font-bold", overShort < 0 ? "text-destructive" : "text-green-600")}>${overShort.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
