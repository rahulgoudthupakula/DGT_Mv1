import {usePurchaseReports} from './usePurchaseReports';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Search } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SingleItemPurchaseTable, type ItemPurchaseRow } from "./SingleItemPurchaseTable";

/* ── Mock purchase rows ─────────────────────────────────── */



const COST_SPIKE_THRESHOLD = 3; // percent

export const SingleItemPurchaseHistory = ({storeId}:{storeId:string}) => {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [vendorFilter, setVendorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const query=usePurchaseReports(storeId,startDate,endDate);
  const mockRows=query.data?.items??[];

  // Unique vendors for filter
  const vendors = [...new Set(mockRows.map((r) => r.vendor))];

  // Apply filters
  const filteredRows = mockRows.filter((row) => {
    const matchesSearch =
      searchQuery === "" ||
      row.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.scanCode.includes(searchQuery);
    const matchesVendor = vendorFilter === "all" || row.vendor === vendorFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "invoiced" && row.invoiced) ||
      (statusFilter === "uninvoiced" && !row.invoiced);
    const matchesStart = true;
    const matchesEnd = true;
    return matchesSearch && matchesVendor && matchesStatus && matchesStart && matchesEnd;
  });

  return (
    <div className="space-y-4">
      {query.isPending&&<p>Loading approved purchases…</p>}{query.error&&<p role="alert" className="text-destructive">{String(query.error)}</p>}
      <p className="text-xs text-muted-foreground">Approved grocery invoices only. Payment splits, earned rebates and unallocated adjustments show — where unavailable.</p>
      {/* ── Filters ─────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 text-xs pl-8 w-[180px]"
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal h-9 text-xs w-[150px]",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                  {startDate ? format(startDate, "MM/dd/yyyy") : "From date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal h-9 text-xs w-[150px]",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                  {endDate ? format(endDate, "MM/dd/yyyy") : "To date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Select value={vendorFilter} onValueChange={setVendorFilter}>
              <SelectTrigger className="h-9 text-xs w-[160px]">
                <SelectValue placeholder="All Vendors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {vendors.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-xs w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="invoiced">Invoiced</SelectItem>
                <SelectItem value="uninvoiced">Uninvoiced</SelectItem>
              </SelectContent>
            </Select>

            <Badge variant="secondary" className="text-[10px] gap-1 ml-auto">
              {filteredRows.length} of {mockRows.length} purchases
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* ── Purchase History Table ──────────────────────── */}
      <Card>
        <CardContent className="pt-4">
          <SingleItemPurchaseTable
            data={filteredRows}
            costSpikeThreshold={COST_SPIKE_THRESHOLD}
          />
        </CardContent>
      </Card>
    </div>
  );
};
