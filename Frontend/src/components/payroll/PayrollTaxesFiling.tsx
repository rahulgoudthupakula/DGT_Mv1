import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, FileDown } from "lucide-react";

const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const liabilities = [
  { type: "Federal Income Tax", current: 1450.40, ytd: 4351.20 },
  { type: "Social Security (Employer + Employee)", current: 1800.20, ytd: 5400.60 },
  { type: "Medicare (Employer + Employee)", current: 421.20, ytd: 1263.60 },
  { type: "State Income Tax", current: 682.40, ytd: 2047.20 },
  { type: "FUTA", current: 42.00, ytd: 126.00 },
  { type: "SUTA", current: 189.00, ytd: 567.00 },
];

const payments = [
  { date: "Feb 10, 2026", type: "Federal (941)", amount: 3671.80, ref: "EFTPS-8847123", status: "Confirmed" },
  { date: "Jan 10, 2026", type: "Federal (941)", amount: 3520.60, ref: "EFTPS-8812456", status: "Confirmed" },
  { date: "Jan 31, 2026", type: "State", amount: 682.40, ref: "ST-20260131", status: "Confirmed" },
];

const forms = [
  { form: "941 — Q4 2025", status: "Filed", dueDate: "Jan 31, 2026" },
  { form: "941 — Q1 2026", status: "Pending", dueDate: "Apr 30, 2026" },
  { form: "W-2 — 2025", status: "Issued", dueDate: "Jan 31, 2026" },
];

export const PayrollTaxesFiling = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Taxes & Filing</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><DollarSign className="w-4 h-4 mr-1" /> Record Tax Payment</Button>
          <Button variant="outline" size="sm"><FileDown className="w-4 h-4 mr-1" /> Export Filing Summary</Button>
        </div>
      </div>

      <Tabs defaultValue="liability">
        <TabsList>
          <TabsTrigger value="liability">Tax Liability</TabsTrigger>
          <TabsTrigger value="payments">Payments Made</TabsTrigger>
          <TabsTrigger value="forms">Forms Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="liability" className="mt-4">
          <Card className="border-dashboard-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tax Type</TableHead>
                    <TableHead className="text-right">Current Period</TableHead>
                    <TableHead className="text-right">YTD</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liabilities.map((l) => (
                    <TableRow key={l.type}>
                      <TableCell>{l.type}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(l.current)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(l.ytd)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/30 font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right font-mono">{fmt(liabilities.reduce((s, l) => s + l.current, 0))}</TableCell>
                    <TableCell className="text-right font-mono">{fmt(liabilities.reduce((s, l) => s + l.ytd, 0))}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card className="border-dashboard-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell>{p.date}</TableCell>
                      <TableCell>{p.type}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(p.amount)}</TableCell>
                      <TableCell className="font-mono text-sm">{p.ref}</TableCell>
                      <TableCell><Badge variant="default" className="text-[10px]">{p.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="mt-4">
          <Card className="border-dashboard-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forms.map((f) => (
                    <TableRow key={f.form}>
                      <TableCell className="font-medium">{f.form}</TableCell>
                      <TableCell>{f.dueDate}</TableCell>
                      <TableCell>
                        <Badge variant={f.status === "Pending" ? "secondary" : "default"} className="text-[10px]">{f.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
