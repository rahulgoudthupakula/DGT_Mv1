import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/backend";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  FileText,
  CreditCard,
  TrendingUp,
  Gift,
  User,
  DollarSign,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppNavigation } from "@/contexts/NavigationContext";

const fmt = (_n: number) => "";

/* ── Mock data ──────────────────────────────────── */

interface VendorInvoice {
  date: string;
  invoiceNumber: string;
  invoiceAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: "Paid" | "Partial" | "Unpaid";
  dueDate: string;
}

interface PaymentRecord {
  date: string;
  invoiceNumber: string;
  method: string;
  amount: number;
  reference: string;
}

const vendorProfiles: Record<string, {
  id: string;
  name: string;
  type: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  paymentTerms: string;
  rating: number;
  totalPurchases: number;
  outstandingBalance: number;
  rebatePrograms: string[];
}> = {
  "McLane Co.": {
    id: "V-MCL", name: "McLane Co.", type: "Grocery / General",
    contactName: "David Richardson", phone: "(555) 234-8900", email: "david.r@mclane.com",
    address: "4747 McLane Pkwy, Temple, TX 76504",
    paymentTerms: "Net 30", rating: 4.5, totalPurchases: 48750.50, outstandingBalance: 114.70,
    rebatePrograms: ["Quarterly Volume Rebate", "Annual Growth Incentive"],
  },
  "Core-Mark": {
    id: "V-CMK", name: "Core-Mark", type: "Convenience / Tobacco",
    contactName: "Sarah Kim", phone: "(555) 345-6712", email: "sarah.k@coremark.com",
    address: "1500 Solana Blvd, Westlake, TX 76262",
    paymentTerms: "Net 15", rating: 4.2, totalPurchases: 44638.00, outstandingBalance: 123.40,
    rebatePrograms: ["Tobacco Quarterly Rebate"],
  },
  "S&P Distributors": {
    id: "V-SNP", name: "S&P Distributors", type: "Specialty / Snacks",
    contactName: "Mike Torres", phone: "(555) 456-2233", email: "mike@spdist.com",
    address: "220 Distribution Way, Pittsburgh, PA 15201",
    paymentTerms: "Net 30", rating: 4.0, totalPurchases: 32108.00, outstandingBalance: 90.30,
    rebatePrograms: [],
  },
  "Pepsi Beverages": {
    id: "V-PEP", name: "Pepsi Beverages", type: "Beverage",
    contactName: "Lisa Chang", phone: "(555) 567-8899", email: "lisa.c@pepsibev.com",
    address: "700 Anderson Hill Rd, Purchase, NY 10577",
    paymentTerms: "Net 30", rating: 4.6, totalPurchases: 28609.00, outstandingBalance: 80.30,
    rebatePrograms: ["Beverage Volume Program", "Cooler Placement Rebate"],
  },
  "Frito-Lay": {
    id: "V-FRL", name: "Frito-Lay", type: "Snacks",
    contactName: "Tom Bradley", phone: "(555) 678-1100", email: "tom.b@fritolay.com",
    address: "7701 Legacy Dr, Plano, TX 75024",
    paymentTerms: "Net 30", rating: 4.3, totalPurchases: 19755.00, outstandingBalance: 55.20,
    rebatePrograms: ["Snack Rack Incentive"],
  },
};

const defaultProfile = {
  id: "V-UNK", name: "Unknown Vendor", type: "General",
  contactName: "N/A", phone: "N/A", email: "N/A", address: "N/A",
  paymentTerms: "N/A", rating: 0, totalPurchases: 0, outstandingBalance: 0,
  rebatePrograms: [],
};

const mockInvoices: Record<string, VendorInvoice[]> = {
  "McLane Co.": [
    { date: "02/02/2026", invoiceNumber: "INV-20260202-001", invoiceAmount: 2520.30, paidAmount: 2520.30, pendingAmount: 69.50, status: "Partial", dueDate: "02/16/2026" },
    { date: "02/04/2026", invoiceNumber: "INV-20260204-001", invoiceAmount: 1625.40, paidAmount: 1625.40, pendingAmount: 45.20, status: "Partial", dueDate: "02/18/2026" },
    { date: "02/08/2026", invoiceNumber: "INV-20260208-001", invoiceAmount: 702.80, paidAmount: 702.80, pendingAmount: 0, status: "Paid", dueDate: "02/22/2026" },
  ],
  "Core-Mark": [
    { date: "02/02/2026", invoiceNumber: "INV-20260202-002", invoiceAmount: 915.60, paidAmount: 915.60, pendingAmount: 25.20, status: "Partial", dueDate: "02/16/2026" },
    { date: "02/07/2026", invoiceNumber: "INV-20260207-001", invoiceAmount: 3548.20, paidAmount: 3548.20, pendingAmount: 98.20, status: "Partial", dueDate: "02/21/2026" },
  ],
  "S&P Distributors": [
    { date: "02/03/2026", invoiceNumber: "INV-20260203-001", invoiceAmount: 3210.80, paidAmount: 3210.80, pendingAmount: 90.30, status: "Partial", dueDate: "02/17/2026" },
  ],
  "Pepsi Beverages": [
    { date: "02/05/2026", invoiceNumber: "INV-20260205-001", invoiceAmount: 2860.90, paidAmount: 2860.90, pendingAmount: 80.30, status: "Partial", dueDate: "02/19/2026" },
  ],
  "Frito-Lay": [
    { date: "02/06/2026", invoiceNumber: "INV-20260206-001", invoiceAmount: 1975.50, paidAmount: 1975.50, pendingAmount: 55.20, status: "Partial", dueDate: "02/20/2026" },
  ],
};

const mockPayments: Record<string, PaymentRecord[]> = {
  "McLane Co.": [
    { date: "02/02/2026", invoiceNumber: "INV-20260202-001", method: "Cash", amount: 500.00, reference: "RCP-0201" },
    { date: "02/02/2026", invoiceNumber: "INV-20260202-001", method: "EFT", amount: 1520.30, reference: "EFT-44821" },
    { date: "02/02/2026", invoiceNumber: "INV-20260202-001", method: "Bank", amount: 500.00, reference: "BNK-9920" },
    { date: "02/04/2026", invoiceNumber: "INV-20260204-001", method: "EFT", amount: 625.40, reference: "EFT-44910" },
    { date: "02/04/2026", invoiceNumber: "INV-20260204-001", method: "Bank", amount: 1000.00, reference: "BNK-9935" },
    { date: "02/08/2026", invoiceNumber: "INV-20260208-001", method: "Cash", amount: 202.80, reference: "RCP-0208" },
    { date: "02/08/2026", invoiceNumber: "INV-20260208-001", method: "EFT", amount: 500.00, reference: "EFT-45012" },
  ],
  "Core-Mark": [
    { date: "02/02/2026", invoiceNumber: "INV-20260202-002", method: "EFT", amount: 915.60, reference: "EFT-44822" },
    { date: "02/07/2026", invoiceNumber: "INV-20260207-001", method: "Cash", amount: 1048.20, reference: "RCP-0207" },
    { date: "02/07/2026", invoiceNumber: "INV-20260207-001", method: "EFT", amount: 2000.00, reference: "EFT-44998" },
    { date: "02/07/2026", invoiceNumber: "INV-20260207-001", method: "Bank", amount: 500.00, reference: "BNK-9940" },
  ],
};

const statusVariant = (s: "Paid" | "Partial" | "Unpaid") => {
  switch (s) {
    case "Paid": return "default" as const;
    case "Partial": return "secondary" as const;
    case "Unpaid": return "destructive" as const;
  }
};

/* ── Component ──────────────────────────────────── */

interface VendorProfileProps {
  storeId:string; vendorId?:string;
  vendorName: string;
  onBack: () => void;
}

export const VendorProfile = ({ vendorName, onBack,storeId,vendorId }: VendorProfileProps) => {
  const [activeTab, setActiveTab] = useState("invoices");
  const { navigateTo } = useAppNavigation();

  const query=useQuery({queryKey:['vendors',storeId],queryFn:()=>request<{id:number;name:string;email:string;phone:string;paymentTerms:string;contactName:string}[]>(`/access/stores/${encodeURIComponent(storeId)}/vendors`)});
  const vendor=query.data?.find(v=>String(v.id)===vendorId);
  const profile={...defaultProfile,id:vendorId??'',name:vendor?.name??vendorName,type:'',contactName:vendor?.contactName??'',phone:vendor?.phone??'',email:vendor?.email??'',address:'',paymentTerms:vendor?.paymentTerms??''};
  const invoices:VendorInvoice[]=[];const payments:PaymentRecord[]=[];
  const invoiceTotals = invoices.reduce(
    (acc, inv) => ({
      invoiceAmount: acc.invoiceAmount + inv.invoiceAmount,
      paidAmount: acc.paidAmount + inv.paidAmount,
      pendingAmount: acc.pendingAmount + inv.pendingAmount,
    }),
    { invoiceAmount: 0, paidAmount: 0, pendingAmount: 0 }
  );

  return (
    <div className="space-y-5">
      {query.error&&<p role="alert">{query.error.message}</p>}{query.isPending&&<p>Loading vendor…</p>}
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={onBack}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <div>
          <h2 className="text-lg font-bold">{profile.name}</h2>
          <p className="text-xs text-muted-foreground">{profile.type} • {profile.id}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">{fmt(profile.totalPurchases)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Purchases</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[hsl(var(--warning))]/10">
              <Clock className="h-4 w-4 text-[hsl(var(--warning))]" />
            </div>
            <div>
              <p className={cn("text-lg font-bold", profile.outstandingBalance > 0 ? "text-[hsl(var(--warning))]" : "text-[hsl(var(--success))]")}>
                {fmt(profile.outstandingBalance)}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Outstanding Balance</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[hsl(var(--success))]/10">
              <FileText className="h-4 w-4 text-[hsl(var(--success))]" />
            </div>
            <div>
              <p className="text-lg font-bold"></p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Invoices</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">{profile.paymentTerms}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Payment Terms</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact info strip */}
      <Card>
        <CardContent className="p-4 flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{profile.contactName}</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2 text-xs">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{profile.phone}</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2 text-xs">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-primary">{profile.email}</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2 text-xs">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{profile.address}</span>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="invoices" className="text-xs gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="payments" className="text-xs gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            Payment History
          </TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardContent className="pt-5">
              <div className="rounded-md border overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background">
                    <TableRow>
                      <TableHead className="text-[11px]">Date</TableHead>
                      <TableHead className="text-[11px]">Invoice #</TableHead>
                      <TableHead className="text-[11px] text-right">Invoice Amount</TableHead>
                      <TableHead className="text-[11px] text-right">Paid Amount</TableHead>
                      <TableHead className="text-[11px] text-right">Pending</TableHead>
                      <TableHead className="text-[11px] text-center">Status</TableHead>
                      <TableHead className="text-[11px]">Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{inv.date}</TableCell>
                        <TableCell className="text-xs font-medium text-primary">{inv.invoiceNumber}</TableCell>
                        <TableCell className="text-xs text-right font-medium">{fmt(inv.invoiceAmount)}</TableCell>
                        <TableCell className="text-xs text-right">{fmt(inv.paidAmount)}</TableCell>
                        <TableCell className={cn("text-xs text-right font-medium", inv.pendingAmount > 0 ? "text-[hsl(var(--warning))]" : "text-[hsl(var(--success))]")}>
                          {fmt(inv.pendingAmount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={statusVariant(inv.status)} className="text-[10px] px-2 py-0">{inv.status}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">{inv.dueDate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Invoice totals */}
              <div className="flex items-center gap-6 mt-4 pt-3 border-t">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Invoiced</p>
                  <p className="text-sm font-bold">{fmt(invoiceTotals.invoiceAmount)}</p>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Paid</p>
                  <p className="text-sm font-bold text-[hsl(var(--success))]">{fmt(invoiceTotals.paidAmount)}</p>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Pending</p>
                  <p className={cn("text-sm font-bold", invoiceTotals.pendingAmount > 0 ? "text-[hsl(var(--warning))]" : "text-[hsl(var(--success))]")}>
                    {fmt(invoiceTotals.pendingAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardContent className="pt-5">
              <div className="rounded-md border overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background">
                    <TableRow>
                      <TableHead className="text-[11px]">Date</TableHead>
                      <TableHead className="text-[11px]">Invoice #</TableHead>
                      <TableHead className="text-[11px]">Method</TableHead>
                      <TableHead className="text-[11px] text-right">Amount</TableHead>
                      <TableHead className="text-[11px]">Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">
                          No payment records available
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments.map((p, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">{p.date}</TableCell>
                          <TableCell className="text-xs font-medium text-primary">{p.invoiceNumber}</TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className="text-[10px]">{p.method}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-right font-medium">{fmt(p.amount)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{p.reference}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Shortcut links */}
      <Card>
        <CardContent className="p-4">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">Quick Links</h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => navigateTo("Price Book", "Vendor management")}
            >
              <Building2 className="h-3.5 w-3.5" />
              Vendor Contact
            </Button>
            {profile.rebatePrograms.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => navigateTo("Price Book", "Rebate management")}
              >
                <Gift className="h-3.5 w-3.5" />
                Rebate Programs ({profile.rebatePrograms.length})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => navigateTo("Grocery", "Reports")}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Purchase Trends
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
