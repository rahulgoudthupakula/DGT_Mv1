import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Eye, RefreshCw } from "lucide-react";

const batches = [
  { id: "ACH-20260215-001", payDate: "Feb 15, 2026", totalNet: 2208.00, status: "Paid", failed: 0 },
  { id: "ACH-20260131-001", payDate: "Jan 31, 2026", totalNet: 2180.50, status: "Paid", failed: 0 },
  { id: "ACH-20260115-001", payDate: "Jan 15, 2026", totalNet: 2195.00, status: "Paid", failed: 1 },
];

const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

export const PayrollDirectDeposit = () => {
  const [selected, setSelected] = useState<typeof batches[0] | null>(null);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Direct Deposit (ACH)</h1>

      <Card className="border-dashboard-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch ID</TableHead>
                <TableHead>Pay Date</TableHead>
                <TableHead className="text-right">Total Net</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Failed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-sm">{b.id}</TableCell>
                  <TableCell>{b.payDate}</TableCell>
                  <TableCell className="text-right font-mono">{fmt(b.totalNet)}</TableCell>
                  <TableCell>
                    <Badge variant="default" className="text-[10px]">{b.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {b.failed > 0 ? (
                      <Badge variant="destructive" className="text-[10px]">{b.failed}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelected(b)}><Eye className="w-3.5 h-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Batch {selected?.id}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <InfoRow label="Pay Date" value={selected?.payDate || ""} />
            <InfoRow label="Total Net" value={fmt(selected?.totalNet || 0)} />
            <InfoRow label="Status" value={selected?.status || ""} />
            <InfoRow label="ACH File Generated" value="Feb 13, 2026 09:14 AM" />

            {selected?.failed ? (
              <Card className="border-destructive/30">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-xs text-destructive">Failed Payments</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tom Nguyen — invalid routing #</span>
                    <Button variant="outline" size="sm" className="h-6 text-[10px]"><RefreshCw className="w-3 h-3 mr-1" /> Reissue</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground">No failed payments in this batch.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between border-b border-dashboard-border pb-2">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-foreground">{value}</span>
  </div>
);
