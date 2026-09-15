import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";
import { useState } from "react";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/ui/table-pagination";

const rebateAccruals = [
  { id: "ACC-001", item: "Coca-Cola 20oz", vendor: "Coca-Cola Enterprises", program: "Coca-Cola Q1 Rebate", salesQty: 450, rebateRate: "$0.15/unit", accruedAmount: 67.50, claimableDate: "2024-02-01", status: "Claimable" },
  { id: "ACC-002", item: "Sprite 20oz", vendor: "Coca-Cola Enterprises", program: "Coca-Cola Q1 Rebate", salesQty: 280, rebateRate: "$0.15/unit", accruedAmount: 42.00, claimableDate: "2024-02-01", status: "Claimable" },
  { id: "ACC-003", item: "Lay's Classic", vendor: "Frito-Lay", program: "Frito-Lay Volume Bonus", salesQty: 620, rebateRate: "2% over 500", accruedAmount: 24.80, claimableDate: "2024-04-01", status: "Pending" },
  { id: "ACC-004", item: "Pepsi 2L", vendor: "PepsiCo", program: "Pepsi Summer Boost", salesQty: 310, rebateRate: "$0.10/unit", accruedAmount: 31.00, claimableDate: "2024-07-01", status: "Pending" },
  { id: "ACC-005", item: "Doritos Nacho", vendor: "Frito-Lay", program: "Frito-Lay Volume Bonus", salesQty: 180, rebateRate: "2% over 500", accruedAmount: 0.00, claimableDate: "2024-04-01", status: "Pending" },
  { id: "ACC-006", item: "Snickers Bar", vendor: "Mars Inc.", program: "Mars Candy Promo", salesQty: 520, rebateRate: "3% of purchases", accruedAmount: 46.80, claimableDate: "2024-01-01", status: "Claimable" },
  { id: "ACC-007", item: "Kit Kat 4-Pack", vendor: "Nestle", program: "Nestle Waters Deal", salesQty: 240, rebateRate: "1.5% over 1000", accruedAmount: 0.00, claimableDate: "2024-04-01", status: "Pending" },
  { id: "ACC-008", item: "Frosted Flakes", vendor: "Kellogg's", program: "Kellogg's Cereal Rebate", salesQty: 95, rebateRate: "2.5% of purchases", accruedAmount: 11.31, claimableDate: "2024-02-01", status: "Claimable" },
  { id: "ACC-009", item: "Tide Pods 32ct", vendor: "Procter & Gamble", program: "P&G Home Care", salesQty: 75, rebateRate: "$0.25/unit", accruedAmount: 18.75, claimableDate: "2024-01-01", status: "Claimable" },
  { id: "ACC-010", item: "Dove Body Wash", vendor: "Unilever", program: "Unilever Personal Care", salesQty: 130, rebateRate: "4% of purchases", accruedAmount: 20.80, claimableDate: "2024-04-01", status: "Pending" },
  { id: "ACC-011", item: "Oreo Cookies", vendor: "Mondelez", program: "Mondelez Snack Deal", salesQty: 400, rebateRate: "3% over 300 units", accruedAmount: 36.00, claimableDate: "2024-03-01", status: "Claimable" },
  { id: "ACC-012", item: "Red Bull 8oz", vendor: "Red Bull GmbH", program: "Red Bull Energy Promo", salesQty: 560, rebateRate: "$0.20/unit", accruedAmount: 112.00, claimableDate: "2024-01-01", status: "Claimable" },
];

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    Claimable: "default", Pending: "outline",
  };
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
};

export const RebateAccrualPage = () => {
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = rebateAccruals.filter(
    (a) => statusFilter === "all" || a.status.toLowerCase() === statusFilter
  );

  const { paginated, page, totalPages, totalItems, pageSize, hasPrev, hasNext, nextPage, prevPage, goToPage } =
    usePagination(filtered, 10);

  const totalAccrued = filtered.reduce((sum, a) => sum + a.accruedAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rebate Accrual</h1>
          <p className="text-sm text-muted-foreground">Track earned rebates before they're claimed</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">Accrual Ledger</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); goToPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="claimable">Claimable</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Export</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Program</TableHead>
                <TableHead className="text-right">Sales Qty</TableHead>
                <TableHead>Rebate Rate</TableHead>
                <TableHead className="text-right">Accrued Amount</TableHead>
                <TableHead>Claimable Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((accrual) => (
                <TableRow key={accrual.id}>
                  <TableCell className="font-medium">{accrual.item}</TableCell>
                  <TableCell>{accrual.vendor}</TableCell>
                  <TableCell className="text-sm">{accrual.program}</TableCell>
                  <TableCell className="text-right">{accrual.salesQty}</TableCell>
                  <TableCell>{accrual.rebateRate}</TableCell>
                  <TableCell className="text-right font-medium">${accrual.accruedAmount.toFixed(2)}</TableCell>
                  <TableCell>{accrual.claimableDate}</TableCell>
                  <TableCell>{getStatusBadge(accrual.status)}</TableCell>
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
          <div className="flex justify-end px-4 py-3 border-t">
            <div className="bg-muted/50 px-4 py-2 rounded-lg">
              <span className="text-sm text-muted-foreground">Total Accrued: </span>
              <span className="font-bold">${totalAccrued.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
