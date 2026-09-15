import {useGroceryDefaults} from "@/lib/grocerySettings";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { request, isPendingChange } from "@/lib/backend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Plus, Download, X, Pencil, Trash2, Copy, Send, MoreHorizontal } from "lucide-react";



type Item = {
  id?: number; version?: string; inventoryVersion?:string; unitsPerCase?:number; purchaseGrossCost?:number; purchaseDiscount?:number;
  barcode: string;
  sku: string;
  name: string;
  category: string;
  vendor: string;
  vendorNames?:string[];
  dept: string;
  cost: number;
  retail: number;
  effectiveRetail?:number;
  taxable: boolean;
  ageRestricted: boolean;
  allowReturns: boolean;
  active: boolean;
  lastUpdated: string;
  // New fields
  priceGroup: string;
  ebtSnap: boolean;
  itemGrossCost: number;
  itemNetCost: number;
  itemDiscount: number;
  unitType: "item" | "case";
  caseGrossCost: number;
  caseDiscount: number;
  caseNetCost: number;
  currentInventory?: number;
  reorderLevel: number;
  promotionalBatch: string;
  subDept?: string;
};

const emptyItem: Item = {
  barcode: "", sku: "", name: "", category: "", vendor: "", dept: "",
  cost: 0, retail: 0, taxable: false, ageRestricted: false, allowReturns: false, active: true, lastUpdated: "",
  priceGroup: "", ebtSnap: false,
  itemGrossCost: 0, itemNetCost: 0, itemDiscount: 0,
  unitType: "item",
  caseGrossCost: 0, caseDiscount: 0, caseNetCost: 0,
  currentInventory: undefined, reorderLevel: 0, promotionalBatch: "", subDept: "",
};

const calcMargin = (cost: number, retail: number) =>
  retail > 0 ? (((retail - cost) / retail) * 100).toFixed(1) + "%" : "0.0%";

type DrawerMode = "edit" | "add" | null;



const CurrencyInput = ({
  id, label, value, onChange, readOnly=false,
}: { id: string; label: string; value: number; onChange: (v: number) => void; readOnly?:boolean }) => {
  const [draft,setDraft]=useState<string|null>(null);
  return (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    <div className="relative">
      <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">$</span>
      <Input
        id={id}
        readOnly={readOnly}
        min="0"
        type="number"
        step="0.01"
        placeholder=""
        value={draft??(Number.isFinite(value)?value:"")}
        onChange={(e) => {setDraft(e.target.value);onChange(e.target.value===''?0:Number(e.target.value));}}
        onBlur={()=>setDraft(null)}
        className="pl-6"
      />
    </div>
  </div>
);
};

export const ItemsPage = ({storeId}: {storeId:string}) => {
  const defaults=useGroceryDefaults(storeId);
  const client=useQueryClient(),path=`/access/stores/${encodeURIComponent(storeId)}/items`;
  const query=useQuery({queryKey:['pricebook-items',storeId],queryFn:()=>request<{items:Item[];departments:{name:string;children:string[]}[];canEdit:boolean}>(path),enabled:!!storeId});
  const items=(query.data?.items??[]).map(i=>({...emptyItem,...i,unitType:i.unitType??"item"}));
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
  async function save(){if(!form)return;if(marginPct>=100){setMessage('Margin must be less than 100%.');return;}setBusy(true);setMessage('');try{
    const body={name:form.name,sku:form.sku,barcode:form.barcode,dept:form.dept,subDept:form.subDept,retail:form.retail,taxable:form.taxable,ebtSnap:form.ebtSnap,allowReturns:form.allowReturns,active:form.active,ageRestricted:form.ageRestricted,reorderLevel:form.reorderLevel,unitType:form.unitType,unitsPerCase:form.unitsPerCase??null,purchaseGrossCost:form.unitType==='case'?form.caseGrossCost:form.itemGrossCost,purchaseDiscount:form.unitType==='case'?form.caseDiscount:form.itemDiscount,currentInventory:form.currentInventory??null,inventoryVersion:isAdd?'0':form.inventoryVersion??'0'};
    const result=await request(isAdd?path:`${path}/${editItem?.id}`,{method:isAdd?'POST':'PUT',headers:isAdd?{}:{'If-Match':editItem?.version??''},body:JSON.stringify(body)});
    setMessage(isPendingChange(result)?'Submitted for approval.':'Item saved.');setDrawerOpen(false);await Promise.all(['pricebook-items','vendor-pricing','vendor-available-items','price-groups','current-stock','stock-movements'].map(key=>client.invalidateQueries({queryKey:[key,storeId]})));
  }catch(e){setMessage(e instanceof Error?e.message:'Could not save item');}finally{setBusy(false);}}

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [form, setForm] = useState<Item | null>(null);
  const [marginPct, setMarginPct] = useState<number>(0);

  const hasActiveFilters = search !== "" || categoryFilter !== "all" || vendorFilter !== "all" || deptFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setVendorFilter("all");
    setDeptFilter("all");
    setStatusFilter("all");
  };

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))];
  const vendors = [...new Set(items.flatMap((i) => i.vendorNames??(i.vendor?[i.vendor]:[])).filter(Boolean))];
  const depts = [...new Set((query.data?.departments??[]).map(d=>d.name))];
  const subDepts = query.data?.departments.find(d=>d.name===form?.dept)?.children??[];


  const filtered = items
    .filter((item) => {
      const matchSearch =
        search === "" ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.barcode.includes(search) ||
        item.sku.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === "all" || item.category.toLowerCase() === categoryFilter;
      const matchVendor = vendorFilter === "all" || (item.vendorNames??[item.vendor]).includes(vendorFilter);
      const matchDept = deptFilter === "all" || item.dept.toLowerCase() === deptFilter;
      const matchStatus = statusFilter === "all" || (statusFilter === "active" ? item.active : !item.active);
      return matchSearch && matchCategory && matchVendor && matchDept && matchStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name": return a.name.localeCompare(b.name);
        case "retail_asc": return a.retail - b.retail;
        case "retail_desc": return b.retail - a.retail;
        case "margin": {
          const mA = a.retail > 0 ? (a.retail - a.cost) / a.retail : 0;
          const mB = b.retail > 0 ? (b.retail - b.cost) / b.retail : 0;
          return mB - mA;
        }
        case "last_updated": return b.lastUpdated.localeCompare(a.lastUpdated);
        default: return 0;
      }
    });

  const calcMarginFromForm = (cost: number, retail: number) =>
    retail > 0 ? parseFloat((((retail - cost) / retail) * 100).toFixed(2)) : 0;

  const openEdit = (item: Item) => {
    setDrawerMode("edit");
    setEditItem(item);
    setForm({ ...item });
    setMarginPct(calcMarginFromForm(item.cost, item.retail));
    setDrawerOpen(true);
  };

  const openAdd = () => {
    if(defaults.isPending||defaults.isError){setMessage(defaults.isError?"Could not load store item defaults. Reload and try again.":"Loading store item defaults…");return;}
    setDrawerMode("add");
    setEditItem(null);
    setForm({ ...emptyItem, taxable:defaults.data?.defaultTaxType==null?emptyItem.taxable:defaults.data.defaultTaxType==='taxable' });
    setMarginPct(0);
    setDrawerOpen(true);
  };

  const handleFormChange = (key: keyof Item | "marginPct", value: string | number | boolean) => {
    if (!form) return;
    if (key === "retail") {
      const retail = value as number;
      setForm({ ...form, retail });
      setMarginPct(calcMarginFromForm(form.cost, retail));
    } else if (key === "marginPct") {
      const margin = value as number;
      const retail = margin < 100 && form.cost > 0 ? parseFloat((form.cost / (1 - margin / 100)).toFixed(2)) : form.retail;
      setMarginPct(margin);
      setForm({ ...form, retail });
    } else if (["cost","itemGrossCost","itemDiscount","caseGrossCost","caseDiscount","unitType","unitsPerCase"].includes(key)) {
      const next={...form,[key]:value} as Item;
      const units=next.unitsPerCase??1;
      if(key==='cost'){next.itemGrossCost=Number(value)+next.itemDiscount;if(next.unitType==='case')next.caseGrossCost=next.itemGrossCost*units;}
      if(next.unitType==='case'){
        next.itemGrossCost=Number((next.caseGrossCost/units).toFixed(6));next.itemDiscount=Number((next.caseDiscount/units).toFixed(6));
      }else{next.caseGrossCost=Number((next.itemGrossCost*units).toFixed(2));next.caseDiscount=Number((next.itemDiscount*units).toFixed(2));}
      next.itemNetCost=Number((next.itemGrossCost-next.itemDiscount).toFixed(6));next.caseNetCost=Number((next.caseGrossCost-next.caseDiscount).toFixed(2));next.cost=next.itemNetCost;
      setForm(next);setMarginPct(calcMarginFromForm(next.cost,next.retail));
    } else {
      setForm({ ...form, [key]: value });
    }
  };

  const isAdd = drawerMode === "add";

  const drawerFields = form ? (
    <div className="py-4 space-y-5">

      {/* ── Basic Info ── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Basic Info</p>
        <div className="space-y-1.5">
          <Label htmlFor="name">Item Name</Label>
          <Input id="name" placeholder="e.g. Coca-Cola 20oz" value={form.name} onChange={(e) => handleFormChange("name", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sku">SKU</Label><Input id="sku" value={form.sku} onChange={e=>handleFormChange("sku",e.target.value)} />
          <Label htmlFor="barcode">Barcode</Label>
          <Input id="barcode" placeholder="e.g. 049000042566" value={form.barcode} onChange={(e) => handleFormChange("barcode", e.target.value)} className="font-mono" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dept">Department</Label>
          <Select value={form.dept} onValueChange={(v) => setForm({...form,dept:v,subDept:""})}>
            <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
            <SelectContent>
              {depts.length === 0 ? (
                <div className="px-2 py-3 text-xs text-muted-foreground">No departments yet</div>
              ) : depts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              
            </SelectContent>
          </Select>

        </div>
        <div className="space-y-1.5">
          <Label htmlFor="subDept">Sub-Department</Label>
          <Select value={form.subDept ?? ""} onValueChange={(v) => handleFormChange("subDept", v)}>
            <SelectTrigger><SelectValue placeholder="Select sub-department" /></SelectTrigger>
            <SelectContent>
              {subDepts.length === 0 ? (
                <div className="px-2 py-3 text-xs text-muted-foreground">No sub-departments yet</div>
              ) : subDepts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              
            </SelectContent>
          </Select>

        </div>

      </div>

      <Separator />

      {/* ── Retail Pricing ── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Retail Pricing</p>
        <CurrencyInput id="cost" label="Cost" value={form.cost} onChange={(v) => handleFormChange("cost", v)} />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="retail">Retail Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">$</span>
              <Input
                id="retail"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.retail || ""}
                onChange={(e) => handleFormChange("retail", parseFloat(e.target.value) || 0)}
                className="pl-6"
              />
            </div>
            <p className="text-xs text-muted-foreground">Change → margin auto-updates</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="marginPct">Margin %</Label>
            <div className="relative">
              <Input
                id="marginPct"
                type="number"
                step="0.01"
                placeholder=""
                value={marginPct}
                onChange={(e) => handleFormChange("marginPct", parseFloat(e.target.value) || 0)}
                className="pr-6"
              />
              <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">Change → retail auto-updates</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Item Cost Breakdown ── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Item Cost Breakdown</p>
        <div className="grid grid-cols-3 gap-3">
          <CurrencyInput readOnly={form.unitType==='case'} id="itemGrossCost" label="Gross Cost" value={form.itemGrossCost} onChange={(v) => handleFormChange("itemGrossCost", v)} />
          <CurrencyInput readOnly={form.unitType==='case'} id="itemDiscount" label="Discount" value={form.itemDiscount} onChange={(v) => handleFormChange("itemDiscount", v)} />
          <CurrencyInput readOnly id="itemNetCost" label="Net Cost" value={form.itemNetCost} onChange={(v) => handleFormChange("itemNetCost", v)} />
        </div>
      </div>

      <Separator />

      {/* ── Unit Type ── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sold by Unit or Case</p><p className="text-xs text-muted-foreground">Enter gross cost and dollar discount for the selected unit. Net cost and the other unit’s costs are calculated automatically.</p>
        <div className="space-y-1.5">
          <Label htmlFor="unitsPerCase">Units per Case</Label><Input id="unitsPerCase" type="number" min="1" step="1" value={form.unitsPerCase??''} onChange={e=>handleFormChange('unitsPerCase',Number(e.target.value))}/>
          <Label htmlFor="unitType">Sold by Unit or Case</Label>
          <Select value={form.unitType??"item"} onValueChange={(v) => handleFormChange("unitType", v as "item" | "case")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="item">Unit (Each)</SelectItem>
              <SelectItem value="case">Case</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* ── Case Cost Breakdown ── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Case Cost Breakdown</p>
        <div className="grid grid-cols-3 gap-3">
          <CurrencyInput readOnly={form.unitType!=='case'} id="caseGrossCost" label="Gross Cost" value={form.caseGrossCost} onChange={(v) => handleFormChange("caseGrossCost", v)} />
          <CurrencyInput readOnly={form.unitType!=='case'} id="caseDiscount" label="Discount" value={form.caseDiscount} onChange={(v) => handleFormChange("caseDiscount", v)} />
          <CurrencyInput readOnly id="caseNetCost" label="Net Cost" value={form.caseNetCost} onChange={(v) => handleFormChange("caseNetCost", v)} />
        </div>
      </div>

      <Separator />

      {/* ── Inventory ── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Inventory</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="currentInventory">Current Count</Label>
            <Input
              id="currentInventory"
              type="number"
              placeholder=""
              value={form.currentInventory ?? ""}
              onChange={(e) => setForm({...form,currentInventory:e.target.value===''?undefined:Number(e.target.value)})}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reorderLevel">Reorder Level</Label>
            <Input
              id="reorderLevel"
              type="number"
              placeholder=""
              value={form.reorderLevel || ""}
              onChange={(e) => handleFormChange("reorderLevel", parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Item Settings ── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Item Settings</p>
        {[
          { key: "taxable", label: "Taxable", desc: "Apply sales tax to this item" },
          { key: "ebtSnap", label: "EBT / SNAP Accepted", desc: "Item is eligible for food stamp payment" },
          { key: "ageRestricted", label: "Age Restricted", desc: "Requires age verification at checkout" },
          { key: "allowReturns", label: "Allow Returns", desc: "Item can be returned for refund" },
          { key: "active", label: "Active", desc: "Item is available for sale" },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <Switch
              
              checked={!!form[key as keyof Item]}
              onCheckedChange={(v) => handleFormChange(key as keyof Item, v)}
            />
          </div>
        ))}
      </div>

    </div>
  ) : null;

  return (
    <div className="space-y-6">
      {query.isPending&&<p>Loading items…</p>}{query.error&&<p role="alert">{query.error.message}</p>}{!drawerOpen&&message&&<p role="status">{message}</p>}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Items</h1>
          <p className="text-sm text-muted-foreground">Create, edit, and manage item pricing rules</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled><Download className="h-4 w-4 mr-1" /> Export</Button>
          <Button size="sm" disabled={!query.data?.canEdit} onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Name / Barcode / SKU..." className="pl-8 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Vendor</Label>
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Vendors" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Department</Label>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Departments" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {depts.map((d) => <SelectItem key={d} value={d.toLowerCase()}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Product Name</SelectItem>
                  <SelectItem value="retail_asc">Price: Low → High</SelectItem>
                  <SelectItem value="retail_desc">Price: High → Low</SelectItem>
                  <SelectItem value="margin">Margin (High)</SelectItem>
                  <SelectItem value="last_updated">Last Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-3">
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground h-8 px-2">
                <X className="h-3.5 w-3.5 mr-1" /> Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-4">
          <CardTitle className="text-base">Inventory Items</CardTitle>
          <span className="text-sm text-muted-foreground">{filtered.length} of {items.length} items</span>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Barcode / SKU</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Sub-Department</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Price Group</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Retail Price</TableHead>
                <TableHead className="text-right">Margin %</TableHead>
                <TableHead className="text-center">Taxable</TableHead>
                <TableHead className="text-center">EBT/SNAP</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="text-center text-muted-foreground py-8">
                    No items match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => {
                  const onHand = item.currentInventory;
                  const isLowStock = onHand!=null&&item.reorderLevel!=null&&onHand<=item.reorderLevel;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <div className="font-mono text-xs">{item.barcode}</div>
                        <div className="text-xs text-muted-foreground">{item.sku}</div>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{item.dept}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.subDept || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.vendor}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.priceGroup || "—"}</TableCell>
                      <TableCell className="text-right">{item.cost!=null?`$${item.cost.toFixed(2)}`:''}</TableCell>
                      <TableCell className="text-right">{item.retail == null ? "" : `$${item.retail.toFixed(2)}`}{item.effectiveRetail!=null&&(item.priceGroup||item.effectiveRetail!==item.retail)&&<div className="text-xs text-muted-foreground">{item.priceGroup?"Group":"Invoice MSRP"} selling price: ${item.effectiveRetail.toFixed(2)}</div>}</TableCell>
                      <TableCell className="text-right font-medium text-primary">{item.cost!=null&&item.retail>0?calcMargin(item.cost,item.retail):''}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={item.taxable ? "default" : "outline"} className="text-xs">
                          {item.taxable ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={item.ebtSnap ? "default" : "outline"} className="text-xs">
                          {item.ebtSnap ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm">{onHand}</span>
                          {isLowStock && (
                            <span className="text-xs font-medium text-destructive">Low Stock</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.active ? "default" : "outline"}>
                          {item.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled={!query.data?.canEdit} onClick={() => openEdit(item)}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled={!query.data?.canEdit} onClick={() => { setDrawerMode("add"); setEditItem(null); setMarginPct(calcMarginFromForm(item.cost,item.retail)); setForm({ ...item, barcode: "", sku: item.sku + "-COPY", name: item.name + " (Copy)", currentInventory: undefined, inventoryVersion: '0' }); setDrawerOpen(true); }}>
                              <Copy className="h-4 w-4 mr-2" /> Clone Item
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled onClick={() => {}}>
                              <Send className="h-4 w-4 mr-2" /> Send to POS
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled className="text-destructive focus:text-destructive" onClick={() => {}}>
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Item Drawer */}
      <Sheet open={drawerOpen} onOpenChange={v=>{if(!busy)setDrawerOpen(v);}}>
        <SheetContent className="w-[440px] sm:w-[520px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{isAdd ? "Add New Item" : "Edit Item"}</SheetTitle>
            <p className="text-sm text-muted-foreground">
              {isAdd ? "Fill in the details to create a new item." : editItem?.name}
            </p>
          </SheetHeader>

          <fieldset disabled={busy}>{drawerFields}</fieldset>
          {message&&<p role="status">{message}</p>}

          <SheetFooter className="flex gap-2 pt-2 pb-6">
            <Button disabled={busy} variant="outline" className="flex-1" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button className="flex-1" disabled={busy||!query.data?.canEdit} onClick={save}>
              {isAdd ? "Create Item" : "Save Changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

    </div>
  );
};
