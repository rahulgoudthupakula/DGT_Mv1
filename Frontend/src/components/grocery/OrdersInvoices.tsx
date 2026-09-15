import { useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/backend";
import { useState } from "react";
import { format } from "date-fns";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Search,
  Plus,
  Upload,
  FileText,
  Check,
  AlertTriangle,
  X,
  Eye,
  Pencil,
  Download,
  Send,
  Save,
  Clock,
  User,
  Calendar as CalendarIcon,
  ArrowLeft,
  Filter,
} from "lucide-react";
import { Trash2 } from "lucide-react";

import { type PostDeliveryInput, type PostDeliveryLine } from "@/lib/postDelivery";


import { toast } from "sonner";

type ParsedLine = PostDeliveryLine & { key: string; isNew: boolean };

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

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
  purchaseOrderId?:string|null;
  receivingId: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  termsNet: string;
  status: "Pending" | "Matched" | "Approved" | "Posted";
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

export const OrdersInvoices = ({storeId}:{storeId:string}) => {
  const client=useQueryClient();const path=`/access/stores/${encodeURIComponent(storeId)}/invoice-entry`;
  const query=useQuery({queryKey:['invoice-entry',storeId],enabled:!!storeId,queryFn:()=>request<{invoices:Partial<Invoice>[];vendors:{name:string;terms:string}[]}>(path)});
  const catalogQuery=useQuery({queryKey:['pricebook-items',storeId],enabled:!!storeId,queryFn:()=>request<{items:{name:string;sku:string;barcode:string;vendor:string;cost:number}[]}>(`/access/stores/${encodeURIComponent(storeId)}/items`)});
  const pricebookItems=catalogQuery.data?.items??[];
  const invoices:Invoice[]=(query.data?.invoices??[]).map(i=>({deliveryDate:'',deliveryTime:'',notes:'',freight:0,fuelSurcharge:0,handlingFee:0,discount:0,vendorAddress:'',vendorPhone:'',salesRepName:'',driverName:'',driverNumber:'',routeId:'',dueDate:'',poNumber:'',receivingId:'',customerId:'',customerName:'',customerAddress:'',customerPhone:'',termsNet:'',tax:0,otherCharges:0,paymentStatus:'' as Invoice['paymentStatus'],createdBy:'',createdAt:'',approvedBy:null,approvedAt:null,...i,id:String(i.id)} as Invoice));
  const [editingInvoice,setEditingInvoice]=useState<{id:string;version:string}|null>(null);
  const postDelivery=async(input:PostDeliveryInput)=>{const result=await request(editingInvoice?`${path}/${editingInvoice.id}`:path,{method:editingInvoice?'PUT':'POST',headers:editingInvoice?{'If-Match':editingInvoice.version}:undefined,body:JSON.stringify(input)});await client.invalidateQueries({queryKey:['invoice-entry',storeId]});return result;};
  const [selectedInvoiceSnapshot, setSelectedInvoice] = useState<Invoice | null>(null);
  const detailQuery=useQuery({queryKey:['invoice-entry',storeId,selectedInvoiceSnapshot?.id],enabled:!!selectedInvoiceSnapshot,queryFn:()=>request<{invoice:Partial<Invoice>;items:InvoiceItem[];version:string;purchaseOrderId:string|null}>(`${path}/${selectedInvoiceSnapshot!.id}`)});
  const selectedInvoice=selectedInvoiceSnapshot?{...selectedInvoiceSnapshot,...detailQuery.data?.invoice}:null;
  const invoiceItems=detailQuery.data?.items??[];
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [newInvoiceStep, setNewInvoiceStep] = useState<"choose" | "upload" | "processing" | "review" | "manual">("choose");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [savingUpload, setSavingUpload] = useState(false);
  const [parsedHeader, setParsedHeader] = useState({ vendor: "", invoiceNumber: "", invoiceDate: "" });
  const [parsedLines, setParsedLines] = useState<ParsedLine[]>([]);

  const emptyManualForm = {
    vendor: "",
    invoiceNumber: "",
    invoiceDate: "",
    dueDate: "",
    terms: "",
    poId: "",
    deliveryDate: "",
    deliveryTime: "",
    driverName: "",
    driverNumber: "",
    routeId: "",
    notes: "",
    freight: 0,
    fuelSurcharge: 0,
    handlingFee: 0,
    discount: 0,
    tax: 0,
    rebateRef: "",
  };
  const [manualForm, setManualForm] = useState({ ...emptyManualForm });
  type ManualLine = {
    key: string;
    sku: string;
    barcode: string;
    itemName: string;
    orderedQuantity: number;
    invoicedQuantity: number;
    receivedQuantity: number;
    unitType: "item" | "case";
    unitsPerCase: number;
    unitCost: number;
    msrp?: number|null; newItem?: boolean; tax:number;
  };
  const newManualLine = (): ManualLine => ({
    key: Math.random().toString(36).slice(2),
    sku: "", barcode: "", itemName: "", orderedQuantity: 0, invoicedQuantity: 0,
    receivedQuantity: 0, tax:0, unitType: "item", unitsPerCase: 12, unitCost: 0,
  });
  const [manualLines, setManualLines] = useState<ManualLine[]>([newManualLine()]);
  const [manualProductFilter, setManualProductFilter] = useState("");
  const [savingManual, setSavingManual] = useState(false);
  const [manualAttachment, setManualAttachment] = useState<File | null>(null);
  type InvoicePO={id:string;poNumber:string;vendor:string;pending:boolean;lines:{sku:string;barcode:string;itemName:string;orderedQuantity:number;previouslyReceived:number;casePackSize:number;unitCost:number}[]};
  const poQuery=useQuery({queryKey:['invoice-pending-pos',storeId],enabled:!!storeId&&newInvoiceStep==='manual',queryFn:()=>request<InvoicePO[]>(`${path}/pending-pos`)});
  const pendingPos=poQuery.data??[];



  const vendorPos = pendingPos.filter(p=>p.vendor===manualForm.vendor&&(p.pending||p.id===manualForm.poId));

  const manualVendors = (query.data?.vendors??[]).map(v=>v.name);
  const manualCatalog = (() => {
    const q = manualProductFilter.trim().toLowerCase();
    const base = pricebookItems;
    if (!q) return base;
    return base.filter((i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || i.barcode.includes(q));
  })();
  const updateManualLine = (key: string, patch: Partial<ManualLine>) =>
    setManualLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const changeLineUnit=(l:ManualLine,unitType:'item'|'case',unitsPerCase:number)=>{
    const oldPack=l.unitType==='case'?(l.unitsPerCase||1):1, nextPack=unitType==='case'?(unitsPerCase||1):1;
    updateManualLine(l.key,{unitType,unitsPerCase,invoicedQuantity:Number((l.invoicedQuantity*oldPack/nextPack).toFixed(3)),receivedQuantity:Number((l.receivedQuantity*oldPack/nextPack).toFixed(3)),unitCost:Number((l.unitCost*nextPack/oldPack).toFixed(2))});
  };
  const pickManualProduct = (key: string, sku: string) => {
    if(sku==='__new__'){updateManualLine(key,{newItem:true,sku:'',barcode:'',itemName:'',unitCost:0});return;}
    const item = pricebookItems.find((i) => i.sku === sku);
    if (!item) return;
    updateManualLine(key, { newItem:false, orderedQuantity:pendingPos.find(p=>p.id===manualForm.poId)?.lines.find(l=>l.sku===item.sku)?.orderedQuantity??0, unitType:"item", sku: item.sku, barcode: item.barcode, itemName: item.name, unitCost: Math.round((item.cost??0)*100)/100 });
  };
  const manualUnitsFor = (l: ManualLine) =>
    l.unitType === "case" ? l.receivedQuantity * (l.unitsPerCase || 1) : l.receivedQuantity;
  const manualValidLines = manualLines.filter(
    (l) => l.sku && l.invoicedQuantity > 0 && l.receivedQuantity >= 0,
  );
  const manualTotalUnits = manualValidLines.reduce((s, l) => s + manualUnitsFor(l), 0);
  const extendedFor=(l:ManualLine)=>Math.round((l.invoicedQuantity*l.unitCost+Number.EPSILON)*100)/100;
  const manualSubtotal = manualLines.reduce((sum,l)=>sum+extendedFor(l),0);
  const manualOtherCharges =
    (manualForm.freight || 0) + (manualForm.fuelSurcharge || 0) + (manualForm.handlingFee || 0) - (manualForm.discount || 0);
  const manualTax=manualLines.reduce((sum,l)=>sum+(l.tax||0),0);
  const manualInvoiceTotal = manualSubtotal + manualTax + manualOtherCharges;

  const pickVendor = (vendor:string) => {setManualForm(f=>({...f,vendor,terms:query.data?.vendors.find(v=>v.name===vendor)?.terms??'',dueDate:'',poId:''}));setManualLines([newManualLine()]);};
  const pickInvoiceDate = (invoiceDate:string) => setManualForm(f=>({...f,invoiceDate}));

  const pickLinkedPo = (poId: string) => {
    setManualForm((f) => ({ ...f, poId:poId==='none'?'':poId }));
    if(poId==='none'){setManualLines([newManualLine()]);return;}
    const po = pendingPos.find((p) => p.id === poId);
    if (!po || po.lines.length === 0) return;
    setManualLines(
      po.lines.map((l) => ({
        key: Math.random().toString(36).slice(2),
        sku: l.sku,
        barcode: l.barcode,
        itemName: l.itemName,
        orderedQuantity: l.orderedQuantity,
        invoicedQuantity: 0,
        receivedQuantity: 0, tax:0,
        unitType: "item" as const,
        unitsPerCase: l.casePackSize || 1,
        unitCost: l.unitCost,
      }))
    );
  };

  const resetManual = () => {
    setEditingInvoice(null);
    setManualForm({ ...emptyManualForm });
    setManualLines([newManualLine()]);
    setManualProductFilter("");
    setManualAttachment(null);
  };
  const beginEdit=()=>{
    if(!selectedInvoice||selectedInvoice.status!=='Pending'||!detailQuery.data)return;
    setEditingInvoice({id:selectedInvoice.id,version:detailQuery.data.version});
    setManualForm({...emptyManualForm,vendor:selectedInvoice.vendorName,invoiceNumber:selectedInvoice.invoiceNumber,invoiceDate:String(selectedInvoice.invoiceDate).slice(0,10),poId:detailQuery.data.purchaseOrderId??'',deliveryDate:selectedInvoice.deliveryDate??'',deliveryTime:selectedInvoice.deliveryTime?.slice(0,5)??'',dueDate:selectedInvoice.dueDate??'',driverName:selectedInvoice.driverName??'',driverNumber:selectedInvoice.driverNumber??'',routeId:selectedInvoice.routeId??'',terms:selectedInvoice.termsNet??'',notes:selectedInvoice.notes??'',freight:Number(selectedInvoice.freight??0),fuelSurcharge:Number(selectedInvoice.fuelSurcharge??0),handlingFee:Number(selectedInvoice.handlingFee??0),discount:Number(selectedInvoice.discount??0)});
    setManualLines(detailQuery.data.items.map((l:any)=>({key:String(l.id),sku:l.scanCode,barcode:'',itemName:l.itemName,orderedQuantity:Number(l.orderedQty??0)*(l.unitType==='CASE'?Number(l.casePack??1):1),invoicedQuantity:Number(l.invoicedQty),receivedQuantity:Number(l.receivedQty),tax:Number(l.tax??0),unitType:l.unitType==='CASE'?'case':'item',unitsPerCase:Number(l.casePack??1),unitCost:Number(l.unitCost),msrp:l.msrp==null?null:Number(l.msrp)})));
    setSelectedInvoice(null);setNewInvoiceStep('manual');setShowNewInvoice(true);
  };
  const handleSaveManual = async () => {
    if(savingManual)return;
    if(manualLines.some(l=>!l.sku || !l.itemName.trim() || l.invoicedQuantity<=0 || l.receivedQuantity<0 || l.tax<0)) {toast.error('Complete every invoice line or remove it');return;}
    if(manualForm.deliveryTime&&!manualForm.deliveryDate){toast.error('Enter a delivery date with the delivery time');return;}
    if(manualForm.dueDate&&manualForm.dueDate<manualForm.invoiceDate){toast.error('Due date cannot be before the invoice date');return;}
    if(manualForm.discount> manualSubtotal+manualForm.freight+manualForm.fuelSurcharge+manualForm.handlingFee){toast.error('Discount cannot exceed subtotal plus additional charges');return;}
    setSavingManual(true);
    try {
      await postDelivery({vendor:manualForm.vendor.trim(),invoice:manualForm.invoiceNumber.trim(),purchaseOrderId:manualForm.poId||null,invoiceDate:manualForm.invoiceDate,deliveryDate:manualForm.deliveryDate||null,dueDate:manualForm.dueDate||null,deliveryTime:manualForm.deliveryTime||null,driverName:manualForm.driverName,driverNumber:manualForm.driverNumber,routeId:manualForm.routeId,terms:manualForm.terms,notes:manualForm.notes,freight:manualForm.freight,fuelSurcharge:manualForm.fuelSurcharge,handlingFee:manualForm.handlingFee,discount:manualForm.discount,status:'Pending',lines:manualLines.map(l=>({sku:l.sku,barcode:l.barcode,itemName:l.itemName,quantity:l.invoicedQuantity,unitType:l.unitType,unitsPerCase:l.unitsPerCase,unitCost:l.unitCost,msrp:l.msrp??null,receivedQuantity:l.receivedQuantity,tax:l.tax}))});
      toast.success('Invoice saved pending approval; stock unchanged');
      setShowNewInvoice(false);setNewInvoiceStep('choose');resetManual();
    } catch(e){toast.error(e instanceof Error?e.message:'Could not save invoice');}
    finally{setSavingManual(false);}
  };
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const resetUpload = () => {
    setUploadedFile(null);
    setParseError(null);
    setParsedLines([]);
    setParsedHeader({ vendor: "", invoiceNumber: "", invoiceDate: "" });
  };

  const updateParsedLine = (key: string, patch: Partial<ParsedLine>) =>
    setParsedLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const uploadValidLines = parsedLines.filter((l) => l.itemName.trim() && l.quantity > 0);
  const uploadTotalUnits = uploadValidLines.reduce(
    (s, l) => s + (l.unitType === "case" ? l.quantity * (l.unitsPerCase || 1) : l.quantity),
    0
  );
  const uploadTotalCost = uploadValidLines.reduce((s, l) => s + l.quantity * l.unitCost, 0);

  const handleReadInvoice = () => toast.info('Invoice scanning is not connected yet');
  const handleSaveUploadedInvoice = () => toast.info('Invoice scanning is not connected yet');

  // Date filter state
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Additional charges state
  const [freight, setFreight] = useState("");
  const [fuelSurcharge, setFuelSurcharge] = useState("");
  const [handlingFee, setHandlingFee] = useState("");
  const [discount, setDiscount] = useState("");
  const [rebateRef, setRebateRef] = useState("");

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.poNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;

    // Date filtering
    const invoiceDate = String(inv.invoiceDate).slice(0,10);
    const matchesStartDate = !startDate || invoiceDate >= format(startDate,"yyyy-MM-dd");
    const matchesEndDate = !endDate || invoiceDate <= format(endDate,"yyyy-MM-dd");

    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
  });

  const [pageSize, setPageSize] = useState(10);
  const { paginated: paginatedInvoices, page, totalPages, totalItems, hasPrev, hasNext, prevPage, nextPage } = usePagination(filteredInvoices, pageSize);

  const getStatusBadge = (status: Invoice["status"]) => {
    const styles = {
      Pending: "bg-yellow-100 text-yellow-800",
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

  const getMatchIcon = (match: boolean) => {
    return match ? (
      <Check className="h-4 w-4 text-green-600" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-red-600" />
    );
  };

  const hasQtyMismatch = (item: InvoiceItem) => false;

  const hasPriceMismatch = (item: InvoiceItem) => false;

  const clearDateFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  // If an invoice is selected, show the detail view
  if(query.isError||catalogQuery.isError)return <p role="alert">{(query.error??catalogQuery.error)?.message}</p>;
  if(query.isLoading)return <p>Loading invoices…</p>;
  if(selectedInvoice&&detailQuery.isError)return <div><p role="alert">{detailQuery.error.message}</p><Button onClick={()=>setSelectedInvoice(null)}>Back to Invoices</Button></div>;
  if(selectedInvoice&&detailQuery.isLoading)return <p>Loading invoice…</p>;
  if (selectedInvoice) {
    return (
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedInvoice(null)}
          >
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
                {selectedInvoice.status==='Pending'&&<Button disabled={!detailQuery.data} onClick={beginEdit}>Edit Invoice</Button>}
                {getStatusBadge(selectedInvoice.status)}
                {getPaymentBadge(selectedInvoice.paymentStatus)}
              </div>
            </div>

            {/* Invoice Header Info - Full Details */}
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

            {/* Invoice & Order Details Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 pt-4 border-t text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Invoice ID</p>
                <p className="font-medium">{selectedInvoice.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Invoice Date</p>
                <p className="font-medium">{selectedInvoice.invoiceDate}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Due Date</p>
                <p className="font-medium">{selectedInvoice.dueDate}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">PO Number</p>
                <p className="font-medium text-primary cursor-pointer hover:underline">
                  {selectedInvoice.poNumber}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Receiving ID</p>
                <p className="font-medium text-primary cursor-pointer hover:underline">
                  {selectedInvoice.receivingId}
                </p>
              </div>
            </div>

            {/* Terms */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">Terms:</span>
                <Badge variant="outline" className="font-medium">{selectedInvoice.termsNet}</Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-6">
            {/* Invoice Items Table */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Invoice Items</h3>
              <div className="border rounded-lg overflow-hidden">
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

              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3 text-amber-600" />
                <span>Ordered quantities come from the linked PO; stock is posted from received quantities after invoice approval.</span>
              </div>
            </div>

            {/* Additional Charges */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Additional Charges</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <Label className="text-xs">Freight</Label>
                  <Input disabled
                    type="number"
                    readOnly value={selectedInvoice.freight??0}
                    onChange={(e) => setFreight(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Fuel Surcharge</Label>
                  <Input disabled
                    type="number"
                    readOnly value={selectedInvoice.fuelSurcharge??0}
                    onChange={(e) => setFuelSurcharge(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Handling Fee</Label>
                  <Input disabled
                    type="number"
                    readOnly value={selectedInvoice.handlingFee??0}
                    onChange={(e) => setHandlingFee(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Discount</Label>
                  <Input disabled
                    type="number"
                    readOnly value={selectedInvoice.discount??0}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Rebate Ref</Label>
                  <Input disabled
                    title="Not connected yet" value={rebateRef}
                    onChange={(e) => setRebateRef(e.target.value)}
                    className="h-8 text-sm"
                    placeholder="REB-XXX"
                  />
                </div>
              </div>
            </div>

            {/* Summary Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold mb-3">Summary</h3>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
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
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Invoice Total</span>
                    <span>${selectedInvoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Attachments */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Attachments</h3>
                <div className="space-y-2">
                  <Button disabled variant="outline" size="sm" className="w-full justify-start">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Invoice (PDF/Image)
                  </Button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button variant="default" disabled title="Use the Invoice Approvals tab">
                <Send className="h-4 w-4 mr-2" />
                Submit Invoice
              </Button>
              <Button disabled variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            {selectedInvoice.notes&&<div className="rounded-lg bg-muted/30 p-4"><h3 className="text-sm font-semibold">Notes</h3><p className="text-sm whitespace-pre-wrap">{selectedInvoice.notes}</p></div>}
            {/* Audit Info */}
            <div className="bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
              <h4 className="font-medium text-foreground mb-2">Audit Trail</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  <span>Created by: {selectedInvoice.createdBy}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span>Created: {selectedInvoice.createdAt}</span>
                </div>
                {selectedInvoice.approvedBy && (
                  <>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>Approved by: {selectedInvoice.approvedBy}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-3 w-3" />
                      <span>Approved: {selectedInvoice.approvedAt}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Invoice</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this invoice.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label>Reason for Rejection</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="mt-2"
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectReason("");
                }}
              >
                Reject Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Default: Show invoice list view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Create and edit invoices before approval
          </p>
        </div>
        <Button onClick={() => setShowNewInvoice(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[180px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by vendor, invoice #, or PO #..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-2">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[140px] justify-start text-left font-normal h-10",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "MMM dd, yyyy") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[140px] justify-start text-left font-normal h-10",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "MMM dd, yyyy") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearDateFilters}
                  className="h-10 mt-5"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice List Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              All Invoices ({filteredInvoices.length})
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              {startDate || endDate || statusFilter !== "all" || searchTerm
                ? "Filtered"
                : "Showing all"}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs">Invoice #</TableHead>
                  <TableHead className="text-xs">Vendor</TableHead>
                  <TableHead className="text-xs">Invoice Date</TableHead>
                  <TableHead className="text-xs">Due Date</TableHead>
                  <TableHead className="text-xs">Purchase Order Number</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                  <TableHead className="text-xs text-center">Status</TableHead>
                  <TableHead className="text-xs text-center">Payment</TableHead>
                  <TableHead className="text-xs text-right">Edit Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No invoices found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-sm">{invoice.invoiceNumber}</TableCell>
                      <TableCell className="text-sm">{invoice.vendorName}</TableCell>
                      <TableCell className="text-sm">{invoice.invoiceDate}</TableCell>
                      <TableCell className="text-sm">{invoice.dueDate}</TableCell>
                      <TableCell className="text-sm text-blue-600">{invoice.poNumber}</TableCell>
                      <TableCell className="text-right text-sm font-medium">${invoice.total.toFixed(2)}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-center">{getPaymentBadge(invoice.paymentStatus)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(invoice)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize}
              hasPrev={hasPrev} hasNext={hasNext} onPrev={prevPage} onNext={nextPage}
              onPageSizeChange={(s) => setPageSize(s)}
            />
          </div>
        </CardContent>
      </Card>

      {/* New Invoice Dialog */}
      <Dialog open={showNewInvoice} onOpenChange={(open) => {
        if(savingManual)return;
        setShowNewInvoice(open);
        if (!open) { setNewInvoiceStep("choose"); resetUpload(); resetManual(); }
      }}>
        <DialogContent className={cn("transition-all duration-300", newInvoiceStep === "review" || newInvoiceStep === "manual" ? "max-w-6xl" : "max-w-lg")}>
          <DialogHeader>
            <DialogTitle>
              {newInvoiceStep === "choose" && "Create New Invoice"}
              {newInvoiceStep === "upload" && "Auto Fill — Upload Invoice"}
              {newInvoiceStep === "processing" && "Reading Invoice…"}
              {newInvoiceStep === "review" && "Review & Confirm Invoice"}
              {newInvoiceStep === "manual" && (editingInvoice?"Edit Invoice":"Enter Invoice Details")}
            </DialogTitle>
            <DialogDescription>
              {newInvoiceStep === "choose" && "Choose how you'd like to create this invoice."}
              {newInvoiceStep === "upload" && "Upload your invoice PDF or image and we'll auto-fill the details."}
              {newInvoiceStep === "processing" && "Extracting invoice information from your file. Please wait."}
              {newInvoiceStep === "review" && "Verify the extracted information before submitting."}
              {newInvoiceStep === "manual" && "Fill in the invoice details manually and submit when ready."}
            </DialogDescription>
          </DialogHeader>

          {/* ── Step 0: Choose ── */}
          {newInvoiceStep === "choose" && (
            <>
              <div className="grid grid-cols-2 gap-4 py-6">
                <button
                  onClick={() => setNewInvoiceStep("manual")}
                  className="flex flex-col items-center gap-3 rounded-xl border-2 border-input px-4 py-8 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Pencil className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">Fill Manually</p>
                    <p className="text-xs text-muted-foreground mt-1">Enter all invoice details by hand</p>
                  </div>
                </button>
                <button
                  disabled title="Invoice scanning is not connected yet"
                  className="flex flex-col items-center gap-3 rounded-xl border-2 border-primary/40 bg-primary/5 px-4 py-8 hover:border-primary hover:bg-primary/10 transition-all group"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">Auto Fill</p>
                    <p className="text-xs text-muted-foreground mt-1">Upload PDF / image, we'll extract details</p>
                  </div>
                </button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewInvoice(false)}>Cancel</Button>
              </DialogFooter>
            </>
          )}

          {/* ── Step Manual ── */}
          {newInvoiceStep === "manual" && (
            <>
              <div className="space-y-5 py-4 max-h-[70vh] overflow-y-auto pr-1">
                {/* Vendor + Delivery */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border p-3 space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Vendor Information</p>
                    <div>
                      <Label className="text-xs text-muted-foreground">Vendor Name *</Label>
                      <Select value={manualForm.vendor} onValueChange={pickVendor}>
                        <SelectTrigger className="mt-1 h-8 text-sm">
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          {manualVendors.map((v) => (
                            <SelectItem key={v} value={v}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Terms</Label>
                        <Input aria-label="Payment terms"
                          className="mt-1 h-8 text-sm"
                          placeholder="Payment terms"
                          value={manualForm.terms}
                          onChange={(e) => setManualForm((f) => ({ ...f, terms: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Link PO</Label>
                        <Select disabled={!manualForm.vendor||poQuery.isLoading||poQuery.isError} value={manualForm.poId||"none"} onValueChange={pickLinkedPo}>
                          <SelectTrigger className="mt-1 h-8 text-sm">
                            <SelectValue placeholder={manualForm.vendor ? (vendorPos.length ? "Select pending PO" : "No pending POs") : "Select vendor first"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No purchase order</SelectItem>
                            {vendorPos.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.poNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border p-3 space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Delivery Information</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Delivery Date</Label>
                        <Input aria-label="Delivery date" type="date" className="mt-1 h-8 text-sm" value={manualForm.deliveryDate}
                          onChange={(e) => setManualForm((f) => ({ ...f, deliveryDate: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Delivery Time</Label>
                        <Input aria-label="Delivery time" type="time" className="mt-1 h-8 text-sm" value={manualForm.deliveryTime}
                          onChange={(e) => setManualForm((f) => ({ ...f, deliveryTime: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Driver Name</Label>
                        <Input aria-label="Driver name" className="mt-1 h-8 text-sm" placeholder="Driver name" value={manualForm.driverName}
                          onChange={(e) => setManualForm((f) => ({ ...f, driverName: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Driver Number</Label>
                        <Input aria-label="Driver number" className="mt-1 h-8 text-sm" placeholder="DRV-0000" value={manualForm.driverNumber}
                          onChange={(e) => setManualForm((f) => ({ ...f, driverNumber: e.target.value }))} />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">Route ID</Label>
                        <Input aria-label="Route ID" className="mt-1 h-8 text-sm" placeholder="RT-0000" value={manualForm.routeId}
                          onChange={(e) => setManualForm((f) => ({ ...f, routeId: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Invoice identifiers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Invoice ID *</Label>
                    <Input className="mt-1 h-8 text-sm" placeholder="INV-XXXX" value={manualForm.invoiceNumber}
                      onChange={(e) => setManualForm((f) => ({ ...f, invoiceNumber: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Invoice Date *</Label>
                    <Input type="date" className="mt-1 h-8 text-sm" value={manualForm.invoiceDate}
                      onChange={(e) => pickInvoiceDate(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Invoice Due Date</Label>
                    <Input aria-label="Invoice due date" type="date" className="mt-1 h-8 text-sm" value={manualForm.dueDate}
                      onChange={(e) => setManualForm((f) => ({ ...f, dueDate: e.target.value }))} />
                  </div>
                </div>

                {/* Products Invoiced */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="text-sm font-semibold">Products Invoiced &amp; Received</Label>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Filter products..."
                          value={manualProductFilter}
                          onChange={(e) => setManualProductFilter(e.target.value)}
                          className="pl-8 h-8 text-xs w-[200px]"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => setManualLines((prev) => [...prev, newManualLine()])}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Line
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-md border border-border">
                    <Table className="[&_td]:px-2 [&_th]:px-2 [&_input]:h-8 [&_input]:text-xs [&_[role=combobox]]:h-8 [&_[role=combobox]]:text-xs">
                      <TableHeader><TableRow>{['Product name','Item quantity','Ordered','Invoiced','Received','Unit cost','Extended','Tax','MSRP','Total','Actions'].map(label=><TableHead key={label} className="text-xs whitespace-nowrap">{label}</TableHead>)}</TableRow></TableHeader>
                    <TableBody>{manualLines.map(l=>{
                      const extended=extendedFor(l), total=extended+(l.tax||0), pack=l.unitType==='case'?l.unitsPerCase:1;
                      return <TableRow key={l.key}>
                        <TableCell className="min-w-[180px]"><Select value={l.newItem?'__new__':l.sku} onValueChange={v=>pickManualProduct(l.key,v)}><SelectTrigger><SelectValue placeholder="Select product"/></SelectTrigger><SelectContent><SelectItem value="__new__">New item</SelectItem>{manualCatalog.map(i=><SelectItem key={i.sku} value={i.sku}>{i.name} — {i.sku}</SelectItem>)}</SelectContent></Select>
                          {l.newItem&&<div className="space-y-1 mt-2"><Input placeholder="Item name" value={l.itemName} onChange={e=>updateManualLine(l.key,{itemName:e.target.value})}/><Input placeholder="SKU" value={l.sku} onChange={e=>updateManualLine(l.key,{sku:e.target.value})}/><Input placeholder="Barcode (optional)" value={l.barcode} onChange={e=>updateManualLine(l.key,{barcode:e.target.value})}/></div>}
                          <p className="text-xs text-muted-foreground mt-1">{l.barcode}</p></TableCell>
                        <TableCell className="min-w-[105px]"><Select value={l.unitType} onValueChange={(v:'item'|'case')=>changeLineUnit(l,v,l.unitsPerCase)}><SelectTrigger aria-label="Purchase unit"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="item">Single unit</SelectItem><SelectItem value="case">Case</SelectItem></SelectContent></Select>{l.unitType==='case'&&<Input aria-label="Units per case" type="number" min="1" step="1" value={l.unitsPerCase||''} onChange={e=>changeLineUnit(l,'case',Number(e.target.value))}/>}</TableCell>
                        <TableCell>{manualForm.poId&&l.orderedQuantity>0?Number((l.orderedQuantity/(pack||1)).toFixed(3)):'—'}</TableCell>
                        <TableCell><Input className="min-w-[68px]" aria-label={`Invoiced quantity for ${l.itemName||'product'}`} type="number" min="0" step="0.001" value={l.invoicedQuantity||''} onChange={e=>updateManualLine(l.key,{invoicedQuantity:Number(e.target.value)})}/></TableCell>
                        <TableCell><Input className="min-w-[68px]" aria-label={`Received quantity for ${l.itemName||'product'}`} type="number" min="0" step="0.001" value={l.receivedQuantity??''} onChange={e=>updateManualLine(l.key,{receivedQuantity:Number(e.target.value)})}/></TableCell>
                        <TableCell><Input className="min-w-[72px]" aria-label="Unit cost" type="number" min="0" step="0.01" value={l.unitCost??''} onChange={e=>updateManualLine(l.key,{unitCost:Number(e.target.value)})}/></TableCell>
                        <TableCell>${extended.toFixed(2)}</TableCell>
                        <TableCell><Input className="min-w-[68px]" aria-label="Line tax" type="number" min="0" step="0.01" value={l.tax||''} onChange={e=>updateManualLine(l.key,{tax:Number(e.target.value)})}/></TableCell>
                        <TableCell><Input className="min-w-[72px]" aria-label="Invoice MSRP per item" type="number" min="0" step="0.01" value={l.msrp??''} onChange={e=>updateManualLine(l.key,{msrp:e.target.value===''?null:Number(e.target.value)})}/></TableCell>
                        <TableCell className="font-semibold">${total.toFixed(2)}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" aria-label="Remove line" onClick={()=>setManualLines(prev=>prev.length===1?[newManualLine()]:prev.filter(x=>x.key!==l.key))}><Trash2 className="h-4 w-4 text-destructive"/></Button></TableCell>
                      </TableRow>;
                    })}</TableBody>
                    </Table>
                  </div>
                </div>

                {/* Additional charges */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Additional Charges</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {([
                      ["freight", "Freight"],
                      ["fuelSurcharge", "Fuel Surcharge"],
                      ["handlingFee", "Handling Fee"],
                      ["discount", "Discount"],
                    ] as const).map(([field, label]) => (
                      <div key={field}>
                        <Label className="text-xs text-muted-foreground">{label}</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          className="mt-1 h-8 text-sm text-right"
                          aria-label={label} value={manualForm[field] || ""}
                          placeholder="0.00"
                          onChange={(e) => setManualForm((f) => ({ ...f, [field]: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    ))}
                    <div>
                      <Label className="text-xs text-muted-foreground">Rebate Ref</Label>
                      <Input disabled title="Not connected yet" className="mt-1 h-8 text-sm" placeholder="REB-XXX" value={manualForm.rebateRef}
                        onChange={(e) => setManualForm((f) => ({ ...f, rebateRef: e.target.value }))} />
                    </div>
                  </div>
                </div>

                {/* Summary + attachment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Summary</Label>
                    <div className="rounded-lg border border-border p-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">${manualSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Tax</span>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          className="h-7 w-28 text-xs text-right"
                          placeholder="0.00"
                          readOnly value={manualTax.toFixed(2)}
                          onChange={(e) => setManualForm((f) => ({ ...f, tax: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Other Charges</span>
                        <span className="font-medium">${manualOtherCharges.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-border pt-2">
                        <span className="font-semibold">Invoice Total</span>
                        <span className="font-bold">${manualInvoiceTotal.toFixed(2)}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground pt-1">
                        {manualValidLines.length} lines · {manualTotalUnits.toLocaleString()} units
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Attachments</Label>
                    <label className={cn(
                      "flex items-center gap-3 rounded-lg border-2 border-dashed px-4 py-5 cursor-pointer transition-colors",
                      manualAttachment ? "border-primary/50 bg-primary/5" : "border-input hover:border-primary/40 hover:bg-muted/30"
                    )}>
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">
                        {manualAttachment ? manualAttachment.name : "Upload Invoice (PDF/Image)"}
                      </span>
                      <input
                        disabled type="file"
                        accept="application/pdf,image/*"
                        className="hidden"
                        onChange={(e) => setManualAttachment(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    <div>
                      <Label className="text-xs text-muted-foreground">Notes</Label>
                      <Input aria-label="Invoice notes"
                        className="mt-1 h-8 text-sm"
                        placeholder="Optional"
                        value={manualForm.notes}
                        onChange={(e) => setManualForm((f) => ({ ...f, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {poQuery.isError&&<p role="alert" className="text-destructive">{poQuery.error.message}</p>}
              <DialogFooter>
                <Button variant="outline" disabled={savingManual} onClick={()=>{if(editingInvoice){setShowNewInvoice(false);resetManual();}else setNewInvoiceStep("choose");}}>{editingInvoice?"Cancel":"Back"}</Button>
                <Button
                  disabled={!manualForm.vendor || !manualForm.invoiceNumber || !manualForm.invoiceDate || manualValidLines.length === 0 || savingManual}
                  onClick={handleSaveManual}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {savingManual ? "Saving…" : editingInvoice?"Save Changes":"Submit Invoice"}
                </Button>
              </DialogFooter>
            </>
          )}

          {/* ── Step Upload (Auto Fill) ── */}
          {newInvoiceStep === "upload" && (
            <>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Upload Invoice (PDF / Image)</Label>
                  <label className={cn(
                    "mt-2 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-4 py-8 cursor-pointer transition-colors",
                    uploadedFile ? "border-primary/50 bg-primary/5" : "border-input hover:border-primary/40 hover:bg-muted/30"
                  )}>
                    {uploadedFile ? (
                      <>
                        <FileText className="h-10 w-10 text-primary" />
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">{uploadedFile.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{(uploadedFile.size / 1024).toFixed(1)} KB — click to change</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 text-muted-foreground" />
                        <div className="text-center">
                          <p className="text-sm font-medium">Drop file here or click to browse</p>
                          <p className="text-xs text-muted-foreground mt-0.5">PDF, JPG, PNG supported</p>
                        </div>
                      </>
                    )}
                    <input disabled type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                      onChange={(e) => { setUploadedFile(e.target.files?.[0] ?? null); setParseError(null); }} />
                  </label>
                </div>
                {parseError && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
                    <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive">{parseError}</p>
                  </div>
                )}
              </div>
              {poQuery.isError&&<p role="alert" className="text-destructive">{poQuery.error.message}</p>}
              <DialogFooter>
                <Button variant="outline" disabled={savingManual} onClick={()=>{if(editingInvoice){setShowNewInvoice(false);resetManual();}else setNewInvoiceStep("choose");}}>{editingInvoice?"Cancel":"Back"}</Button>
                {parseError && (
                  <Button variant="secondary" onClick={() => { setNewInvoiceStep("manual"); setParseError(null); }}>
                    Enter Manually
                  </Button>
                )}
                <Button disabled={!uploadedFile} onClick={handleReadInvoice}>
                  <Upload className="h-4 w-4 mr-2" />
                  Read Invoice
                </Button>
              </DialogFooter>
            </>
          )}

          {/* ── Step 2: Processing ── */}
          {newInvoiceStep === "processing" && (
            <div className="py-12 flex flex-col items-center gap-5">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-muted animate-spin border-t-primary" />
                <FileText className="h-6 w-6 text-primary absolute inset-0 m-auto" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">Scanning {uploadedFile?.name}</p>
                <p className="text-xs text-muted-foreground">Extracting vendor, items, quantities and costs…</p>
              </div>
            </div>
          )}

          {/* ── Step 3: Review ── */}
          {newInvoiceStep === "review" && (
            <>
              <div className="py-4 space-y-5 max-h-[65vh] overflow-y-auto pr-1">
                <div className="flex items-center gap-2 rounded-md bg-primary/10 border border-primary/20 px-3 py-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <p className="text-xs text-primary font-medium">
                    Read from <span className="font-semibold">{uploadedFile?.name}</span>. Check the items, then save for approval.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Vendor</Label>
                    <Input className="mt-1 h-8 text-sm" value={parsedHeader.vendor}
                      onChange={(e) => setParsedHeader((h) => ({ ...h, vendor: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Invoice #</Label>
                    <Input className="mt-1 h-8 text-sm" value={parsedHeader.invoiceNumber}
                      onChange={(e) => setParsedHeader((h) => ({ ...h, invoiceNumber: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Invoice Date</Label>
                    <Input type="date" className="mt-1 h-8 text-sm" value={parsedHeader.invoiceDate}
                      onChange={(e) => setParsedHeader((h) => ({ ...h, invoiceDate: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Line Items</p>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5"
                      onClick={() => setParsedLines((prev) => [...prev, {
                        key: Math.random().toString(36).slice(2), sku: "", barcode: "", itemName: "",
                        quantity: 0, unitType: "item", unitsPerCase: 1, unitCost: 0, isNew: true,
                      }])}>
                      <Plus className="h-3.5 w-3.5" /> Add Line
                    </Button>
                  </div>
                  <div className="rounded-md border overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-2 py-2 font-medium min-w-[180px]">Product</th>
                          <th className="text-left px-2 py-2 font-medium w-[90px]">Unit</th>
                          <th className="text-right px-2 py-2 font-medium w-[70px]">Qty</th>
                          <th className="text-right px-2 py-2 font-medium w-[90px]">Units/Case</th>
                          <th className="text-right px-2 py-2 font-medium w-[90px]">Unit Cost</th>
                          <th className="text-right px-2 py-2 font-medium w-[90px]">Total</th>
                          <th className="w-[40px]" />
                        </tr>
                      </thead>
                      <tbody>
                        {parsedLines.map((l) => (
                          <tr key={l.key} className="border-t">
                            <td className="px-2 py-1.5">
                              <Input className="h-8 text-xs" value={l.itemName}
                                onChange={(e) => updateParsedLine(l.key, { itemName: e.target.value })} />
                              <div className="mt-1 flex items-center gap-1.5">
                                <span className="text-[10px] text-muted-foreground">{l.sku}</span>
                                {l.isNew && <Badge className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0">New product</Badge>}
                              </div>
                            </td>
                            <td className="px-2 py-1.5">
                              <Select value={l.unitType} onValueChange={(v) => updateParsedLine(l.key, { unitType: v as "item" | "case" })}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="item">Item</SelectItem>
                                  <SelectItem value="case">Case</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-2 py-1.5">
                              <Input type="number" min={0} className="h-8 text-xs text-right" value={l.quantity || ""}
                                onChange={(e) => updateParsedLine(l.key, { quantity: Number(e.target.value) || 0 })} />
                            </td>
                            <td className="px-2 py-1.5">
                              <Input type="number" min={1} disabled={l.unitType !== "case"} className="h-8 text-xs text-right"
                                value={l.unitType === "case" ? l.unitsPerCase || "" : ""}
                                onChange={(e) => updateParsedLine(l.key, { unitsPerCase: parseInt(e.target.value) || 1 })} />
                            </td>
                            <td className="px-2 py-1.5">
                              <Input type="number" step="0.01" min={0} className="h-8 text-xs text-right" value={l.unitCost || ""}
                                onChange={(e) => updateParsedLine(l.key, { unitCost: parseFloat(e.target.value) || 0 })} />
                            </td>
                            <td className="px-2 py-1.5 text-right font-medium">${(l.quantity * l.unitCost).toFixed(2)}</td>
                            <td className="px-2 py-1.5 text-right">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                aria-label="Remove line"
                                onClick={() => setParsedLines((prev) => prev.filter((x) => x.key !== l.key))}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="w-56 space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Lines</span><span>{uploadValidLines.length}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Total Units</span><span>{uploadTotalUnits.toLocaleString()}</span></div>
                    <div className="flex justify-between font-semibold border-t pt-1 mt-1 text-sm"><span>Total Cost</span><span>${uploadTotalCost.toFixed(2)}</span></div>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => { setNewInvoiceStep("upload"); setParsedLines([]); }}>
                  Re-upload
                </Button>
                <Button disabled={uploadValidLines.length === 0 || !parsedHeader.vendor.trim() || savingUpload} onClick={handleSaveUploadedInvoice}>
                  <Check className="h-4 w-4 mr-2" />
                  {savingUpload ? "Saving…" : "Submit Invoice"}
                </Button>
              </DialogFooter>
            </>
          )}

        </DialogContent>
      </Dialog>
    </div>
  );
};
