import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/backend";
import { useState, useEffect, useRef } from "react";
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
  unitType?:string; casePack?:number; msrp?:number|null;
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
  deliveryDate:string; deliveryTime:string; notes:string; freight:number; fuelSurcharge:number; handlingFee:number; discount:number;
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
  status: "Pending" | "Draft" | "Matched" | "Approved" | "Posted";
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

export const ViewInvoice = ({storeId,initialInvoiceId}:{storeId:string;initialInvoiceId?:string}) => {
  const path=`/access/stores/${encodeURIComponent(storeId)}/invoice-entry`;
  const query=useQuery({queryKey:['invoice-entry',storeId],enabled:!!storeId,queryFn:()=>request<{invoices:Partial<Invoice>[];vendors:{name:string}[]}>(path)});
  const invoices:Invoice[]=(query.data?.invoices??[]).map(i=>({deliveryDate:'',deliveryTime:'',notes:'',freight:0,fuelSurcharge:0,handlingFee:0,discount:0,vendorAddress:'',vendorPhone:'',salesRepName:'',driverName:'',driverNumber:'',routeId:'',dueDate:'',poNumber:'',receivingId:'',customerId:'',customerName:'',customerAddress:'',customerPhone:'',termsNet:'',tax:0,otherCharges:0,paymentStatus:'' as Invoice['paymentStatus'],createdBy:'',createdAt:'',approvedBy:null,approvedAt:null,...i,id:String(i.id)} as Invoice));

  const [selectedInvoiceSnapshot, setSelectedInvoice] = useState<Invoice | null>(null);
  const openedInitialInvoice=useRef(false);
  useEffect(()=>{
    if(!initialInvoiceId||openedInitialInvoice.current||!query.data)return;
    const invoice=invoices.find(i=>i.id===initialInvoiceId);
    if(invoice){openedInitialInvoice.current=true;setSelectedInvoice(invoice);}
  },[initialInvoiceId,query.data]);
  const detailQuery=useQuery({queryKey:['invoice-entry',storeId,selectedInvoiceSnapshot?.id],enabled:!!selectedInvoiceSnapshot,queryFn:()=>request<{invoice:Partial<Invoice>;items:InvoiceItem[]}>(`${path}/${selectedInvoiceSnapshot!.id}`)});
  const selectedInvoice=selectedInvoiceSnapshot?{...selectedInvoiceSnapshot,...detailQuery.data?.invoice}:null;
  const invoiceItems=detailQuery.data?.items??[];
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
      Pending: "bg-yellow-100 text-yellow-800",
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
    false;

  const hasPriceMismatch = (item: InvoiceItem) => false;


  // Detail view
  if(query.isError)return <p role="alert">{query.error.message}</p>;
  if(query.isLoading)return <p>Loading invoices…</p>;
  if(selectedInvoice&&detailQuery.isError)return <div><p role="alert">{detailQuery.error.message}</p><Button onClick={()=>setSelectedInvoice(null)}>Back to Invoices</Button></div>;
  if(selectedInvoice&&detailQuery.isLoading)return <p>Loading invoice…</p>;
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
                <Button disabled variant="outline" size="sm">
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
                  <TableHeader><TableRow>{['Product name','Item quantity','Ordered','Invoiced','Received','Unit cost','Extended','Tax','MSRP','Total'].map(label=><TableHead key={label} className="text-xs whitespace-nowrap">{label}</TableHead>)}</TableRow></TableHeader>
                  <TableBody>{invoiceItems.map(item=><TableRow key={item.id}>
                    <TableCell>{item.itemName}<p className="text-xs text-muted-foreground">{item.scanCode}</p></TableCell>
                    <TableCell>{item.unitType==='CASE'?`Case (${item.casePack})`:'Single unit'}</TableCell>
                    <TableCell>{item.orderedQty==null?'—':Number(Number(item.orderedQty).toFixed(3))}</TableCell>
                    <TableCell>{item.invoicedQty}</TableCell><TableCell>{item.receivedQty??'—'}</TableCell>
                    <TableCell>${item.unitCost.toFixed(2)}</TableCell><TableCell>${item.extendedCost.toFixed(2)}</TableCell>
                    <TableCell>{item.tax==null?'—':`$${item.tax.toFixed(2)}`}</TableCell><TableCell>{item.msrp==null?'—':`$${item.msrp.toFixed(2)}`}</TableCell><TableCell>${item.total.toFixed(2)}</TableCell>
                  </TableRow>)}</TableBody>
                </Table>
              </div>
            </div>

            <div className="rounded-lg border p-4"><h3 className="text-sm font-semibold mb-3">Additional Charges</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[['Freight',selectedInvoice.freight],['Fuel Surcharge',selectedInvoice.fuelSurcharge],['Handling Fee',selectedInvoice.handlingFee],['Discount',selectedInvoice.discount]].map(([label,value])=><div key={String(label)}><p className="text-xs text-muted-foreground">{label}</p><p>${Number(value??0).toFixed(2)}</p></div>)}</div></div>
            {selectedInvoice.notes&&<div className="rounded-lg bg-muted/30 p-4"><h3 className="text-sm font-semibold">Notes</h3><p className="text-sm whitespace-pre-wrap">{selectedInvoice.notes}</p></div>}
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
        <Button disabled variant="outline" size="sm">
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
                <SelectItem value="Pending">Pending</SelectItem>
                
                <SelectItem value="Approved">Approved</SelectItem>
                
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
