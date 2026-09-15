import {useGroceryDefaults} from "@/lib/grocerySettings";
import { useMemo, useState } from "react";
import { differenceInDays, format, parseISO, isAfter, subDays } from "date-fns";
import { PackagePlus, Search, Sparkles, Boxes, DollarSign, Package, Tag, CheckCircle2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery,useQueryClient } from "@tanstack/react-query";
import { request,isPendingChange } from "@/lib/backend";


import { toast } from "@/hooks/use-toast";

type Item = { id:number; version:string; effectiveRetail?:number|null; name:string; sku:string; barcode:string; dept:string; subDept:string; retail:number|null; currentInventory:number|null; [key:string]:unknown };
type Arrival = { id:number; sku:string; itemName:string; barcode:string; vendor:string; firstReceived:string; unitsReceived:number|null; cost:number|null; retail:number|null; currentStock:number|null; isNew:boolean; needsCategory:boolean; msrp:number|null };
type Assignment = {dept:string;subDept:string;margin:number|null;retail:number|null};
const retailFromMargin=(cost:number,margin:number)=>Math.round(cost/(1-margin/100)*100)/100;
export const NewArrivalsPage = ({storeId}:{storeId:string}) => {
  const client=useQueryClient();
  const path=`/access/stores/${encodeURIComponent(storeId)}/items`;
  const defaults=useGroceryDefaults(storeId);
  const itemsQuery=useQuery({queryKey:['pricebook-items',storeId],queryFn:()=>request<{items:Item[];departments:{name:string;children:string[]}[];canEdit:boolean}>(path)});
  const arrivalsQuery=useQuery({queryKey:['new-arrivals',storeId],queryFn:()=>request<{arrivals:Arrival[]}>(`/access/stores/${encodeURIComponent(storeId)}/new-arrivals`)});
  const loading=itemsQuery.isLoading||arrivalsQuery.isLoading;
  const [search,setSearch]=useState('');const [vendorFilter,setVendorFilter]=useState('all');
  const [linkTarget,setLinkTarget]=useState<Arrival|null>(null);
  const [dept,setDept]=useState('');const [subDept,setSubDept]=useState('');const [marginInput,setMarginInput]=useState('');const [saving,setSaving]=useState(false);
  const departmentTree=(itemsQuery.data?.departments??[]).map(d=>({name:d.name,subDepartments:d.children}));
  const arrivals=(arrivalsQuery.data?.arrivals??[]).flatMap(a=>{const p=itemsQuery.data?.items.find(p=>p.id===a.id);return p?[{...a,sku:p.sku,itemName:p.name,barcode:p.barcode,retail:a.needsCategory?(p.effectiveRetail??p.retail):p.retail,currentStock:p.currentInventory}]:[];});
  const assignments:Record<number,Assignment>={};
  for(const a of arrivals){const p=itemsQuery.data?.items.find(p=>p.id===a.id);if(p&&!a.needsCategory)assignments[a.id]={dept:p.dept,subDept:p.subDept,retail:p.retail,margin:a.cost!=null&&p.retail?Number(((p.retail-a.cost)/p.retail*100).toFixed(2)):null};}
  const openLink=(a:Arrival)=>{setLinkTarget(a);const existing=assignments[a.id];setDept(existing?.dept??'');setSubDept(existing?.subDept??'');setMarginInput(existing?.margin!=null?String(existing.margin):'');};
  const onDeptChange=(value:string)=>{setDept(value);setSubDept('');setMarginInput('');};
  const onSubDeptChange=(value:string)=>{setSubDept(value);const margin=defaults.data?.margins.find(m=>m.dept===dept&&m.subDept===value)?.margin;setMarginInput(margin==null?'':String(margin));};
  const subDeptOptions=departmentTree.find(d=>d.name===dept)?.subDepartments??[];
  const previewMargin=Number.parseFloat(marginInput);
  const valid=Number.isFinite(previewMargin)&&previewMargin>=0&&previewMargin<100&&linkTarget?.cost!=null;
  const previewRetail=valid?retailFromMargin(linkTarget!.cost!,previewMargin):0;
  const confirmLink=async()=>{if(!linkTarget||!valid||!dept||!subDept)return;const item=itemsQuery.data?.items.find(p=>p.id===linkTarget.id);if(!item)return;setSaving(true);try{
    const result=await request(`${path}/${item.id}`,{method:'PUT',headers:{'If-Match':item.version},body:JSON.stringify({...item,dept,subDept,retail:previewRetail,currentInventory:null})});
    toast({title:isPendingChange(result)?'Submitted for approval':'Category and regular price saved'});
    await client.invalidateQueries({queryKey:['pricebook-items',storeId]});await client.invalidateQueries({queryKey:['new-arrivals',storeId]});setLinkTarget(null);
  }catch(e){toast({title:'Could not save arrival',description:e instanceof Error?e.message:'Please try again',variant:'destructive'});}finally{setSaving(false);}};

  const vendors = useMemo(
    () => Array.from(new Set(arrivals.map((a) => a.vendor).filter((v) => v !== "—"))).sort(),
    [arrivals]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return arrivals.filter((a) => {
      if (vendorFilter !== "all" && a.vendor !== vendorFilter) return false;
      if (!q) return true;
      return (
        a.itemName.toLowerCase().includes(q) ||
        a.sku.toLowerCase().includes(q) ||
        a.barcode.includes(q)
      );
    });
  }, [arrivals, search, vendorFilter]);

  const newThisWeek = arrivals.filter((a) => a.isNew).length;
  const totalUnits = arrivals.reduce((s, a) => s + (a.unitsReceived??0), 0);
  const totalValue = arrivals.reduce((s, a) => s + (a.unitsReceived??0) * (a.cost??0), 0);
  const pendingCount = arrivals.filter((a) => !assignments[a.id]).length;

  return (
    <div className="space-y-4">
      {(itemsQuery.error||arrivalsQuery.error)&&<p role="alert" className="text-destructive">{String(itemsQuery.error||arrivalsQuery.error)}</p>}
      {arrivals.some(a=>a.cost==null||a.unitsReceived==null)&&<p role="status">Totals exclude arrivals with unknown purchase units or missing case packs.</p>}
      <div>
        <h1 className="text-2xl font-bold text-foreground">New Arrivals</h1>
        <p className="text-sm text-muted-foreground">
          New products from approved invoices — verify their categories and regular prices
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <PackagePlus className="h-5 w-5 text-primary" />
            <div>
              <p className="text-[11px] text-muted-foreground">Total Arrivals</p>
              <p className="text-lg font-bold">{arrivals.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-success" />
            <div>
              <p className="text-[11px] text-muted-foreground">New This Week</p>
              <p className="text-lg font-bold">{newThisWeek}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Boxes className="h-5 w-5 text-primary" />
            <div>
              <p className="text-[11px] text-muted-foreground">Units Received</p>
              <p className="text-lg font-bold">{totalUnits.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-success" />
            <div>
              <p className="text-[11px] text-muted-foreground">Received Value</p>
              <p className="text-lg font-bold">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <div>
              <p className="text-[11px] text-muted-foreground">Needs Category</p>
              <p className="text-lg font-bold">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base">First-Time Received Products</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search name, SKU, barcode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs w-[220px]"
                />
              </div>
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger className="h-8 text-xs w-[160px]">
                  <SelectValue placeholder="All vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All vendors</SelectItem>
                  {vendors.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px]">Product Name</TableHead>
                <TableHead className="text-[11px]">SKU</TableHead>
                <TableHead className="text-[11px]">Barcode</TableHead>
                <TableHead className="text-[11px]">Vendor</TableHead>
                <TableHead className="text-[11px]">Sub-Department</TableHead>
                <TableHead className="text-[11px]">First Received</TableHead>
                <TableHead className="text-[11px] text-right">Units Received</TableHead>
                <TableHead className="text-[11px] text-right">Cost</TableHead>
                <TableHead className="text-[11px] text-right">Margin %</TableHead>
                <TableHead className="text-[11px] text-right">Retail</TableHead>
                <TableHead className="text-[11px] text-right">Current Stock</TableHead>
                <TableHead className="text-[11px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-sm text-muted-foreground py-8">
                    Loading arrivals...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-10">
                    <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">No new arrivals yet</p>
                    <p className="text-xs text-muted-foreground">
                      New items flagged on approved invoices will appear here.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((a) => (
                  <TableRow key={a.id} className={a.isNew ? "bg-success/5" : undefined}>
                    <TableCell className="text-xs font-medium">
                      <span className="flex items-center gap-2">
                        {a.itemName}
                        {a.isNew && (
                          <Badge className="bg-success/10 text-success border-success/30 text-[10px] px-1.5 py-0">
                            New
                          </Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">{a.sku}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.barcode || "—"}</TableCell>
                    <TableCell className="text-xs">{a.vendor}</TableCell>
                    <TableCell className="text-xs">
                      {assignments[a.id] ? (
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                          <span>
                            {assignments[a.id].subDept}
                            <span className="block text-[10px] text-muted-foreground">
                              {assignments[a.id].dept}
                            </span>
                          </span>
                        </span>
                      ) : (
                        <Badge variant="outline" className="text-[10px] border-warning/40 text-warning">
                          Needs category
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {format(parseISO(a.firstReceived), "MMM dd, yyyy")}
                      {differenceInDays(new Date(), parseISO(a.firstReceived)) === 0 && (
                        <span className="text-muted-foreground"> (today)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-right">{a.unitsReceived?.toLocaleString()??""}</TableCell>
                    <TableCell className="text-xs text-right">${a.cost?.toFixed(2)??""}</TableCell>
                    <TableCell className="text-xs text-right">
                      {assignments[a.id]?.margin!=null ? `${assignments[a.id].margin}%` : ""}
                    </TableCell>
                    <TableCell className="text-xs text-right font-medium">
                      {assignments[a.id]
                        ? `$${assignments[a.id].retail?.toFixed(2)??""}`
                        : a.retail != null && a.retail > 0
                          ? `$${a.retail.toFixed(2)}`
                          : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-right font-medium">{a.currentStock?.toLocaleString()??""}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={assignments[a.id] ? "ghost" : "default"}
                        className="h-7 text-[11px]"
                        disabled={!itemsQuery.data?.canEdit} onClick={() => openLink(a)}
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {assignments[a.id] ? "Change" : "Confirm"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!linkTarget} onOpenChange={(o) => !o && setLinkTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm sub-department</DialogTitle>
            <DialogDescription>
              Link {linkTarget?.itemName} to a sub-department — its margin sets the retail price.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Department</Label>
              <Select value={dept} onValueChange={onDeptChange}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {departmentTree.map((d) => (
                    <SelectItem key={d.name} value={d.name}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Sub-Department</Label>
              <Select value={subDept} onValueChange={onSubDeptChange} disabled={!dept||defaults.isPending}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder={dept ? "Select sub-department" : "Select department first"} />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {subDeptOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Margin %</Label>
                <Input
                  type="number"
                  value={marginInput}
                  onChange={(e) => setMarginInput(e.target.value)}
                  className="h-9 text-sm"
                  disabled={!subDept}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Calculated retail</Label>
                <div className="h-9 flex items-center px-3 rounded-md border bg-muted/40 text-sm font-semibold">
                  {previewRetail > 0 ? `$${previewRetail.toFixed(2)}` : "—"}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {defaults.isError?'Could not load saved margins. Enter a margin manually. ':'Saved sub-department margin prefills here and can be overridden. '}Invoice unit cost ${linkTarget?.cost?.toFixed(2) ?? ""}. MSRP {linkTarget?.msrp!=null?`$${linkTarget.msrp.toFixed(2)}`:"not supplied"}. Enter a margin to set regular retail. Active group pricing still applies while grouped.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkTarget(null)}>
              Cancel
            </Button>
            <Button onClick={confirmLink} disabled={saving || !dept || !subDept || !valid}>
              Confirm & set price
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
