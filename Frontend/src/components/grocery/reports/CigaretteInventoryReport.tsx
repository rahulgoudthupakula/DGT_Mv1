import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CigaretteSummaryView } from "./CigaretteSummaryView";
import { CigaretteByBrandView } from "./CigaretteByBrandView";

type CigTab = "summary" | "by-brand";

export const CigaretteInventoryReport = ({storeId}:{storeId:string}) => {
  const [activeTab, setActiveTab] = useState<CigTab>("summary");

  // Summary filters — date range only
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // By Brand filter — single day
  const [brandDate, setBrandDate] = useState<Date | undefined>();

  return (
    <div className="space-y-5">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CigTab)}>
        <TabsList className="h-auto gap-1 bg-muted p-1">
          <TabsTrigger value="summary" className="text-xs px-3 py-1.5">Summary</TabsTrigger>
          <TabsTrigger value="by-brand" className="text-xs px-3 py-1.5">By Brand</TabsTrigger>
        </TabsList>

        {/* Summary Filters — date range only */}
        {activeTab === "summary" && (
          <Card className="mt-4">
            <CardContent className="pt-5 pb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Filters</h3>
              <div className="flex flex-wrap gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal h-9 text-xs w-[160px]", !startDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                      {startDate ? format(startDate, "MM/dd/yyyy") : "From date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal h-9 text-xs w-[160px]", !endDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                      {endDate ? format(endDate, "MM/dd/yyyy") : "To date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>
        )}

        {/* By Brand Filters — single day picker */}
        {activeTab === "by-brand" && (
          <Card className="mt-4">
            <CardContent className="pt-5 pb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Select Date</h3>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("justify-start text-left font-normal h-9 text-xs w-[160px]", !brandDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                    {brandDate ? format(brandDate, "MM/dd/yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={brandDate} onSelect={setBrandDate} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>
        )}

        <TabsContent value="summary" className="mt-4">
          <CigaretteSummaryView storeId={storeId} startDate={startDate} endDate={endDate} />
        </TabsContent>
        <TabsContent value="by-brand" className="mt-4">
          <CigaretteByBrandView storeId={storeId} date={brandDate} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
