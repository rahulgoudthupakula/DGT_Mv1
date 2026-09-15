import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, Printer, Download } from "lucide-react";

interface Props {
  asOfDate: string;
  onAsOfDateChange: (v: string) => void;
  tenderType: string;
  onTenderTypeChange: (v: string) => void;
  processor: string;
  onProcessorChange: (v: string) => void;
}

export const CashCardBalanceFilters = ({
  asOfDate, onAsOfDateChange,
  tenderType, onTenderTypeChange,
  processor, onProcessorChange,
}: Props) => (
  <div className="sticky top-0 z-10 bg-background border-b border-border pb-4 space-y-3">
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 min-w-[180px]">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Select value={asOfDate} onValueChange={onAsOfDateChange}>
          <SelectTrigger className="h-8 text-xs w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="this-week">This Week</SelectItem>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="custom">Custom Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Select value={tenderType} onValueChange={onTenderTypeChange}>
        <SelectTrigger className="h-8 text-xs w-[120px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Tenders</SelectItem>
          <SelectItem value="cash">Cash</SelectItem>
          <SelectItem value="card">Card</SelectItem>
        </SelectContent>
      </Select>

      <Select value={processor} onValueChange={onProcessorChange}>
        <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Processors</SelectItem>
          <SelectItem value="worldpay">Worldpay</SelectItem>
          <SelectItem value="heartland">Heartland</SelectItem>
          <SelectItem value="fiserv">Fiserv</SelectItem>
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
