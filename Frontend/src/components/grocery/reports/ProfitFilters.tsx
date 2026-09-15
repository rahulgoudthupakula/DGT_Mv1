import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { CalendarIcon, Search, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ProfitFiltersProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  store: string;
  department: string;
  vendor: string;
  itemSearch: string;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onStoreChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onVendorChange: (value: string) => void;
  onItemSearchChange: (value: string) => void;
  onClearFilters: () => void;
}

export const ProfitFilters = ({
  startDate,
  endDate,
  store,
  department,
  vendor,
  itemSearch,
  onStartDateChange,
  onEndDateChange,
  onStoreChange,
  onDepartmentChange,
  onVendorChange,
  onItemSearchChange,
  onClearFilters,
}: ProfitFiltersProps) => {
  const hasActiveFilters = startDate || endDate || store !== "all" || department !== "all" || vendor !== "all" || itemSearch;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-7 text-xs gap-1">
            <X className="h-3 w-3" />
            Clear filters
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Date Range - From */}
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

        {/* Date Range - To */}
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


        {/* Item Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Scan code / item name"
            value={itemSearch}
            onChange={(e) => onItemSearchChange(e.target.value)}
            className="h-9 text-xs pl-8"
          />
        </div>
      </div>
    </div>
  );
};
