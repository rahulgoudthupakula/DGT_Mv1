import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, AlertTriangle } from "lucide-react";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/ui/table-pagination";

const nonScannedItems = [
  { id: "NSI-001", description: "Loose candy – bulk bin", department: "Grocery", price: 0.50, qty: 120, totalSales: 60.00, date: "2024-02-15", flag: "No barcode" },
  { id: "NSI-002", description: "Bakery roll (single)", department: "Deli", price: 1.25, qty: 85, totalSales: 106.25, date: "2024-02-15", flag: "Manual entry" },
  { id: "NSI-003", description: "Prepared soup – 16oz", department: "Deli", price: 3.99, qty: 42, totalSales: 167.58, date: "2024-02-14", flag: "No barcode" },
  { id: "NSI-004", description: "Seasonal produce item", department: "Produce", price: 2.00, qty: 200, totalSales: 400.00, date: "2024-02-14", flag: "Manual entry" },
  { id: "NSI-005", description: "Fresh squeezed juice", department: "Deli", price: 4.99, qty: 30, totalSales: 149.70, date: "2024-02-13", flag: "No barcode" },
  { id: "NSI-006", description: "Hot bar item – per lb", department: "Deli", price: 5.99, qty: 55, totalSales: 329.45, date: "2024-02-13", flag: "Manual entry" },
  { id: "NSI-007", description: "Custom sandwich", department: "Deli", price: 7.50, qty: 40, totalSales: 300.00, date: "2024-02-12", flag: "No barcode" },
  { id: "NSI-008", description: "Bulk nuts – mixed", department: "Grocery", price: 6.99, qty: 18, totalSales: 125.82, date: "2024-02-12", flag: "Manual entry" },
  { id: "NSI-009", description: "Fresh herbs bundle", department: "Produce", price: 1.99, qty: 60, totalSales: 119.40, date: "2024-02-11", flag: "No barcode" },
  { id: "NSI-010", description: "Kombucha on tap", department: "Beverages", price: 3.50, qty: 25, totalSales: 87.50, date: "2024-02-11", flag: "Manual entry" },
  { id: "NSI-011", description: "Cheese wedge – custom cut", department: "Grocery", price: 8.99, qty: 12, totalSales: 107.88, date: "2024-02-10", flag: "No barcode" },
  { id: "NSI-012", description: "Olive bar mix", department: "Grocery", price: 4.50, qty: 35, totalSales: 157.50, date: "2024-02-10", flag: "Manual entry" },
];

export const NonScannedItemPage = () => {
  const [search, setSearch] = useState("");

  const filtered = nonScannedItems.filter(
    (item) =>
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.department.toLowerCase().includes(search.toLowerCase()) ||
      item.flag.toLowerCase().includes(search.toLowerCase())
  );

  const { paginated, page, totalPages, totalItems, pageSize, hasPrev, hasNext, nextPage, prevPage, setPage, goToPage } =
    usePagination(filtered, 10);

  // Reset to page 1 on filter change
  const handleSearch = (val: string) => {
    setSearch(val);
    goToPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Non-Scanned Items</h1>
          <p className="text-sm text-muted-foreground">Track and manage items sold without a barcode scan</p>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Non-Scanned", value: "447 items", sub: "Today" },
          { label: "Total Revenue", value: "$733.83", sub: "Today" },
          { label: "Flagged Entries", value: "12", sub: "Needs review" },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className="text-2xl font-bold text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" /> Non-Scanned Item Log
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              className="pl-8 h-8 text-sm"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Total Sales</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Flag</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-xs">{item.id}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.department}</TableCell>
                  <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{item.qty}</TableCell>
                  <TableCell className="text-right font-medium">${item.totalSales.toFixed(2)}</TableCell>
                  <TableCell className="text-sm">{item.date}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{item.flag}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            hasPrev={hasPrev}
            hasNext={hasNext}
            onPrev={prevPage}
            onNext={nextPage}
          />
        </CardContent>
      </Card>
    </div>
  );
};
