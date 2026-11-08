import { useState } from "react";
import { Plus, Upload, Download, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DeliveryAlerts } from "./DeliveryAlerts";
import { DeliveryListTable } from "./DeliveryListTable";
import { AddDeliveryDialog } from "./AddDeliveryDialog";

const DEFAULT_START = new Date();
const DEFAULT_END = new Date();

export const GasDeliveryPage = () => {
  const [startDate, setStartDate] = useState<Date>(DEFAULT_START);
  const [endDate, setEndDate] = useState<Date>(DEFAULT_END);
  const [vendor, setVendor] = useState("all");
  const [fuelType, setFuelType] = useState("all");
  const [status, setStatus] = useState("all");
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);

  const hasActiveFilters = vendor !== "all" || fuelType !== "all" || status !== "all";

  const clearFilters = () => {
    setStartDate(new Date());
    setEndDate(new Date());
    setVendor("all");
    setFuelType("all");
    setStatus("all");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Gas Deliveries</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-1.5 text-xs" onClick={() => setAddDrawerOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Delivery
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

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
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <SelectValue placeholder="Vendor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vendors</SelectItem>
            <SelectItem value="sunoco">Sunoco LP</SelectItem>
            <SelectItem value="marathon">Marathon Petroleum</SelectItem>
            <SelectItem value="shell">Shell Oil</SelectItem>
            <SelectItem value="exxon">ExxonMobil</SelectItem>
          </SelectContent>
        </Select>

        {/* Fuel Type */}
        <Select value={fuelType} onValueChange={setFuelType}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Fuel Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fuels</SelectItem>
            <SelectItem value="regular">Regular</SelectItem>
            <SelectItem value="plus">Plus</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="diesel">Diesel</SelectItem>
          </SelectContent>
        </Select>

        {/* Status */}
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="reconciled">Reconciled</SelectItem>
            <SelectItem value="posted">Posted</SelectItem>
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
      <DeliveryAlerts />

      {/* Delivery List Table */}
      <DeliveryListTable vendor={vendor} fuelType={fuelType} status={status} startDate={startDate} endDate={endDate} />

      {/* Add Delivery Dialog */}
      <AddDeliveryDialog open={addDrawerOpen} onOpenChange={setAddDrawerOpen} />
    </div>
  );
};
