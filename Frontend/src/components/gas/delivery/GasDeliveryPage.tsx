import { useEffect, useState } from "react";
import { Plus, Upload, Download, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { format, parseISO, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';
import { request } from '@/lib/backend';
import { type Delivery, type DeliveryData, type DeliveryOptions, exportDeliveries } from './gasDeliveryData';
import { DeliveryListTable } from "./DeliveryListTable";
import { AddDeliveryDialog } from "./AddDeliveryDialog";

const DEFAULT_START = subDays(new Date(),30);
const DEFAULT_END = new Date();

export const GasDeliveryPage = ({storeId}:{storeId:string}) => {
  const path=`/access/stores/${encodeURIComponent(storeId)}/gas-deliveries`;
  const query=useQuery({queryKey:['gas-deliveries',storeId],queryFn:()=>request<DeliveryData>(path),enabled:!!storeId,refetchOnWindowFocus:false});
  const options=useQuery({queryKey:['gas-delivery-options',storeId],queryFn:()=>request<DeliveryOptions>(path+'/options'),enabled:!!storeId,refetchOnWindowFocus:false});
  const [selected,setSelected]=useState<Delivery|null>(null);
  const [opening,setOpening]=useState(false);
  const [error,setError]=useState('');
  const [startDate, setStartDate] = useState<Date>(DEFAULT_START);
  const [endDate, setEndDate] = useState<Date>(DEFAULT_END);
  const [vendor, setVendor] = useState("all");
  const [fuelType, setFuelType] = useState("all");
  const [status, setStatus] = useState("all");
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);

  useEffect(()=>{if(query.data?.today){const date=parseISO(query.data.today);setStartDate(subDays(date,30));setEndDate(date);}},[query.data?.today]);
  const hasActiveFilters = vendor !== "all" || fuelType !== "all" || status !== "all" || format(startDate,'yyyy-MM-dd')!==format(DEFAULT_START,'yyyy-MM-dd') || format(endDate,'yyyy-MM-dd')!==format(DEFAULT_END,'yyyy-MM-dd');
  const grades=Array.from(new Map([...(options.data?.tanks.flatMap(t=>t.assignments)||[]),...(query.data?.deliveries.flatMap(d=>d.lines)||[])].map(g=>[g.gradeId,{id:g.gradeId,name:g.gradeName}])).values());
  const vendors=Array.from(new Map([...(options.data?.vendors||[]),...(query.data?.deliveries.map(d=>({id:d.header.supplier,name:d.vendorName}))||[])].map(v=>[v.id,v])).values());
  const filtered=(query.data?.deliveries||[]).filter(d=>(vendor==='all'||d.header.supplier===vendor)&&(status==='all'||d.status===status)&&d.header.loadDate>=format(startDate,'yyyy-MM-dd')&&d.header.loadDate<=format(endDate,'yyyy-MM-dd')).map(d=>({...d,lines:d.lines.filter(l=>fuelType==='all'||l.gradeId===fuelType)})).filter(d=>d.lines.length>0);
  async function view(delivery:Delivery){setOpening(true);setError('');try{const full=await request<Delivery>(path+'/'+delivery.id);setSelected(full);setAddDrawerOpen(true);void options.refetch();}catch(e){setError(e instanceof Error?e.message:'Unable to open delivery');}finally{setOpening(false);}}
  function saved(){setAddDrawerOpen(false);setSelected(null);void query.refetch();}

  const clearFilters = () => {
    setStartDate(subDays(parseISO(query.data?.today||format(new Date(),"yyyy-MM-dd")),30));
    setEndDate(parseISO(query.data?.today||format(new Date(),"yyyy-MM-dd")));
    setVendor("all");
    setFuelType("all");
    setStatus("all");
  };

  if(query.isPending||options.isPending)return <p>Loading gas deliveries…</p>;
  if(query.error||options.error)return <p role="alert">{query.error?.message||options.error?.message} <Button variant="outline" onClick={()=>{void query.refetch();void options.refetch();}}>Retry</Button></p>;
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Gas Deliveries</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-1.5 text-xs" disabled={!query.data?.canEdit||opening} onClick={() => {setSelected(null);setAddDrawerOpen(true);void options.refetch();}}>
            <Plus className="h-3.5 w-3.5" />
            Add Delivery
          </Button>
          <Button disabled={filtered.length===0} onClick={()=>exportDeliveries(filtered)} variant="outline" size="sm" className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      {error&&<p role="alert" className="text-destructive">{error}</p>}
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap pb-4 border-b border-border">
        {/* Date Range */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                <Calendar className="h-3.5 w-3.5" />
                {format(startDate, "MMM dd, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarPicker mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          <span className="text-xs text-muted-foreground">to</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                <Calendar className="h-3.5 w-3.5" />
                {format(endDate, "MMM dd, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarPicker mode="single" selected={endDate} onSelect={(d) => d && setEndDate(d)} className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
        </div>

        {/* Vendor */}
        <Select value={vendor} onValueChange={setVendor}>
          <SelectTrigger aria-label="Filter deliveries by vendor" className="w-[150px] h-8 text-xs">
            <SelectValue placeholder="Vendor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vendors</SelectItem>
            {vendors.map(v=><SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Fuel Type */}
        <Select value={fuelType} onValueChange={setFuelType}>
          <SelectTrigger aria-label="Filter deliveries by fuel" className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Fuel Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fuels</SelectItem>
            {grades.map(g=><SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Status */}
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger aria-label="Filter deliveries by status" className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="RECEIVED">Received</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={clearFilters}>
            <X className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Alerts strip */}
      {startDate>endDate&&<p role="alert" className="text-destructive text-xs">Start date must be on or before end date.</p>}
      {(query.data?.deliveries.filter(d=>d.status==='DRAFT').length??0)>0&&<div className="inline-flex items-center rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs">{query.data!.deliveries.filter(d=>d.status==='DRAFT').length} draft deliveries waiting for confirmation</div>}

      {/* Delivery List Table */}
      <DeliveryListTable deliveries={filtered} onView={view} busy={opening} />

      {/* Add Delivery Dialog */}
      <AddDeliveryDialog storeId={storeId} open={addDrawerOpen} onOpenChange={setAddDrawerOpen} delivery={selected} today={query.data!.today} options={options.data!} canEdit={query.data!.canEdit} canReceive={query.data!.canReceive} onSaved={saved} />
    </div>
  );
};
