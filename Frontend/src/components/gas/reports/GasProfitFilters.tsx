import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, X, Printer, Download } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface GasProfitFiltersProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  fuelType: string;
  viewType: "by-day" | "by-fuel";
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onFuelTypeChange: (value: string) => void;
  onViewTypeChange: (value: "by-day" | "by-fuel") => void;
  onClearFilters: () => void;
}

export const GasProfitFilters = ({
  startDate,
  endDate,
  fuelType,
  viewType,
  onStartDateChange,
  onEndDateChange,
  onFuelTypeChange,
  onViewTypeChange,
  onClearFilters,
}: GasProfitFiltersProps) => {
  const hasActiveFilters = startDate || endDate || fuelType !== "all";

  const handlePrint = () => window.print();

  const handleExport = () => {
    // Placeholder for CSV/Excel export
    console.log("Export triggered");
  };

  return (
    <div className="sticky top-0 z-10 bg-background pb-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Filters</h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-7 text-xs gap-1">
              <X className="h-3 w-3" />
              Clear filters
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handlePrint} className="h-7 text-xs gap-1">
            <Printer className="h-3 w-3" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="h-7 text-xs gap-1">
            <Download className="h-3 w-3" />
            Export
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* From Date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal h-9 text-xs",
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
              onSelect={onStartDateChange}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {/* To Date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal h-9 text-xs",
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
              onSelect={onEndDateChange}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {/* Fuel Type */}
        <Select value={fuelType} onValueChange={onFuelTypeChange}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Fuel Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fuel Types</SelectItem>
            <SelectItem value="regular">Regular</SelectItem>
            <SelectItem value="plus">Plus</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="diesel">Diesel</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
