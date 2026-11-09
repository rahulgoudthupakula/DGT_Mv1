import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Search,
  FileText,
  Eye,
  Download,
  ArrowLeft,
  Filter,
} from "lucide-react";

interface InvoiceItem {
  id: string;
  itemName: string;
  scanCode: string;
  orderedQty: number;
  receivedQty: number;
  invoicedQty: number;
  unitCost: number;
  extendedCost: number;
  tax: number;
  total: number;
  poMatch: boolean;
  receivingMatch: boolean;
  priceMatch: boolean;
}

interface Invoice {
  id: string;
  vendorName: string;
  vendorAddress: string;
  vendorPhone: string;
  salesRepName: string;
  driverName: string;
  driverNumber: string;
  routeId: string;
  deliveryDateTime: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  poNumber: string;
  receivingId: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  termsNet: string;
  status: "Draft" | "Matched" | "Approved" | "Posted";
  subtotal: number;
  tax: number;
  otherCharges: number;
  total: number;
  paymentStatus: "Unpaid" | "Partial" | "Paid";
  createdBy: string;
  approvedBy: string | null;
  createdAt: string;
  approvedAt: string | null;
}

const mockInvoices: Invoice[] = [
  {
    id: "INV-001",
    vendorName: "ABC Distributors",
    vendorAddress: "123 Supply Chain Blvd, Chicago, IL 60601",
    vendorPhone: "(312) 555-0100",
    salesRepName: "Michael Chen",
    driverName: "Robert Wilson",
    driverNumber: "DRV-4521",
    routeId: "RT-CHI-15",
    deliveryDateTime: "2024-01-20 08:30 AM",
    invoiceNumber: "INV-2024-0156",
    invoiceDate: "2024-01-20",
    dueDate: "2024-02-20",
    poNumber: "PO-2024-089",
    receivingId: "RCV-001",
    customerId: "CUST-001",
    customerName: "Main Street Market",
    customerAddress: "456 Main Street, Springfield, IL 62701",
    customerPhone: "(217) 555-0200",
    termsNet: "Net 30",
    status: "Draft",
    subtotal: 1250.0,
    tax: 87.5,
    otherCharges: 45.0,
    total: 1382.5,
    paymentStatus: "Unpaid",
    createdBy: "John Smith",
    approvedBy: null,
    createdAt: "2024-01-20 09:30",
    approvedAt: null,
  },
  {
    id: "INV-002",
    vendorName: "Fresh Foods Co",
    vendorAddress: "789 Produce Way, Milwaukee, WI 53201",
    vendorPhone: "(414) 555-0300",
    salesRepName: "Sarah Johnson",
    driverName: "James Martinez",
    driverNumber: "DRV-7832",
    routeId: "RT-MKE-08",
    deliveryDateTime: "2024-01-19 07:00 AM",
    invoiceNumber: "FF-89012",
    invoiceDate: "2024-01-19",
    dueDate: "2024-02-19",
    poNumber: "PO-2024-087",
    receivingId: "RCV-002",
    customerId: "CUST-001",
    customerName: "Main Street Market",
    customerAddress: "456 Main Street, Springfield, IL 62701",
    customerPhone: "(217) 555-0200",
    termsNet: "Net 15",
    status: "Matched",
    subtotal: 2340.0,
    tax: 163.8,
    otherCharges: 0,
    total: 2503.8,
    paymentStatus: "Unpaid",
    createdBy: "Jane Doe",
    approvedBy: null,
    createdAt: "2024-01-19 14:15",
    approvedAt: null,
  },
  {
    id: "INV-003",
    vendorName: "Quality Supplies",
    vendorAddress: "321 Industrial Park, Detroit, MI 48201",
    vendorPhone: "(313) 555-0400",
    salesRepName: "David Lee",
    driverName: "Chris Thompson",
    driverNumber: "DRV-2198",
    routeId: "RT-DET-22",
    deliveryDateTime: "2024-01-18 09:15 AM",
    invoiceNumber: "QS-45678",
    invoiceDate: "2024-01-18",
    dueDate: "2024-02-18",
    poNumber: "PO-2024-085",
    receivingId: "RCV-003",
    customerId: "CUST-001",
    customerName: "Main Street Market",
    customerAddress: "456 Main Street, Springfield, IL 62701",
    customerPhone: "(217) 555-0200",
    termsNet: "Net 30",
    status: "Approved",
    subtotal: 890.0,
    tax: 62.3,
    otherCharges: 25.0,
    total: 977.3,
    paymentStatus: "Partial",
    createdBy: "Mike Johnson",
    approvedBy: "Sarah Manager",
    createdAt: "2024-01-18 11:00",
    approvedAt: "2024-01-19 10:00",
  },
  {
    id: "INV-004",
    vendorName: "Metro Wholesale",
    vendorAddress: "555 Commerce Drive, Indianapolis, IN 46201",
    vendorPhone: "(317) 555-0500",
    salesRepName: "Emily Brown",
    driverName: "Kevin Davis",
    driverNumber: "DRV-6743",
    routeId: "RT-IND-11",
    deliveryDateTime: "2024-01-17 06:45 AM",
    invoiceNumber: "MW-2024-445",
    invoiceDate: "2024-01-17",
    dueDate: "2024-02-17",
    poNumber: "PO-2024-082",
    receivingId: "RCV-004",
    customerId: "CUST-001",
    customerName: "Main Street Market",
    customerAddress: "456 Main Street, Springfield, IL 62701",
    customerPhone: "(217) 555-0200",
    termsNet: "Net 45",
    status: "Posted",
    subtotal: 3450.0,
    tax: 241.5,
    otherCharges: 50.0,
    total: 3741.5,
    paymentStatus: "Paid",
    createdBy: "Jane Doe",
    approvedBy: "Sarah Manager",
    createdAt: "2024-01-17 08:00",
    approvedAt: "2024-01-17 16:00",
  },
  {
    id: "INV-005",
    vendorName: "ABC Distributors",
    vendorAddress: "123 Supply Chain Blvd, Chicago, IL 60601",
    vendorPhone: "(312) 555-0100",
    salesRepName: "Michael Chen",
    driverName: "Robert Wilson",
    driverNumber: "DRV-4521",
    routeId: "RT-CHI-15",
    deliveryDateTime: "2024-01-15 08:00 AM",
    invoiceNumber: "INV-2024-0155",
    invoiceDate: "2024-01-15",
    dueDate: "2024-02-15",
    poNumber: "PO-2024-078",
    receivingId: "RCV-005",
    customerId: "CUST-001",
    customerName: "Main Street Market",
    customerAddress: "456 Main Street, Springfield, IL 62701",
    customerPhone: "(217) 555-0200",
    termsNet: "Net 30",
    status: "Approved",
    subtotal: 1890.0,
    tax: 132.3,
    otherCharges: 0,
    total: 2022.3,
    paymentStatus: "Unpaid",
    createdBy: "John Smith",
    approvedBy: "Sarah Manager",
    createdAt: "2024-01-15 10:30",
    approvedAt: "2024-01-16 09:00",
  },
];

const mockInvoiceItems: InvoiceItem[] = [
  {
    id: "1",
    itemName: "Organic Milk 1L",
    scanCode: "123456789",
    orderedQty: 24,
    receivedQty: 24,
    invoicedQty: 24,
    unitCost: 3.99,
    extendedCost: 95.76,
    tax: 6.7,
    total: 102.46,
    poMatch: true,
    receivingMatch: true,
    priceMatch: true,
  },
  {
    id: "2",
    itemName: "Whole Wheat Bread",
    scanCode: "234567890",
    orderedQty: 48,
    receivedQty: 45,
    invoicedQty: 48,
    unitCost: 2.49,
    extendedCost: 119.52,
    tax: 0,
    total: 119.52,
    poMatch: true,
    receivingMatch: false,
    priceMatch: true,
  },
  {
    id: "3",
    itemName: "Fresh Orange Juice",
    scanCode: "345678901",
    orderedQty: 36,
    receivedQty: 36,
    invoicedQty: 36,
    unitCost: 4.99,
    extendedCost: 179.64,
    tax: 12.57,
    total: 192.21,
    poMatch: true,
    receivingMatch: true,
    priceMatch: false,
  },
  {
    id: "4",
    itemName: "Cheddar Cheese 500g",
    scanCode: "456789012",
    orderedQty: 20,
    receivedQty: 20,
    invoicedQty: 20,
    unitCost: 6.99,
    extendedCost: 139.8,
    tax: 9.79,
    total: 149.59,
    poMatch: true,
    receivingMatch: true,
    priceMatch: true,
  },
];

export const ViewInvoice = () => {
  const [invoices] = useState<Invoice[]>(mockInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceItems] = useState<InvoiceItem[]>(mockInvoiceItems);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.poNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Invoice["status"]) => {
    const styles = {
      Draft: "bg-muted text-muted-foreground",
      Matched: "bg-blue-100 text-blue-800",
      Approved: "bg-green-100 text-green-800",
      Posted: "bg-purple-100 text-purple-800",
    };
    return <Badge className={styles[status]}>{status}</Badge>;
  };

  const getPaymentBadge = (status: Invoice["paymentStatus"]) => {
    const styles = {
      Unpaid: "bg-red-100 text-red-800",
      Partial: "bg-yellow-100 text-yellow-800",
      Paid: "bg-green-100 text-green-800",
    };
    return <Badge className={styles[status]}>{status}</Badge>;
  };

  const hasQtyMismatch = (item: InvoiceItem) =>
    item.orderedQty !== item.invoicedQty || item.receivedQty !== item.invoicedQty;

  const hasPriceMismatch = (item: InvoiceItem) => !item.priceMatch;


  // Detail view
  if (selectedInvoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3 border-b">
            <div className="flex items-start justify-between mb-4">
              <div>
                <CardTitle className="text-lg">
                  Invoice #{selectedInvoice.invoiceNumber}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedInvoice.invoiceDate}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedInvoice.status)}
                {getPaymentBadge(selectedInvoice.paymentStatus)}
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              {/* Vendor Information */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vendor Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Vendor Name</p>
                    <p className="font-medium">{selectedInvoice.vendorName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Vendor Address</p>
                    <p className="font-medium">{selectedInvoice.vendorAddress}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Vendor Phone</p>
                    <p className="font-medium">{selectedInvoice.vendorPhone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Sales Representative</p>
                    <p className="font-medium">{selectedInvoice.salesRepName}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Delivery Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Delivery Date & Time</p>
                    <p className="font-medium">{selectedInvoice.deliveryDateTime}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Driver Name</p>
                    <p className="font-medium">{selectedInvoice.driverName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Driver Number</p>
                    <p className="font-medium">{selectedInvoice.driverNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Route ID</p>
                    <p className="font-medium">{selectedInvoice.routeId}</p>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Customer ID</p>
                    <p className="font-medium">{selectedInvoice.customerId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Customer Name</p>
                    <p className="font-medium">{selectedInvoice.customerName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Customer Address</p>
                    <p className="font-medium">{selectedInvoice.customerAddress}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Customer Phone</p>
                    <p className="font-medium">{selectedInvoice.customerPhone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Details Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Invoice Number</p>
                <p className="text-sm font-medium">{selectedInvoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Purchase Order Number</p>
                <p className="text-sm font-medium">{selectedInvoice.poNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Receiving ID</p>
                <p className="text-sm font-medium">{selectedInvoice.receivingId}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Terms</p>
                <p className="text-sm font-medium">{selectedInvoice.termsNet}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Invoice Date</p>
                <p className="text-sm font-medium">{selectedInvoice.invoiceDate}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Due Date</p>
                <p className="text-sm font-medium">{selectedInvoice.dueDate}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created By</p>
                <p className="text-sm font-medium">{selectedInvoice.createdBy}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Approved By</p>
                <p className="text-sm font-medium">{selectedInvoice.approvedBy ?? "—"}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">

            {/* Line Items */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Invoice Line Items</h3>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">Item Name</TableHead>
                      <TableHead className="text-xs">Scan Code</TableHead>
                      <TableHead className="text-xs text-center">Ordered</TableHead>
                      <TableHead className="text-xs text-center">Received</TableHead>
                      <TableHead className="text-xs text-center">Invoiced</TableHead>
                      <TableHead className="text-xs text-right">Unit Cost</TableHead>
                      <TableHead className="text-xs text-right">Extended</TableHead>
                      <TableHead className="text-xs text-right">Tax</TableHead>
                      <TableHead className="text-xs text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceItems.map((item) => (
                      <TableRow
                        key={item.id}
                        className={cn(
                          hasQtyMismatch(item) || hasPriceMismatch(item)
                            ? "bg-red-50/50"
                            : ""
                        )}
                      >
                        <TableCell className="text-xs font-medium">{item.itemName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{item.scanCode}</TableCell>
                        <TableCell className="text-xs text-center">{item.orderedQty}</TableCell>
                        <TableCell className={cn("text-xs text-center", item.receivedQty !== item.orderedQty ? "text-red-600 font-medium" : "")}>{item.receivedQty}</TableCell>
                        <TableCell className={cn("text-xs text-center", item.invoicedQty !== item.orderedQty ? "text-red-600 font-medium" : "")}>{item.invoicedQty}</TableCell>
                        <TableCell className="text-xs text-right">${item.unitCost.toFixed(2)}</TableCell>
                        <TableCell className="text-xs text-right">${item.extendedCost.toFixed(2)}</TableCell>
                        <TableCell className="text-xs text-right">${item.tax.toFixed(2)}</TableCell>
                        <TableCell className="text-xs text-right font-medium">${item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${selectedInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${selectedInvoice.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Other Charges</span>
                  <span>${selectedInvoice.otherCharges.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t pt-2">
                  <span>Total</span>
                  <span>${selectedInvoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Audit Trail */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Audit Trail</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="w-32">Created</span>
                  <span>{selectedInvoice.createdAt}</span>
                  <span>by {selectedInvoice.createdBy}</span>
                </div>
                {selectedInvoice.approvedAt && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="w-32">Approved</span>
                    <span>{selectedInvoice.approvedAt}</span>
                    <span>by {selectedInvoice.approvedBy}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">View Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">Read-only view of all invoices</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendor, invoice #, PO..."
                className="pl-9 h-8 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <Filter className="h-3.5 w-3.5 mr-1" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Matched">Matched</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Posted">Posted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">All Invoices</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs font-semibold">Purchase Order Number</TableHead>
                <TableHead className="text-xs font-semibold">Invoice #</TableHead>
                <TableHead className="text-xs font-semibold">Vendor</TableHead>
                <TableHead className="text-xs font-semibold">Date</TableHead>
                <TableHead className="text-xs font-semibold">Due Date</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="text-xs font-semibold">Payment</TableHead>
                <TableHead className="text-xs font-semibold text-right">Total</TableHead>
                <TableHead className="text-xs font-semibold text-center">View Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="text-xs hover:bg-muted/20">
                  <TableCell className="font-medium">{invoice.poNumber}</TableCell>
                  <TableCell>{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.vendorName}</TableCell>
                  <TableCell>{invoice.invoiceDate}</TableCell>
                  <TableCell>{invoice.dueDate}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>{getPaymentBadge(invoice.paymentStatus)}</TableCell>
                  <TableCell className="text-right font-medium">${invoice.total.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedInvoice(invoice)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
