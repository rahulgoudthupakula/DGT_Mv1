import { costEdit } from "@/lib/pricebook/bulk-costs";
import { useState,useRef } from "react";
import { useQuery,useQueryClient } from "@tanstack/react-query";
import { request,isPendingChange } from "@/lib/backend";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { Popover,PopoverContent,PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Download, Search, X, Pencil, Check, XCircle } from "lucide-react";


type Links={version:string;groupId:number|null;groupVersion:string|null;vendorIds:number[];promotionIds:number[];promotionVersions:Record<number,string>};
type Option={id:number;name:string;active?:boolean;version?:string;price?:number};
type BulkItem = {
  effectiveRetail?:number;links:Links;
  id:number;version:string;inventoryVersion:string;unitsPerCase:number;purchaseGrossCost:number;purchaseDiscount:number;vendorNames:string[];
  barcode: string;
  sku: string;
  name: string;
  dept: string;
  subDept: string;
  priceGroup: string;
  vendor: string;
  cost: number;
  retail: number;
  margin: number;
  itemGrossCost: number;
  itemDiscount: number;
  itemNetCost: number;
  unitType: "item" | "case";
  caseGrossCost: number;
  caseDiscount: number;
  caseNetCost: number;
  currentInventory: number;
  reorderLevel: number;
  promotionalBatch: string;
  taxable: boolean;
  ebtSnap: boolean;
  ageRestricted: boolean;
  allowReturns: boolean;
  active: boolean;
};

const money=(v:number)=>v==null||!Number.isFinite(v)?"":`$${v.toFixed(2)}`;
const derive=(i:BulkItem):BulkItem=>{
 const pack=i.unitsPerCase,div=i.unitType==='case'?pack:1;
 const gross=i.purchaseGrossCost==null||!div?null:Math.round(i.purchaseGrossCost/div*1e6)/1e6;
 const discount=i.purchaseDiscount==null||!div?null:Math.round(i.purchaseDiscount/div*1e6)/1e6;
 const net=gross==null||discount==null?null:gross-discount;
 return {...i,itemGrossCost:gross,itemDiscount:discount,itemNetCost:net,cost:net,caseGrossCost:gross==null||!pack?null:gross*pack,caseDiscount:discount==null||!pack?null:discount*pack,caseNetCost:net==null||!pack?null:net*pack,margin:net==null||i.retail==null||i.retail<=0?null:(i.retail-net)/i.retail*100};
};
const body=(i:BulkItem)=>({name:i.name,sku:i.sku,barcode:i.barcode,dept:i.dept,subDept:i.subDept,retail:i.retail,taxable:i.taxable,ebtSnap:i.ebtSnap,allowReturns:i.allowReturns,active:i.active,ageRestricted:i.ageRestricted,reorderLevel:i.reorderLevel,unitType:i.unitType,unitsPerCase:i.unitsPerCase,purchaseGrossCost:i.purchaseGrossCost,purchaseDiscount:i.purchaseDiscount,currentInventory:i.currentInventory,inventoryVersion:i.inventoryVersion});

const YesNoBadge = ({ value }: { value: boolean }) => (
  <Badge variant={value ? "default" : "outline"} className="text-xs">
    {value ? "Yes" : "No"}
  </Badge>
);

const EditableCell = ({value,onChange,type="number"}:{value:string|number;onChange:(v:string)=>void;type?:string}) => {
 const [text,setText]=useState<string|null>(null);
 return <Input className="h-7 text-xs w-24 px-2 text-right" type={type} step="any" value={text??(value??'')} onChange={e=>{setText(e.target.value);onChange(e.target.value);}} onBlur={()=>setText(null)} />;
};

const EditableCheckCell = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex justify-center">
    <Checkbox checked={value} onCheckedChange={(v) => onChange(!!v)} />
  </div>
);

const LinkChoices=({options,selected,onChange,label}:{options:Option[];selected:number[];onChange:(ids:number[])=>void;label:string})=><Popover><PopoverTrigger asChild><Button variant="outline" size="sm" aria-label={label}>{selected.length?`${selected.length} selected`:label}</Button></PopoverTrigger><PopoverContent className="max-h-64 overflow-y-auto">{options.length===0?<p>No available options</p>:options.map(o=><label key={o.id} className="flex gap-2 py-1 text-sm"><Checkbox checked={selected.includes(o.id)} disabled={o.active===false&&!selected.includes(o.id)} onCheckedChange={checked=>onChange(checked?[...selected,o.id]:selected.filter(id=>id!==o.id))}/>{o.name}{o.active===false?' (inactive)':''}</label>)}</PopoverContent></Popover>;

export const BulkUpdatePage = ({storeId}:{storeId:string}) => {
  const path=`/access/stores/${storeId}/items`,client=useQueryClient();
  const query=useQuery({queryKey:['pricebook-items',storeId],queryFn:()=>request<{items:BulkItem[];departments:{name:string;children:string[]}[]}>(path),enabled:!!storeId});
  const options=useQuery({queryKey:['bulk-item-options',storeId],queryFn:()=>request<{groups:Option[];vendors:Option[];promotions:Option[];links:({id:number}&Links)[]}>(`${path}/bulk-options`),enabled:!!storeId,refetchOnMount:'always'});
  const groups=options.data?.groups??[],vendorOptions=options.data?.vendors??[],promotions=options.data?.promotions??[];
  const items=(query.data?.items??[]).map(i=>{
   const saved=options.data?.links.find(l=>l.id===i.id);
   const links=saved?{version:saved.version,groupId:saved.groupId,vendorIds:saved.vendorIds,promotionIds:saved.promotionIds,groupVersion:groups.find(g=>g.id===saved.groupId)?.version??null,promotionVersions:Object.fromEntries(promotions.filter(p=>saved.promotionIds.includes(p.id)).map(p=>[p.id,p.version]))}:null;
   return derive({...i,links,promotionalBatch:promotions.filter(p=>saved?.promotionIds.includes(p.id)).map(p=>p.name).join(', ')});
  });
  const departments=(query.data?.departments??[]).map(d=>d.name),priceGroups=groups.map(g=>g.name),vendors=vendorOptions.map(v=>v.name),promoOptions=promotions.map(p=>p.name);
  const baseline=useRef<BulkItem[]>([]),attempt=useRef({payload:'',key:''});
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('');

  const [draft, setDraft] = useState<BulkItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Filters
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [priceGroupFilter, setPriceGroupFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [promoFilter, setPromoFilter] = useState("all");
  const [taxFilter, setTaxFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [ebtFilter, setEbtFilter] = useState("all");
  const [pageSize, setPageSize] = useState(10);

  const hasActiveFilters = search !== "" || deptFilter !== "all" || priceGroupFilter !== "all" || vendorFilter !== "all" || promoFilter !== "all" || taxFilter !== "all" || ageFilter !== "all" || ebtFilter !== "all";

  const clearFilters = () => {
    setSearch(""); setDeptFilter("all"); setPriceGroupFilter("all");
    setVendorFilter("all"); setPromoFilter("all"); setTaxFilter("all");
    setAgeFilter("all"); setEbtFilter("all");
  };

  const source = isEditing ? draft : items;

  const filtered = source.filter((item) => {
    const f=isEditing?(baseline.current.find(b=>b.id===item.id)??item):item;
    const matchSearch = search === "" || f.name.toLowerCase().includes(search.toLowerCase()) || f.barcode.includes(search) || f.sku.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "all" || f.dept === deptFilter;
    const matchPG = priceGroupFilter === "all" || f.priceGroup === priceGroupFilter;
    const matchVendor = vendorFilter === "all" || (f.vendorNames??[]).includes(vendorFilter);
    const matchPromo = promoFilter === "all" || promotions.some(p=>p.name===promoFilter&&f.links?.promotionIds.includes(p.id));
    const matchTax = taxFilter === "all" || (taxFilter === "yes" ? f.taxable : !f.taxable);
    const matchAge = ageFilter === "all" || (ageFilter === "yes" ? f.ageRestricted : !f.ageRestricted);
    const matchEbt = ebtFilter === "all" || (ebtFilter === "yes" ? f.ebtSnap : !f.ebtSnap);
    return matchSearch && matchDept && matchPG && matchVendor && matchPromo && matchTax && matchAge && matchEbt;
  });

  const { paginated, page, totalPages, totalItems, hasPrev, hasNext, prevPage, nextPage } = usePagination(filtered, pageSize);
  const allSelected = paginated.length > 0 && paginated.every((i) => selected.has(String(i.id)));
  const toggleAll = () => {
    const next = new Set(selected);
    allSelected ? paginated.forEach((i) => next.delete(String(i.id))) : paginated.forEach((i) => next.add(String(i.id)));
    setSelected(next);
  };
  const toggleOne = (barcode: string) => {
    const next = new Set(selected);
    next.has(barcode) ? next.delete(barcode) : next.add(barcode);
    setSelected(next);
  };

  const startEdit = () => {
    baseline.current=items;setMessage('');setDraft(items.map((i) => ({ ...i })));
    setIsEditing(true);
  };

  const updateDraft=(id:number,key:keyof BulkItem,value:string|number|boolean)=>setDraft(prev=>prev.map(i=>{
    if(i.id!==id)return i;let patch:any={[key]:value};
    if(key==='dept')patch.subDept='';
    try{if(['cost','margin','itemGrossCost','itemDiscount','itemNetCost','caseGrossCost','caseDiscount','caseNetCost'].includes(key))patch=costEdit(i,key,value as number);if(key==='unitsPerCase'&&value!=null&&(!Number.isInteger(value)||Number(value)<=0))throw Error('Units per case must be a positive whole number.');setMessage('');}catch(e){setMessage(e instanceof Error?e.message:'Invalid value');return i;}
    return derive({...i,...patch});
  }));
  const changeLinks=(id:number,key:'groupId'|'vendorIds'|'promotionIds',value:number|number[]|null)=>setDraft(prev=>prev.map(i=>{
   if(i.id!==id)return i;const links={...i.links,[key]:value};
   links.groupVersion=groups.find(g=>g.id===links.groupId)?.version??null;
   links.promotionVersions=Object.fromEntries(promotions.filter(p=>links.promotionIds.includes(p.id)).map(p=>[p.id,p.version]));
   const names=vendorOptions.filter(v=>links.vendorIds.includes(v.id)).map(v=>v.name);
   return {...i,links,priceGroup:groups.find(g=>g.id===links.groupId)?.name??'',vendor:names.join(', '),vendorNames:names,promotionalBatch:promotions.filter(p=>links.promotionIds.includes(p.id)).map(p=>p.name).join(', ')};
  }));
  const saveEdit=async()=>{
    const changed=draft.filter(i=>JSON.stringify({item:body(i),links:i.links})!==JSON.stringify({item:body(baseline.current.find(b=>b.id===i.id)!),links:baseline.current.find(b=>b.id===i.id)!.links}));
    if(!changed.length){setIsEditing(false);return;}
    if(changed.length>200){setMessage('Save at most 200 changed items at a time.');return;}
    const payload=JSON.stringify({rows:changed.map(i=>({id:i.id,version:i.version,item:body(i),links:i.links}))});
    if(attempt.current.payload!==payload)attempt.current={payload,key:crypto.randomUUID()};
    setBusy(true);setMessage('');try{const result=await request(`${path}/bulk`,{method:'POST',headers:{'Idempotency-Key':attempt.current.key},body:payload});await Promise.all(['pricebook-items','bulk-item-options','vendors','vendor-items','vendor-audit','vendor-cost-items','vendor-pricing','vendor-available-items','price-groups','promotions','current-stock','stock-movements'].map(k=>client.invalidateQueries({queryKey:[k,storeId]})));setMessage(isPendingChange(result)?'Submitted for approval.':`${changed.length} items saved.`);setIsEditing(false);attempt.current={payload:'',key:''};}catch(e){setMessage(e instanceof Error?e.message:'Could not save items');}finally{setBusy(false);}
  };
  const exportCsv=()=>{
    const rows=filtered.filter(i=>selected.size===0||selected.has(String(i.id)));
    const keys:(keyof BulkItem)[]=['name','barcode','sku','dept','subDept','priceGroup','vendor','promotionalBatch','unitType','unitsPerCase','cost','retail','effectiveRetail','margin','itemGrossCost','itemDiscount','itemNetCost','caseGrossCost','caseDiscount','caseNetCost','currentInventory','reorderLevel','taxable','ebtSnap','ageRestricted','allowReturns','active'];
    const cell=(v:unknown)=>{let t=v==null?'':String(v);if(typeof v==='string'&&/^[=+@\-\t\r]/.test(t))t="'"+t;return '"'+t.replace(/"/g,'""')+'"';};
    const csv=[keys.map(cell).join(','),...rows.map(i=>keys.map(k=>cell(i[k])).join(','))].join('\r\n');
    const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`items-${storeId}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };

  const cancelEdit = () => {
    setDraft([]);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {query.isPending&&<p>Loading items…</p>}{query.error&&<p role="alert">{query.error.message}</p>}{options.error&&<p role="alert">{options.error.message}</p>}{message&&<p role="status">{message}</p>}
      <p className="text-sm text-muted-foreground">Same records as Items. Export uses filtered rows, or selected filtered rows. Retail and margin edit regular retail. Grouped items use the group selling price without changing regular retail. New promotion links use quantity 1; adjust bundle quantities in Promotions.</p>
      <fieldset disabled={busy} className="space-y-6 border-0 p-0 min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bulk Update</h1>
          <p className="text-sm text-muted-foreground">Apply changes across multiple items at once</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={isEditing||!items.length||!options.data} onClick={exportCsv}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={cancelEdit}>
                <XCircle className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={saveEdit}>
                <Check className="h-4 w-4 mr-1" /> Save Changes
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={startEdit} disabled={!items.length||!options.data}>
              <Pencil className="h-4 w-4 mr-1" /> Edit Items
            </Button>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm text-primary">
          <Pencil className="h-4 w-4 shrink-0" />
          Edit mode is active — all rows are now editable. Click <strong className="mx-1">Save Changes</strong> to apply or <strong className="mx-1">Cancel</strong> to discard.
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Name / Barcode / SKU..." className="pl-8 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Department</Label>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Price Group</Label>
              <Select value={priceGroupFilter} onValueChange={setPriceGroupFilter}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {priceGroups.map((pg) => <SelectItem key={pg} value={pg}>{pg}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Vendor</Label>
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Promotion Name</Label>
              <Select value={promoFilter} onValueChange={setPromoFilter}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {promoOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tax Type</Label>
              <Select value={taxFilter} onValueChange={setTaxFilter}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Taxable</SelectItem>
                  <SelectItem value="no">Non-Taxable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Age Restricted</Label>
              <Select value={ageFilter} onValueChange={setAgeFilter}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">EBT / SNAP</Label>
              <Select value={ebtFilter} onValueChange={setEbtFilter}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Accepted</SelectItem>
                  <SelectItem value="no">Not Accepted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground h-8 px-2">
              <X className="h-3.5 w-3.5 mr-1" /> Clear filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Item Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-4">
          <CardTitle className="text-base">Item List</CardTitle>
          <div className="flex items-center gap-3">
            {selected.size > 0 && <span className="text-sm text-primary font-medium">{selected.size} selected</span>}
            <span className="text-sm text-muted-foreground">{filtered.length} of {items.length} items</span>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-0">
          <ScrollArea className="w-full">
            <div className="min-w-[2000px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 pl-6">
                      <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                    </TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Sub-Department</TableHead>
                    <TableHead>Price Group</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Unit Type</TableHead>
                    <TableHead>Promotion Name</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Regular Retail</TableHead>
                    <TableHead className="text-right">Margin %</TableHead>
                    <TableHead className="text-right">Item Gross</TableHead>
                    <TableHead className="text-right">Item Disc.</TableHead>
                    <TableHead className="text-right">Item Net</TableHead>
                    <TableHead className="text-right">Case Gross</TableHead>
                    <TableHead className="text-right">Case Disc.</TableHead>
                    <TableHead className="text-right">Case Net</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Reorder At</TableHead>
                    <TableHead className="text-center">Taxable</TableHead>
                    <TableHead className="text-center">EBT/SNAP</TableHead>
                    <TableHead className="text-center">Age Rest.</TableHead>
                    <TableHead className="text-center">Returns</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={26} className="text-center text-muted-foreground py-10">
                        No items match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((item) => {
                      const onHand = item.currentInventory;
                      const isLowStock = onHand!=null && item.reorderLevel!=null && onHand <= item.reorderLevel;
                      const isChecked = selected.has(String(item.id));
                      return (
                        <TableRow key={item.id} className={isChecked ? "bg-primary/5" : undefined}>
                          <TableCell className="pl-6">
                            <Checkbox checked={isChecked} onCheckedChange={() => toggleOne(String(item.id))} />
                          </TableCell>

                          {/* Identity */}
                          <TableCell className="font-medium whitespace-nowrap">{isEditing?<EditableCell type="text" value={item.name} onChange={v=>updateDraft(item.id,"name",v)}/>:item.name}</TableCell>
                          <TableCell className="font-mono text-xs">{isEditing?<EditableCell type="text" value={item.barcode} onChange={v=>updateDraft(item.id,"barcode",v)}/>:item.barcode}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{isEditing?<EditableCell type="text" value={item.sku} onChange={v=>updateDraft(item.id,"sku",v)}/>:item.sku}</TableCell>

                          {/* Department */}
                          <TableCell>
                            {isEditing ? (
                              <Select value={item.dept} onValueChange={(v) => updateDraft(item.id, "dept", v)}>
                                <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant="secondary">{item.dept}</Badge>
                            )}
                          </TableCell>

                          {/* Sub-Department */}
                          <TableCell>{isEditing?<Select value={item.subDept||''} onValueChange={v=>updateDraft(item.id,'subDept',v)}><SelectTrigger className="h-7 text-xs w-28"><SelectValue placeholder="Choose" /></SelectTrigger><SelectContent>{(query.data?.departments.find(d=>d.name===item.dept)?.children??[]).map(n=><SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent></Select>:item.subDept}</TableCell>

                          <TableCell>{isEditing?<Select value={item.links.groupId==null?'none':String(item.links.groupId)} onValueChange={v=>changeLinks(item.id,'groupId',v==='none'?null:Number(v))}><SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No group</SelectItem>{groups.map(g=><SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}</SelectContent></Select>:item.priceGroup}</TableCell>
                          <TableCell>{isEditing?<LinkChoices label="Choose vendors" options={vendorOptions} selected={item.links.vendorIds} onChange={ids=>changeLinks(item.id,'vendorIds',ids)}/>:item.vendor}</TableCell>

                          {/* Unit Type */}
                          <TableCell>
                            {isEditing ? (
                              <Select value={item.unitType} onValueChange={(v) => updateDraft(item.id, "unitType", v as "item" | "case")}>
                                <SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="item">Item</SelectItem>
                                  <SelectItem value="case">Case</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-sm capitalize">{item.unitType}</span>
                            )}
                          {isEditing?<div className="mt-1"><Label className="text-xs">Units / case</Label><EditableCell value={item.unitsPerCase} onChange={v=>updateDraft(item.id,'unitsPerCase',v===''?null:Number(v))}/></div>:item.unitsPerCase!=null&&<div className="text-xs">{item.unitsPerCase} / case</div>}</TableCell>

                          <TableCell>{isEditing?<LinkChoices label="Choose promotions" options={promotions} selected={item.links.promotionIds} onChange={ids=>changeLinks(item.id,'promotionIds',ids)}/>:item.promotionalBatch}</TableCell>

                          {/* Numeric fields */}
                          {(["cost", "retail"] as const).map((k) => (
                            <TableCell key={k} className="text-right">
                              {isEditing ? (
                                <EditableCell value={item[k]} onChange={(v) => updateDraft(item.id, k, v===''?null:Number(v))} />
                              ) : (
                                money(item[k])
                              )}{k==='retail'&&(item.priceGroup||(item.effectiveRetail!=null&&item.effectiveRetail!==item.retail))&&<p className="text-xs text-muted-foreground">{item.priceGroup?"Group":"Invoice MSRP"} selling price: {money(groups.find(g=>g.id===item.links?.groupId)?.price??item.effectiveRetail)}</p>}
                            </TableCell>
                          ))}

                          {/* Margin edits calculate individual retail */}
                          <TableCell className="text-right font-medium text-primary">{isEditing?<EditableCell value={item.margin==null?null:Number(item.margin.toFixed(2))} onChange={v=>updateDraft(item.id,"margin",v===''?null:Number(v))}/>:item.margin==null?"":`${item.margin.toFixed(1)}%`}</TableCell>

                          {(["itemGrossCost", "itemDiscount", "itemNetCost", "caseGrossCost", "caseDiscount", "caseNetCost"] as const).map((k) => (
                            <TableCell key={k} className="text-right">
                              {isEditing ? (
                                <EditableCell value={item[k]} onChange={(v) => updateDraft(item.id, k, v===''?null:Number(v))} />
                              ) : (
                                money(item[k])
                              )}
                            </TableCell>
                          ))}

                          {/* Stock */}
                          <TableCell className="text-right">
                            {isEditing ? (
                              <EditableCell value={onHand} onChange={(v) => updateDraft(item.id, "currentInventory", v===''?null:Number(v))} />
                            ) : (
                              <div className="flex flex-col items-end gap-0.5">
                                <span className="text-sm">{onHand}</span>
                                {isLowStock && <span className="text-xs font-medium text-destructive">Low</span>}
                              </div>
                            )}
                          </TableCell>

                          {/* Reorder */}
                          <TableCell className="text-right">
                            {isEditing ? (
                              <EditableCell value={item.reorderLevel} onChange={(v) => updateDraft(item.id, "reorderLevel", v===''?null:Number(v))} />
                            ) : (
                              <span className="text-sm">{item.reorderLevel}</span>
                            )}
                          </TableCell>

                          {/* Boolean flags */}
                          {(["taxable", "ebtSnap", "ageRestricted", "allowReturns", "active"] as const).map((k) => (
                            <TableCell key={k} className="text-center">
                              {isEditing ? (
                                <EditableCheckCell value={item[k] as boolean} onChange={(v) => updateDraft(item.id, k, v)} />
                              ) : (
                                <YesNoBadge value={item[k] as boolean} />
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <TablePagination
            page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize}
            hasPrev={hasPrev} hasNext={hasNext} onPrev={prevPage} onNext={nextPage}
            onPageSizeChange={(s) => setPageSize(s)}
          />
        </CardContent>
      </Card>
    </fieldset></div>
  );
};
