import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const mockData = {
  rawRatio: 1.72,
  adjustedRatio: 2.01,
  totalPurchases: 22350,
  uninvoicedPurchases: 3400,
  adjustedPurchases: 18950,
  totalSales: 38440,
};

export const SalesPurchaseAdjusted = () => {
  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">
                Raw Ratio
              </p>
              <p className="text-4xl font-bold tracking-tight">
                {mockData.rawRatio.toFixed(2)}
              </p>
              <Badge variant="secondary" className="text-xs">
                Before adjustment
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">
                Adjusted Ratio
              </p>
              <p className="text-4xl font-bold tracking-tight text-success">
                {mockData.adjustedRatio.toFixed(2)}
              </p>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                Adjusted for uninvoiced purchases
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Purchase Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Total Purchases</TableCell>
                <TableCell className="text-right">
                  ${mockData.totalPurchases.toLocaleString()}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-warning">
                  Uninvoiced Purchases
                </TableCell>
                <TableCell className="text-right text-warning">
                  -${mockData.uninvoicedPurchases.toLocaleString()}
                </TableCell>
              </TableRow>
              <TableRow className="bg-muted/50">
                <TableCell className="font-semibold">
                  Adjusted Purchases
                </TableCell>
                <TableCell className="text-right font-semibold">
                  ${mockData.adjustedPurchases.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Insight Box */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex gap-2">
            <span className="text-primary text-lg">💡</span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Raw ratio looks low due to{" "}
              <span className="font-semibold text-foreground">
                ${mockData.uninvoicedPurchases.toLocaleString()}
              </span>{" "}
              in delayed invoices. Adjusted ratio of{" "}
              <span className="font-semibold text-success">
                {mockData.adjustedRatio.toFixed(2)}
              </span>{" "}
              shows healthy inventory movement.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
