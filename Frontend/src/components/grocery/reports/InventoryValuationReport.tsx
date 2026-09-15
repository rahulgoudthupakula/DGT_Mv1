import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ValuationCostByDate } from "./ValuationCostByDate";
import { ValuationRetailByDate } from "./ValuationRetailByDate";
import { ValuationCostByCategory } from "./ValuationCostByCategory";
import { ValuationRetailByCategory } from "./ValuationRetailByCategory";

type ValuationView = "cost-date" | "retail-date" | "cost-category" | "retail-category";

export const InventoryValuationReport = ({storeId}:{storeId:string}) => {
  const [activeView, setActiveView] = useState<ValuationView>("cost-category");

  // Date-based filters
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [store, setStore] = useState("all");

  // Category-based filter
  const [asOfDate, setAsOfDate] = useState<Date | undefined>();

  const isDateView = activeView === "cost-date" || activeView === "retail-date";

  return (
    <div className="space-y-5">
      {/* View Selector */}
      <p className="text-xs text-muted-foreground">Current recorded stock × current unit cost or effective selling price. Physical-count comparisons are not recorded.</p>
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as ValuationView)}>
        <TabsList className="h-auto gap-1 bg-muted p-1">
          <TabsTrigger value="cost-date" className="text-xs px-3 py-1.5">
            At Cost – By Date
          </TabsTrigger>
          <TabsTrigger value="retail-date" className="text-xs px-3 py-1.5">
            At Retail – By Date
          </TabsTrigger>
          <TabsTrigger value="cost-category" className="text-xs px-3 py-1.5">
            At Cost – By Category
          </TabsTrigger>
          <TabsTrigger value="retail-category" className="text-xs px-3 py-1.5">
            At Retail – By Category
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="mt-4">
          <CardContent className="pt-5 pb-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Filters</h3>
            <div className="flex flex-wrap gap-3">
              {isDateView ? (
                <>
                  {/* Date Range for date views */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("justify-start text-left font-normal h-9 text-xs w-[160px]", !startDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                        {startDate ? format(startDate, "MM/dd/yyyy") : "Start date"}
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
                        {endDate ? format(endDate, "MM/dd/yyyy") : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </>
              ) : (
                /* As-of Date for category views */
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal h-9 text-xs w-[160px]", !asOfDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                      {asOfDate ? format(asOfDate, "MM/dd/yyyy") : "As of date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={asOfDate} disabled onSelect={setAsOfDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              )}

            </div>
          </CardContent>
        </Card>

        {/* View Content */}
        <TabsContent value="cost-date" className="mt-4">
          <p>Historical cost valuation requires dated cost snapshots. Current valuation is available under Cost by Category.</p>
        </TabsContent>
        <TabsContent value="retail-date" className="mt-4">
          <p>Historical retail valuation requires dated price snapshots. Current valuation is available under Retail by Category.</p>
        </TabsContent>
        <TabsContent value="cost-category" className="mt-4">
          <ValuationCostByCategory storeId={storeId}/>
        </TabsContent>
        <TabsContent value="retail-category" className="mt-4">
          <ValuationRetailByCategory storeId={storeId}/>
        </TabsContent>
      </Tabs>
    </div>
  );
};
