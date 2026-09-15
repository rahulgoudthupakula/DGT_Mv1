import {VendorPricing} from "./VendorPricing";
import {VendorAudit} from "./VendorAudit";
import {VendorContracts} from "./VendorContracts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/backend";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Search,
  Plus,
  Filter,
  Download,
  Edit,
  Eye,
  ExternalLink,
  Package,
  Building2,
  Clock,
  AlertTriangle,
  History,
  FileText,
  ChevronRight,
  ArrowUpDown,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useAppNavigation } from "@/contexts/NavigationContext";

interface Vendor {
  id: string;
  version?: string;
  active?: boolean;
  name: string;
  type: string;
  activeItems: number;
  contractStatus: string;
  leadTime: number;
  paymentTerms: string;
  rating: number;
  reliability: number;
  contactName: string;
  phone: string;
  email: string;
}

// Mock data for vendor items
const mockVendorItemsExample = [
  {
    id: "I001",
    name: "Organic Apples",
    scanCode: "012345678901",
    category: "Produce",
    casePackSize: 24,
    unitCost: 1.25,
    lastCost: 1.20,
    avgCost: 1.22,
    moq: 5,
    leadTime: 2,
    active: true,
    vendorId: "V001",
    vendorName: "Fresh Farms Distribution",
    preferred: true,
  },
  {
    id: "I002",
    name: "Bananas",
    scanCode: "012345678902",
    category: "Produce",
    casePackSize: 40,
    unitCost: 0.45,
    lastCost: 0.42,
    avgCost: 0.44,
    moq: 10,
    leadTime: 2,
    active: true,
    vendorId: "V001",
    vendorName: "Fresh Farms Distribution",
    preferred: true,
  },
  {
    id: "I003",
    name: "Coca-Cola 12pk",
    scanCode: "049000028911",
    category: "Beverage",
    casePackSize: 4,
    unitCost: 4.99,
    lastCost: 4.85,
    avgCost: 4.92,
    moq: 20,
    leadTime: 3,
    active: true,
    vendorId: "V002",
    vendorName: "Metro Beverage Co",
    preferred: true,
  },
  {
    id: "I004",
    name: "Frozen Pizza",
    scanCode: "071421912345",
    category: "Frozen",
    casePackSize: 12,
    unitCost: 3.50,
    lastCost: 3.45,
    avgCost: 3.48,
    moq: 6,
    leadTime: 4,
    active: true,
    vendorId: "V003",
    vendorName: "Arctic Cold Storage",
    preferred: false,
  },
  {
    id: "I005",
    name: "Organic Apples",
    scanCode: "012345678901",
    category: "Produce",
    casePackSize: 24,
    unitCost: 1.30,
    lastCost: 1.28,
    avgCost: 1.29,
    moq: 4,
    leadTime: 3,
    active: true,
    vendorId: "V004",
    vendorName: "General Grocery Supply",
    preferred: false,
  },
];

// Mock contracts data
const mockContractsExample = [
  {
    id: "C001",
    vendorId: "V001",
    vendorName: "Fresh Farms Distribution",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    volumeDiscount: "5% over $10,000/month",
    rebateLinkage: "Produce Rebate Program",
    returnPolicy: "14 days, full refund",
    status: "Active",
  },
  {
    id: "C002",
    vendorId: "V002",
    vendorName: "Metro Beverage Co",
    startDate: "2024-03-01",
    endDate: "2025-02-28",
    volumeDiscount: "3% over $5,000/month",
    rebateLinkage: "Beverage Quarterly Rebate",
    returnPolicy: "7 days, store credit",
    status: "Active",
  },
  {
    id: "C003",
    vendorId: "V003",
    vendorName: "Arctic Cold Storage",
    startDate: "2023-06-01",
    endDate: "2024-05-31",
    volumeDiscount: "None",
    rebateLinkage: "None",
    returnPolicy: "No returns on frozen",
    status: "Expired",
  },
];

// Mock cost history
const mockCostHistoryExample = [
  { id: 1, itemName: "Organic Apples", vendor: "Fresh Farms Distribution", oldCost: 1.20, newCost: 1.25, effectiveDate: "2024-01-15", changedBy: "System Import" },
  { id: 2, itemName: "Coca-Cola 12pk", vendor: "Metro Beverage Co", oldCost: 4.85, newCost: 4.99, effectiveDate: "2024-01-10", changedBy: "Admin User" },
  { id: 3, itemName: "Bananas", vendor: "Fresh Farms Distribution", oldCost: 0.42, newCost: 0.45, effectiveDate: "2024-01-08", changedBy: "System Import" },
];

// Mock audit log
const mockAuditLogExample = [
  { id: 1, action: "Vendor Added", details: "Fresh Farms Distribution added to system", user: "Admin", timestamp: "2024-01-15 09:30:00" },
  { id: 2, action: "Item Linked", details: "Organic Apples linked to General Grocery Supply", user: "Manager", timestamp: "2024-01-14 14:22:00" },
  { id: 3, action: "Cost Updated", details: "Coca-Cola 12pk cost changed from $4.85 to $4.99", user: "System", timestamp: "2024-01-10 08:00:00" },
  { id: 4, action: "Preferred Vendor Changed", details: "Fresh Farms set as preferred for Organic Apples", user: "Admin", timestamp: "2024-01-08 11:15:00" },
];

const mockVendorItems: typeof mockVendorItemsExample = [];
const mockContracts: typeof mockContractsExample = [];
const mockCostHistory: typeof mockCostHistoryExample = [];
const mockAuditLog: typeof mockAuditLogExample = [];
type VendorItem={id:number;name:string;scanCode:string;category:string;casePackSize:number|null;unitCost:number;unitType:string;vendorSku:string|null;moq:number|null;leadTime:number|null;active:boolean;version:string};
export const VendorList = ({storeId}:{storeId:string}) => {
  const client=useQueryClient(),path=`/access/stores/${encodeURIComponent(storeId)}/vendors`;
  const query=useQuery({queryKey:['vendors',storeId],queryFn:()=>request<Vendor[]>(path),enabled:!!storeId});
  const vendors=query.data??[];
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[editing,setEditing]=useState<Vendor|null>(null);
  const [linkOpen,setLinkOpen]=useState(false),[productId,setProductId]=useState(''),[unitCost,setUnitCost]=useState(''),[unitType,setUnitType]=useState('ITEM');

  const [editLink,setEditLink]=useState<VendorItem|null>(null),[casePack,setCasePack]=useState(''),[moq,setMoq]=useState('');
  const { navigateTo } = useAppNavigation();

  const [activeTab, setActiveTab] = useState("vendors");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showVendorItems, setShowVendorItems] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [newVendorForm, setNewVendorForm] = useState({
    name: "", type: "", leadTime: "", paymentTerms: "", contactName: "", phone: "", email: "",
  });
  const [pageSizeVendors, setPageSizeVendors] = useState(10);




  const linked=useQuery({queryKey:['vendor-items',storeId,selectedVendor?.id],queryFn:()=>request<VendorItem[]>(`${path}/${selectedVendor?.id}/items`),enabled:!!selectedVendor});
  const available=useQuery({queryKey:['vendor-available-items',storeId],queryFn:()=>request<{items:{id:number;name:string;sku:string;active:boolean;unitsPerCase?:number|null;cost:number|null}[]}>(`/access/stores/${encodeURIComponent(storeId)}/items`),enabled:linkOpen});
  const selectedItem=available.data?.items.find(item=>item.id===Number(productId));
  const packQuantity=Number(casePack);
  const catalogCost=selectedItem?.cost;
  const linkedCost=editLink?unitCost:catalogCost==null||!Number.isFinite(catalogCost)||(unitType==='CASE'&&(!Number.isInteger(packQuantity)||packQuantity<=0))?'':(catalogCost*(unitType==='CASE'?packQuantity:1)).toFixed(2);
  const handleAddVendor=async()=>{setBusy(true);setError('');try{await request(editing?`${path}/${editing.id}`:path,{method:editing?'PUT':'POST',headers:editing?{'If-Match':editing.version??''}:{},body:JSON.stringify({name:newVendorForm.name,contactName:newVendorForm.contactName,email:newVendorForm.email,phone:newVendorForm.phone,paymentTerms:newVendorForm.paymentTerms,leadTime:newVendorForm.leadTime===''?null:Number(newVendorForm.leadTime),active:editing?.active??true})});setShowAddVendor(false);setEditing(null);await Promise.all(['vendors','pricebook-items'].map(key=>client.invalidateQueries({queryKey:[key,storeId]})));}catch(e){setError(e instanceof Error?e.message:'Could not save vendor');}finally{setBusy(false);}};
  async function refreshLinks(){await Promise.all(['vendor-items','vendors','vendor-pricing','vendor-cost-items','vendor-audit','pricebook-items'].map(key=>client.invalidateQueries({queryKey:[key,storeId]})));}
  async function link(){setBusy(true);setError('');try{await request(`${path}/${selectedVendor?.id}/items${editLink?`/${editLink.id}`:''}`,{method:editLink?'PUT':'POST',headers:editLink?{'If-Match':editLink.version}:{},body:JSON.stringify({productId:Number(productId),unitCost:Number(linkedCost),unitType,vendorSku:editLink?.vendorSku??null,casePackSize:casePack===''?null:Number(casePack),moq:moq===''?null:Number(moq)})});setLinkOpen(false);await refreshLinks();}catch(e){setError(e instanceof Error?e.message:'Could not save vendor item');}finally{setBusy(false);}}
  async function unlink(item:VendorItem){if(!window.confirm(`Remove ${item.name} from this vendor? The Price Book item and history will be kept.`))return;setBusy(true);setError('');try{await request(`${path}/${selectedVendor?.id}/items/${item.id}`,{method:'DELETE',headers:{'If-Match':item.version}});await refreshLinks();}catch(e){setError(e instanceof Error?e.message:'Could not remove vendor link');}finally{setBusy(false);}}
  const getContractStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</Badge>;
      case "Pending Renewal":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending Renewal</Badge>;
      case "Expired":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || (vendor.active?"Active":"Inactive") === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const vendorItemsForSelected = linked.data??[];

  const { paginated: paginatedVendors, page: pageVendors, totalPages: totalPagesVendors, totalItems: totalItemsVendors, hasPrev: hasPrevVendors, hasNext: hasNextVendors, prevPage: prevVendors, nextPage: nextVendors } = usePagination(filteredVendors, pageSizeVendors);
  

  return (
    <div className="space-y-6">
      {query.isPending&&<p>Loading vendors…</p>}{query.error&&<p role="alert">{query.error.message}</p>}{error&&<p role="alert">{error}</p>}
      <Dialog open={linkOpen} onOpenChange={v=>{if(!busy)setLinkOpen(v);}}><DialogContent><DialogHeader><DialogTitle>{editLink?'Edit Vendor Item':'Link Item'}</DialogTitle></DialogHeader>
      <Label>{editLink?'Item':'Available item'}<select disabled={!!editLink||busy} className="w-full border rounded p-2 bg-background" value={productId} onChange={e=>{setProductId(e.target.value);const item=available.data?.items.find(i=>i.id===Number(e.target.value));setCasePack(item?.unitsPerCase==null?'':String(item.unitsPerCase));}}><option value="">Select item</option>{editLink&&<option value={editLink.id}>{editLink.name}</option>}{available.data?.items.filter(i=>i.active&&!vendorItemsForSelected.some(l=>Number(l.id)===i.id)).map(i=><option key={i.id} value={i.id}>{i.name} — {i.sku}</option>)}</select></Label>
      {available.error&&<p role="alert">{available.error.message}</p>}
      <Label>Purchase unit<select disabled={busy} className="w-full border rounded p-2 bg-background" value={unitType} onChange={e=>setUnitType(e.target.value)}><option value="ITEM">Item</option><option value="CASE">Case</option></select></Label>
      <Label>Case Pack (items per case)<Input disabled={busy} type="number" min="1" step="1" value={casePack} onChange={e=>setCasePack(e.target.value)}/></Label>
      <Label>MOQ — Minimum Order Quantity ({unitType==='CASE'?'cases':'items'})<Input disabled={busy} type="number" min="0.001" step="0.001" value={moq} onChange={e=>setMoq(e.target.value)}/></Label>
      <Label>Cost per selected unit<Input readOnly={!editLink} disabled={busy} type="number" min="0" step="0.01" value={linkedCost} onChange={e=>setUnitCost(e.target.value)}/></Label>
      {!editLink&&<p className="text-xs text-muted-foreground">{productId&&catalogCost==null?'Set the item cost in Items before linking it.':'Cost comes from Items. Case cost uses the case pack shown above.'}</p>}
      {error&&<p role="alert">{error}</p>}<Button disabled={busy||!productId||linkedCost===''} onClick={link}>{editLink?'Save Changes':'Link Item'}</Button><Button variant="outline" disabled={busy} onClick={()=>setLinkOpen(false)}>Cancel</Button></DialogContent></Dialog>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vendor Management</h1>
          <p className="text-muted-foreground text-sm">
            Manage vendors, item mappings, contracts, and pricing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button disabled variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={showAddVendor} onOpenChange={v=>{if(!busy)setShowAddVendor(v);}}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={()=>{setEditing(null);setError('');setNewVendorForm({name:"",type:"",leadTime:"",paymentTerms:"",contactName:"",phone:"",email:""});}}>
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editing?"Edit Vendor":"Add New Vendor"}</DialogTitle>
              </DialogHeader>
              <fieldset disabled={busy} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Vendor Name</Label>
                  <Input placeholder="Enter vendor name" value={newVendorForm.name} onChange={(e) => setNewVendorForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lead Time (days)</Label>
                    <Input type="number" placeholder="2" value={newVendorForm.leadTime} onChange={(e) => setNewVendorForm((f) => ({ ...f, leadTime: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Terms</Label>
                    <Select value={newVendorForm.paymentTerms} onValueChange={(v) => setNewVendorForm((f) => ({ ...f, paymentTerms: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Net 15">Net 15</SelectItem>
                        <SelectItem value="Net 30">Net 30</SelectItem>
                        <SelectItem value="Net 45">Net 45</SelectItem>
                        <SelectItem value="COD">COD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input placeholder="Representative name" value={newVendorForm.contactName} onChange={(e) => setNewVendorForm((f) => ({ ...f, contactName: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input placeholder="(555) 123-4567" value={newVendorForm.phone} onChange={(e) => setNewVendorForm((f) => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" placeholder="email@vendor.com" value={newVendorForm.email} onChange={(e) => setNewVendorForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
                <p role="alert">{error}</p><Button disabled={busy} className="w-full" onClick={handleAddVendor}>{editing?"Save Changes":"Add Vendor"}</Button>
              </fieldset>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vendors.length}</p>
                <p className="text-xs text-muted-foreground">Total Vendors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vendors.reduce((n,v)=>n+Number(v.activeItems),0)}</p>
                <p className="text-xs text-muted-foreground">Total Item Links</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vendors.filter(v=>v.leadTime!=null).length ? (vendors.filter(v=>v.leadTime!=null).reduce((n,v)=>n+Number(v.leadTime),0)/vendors.filter(v=>v.leadTime!=null).length).toFixed(1):""}</p>
                <p className="text-xs text-muted-foreground">Avg Lead Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">&nbsp;</p>
                <p className="text-xs text-muted-foreground">Pending Renewals</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* Vendors Tab */}
        <TabsContent value="vendors" className="space-y-4">
          {!showVendorItems ? (
            <>
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search vendors..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Vendors Table */}
              <Card>
                {linked.error&&<p role="alert">{linked.error.message}</p>}<Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor Name</TableHead>
                      <TableHead className="text-center">Linked Items</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Lead Time</TableHead>
                      <TableHead>Payment Terms</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedVendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{vendor.name}</p>
                            <p className="text-xs text-muted-foreground">{vendor.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">{vendor.activeItems}</TableCell>
                        <TableCell>{getContractStatusBadge(vendor.active?"Active":"Inactive")}</TableCell>
                        <TableCell className="text-center">{vendor.leadTime==null?"":`${vendor.leadTime} days`}</TableCell>
                        <TableCell>{vendor.paymentTerms}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={()=>{setEditing(vendor);setError('');setNewVendorForm({name:vendor.name,type:'',leadTime:vendor.leadTime==null?'':String(vendor.leadTime),paymentTerms:vendor.paymentTerms??'',contactName:vendor.contactName??'',phone:vendor.phone??'',email:vendor.email??''});setShowAddVendor(true);}}><Edit className="h-4 w-4"/><span className="sr-only">Edit vendor</span></Button>
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedVendor(vendor); setShowVendorItems(true); }}>
                              <Eye className="h-4 w-4 mr-1" /> Items
                            </Button>
                            
                            <Button variant="ghost" size="sm" onClick={() => navigateTo("Price Book", "Vendor management", "vendor-profile", { vendorName: vendor.name, vendorId: String(vendor.id) })}>
                              <ExternalLink className="h-4 w-4 mr-1" /> Go to Vendor
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  page={pageVendors} totalPages={totalPagesVendors} totalItems={totalItemsVendors} pageSize={pageSizeVendors}
                  hasPrev={hasPrevVendors} hasNext={hasNextVendors} onPrev={prevVendors} onNext={nextVendors}
                  onPageSizeChange={(s) => setPageSizeVendors(s)}
                />
              </Card>
            </>
          ) : (
            <>
              {/* Vendor Items View */}
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowVendorItems(false);
                    setSelectedVendor(null);
                  }}
                >
                  ← Back to Vendors
                </Button>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{selectedVendor?.name}</span>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Items from {selectedVendor?.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {vendorItemsForSelected.length} items linked to this vendor
                      </p>
                    </div>
                    <Button size="sm" onClick={()=>{setEditLink(null);setProductId('');setUnitCost('');setUnitType('ITEM');setCasePack('');setMoq('');setError('');setLinkOpen(true);}}>
                      <Plus className="h-4 w-4 mr-2" />
                      Link Item
                    </Button>
                  </div>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Scan Code</TableHead>
                      <TableHead>Sub-Department</TableHead>
                      <TableHead className="text-center">Case Pack</TableHead>
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead className="text-right">Last Cost</TableHead>
                      <TableHead className="text-right">Avg Cost</TableHead>
                      <TableHead className="text-center" title="Minimum Order Quantity">MOQ</TableHead>
                      <TableHead className="text-center">Lead Time</TableHead>
                      <TableHead className="text-center">Status</TableHead><TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorItemsForSelected.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="font-mono text-xs">{item.scanCode}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell className="text-center">{item.casePackSize??''}</TableCell>
                        <TableCell className="text-right">${item.unitCost.toFixed(2)}<span className="block text-xs text-muted-foreground">per {item.unitType==='CASE'?'case':'item'}</span></TableCell>
                        <TableCell className="text-right"></TableCell>
                        <TableCell className="text-right"></TableCell>
                        <TableCell className="text-center">{item.moq==null?'':`${item.moq} ${item.unitType==='CASE'?'cases':'items'}`}</TableCell>
                        <TableCell className="text-center">{item.leadTime==null?'':`${item.leadTime} days`}</TableCell>
                        <TableCell className="text-center">
                          {item.active ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell><div className="flex gap-2"><Button variant="outline" size="sm" disabled={busy} onClick={()=>{setEditLink(item);setProductId(String(item.id));setUnitCost(String(item.unitCost));setUnitType(item.unitType??'ITEM');setCasePack(item.casePackSize==null?'':String(item.casePackSize));setMoq(item.moq==null?'':String(item.moq));setError('');setLinkOpen(true);}}>Edit</Button><Button variant="outline" size="sm" disabled={busy} onClick={()=>unlink(item)}>Delete</Button></div></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4"><VendorContracts key={storeId} storeId={storeId} vendors={vendors}/></TabsContent>

        <TabsContent value="pricing" className="space-y-4"><VendorPricing key={storeId} storeId={storeId}/></TabsContent>
        <TabsContent value="audit" className="space-y-4"><VendorAudit key={storeId} storeId={storeId}/></TabsContent>
      </Tabs>
    </div>
  );
};
