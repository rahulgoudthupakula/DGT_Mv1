import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SalesVatFilters } from "./SalesVatFilters";
import { SalesVatSummaryCards } from "./SalesVatSummaryCards";
import { SalesVatTable } from "./SalesVatTable";
import { SalesVatDrawer } from "./SalesVatDrawer";


export const SalesVatReport = () => {
  const [dateRange, setDateRange] = useState("this-month");
  const [vatRate, setVatRate] = useState("all");
  const [fuelType, setFuelType] = useState("all");
  const [viewType, setViewType] = useState("by-day");
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  return (
    <div className="space-y-6">
      <SalesVatFilters
        dateRange={dateRange} onDateRangeChange={setDateRange}
        vatRate={vatRate} onVatRateChange={setVatRate}
        fuelType={fuelType} onFuelTypeChange={setFuelType}
        viewType={viewType} onViewTypeChange={setViewType}
      />

      <SalesVatSummaryCards />

      <Card>
        <CardContent className="p-0">
          <SalesVatTable viewType={viewType} onRowClick={setSelectedRow} />
        </CardContent>
      </Card>

      

      <SalesVatDrawer
        open={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        row={selectedRow}
      />
    </div>
  );
};
