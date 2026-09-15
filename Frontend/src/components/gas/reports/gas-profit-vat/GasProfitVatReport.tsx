import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { GasProfitVatFilters } from "./GasProfitVatFilters";
import { GasProfitVatSummaryCards } from "./GasProfitVatSummaryCards";
import { GasProfitVatTable } from "./GasProfitVatTable";
import { GasProfitVatDrawer } from "./GasProfitVatDrawer";
import { GasProfitVatInsightStrip } from "./GasProfitVatInsightStrip";

export const GasProfitVatReport = () => {
  const [dateRange, setDateRange] = useState("this-month");
  const [vatRate, setVatRate] = useState("all");
  const [fuelType, setFuelType] = useState("all");
  const [viewType, setViewType] = useState("by-vat");
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  return (
    <div className="space-y-6">
      <GasProfitVatFilters
        dateRange={dateRange} onDateRangeChange={setDateRange}
        vatRate={vatRate} onVatRateChange={setVatRate}
        fuelType={fuelType} onFuelTypeChange={setFuelType}
        viewType={viewType} onViewTypeChange={setViewType}
      />

      <GasProfitVatSummaryCards />

      <Card>
        <CardContent className="p-0">
          <GasProfitVatTable viewType={viewType} onRowClick={setSelectedRow} />
        </CardContent>
      </Card>

      <GasProfitVatInsightStrip />

      <GasProfitVatDrawer
        open={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        row={selectedRow}
      />
    </div>
  );
};
