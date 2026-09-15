import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Eye, Download } from "lucide-react";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/ui/table-pagination";

const stubs = [
  { id: 1, name: "Maria Lopez", payDate: "Feb 15, 2026", net: 460.80, status: "Paid" },
  { id: 2, name: "James Carter", payDate: "Feb 15, 2026", net: 427.20, status: "Paid" },
  { id: 3, name: "Aisha Patel", payDate: "Feb 15, 2026", net: 1320.00, status: "Paid" },
  { id: 4, name: "Sarah Kim", payDate: "Feb 15, 2026", net: 1148.08, status: "Pending" },
];

const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

export const PayrollPaystubs = () => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<typeof stubs[0] | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const { paginated, page, totalPages, totalItems, hasPrev, hasNext, prevPage, nextPage } = usePagination(stubs, pageSize);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Paystubs</h1>

      <Card className="border-dashboard-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Pay Date</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.payDate}</TableCell>
                  <TableCell className="text-right font-mono">{fmt(s.net)}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === "Paid" ? "default" : "secondary"} className="text-[10px]">{s.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelected(s); setOpen(true); }}><Eye className="w-3.5 h-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize}
            hasPrev={hasPrev} hasNext={hasNext} onPrev={prevPage} onNext={nextPage}
            onPageSizeChange={(s) => setPageSize(s)}
          />
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Paystub — {selected?.name}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <Section title="Earnings">
              <Row label="Regular (40 hrs × $16.50)" value="$660.00" />
              <Row label="Overtime (2 hrs × $24.75)" value="$49.50" />
              <Row label="Bonus" value="$16.50" />
              <Row label="Gross Pay" value={fmt(selected?.net ? selected.net + 265.20 : 0)} bold />
            </Section>
            <Section title="Taxes Withheld">
              <Row label="Federal Income Tax" value="$72.60" />
              <Row label="Social Security" value="$45.01" />
              <Row label="Medicare" value="$10.53" />
              <Row label="State Tax" value="$17.06" />
            </Section>
            <Section title="Deductions">
              <Row label="Health Insurance" value="$120.00" />
            </Section>
            <Section title="YTD Totals">
              <Row label="YTD Gross" value="$4,356.00" />
              <Row label="YTD Net" value="$2,764.80" />
            </Section>
            <Button variant="outline" size="sm" className="w-full"><Download className="w-4 h-4 mr-1" /> Download PDF</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card className="border-dashboard-border">
    <CardHeader className="py-2 px-4"><CardTitle className="text-xs text-muted-foreground">{title}</CardTitle></CardHeader>
    <CardContent className="px-4 pb-3 space-y-1.5">{children}</CardContent>
  </Card>
);

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className={`flex justify-between text-sm ${bold ? "font-semibold border-t border-dashboard-border pt-1.5" : ""}`}>
    <span className="text-muted-foreground">{label}</span>
    <span className="font-mono text-foreground">{value}</span>
  </div>
);
