import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  dateRange: string;
  onDateRangeChange: (v: string) => void;
  vatRate: string;
  onVatRateChange: (v: string) => void;
  fuelType: string;
  onFuelTypeChange: (v: string) => void;
  viewType: string;
  onViewTypeChange: (v: string) => void;
}

export const GasProfitVatFilters = ({
  dateRange, onDateRangeChange,
  vatRate, onVatRateChange,
  fuelType, onFuelTypeChange,
  viewType, onViewTypeChange,
}: Props) => (
  <div className="flex flex-wrap gap-3 sticky top-0 z-10 bg-background py-3">
    <Select value={dateRange} onValueChange={onDateRangeChange}>
      <SelectTrigger className="w-[160px]"><SelectValue placeholder="Date Range" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="today">Today</SelectItem>
        <SelectItem value="this-week">This Week</SelectItem>
        <SelectItem value="this-month">This Month</SelectItem>
        <SelectItem value="last-month">Last Month</SelectItem>
        <SelectItem value="this-quarter">This Quarter</SelectItem>
        <SelectItem value="custom">Custom Range</SelectItem>
      </SelectContent>
    </Select>

    <Select value={vatRate} onValueChange={onVatRateChange}>
      <SelectTrigger className="w-[140px]"><SelectValue placeholder="VAT Rate" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All VAT Rates</SelectItem>
        <SelectItem value="5">5%</SelectItem>
        <SelectItem value="10">10%</SelectItem>
        <SelectItem value="15">15%</SelectItem>
        <SelectItem value="20">20%</SelectItem>
      </SelectContent>
    </Select>

    <Select value={fuelType} onValueChange={onFuelTypeChange}>
      <SelectTrigger className="w-[140px]"><SelectValue placeholder="Fuel Type" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Fuels</SelectItem>
        <SelectItem value="regular">Regular</SelectItem>
        <SelectItem value="plus">Plus</SelectItem>
        <SelectItem value="premium">Premium</SelectItem>
        <SelectItem value="diesel">Diesel</SelectItem>
      </SelectContent>
    </Select>

    <Select value={viewType} onValueChange={onViewTypeChange}>
      <SelectTrigger className="w-[150px]"><SelectValue placeholder="View Type" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="by-vat">By VAT Rate</SelectItem>
        <SelectItem value="by-day">By Day</SelectItem>
      </SelectContent>
    </Select>
  </div>
);
