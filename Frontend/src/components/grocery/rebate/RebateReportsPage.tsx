import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Tag, Building2, Store } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// --- Mock Data ---
const programRows = [
  { program: "Pepsi Q1 Volume Rebate", vendor: "PepsiCo", type: "Volume", period: "Q1 2025", expectedAmount: 4820.00, status: "Active" },
  { program: "Frito-Lay Annual Tier", vendor: "Frito-Lay", type: "Tiered", period: "2025", expectedAmount: 3150.00, status: "Active" },
  { program: "Coca-Cola Promo Rebate", vendor: "Coca-Cola", type: "Promotional", period: "Q1 2025", expectedAmount: 2400.00, status: "Active" },
  { program: "Kraft Heinz Growth Incentive", vendor: "Kraft Heinz", type: "Growth", period: "2025", expectedAmount: 1875.00, status: "Pending" },
  { program: "Unilever Display Rebate", vendor: "Unilever", type: "Display", period: "Q1 2025", expectedAmount: 980.00, status: "Active" },
  { program: "Nabisco Loyalty Program", vendor: "Nabisco", type: "Loyalty", period: "2025", expectedAmount: 760.00, status: "Pending" },
];

const itemRows = [
  { item: "Pepsi 2L", upc: "012000001765", category: "Beverages", department: "Grocery", vendor: "PepsiCo", expectedRebate: 0.15, unitsSold: 420, expectedAmount: 63.00 },
  { item: "Lay's Classic Chips 10oz", upc: "028400090100", category: "Snacks", department: "Grocery", vendor: "Frito-Lay", expectedRebate: 0.20, unitsSold: 310, expectedAmount: 62.00 },
  { item: "Coca-Cola 12pk Can", upc: "049000050103", category: "Beverages", department: "Grocery", vendor: "Coca-Cola", expectedRebate: 0.50, unitsSold: 185, expectedAmount: 92.50 },
  { item: "Kraft Mac & Cheese", upc: "021000041497", category: "Dry Goods", department: "Grocery", vendor: "Kraft Heinz", expectedRebate: 0.10, unitsSold: 540, expectedAmount: 54.00 },
  { item: "Doritos Nacho Cheese", upc: "028400090117", category: "Snacks", department: "Grocery", vendor: "Frito-Lay", expectedRebate: 0.18, unitsSold: 290, expectedAmount: 52.20 },
  { item: "Dove Soap Bar 4pk", upc: "011111222234", category: "Personal Care", department: "HBC", vendor: "Unilever", expectedRebate: 0.25, unitsSold: 210, expectedAmount: 52.50 },
  { item: "Oreo Cookies 14.3oz", upc: "044000030186", category: "Cookies", department: "Grocery", vendor: "Nabisco", expectedRebate: 0.12, unitsSold: 380, expectedAmount: 45.60 },
  { item: "Mountain Dew 2L", upc: "012000001780", category: "Beverages", department: "Grocery", vendor: "PepsiCo", expectedRebate: 0.15, unitsSold: 300, expectedAmount: 45.00 },
];

// Group by category for summary
const categoryTotals = itemRows.reduce<Record<string, number>>((acc, row) => {
  acc[row.category] = (acc[row.category] || 0) + row.expectedAmount;
  return acc;
}, {});

const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// --- Sub-pages ---
const ByPrograms = () => {
  const total = programRows.reduce((s, r) => s + r.expectedAmount, 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Qualified Programs</p>
            <p className="text-xl font-bold text-foreground">{programRows.filter(r => r.status === "Active").length - 1}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Active Programs</p>
            <p className="text-xl font-bold text-foreground">{programRows.filter(r => r.status === "Active").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Claims Pending</p>
            <p className="text-xl font-bold text-foreground">{programRows.filter(r => r.status === "Pending").length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Providers</p>
            <p className="text-xl font-bold text-foreground">{new Set(programRows.map(r => r.vendor)).size}</p>
          </CardContent>
        </Card>

      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Expected Rebate by Program</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Expected Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programRows.map((row) => (
                <TableRow key={row.program}>
                  <TableCell className="font-medium">{row.program}</TableCell>
                  <TableCell className="text-muted-foreground">{row.vendor}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell className="text-muted-foreground">{row.period}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === "Active" ? "default" : "secondary"} className="text-xs">
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">{fmt(row.expectedAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end px-4 py-3 border-t border-border bg-muted/30">
            <span className="text-sm font-semibold">Total: {fmt(total)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ByItemCategory = () => {
  const total = itemRows.reduce((s, r) => s + r.expectedAmount, 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total Expected</p>
            <p className="text-xl font-bold text-foreground">{fmt(total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Items Tracked</p>
            <p className="text-xl font-bold text-foreground">{itemRows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Categories</p>
            <p className="text-xl font-bold text-foreground">{Object.keys(categoryTotals).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Avg / Item</p>
            <p className="text-xl font-bold text-foreground">{fmt(total / itemRows.length)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(categoryTotals).map(([cat, amt]) => (
          <Card key={cat} className="bg-muted/30">
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-muted-foreground">{cat}</p>
              <p className="text-base font-semibold">{fmt(amt)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Expected Rebate by Item</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>UPC</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Units Sold</TableHead>
                <TableHead className="text-right">Rebate/Unit</TableHead>
                <TableHead className="text-right">Expected Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemRows.map((row) => (
                <TableRow key={row.upc}>
                  <TableCell className="font-medium">{row.item}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{row.upc}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell className="text-muted-foreground">{row.vendor}</TableCell>
                  <TableCell className="text-right">{row.unitsSold.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">{fmt(row.expectedRebate)}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">{fmt(row.expectedAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end px-4 py-3 border-t border-border bg-muted/30">
            <span className="text-sm font-semibold">Total: {fmt(total)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// --- By Provider ---
const providerRows = [
  { provider: "PepsiCo", expected: 4820, earned: 4600, approved: 4400, paid: 4400 },
  { provider: "Frito-Lay", expected: 3150, earned: 3150, approved: 3100, paid: 1800 },
  { provider: "Coca-Cola", expected: 2400, earned: 2100, approved: 1900, paid: 1200 },
  { provider: "Kraft Heinz", expected: 1875, earned: 1500, approved: 1300, paid: 800 },
  { provider: "Unilever", expected: 980, earned: 700, approved: 640, paid: 200 },
  { provider: "Nabisco", expected: 760, earned: 370, approved: 560, paid: 100 },
];

const storeRows = [
  { store: "Parent Store", expected: 7000, earned: 6200, approved: 6000, paid: 4300 },
  { store: "Child Store 1", expected: 4200, earned: 3800, approved: 3600, paid: 2600 },
  { store: "Child Store 2", expected: 2785, earned: 2420, approved: 2300, paid: 1600 },
];


const BreakdownTable = ({
  title, keyLabel, rows, keyField,
}: {
  title: string;
  keyLabel: string;
  keyField: string;
  rows: Array<Record<string, string | number>>;
}) => {
  const sum = (f: string) => rows.reduce((s, r) => s + Number(r[f] || 0), 0);
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">{title}</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{keyLabel}</TableHead>
              <TableHead className="text-right">Expected</TableHead>
              <TableHead className="text-right">Earned</TableHead>
              <TableHead className="text-right">Approved</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={String(r[keyField])}>
                <TableCell className="font-medium">{r[keyField]}</TableCell>
                <TableCell className="text-right font-mono">{fmt(Number(r.expected))}</TableCell>
                <TableCell className="text-right font-mono">{fmt(Number(r.earned))}</TableCell>
                <TableCell className="text-right font-mono">{fmt(Number(r.approved))}</TableCell>
                <TableCell className="text-right font-mono">{fmt(Number(r.paid))}</TableCell>
                <TableCell className="text-right font-mono font-semibold">{fmt(Number(r.approved) - Number(r.paid))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex justify-end gap-6 px-4 py-3 border-t border-border bg-muted/30 text-sm font-semibold">
          <span>Expected: {fmt(sum("expected"))}</span>
          <span>Paid: {fmt(sum("paid"))}</span>
          <span>Outstanding: {fmt(sum("approved") - sum("paid"))}</span>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Main Page ---
export const RebateReportsPage = () => {
  const [activeTab, setActiveTab] = useState("by-program");

  const expected = providerRows.reduce((s, r) => s + r.expected, 0);
  const earned = providerRows.reduce((s, r) => s + r.earned, 0);
  const approved = providerRows.reduce((s, r) => s + r.approved, 0);
  const paid = providerRows.reduce((s, r) => s + r.paid, 0);

  const topCards = [
    { label: "Expected", value: expected },
    { label: "Earned", value: earned },
    { label: "Approved", value: approved },
    { label: "Paid", value: paid },
    { label: "Outstanding", value: approved - paid },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Rebate Reports</h2>
        <p className="text-sm text-muted-foreground">Rebate amounts broken down by program, item, provider and store</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {topCards.map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-xl font-bold text-foreground">{fmt(c.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
          <TabsTrigger value="by-program" className="flex items-center gap-1.5 text-xs px-3 py-1.5">
            <Gift className="h-3.5 w-3.5" /> By Program
          </TabsTrigger>
          <TabsTrigger value="by-item" className="flex items-center gap-1.5 text-xs px-3 py-1.5">
            <Tag className="h-3.5 w-3.5" /> By Item / Category
          </TabsTrigger>
          <TabsTrigger value="by-provider" className="flex items-center gap-1.5 text-xs px-3 py-1.5">
            <Building2 className="h-3.5 w-3.5" /> By Provider
          </TabsTrigger>
          <TabsTrigger value="by-store" className="flex items-center gap-1.5 text-xs px-3 py-1.5">
            <Store className="h-3.5 w-3.5" /> By Store
          </TabsTrigger>
        </TabsList>

        <TabsContent value="by-program" className="mt-6">
          <ByPrograms />
        </TabsContent>

        <TabsContent value="by-item" className="mt-6">
          <ByItemCategory />
        </TabsContent>

        <TabsContent value="by-provider" className="mt-6">
          <BreakdownTable title="Rebates by Provider" keyLabel="Provider" keyField="provider" rows={providerRows} />
        </TabsContent>

        <TabsContent value="by-store" className="mt-6">
          <BreakdownTable title="Rebates by Store" keyLabel="Store" keyField="store" rows={storeRows} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
