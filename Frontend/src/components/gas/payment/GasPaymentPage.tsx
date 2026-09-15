import { useState } from "react";
import { DollarSign, Download, Calendar, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PaymentSummaryCards } from "./PaymentSummaryCards";
import { PaymentRegisterTable } from "./PaymentRegisterTable";
import { RecordPaymentDrawer } from "./RecordPaymentDrawer";

export const GasPaymentPage = () => {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [vendor, setVendor] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [status, setStatus] = useState("all");
  const [deliveryRef, setDeliveryRef] = useState("");
  const [recordOpen, setRecordOpen] = useState(false);

  const hasActiveFilters = vendor !== "all" || paymentMethod !== "all" || status !== "all" || deliveryRef.trim() !== "";

  const clearFilters = () => {
    setStartDate(new Date());
    setEndDate(new Date());
    setVendor("all");
    setPaymentMethod("all");
    setStatus("all");
    setDeliveryRef("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Gas Payments</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-1.5 text-xs" onClick={() => setRecordOpen(true)}>
            <DollarSign className="h-3.5 w-3.5" />
            Record Payment
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

        {/* Payment Method */}
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder="Payment Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="ach">ACH</SelectItem>
            <SelectItem value="check">Check</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
          </SelectContent>
        </Select>

        {/* Status */}
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>

        {/* Delivery Reference Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="h-8 text-xs pl-8 w-[180px]"
            placeholder="BOL / Invoice #"
            value={deliveryRef}
            onChange={(e) => setDeliveryRef(e.target.value)}
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={clearFilters}>
            <X className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <PaymentSummaryCards />

      {/* Payment Register Table */}
      <PaymentRegisterTable vendor={vendor} paymentMethod={paymentMethod} status={status} deliveryRef={deliveryRef} />

      {/* Header Record Payment Drawer (no prefill) */}
      <RecordPaymentDrawer open={recordOpen} onOpenChange={setRecordOpen} />
    </div>
  );
};
