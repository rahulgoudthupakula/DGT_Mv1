import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface NetWorthFiltersProps {
  asOfDate: Date;
  setAsOfDate: (d: Date) => void;
  includeToday: boolean;
  setIncludeToday: (v: boolean) => void;
}

export const NetWorthFilters = ({ asOfDate, setAsOfDate, includeToday, setIncludeToday }: NetWorthFiltersProps) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">As of Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("justify-start text-left font-normal h-9 text-xs w-[160px]")}>
                <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                {format(asOfDate, "MM/dd/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={asOfDate} onSelect={(d) => d && setAsOfDate(d)} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={includeToday} onCheckedChange={setIncludeToday} id="include-today" />
          <Label htmlFor="include-today" className="text-xs">Include Today's Closing?</Label>
        </div>
      </div>
    </CardContent>
  </Card>
);
