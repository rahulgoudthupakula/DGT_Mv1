import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Download, Printer, Search, Users, DollarSign, AlertTriangle, Clock, X } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  accountNo: string;
  creditLimit: number;
  currentBalance: number;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90plus: number;
  lastPaymentDate: string;
  status: "Active" | "Overdue" | "Blocked" | "Closed";
}

interface Transaction {
  date: string;
  type: "Sale" | "Payment" | "Adjustment";
  reference: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

const mockCustomers: Customer[] = [
  { id: "1", name: "Johnson Construction", accountNo: "CA-1001", creditLimit: 5000, currentBalance: 3250, current: 1200, days1to30: 800, days31to60: 750, days61to90: 500, days90plus: 0, lastPaymentDate: "2026-02-05", status: "Active" },
  { id: "2", name: "Metro Fleet Services", accountNo: "CA-1002", creditLimit: 10000, currentBalance: 8750, current: 2000, days1to30: 1500, days31to60: 2250, days61to90: 1500, days90plus: 1500, lastPaymentDate: "2026-01-15", status: "Overdue" },
  { id: "3", name: "Valley Landscaping", accountNo: "CA-1003", creditLimit: 3000, currentBalance: 2900, current: 500, days1to30: 400, days31to60: 600, days61to90: 800, days90plus: 600, lastPaymentDate: "2025-12-20", status: "Blocked" },
  { id: "4", name: "Quick Courier LLC", accountNo: "CA-1004", creditLimit: 7500, currentBalance: 1200, current: 1200, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0, lastPaymentDate: "2026-02-08", status: "Active" },
  { id: "5", name: "Sunrise Farms", accountNo: "CA-1005", creditLimit: 4000, currentBalance: 0, current: 0, days1to30: 0, days31to60: 0, days61to90: 0, days90plus: 0, lastPaymentDate: "2026-02-01", status: "Active" },
  { id: "6", name: "Harbor Logistics", accountNo: "CA-1006", creditLimit: 6000, currentBalance: 4500, current: 1000, days1to30: 1200, days31to60: 1300, days61to90: 500, days90plus: 500, lastPaymentDate: "2026-01-10", status: "Overdue" },
];

const mockTransactions: Transaction[] = [
  { date: "2026-02-08", type: "Payment", reference: "CHK-4421", debit: 0, credit: 500, runningBalance: 3250 },
  { date: "2026-02-06", type: "Sale", reference: "POS-8812", debit: 185.40, credit: 0, runningBalance: 3750 },
  { date: "2026-02-03", type: "Sale", reference: "POS-8790", debit: 224.60, credit: 0, runningBalance: 3564.60 },
  { date: "2026-01-30", type: "Payment", reference: "CHK-4398", debit: 0, credit: 1000, runningBalance: 3340 },
  { date: "2026-01-28", type: "Sale", reference: "POS-8755", debit: 312.00, credit: 0, runningBalance: 4340 },
  { date: "2026-01-25", type: "Adjustment", reference: "ADJ-112", debit: 0, credit: 28.00, runningBalance: 4028 },
  { date: "2026-01-22", type: "Sale", reference: "POS-8710", debit: 456.00, credit: 0, runningBalance: 4056 },
  { date: "2026-01-18", type: "Sale", reference: "POS-8688", debit: 198.50, credit: 0, runningBalance: 3600 },
];

export function CustomerAccountsPage() {
  const [dateFrom, setDateFrom] = useState("2026-02-01");
  const [dateTo, setDateTo] = useState("2026-02-11");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [agingFilter, setAgingFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all" || agingFilter !== "all";
  const clearFilters = () => { setSearchQuery(""); setStatusFilter("all"); setAgingFilter("all"); };

  const totalOutstanding = mockCustomers.reduce((s, c) => s + c.currentBalance, 0);
  const totalCurrent = mockCustomers.reduce((s, c) => s + c.current, 0);
  const overdue30 = mockCustomers.reduce((s, c) => s + c.days1to30 + c.days31to60 + c.days61to90 + c.days90plus, 0);
  const overdue60 = mockCustomers.reduce((s, c) => s + c.days31to60 + c.days61to90 + c.days90plus, 0);
  const overdue90 = mockCustomers.reduce((s, c) => s + c.days90plus, 0);

  const filtered = mockCustomers.filter(c => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.accountNo.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (agingFilter === "current" && c.currentBalance !== c.current) return false;
    if (agingFilter === "30" && c.days1to30 === 0) return false;
    if (agingFilter === "60" && c.days31to60 === 0) return false;
    if (agingFilter === "90" && c.days90plus === 0) return false;
    return true;
  });

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Active: "bg-emerald-100 text-emerald-800",
      Overdue: "bg-amber-100 text-amber-800",
      Blocked: "bg-red-100 text-red-800",
      Closed: "bg-muted text-muted-foreground",
    };
    return <Badge className={variants[status] || ""}>{status}</Badge>;
  };

  const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Customer Account Reports</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Export</Button>
          <Button variant="outline" size="sm"><Printer className="h-4 w-4 mr-1" /> Print Statement</Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-muted-foreground">From</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">To</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Customer / Account #</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8 w-48" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Aging Bucket</label>
              <Select value={agingFilter} onValueChange={setAgingFilter}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="30">30+</SelectItem>
                  <SelectItem value="60">60+</SelectItem>
                  <SelectItem value="90">90+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-9 text-xs gap-1 text-muted-foreground self-end" onClick={clearFilters}>
                <X className="w-3.5 h-3.5" />Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-bold text-foreground">{fmt(totalOutstanding)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Current Balance</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-bold text-foreground">{fmt(totalCurrent)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Overdue 30+</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-bold text-amber-600">{fmt(overdue30)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Overdue 60+</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-bold text-orange-600">{fmt(overdue60)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Overdue 90+</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl font-bold text-red-600">{fmt(overdue90)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Account Summary</TabsTrigger>
          <TabsTrigger value="aging">Aging Report</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Account #</TableHead>
                    <TableHead className="text-right">Credit Limit</TableHead>
                    <TableHead className="text-right">Current Balance</TableHead>
                    <TableHead className="text-right">Available Credit</TableHead>
                    <TableHead>Last Payment</TableHead>
                    <TableHead>Aging</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(c => {
                    const aging = c.days90plus > 0 ? "90+" : c.days61to90 > 0 ? "61-90" : c.days31to60 > 0 ? "31-60" : c.days1to30 > 0 ? "1-30" : "Current";
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.accountNo}</TableCell>
                        <TableCell className="text-right">{fmt(c.creditLimit)}</TableCell>
                        <TableCell className="text-right">{fmt(c.currentBalance)}</TableCell>
                        <TableCell className="text-right">{fmt(c.creditLimit - c.currentBalance)}</TableCell>
                        <TableCell>{c.lastPaymentDate}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={aging === "90+" ? "border-red-300 text-red-700" : aging === "Current" ? "border-emerald-300 text-emerald-700" : "border-amber-300 text-amber-700"}>
                            {aging}
                          </Badge>
                        </TableCell>
                        <TableCell>{statusBadge(c.status)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(c)}>View</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aging">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-right">1–30 Days</TableHead>
                    <TableHead className="text-right">31–60 Days</TableHead>
                    <TableHead className="text-right">61–90 Days</TableHead>
                    <TableHead className="text-right">90+ Days</TableHead>
                    <TableHead className="text-right">Total Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(c => (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedCustomer(c)}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-right">{fmt(c.current)}</TableCell>
                      <TableCell className="text-right">{fmt(c.days1to30)}</TableCell>
                      <TableCell className="text-right">{fmt(c.days31to60)}</TableCell>
                      <TableCell className="text-right">{fmt(c.days61to90)}</TableCell>
                      <TableCell className="text-right font-medium text-red-600">{fmt(c.days90plus)}</TableCell>
                      <TableCell className="text-right font-bold">{fmt(c.currentBalance)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/30 font-bold">
                    <TableCell>TOTAL</TableCell>
                    <TableCell className="text-right">{fmt(totalCurrent)}</TableCell>
                    <TableCell className="text-right">{fmt(mockCustomers.reduce((s, c) => s + c.days1to30, 0))}</TableCell>
                    <TableCell className="text-right">{fmt(mockCustomers.reduce((s, c) => s + c.days31to60, 0))}</TableCell>
                    <TableCell className="text-right">{fmt(mockCustomers.reduce((s, c) => s + c.days61to90, 0))}</TableCell>
                    <TableCell className="text-right text-red-600">{fmt(overdue90)}</TableCell>
                    <TableCell className="text-right">{fmt(totalOutstanding)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction Ledger Drawer */}
      <Sheet open={!!selectedCustomer} onOpenChange={open => !open && setSelectedCustomer(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {selectedCustomer && (
            <>
              <SheetHeader>
                <SheetTitle>Transaction Ledger — {selectedCustomer.name}</SheetTitle>
                <p className="text-sm text-muted-foreground">Account: {selectedCustomer.accountNo} · Credit Limit: {fmt(selectedCustomer.creditLimit)} · Balance: {fmt(selectedCustomer.currentBalance)}</p>
              </SheetHeader>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Available Credit</p>
                  <p className="text-lg font-bold">{fmt(selectedCustomer.creditLimit - selectedCustomer.currentBalance)}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="mt-1">{statusBadge(selectedCustomer.status)}</div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold text-sm mb-3">Aging Breakdown</h4>
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  {[
                    { label: "Current", val: selectedCustomer.current },
                    { label: "1-30", val: selectedCustomer.days1to30 },
                    { label: "31-60", val: selectedCustomer.days31to60 },
                    { label: "61-90", val: selectedCustomer.days61to90 },
                    { label: "90+", val: selectedCustomer.days90plus },
                  ].map(b => (
                    <div key={b.label} className="bg-muted/40 rounded p-2">
                      <p className="text-muted-foreground">{b.label}</p>
                      <p className="font-semibold">{fmt(b.val)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold text-sm mb-3">Transactions</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTransactions.map((t, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{t.date}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={t.type === "Payment" ? "border-emerald-300 text-emerald-700" : t.type === "Adjustment" ? "border-blue-300 text-blue-700" : ""}>
                            {t.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{t.reference}</TableCell>
                        <TableCell className="text-right">{t.debit > 0 ? fmt(t.debit) : "—"}</TableCell>
                        <TableCell className="text-right">{t.credit > 0 ? fmt(t.credit) : "—"}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(t.runningBalance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
