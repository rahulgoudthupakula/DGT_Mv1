import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, Printer, Download } from "lucide-react";

interface Props {
  dateRange: string;
  onDateRangeChange: (v: string) => void;
  fuelType: string;
  onFuelTypeChange: (v: string) => void;
  jurisdiction: string;
  onJurisdictionChange: (v: string) => void;
  viewType: string;
  onViewTypeChange: (v: string) => void;
}

export const GasTaxFilters = ({
  dateRange, onDateRangeChange,
  fuelType, onFuelTypeChange,
  jurisdiction, onJurisdictionChange,
  viewType, onViewTypeChange,
}: Props) => (
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

      <Select value={jurisdiction} onValueChange={onJurisdictionChange}>
        <SelectTrigger className="h-8 text-xs w-[130px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Jurisdictions</SelectItem>
          <SelectItem value="federal">Federal</SelectItem>
          <SelectItem value="state">State</SelectItem>
          <SelectItem value="county">County</SelectItem>
        </SelectContent>
      </Select>

      <Select value={viewType} onValueChange={onViewTypeChange}>
        <SelectTrigger className="h-8 text-xs w-[120px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="by-day">By Day</SelectItem>
          <SelectItem value="by-fuel">By Fuel Type</SelectItem>
        </SelectContent>
      </Select>

      <div className="ml-auto flex items-center gap-2">
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
