import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const mockData = {
  netMarginImpact: -1.8,
  breakdowns: [
    { label: "Inventory Increase Impact", value: -0.9 },
    { label: "Inventory Decrease Impact", value: 0.4 },
    { label: "Shrink / Spoilage", value: -1.1 },
    { label: "Price Corrections", value: -0.2 },
  ],
};

const mockReasons = [
  { reason: "Spoilage", value: 820 },
  { reason: "Damage", value: 210 },
  { reason: "Theft", value: 95 },
];

export const MarginImpactView = () => {
  const totalReasons = mockReasons.reduce((sum, r) => sum + r.value, 0);
  const isNegative = mockData.netMarginImpact < 0;

  return (
    <div className="space-y-5">
      {/* KPI Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-3">
            <p className="text-sm font-medium text-muted-foreground">
              Net Margin Impact
            </p>
            <p
              className={`text-5xl font-bold tracking-tight ${
                isNegative ? "text-destructive" : "text-success"
              }`}
            >
              {mockData.netMarginImpact > 0 ? "+" : ""}
              {mockData.netMarginImpact.toFixed(1)}%
            </p>
            <Badge
              className={
                isNegative
                  ? "bg-destructive/10 text-destructive border-destructive/20"
                  : "bg-success/10 text-success border-success/20"
              }
              variant="outline"
            >
              {isNegative ? "🔴 Negative Impact" : "🟢 Positive Impact"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {mockData.breakdowns.map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-5 pb-4">
              <div className="text-center space-y-1">
                <p className="text-xs font-medium text-muted-foreground leading-tight">
                  {item.label}
                </p>
                <p
                  className={`text-2xl font-bold ${
                    item.value < 0 ? "text-destructive" : "text-success"
                  }`}
                >
                  {item.value > 0 ? "+" : ""}
                  {item.value.toFixed(1)}%
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Explanation Panel */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="py-4">
          <div className="flex gap-2">
            <span className="text-lg">📉</span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Margin dropped mainly due to{" "}
              <span className="font-semibold text-foreground">
                increased inventory holding
              </span>{" "}
              and{" "}
              <span className="font-semibold text-destructive">
                $
                {mockReasons
                  .reduce((s, r) => s + r.value, 0)
                  .toLocaleString()}{" "}
                in spoilage and shrink
              </span>
              .
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Supporting Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Loss Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockReasons.map((row) => (
                <TableRow key={row.reason}>
                  <TableCell className="font-medium">{row.reason}</TableCell>
                  <TableCell className="text-right text-destructive">
                    ${row.value.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-semibold text-destructive">
                  ${totalReasons.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
