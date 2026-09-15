import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download } from "lucide-react";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/ui/table-pagination";

const rebatePayments = [
  { id: "PAY-001", claimRef: "CLM-002", vendor: "Mars Inc.", paymentDate: "2024-01-25", paymentMethod: "Check #4521", expectedAmount: 156.00, receivedAmount: 156.00, variance: 0 },
  { id: "PAY-002", claimRef: "CLM-098", vendor: "Coca-Cola Enterprises", paymentDate: "2024-01-20", paymentMethod: "ACH Transfer", expectedAmount: 312.50, receivedAmount: 298.75, variance: -13.75 },
  { id: "PAY-003", claimRef: "CLM-006", vendor: "Kellogg's", paymentDate: "2024-04-18", paymentMethod: "ACH Transfer", expectedAmount: 92.40, receivedAmount: 92.40, variance: 0 },
  { id: "PAY-004", claimRef: "CLM-009", vendor: "Mondelez", paymentDate: "2024-03-15", paymentMethod: "Check #4598", expectedAmount: 198.30, receivedAmount: 185.00, variance: -13.30 },
  { id: "PAY-005", claimRef: "CLM-012", vendor: "General Mills", paymentDate: "2024-04-25", paymentMethod: "ACH Transfer", expectedAmount: 263.80, receivedAmount: 263.80, variance: 0 },
  { id: "PAY-006", claimRef: "CLM-003", vendor: "Pepsi Co", paymentDate: "2024-01-30", paymentMethod: "Wire Transfer", expectedAmount: 89.25, receivedAmount: 89.25, variance: 0 },
  { id: "PAY-007", claimRef: "CLM-007", vendor: "Procter & Gamble", paymentDate: "2024-03-01", paymentMethod: "ACH Transfer", expectedAmount: 204.75, receivedAmount: 200.00, variance: -4.75 },
  { id: "PAY-008", claimRef: "CLM-011", vendor: "Tyson Foods", paymentDate: "2024-04-20", paymentMethod: "Check #4650", expectedAmount: 145.60, receivedAmount: 145.60, variance: 0 },
  { id: "PAY-009", claimRef: "CLM-001", vendor: "Coca-Cola Enterprises", paymentDate: "2024-02-28", paymentMethod: "ACH Transfer", expectedAmount: 245.50, receivedAmount: 245.50, variance: 0 },
  { id: "PAY-010", claimRef: "CLM-005", vendor: "Nestle", paymentDate: "2024-05-01", paymentMethod: "Wire Transfer", expectedAmount: 175.50, receivedAmount: 170.00, variance: -5.50 },
  { id: "PAY-011", claimRef: "CLM-010", vendor: "Red Bull GmbH", paymentDate: "2024-02-10", paymentMethod: "Check #4530", expectedAmount: 67.20, receivedAmount: 67.20, variance: 0 },
  { id: "PAY-012", claimRef: "CLM-004", vendor: "Frito-Lay", paymentDate: "2024-04-01", paymentMethod: "ACH Transfer", expectedAmount: 310.00, receivedAmount: 310.00, variance: 0 },
];

export const RebatePaymentsPage = () => {
  const { paginated, page, totalPages, totalItems, pageSize, hasPrev, hasNext, nextPage, prevPage } =
    usePagination(rebatePayments, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rebate Payments</h1>
          <p className="text-sm text-muted-foreground">Reconcile received rebate payments against expected amounts</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">Payment Register</CardTitle>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Export</Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment ID</TableHead>
                <TableHead>Claim Ref</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Expected</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Variance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.id}</TableCell>
                  <TableCell className="text-primary">{payment.claimRef}</TableCell>
                  <TableCell>{payment.vendor}</TableCell>
                  <TableCell>{payment.paymentDate}</TableCell>
                  <TableCell>{payment.paymentMethod}</TableCell>
                  <TableCell className="text-right">${payment.expectedAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">${payment.receivedAmount.toFixed(2)}</TableCell>
                  <TableCell className={`text-right font-medium ${payment.variance < 0 ? "text-destructive" : "text-green-600"}`}>
                    {payment.variance === 0 ? "—" : `${payment.variance > 0 ? "+" : ""}$${payment.variance.toFixed(2)}`}
                  </TableCell>
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
