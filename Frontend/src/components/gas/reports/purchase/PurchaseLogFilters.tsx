import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Printer, Download, Search, X } from "lucide-react";

interface PurchaseLogFiltersProps {
  dateRange: string;
  onDateRangeChange: (v: string) => void;
  vendor: string;
  onVendorChange: (v: string) => void;
  fuelType: string;
  onFuelTypeChange: (v: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export const PurchaseLogFilters = ({
  dateRange, onDateRangeChange,
  vendor, onVendorChange,
  fuelType, onFuelTypeChange,
  search, onSearchChange,
  hasActiveFilters, onClearFilters,
}: PurchaseLogFiltersProps) => (
  <div className="sticky top-0 z-10 bg-background border-b border-border pb-4 space-y-3">
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 min-w-[180px]">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Select value={dateRange} onValueChange={onDateRangeChange}>
          <SelectTrigger className="h-8 text-xs w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="this-week">This Week</SelectItem>
            <SelectItem value="last-week">Last Week</SelectItem>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Select value={vendor} onValueChange={onVendorChange}>
        <SelectTrigger className="h-8 text-xs w-[150px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Vendors</SelectItem>
          <SelectItem value="marathon">Marathon Petroleum</SelectItem>
          <SelectItem value="shell">Shell Supply</SelectItem>
          <SelectItem value="bp">BP Products</SelectItem>
        </SelectContent>
      </Select>

      <Select value={fuelType} onValueChange={onFuelTypeChange}>
        <SelectTrigger className="h-8 text-xs w-[130px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Fuel Types</SelectItem>
          <SelectItem value="regular">Regular</SelectItem>
          <SelectItem value="plus">Plus</SelectItem>
          <SelectItem value="premium">Premium</SelectItem>
          <SelectItem value="diesel">Diesel</SelectItem>
        </SelectContent>
      </Select>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Invoice # / BOL #"
          className="h-8 text-xs pl-8 w-[160px]"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={onClearFilters}>
            <X className="h-3.5 w-3.5" />Clear filters
          </Button>
        )}
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5" />Print
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
          <Download className="h-3.5 w-3.5" />Export
        </Button>
      </div>
    </div>
  </div>
);
