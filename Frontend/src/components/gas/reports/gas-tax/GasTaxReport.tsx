import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { GasTaxFilters } from "./GasTaxFilters";
import { GasTaxSummaryCards } from "./GasTaxSummaryCards";
import { GasTaxTable } from "./GasTaxTable";
import { GasTaxDrawer } from "./GasTaxDrawer";
import { GasTaxComplianceNotes } from "./GasTaxComplianceNotes";

export const GasTaxReport = () => {
  const [dateRange, setDateRange] = useState("this-month");
  const [fuelType, setFuelType] = useState("all");
  const [jurisdiction, setJurisdiction] = useState("all");
  const [viewType, setViewType] = useState("by-day");
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  return (
    <div className="space-y-6">
      <GasTaxFilters
        dateRange={dateRange} onDateRangeChange={setDateRange}
        fuelType={fuelType} onFuelTypeChange={setFuelType}
        jurisdiction={jurisdiction} onJurisdictionChange={setJurisdiction}
        viewType={viewType} onViewTypeChange={setViewType}
      />
      <GasTaxSummaryCards />
      <Card>
        <CardContent className="p-0">
          <GasTaxTable viewType={viewType} onRowClick={setSelectedRow} />
        </CardContent>
      </Card>
      <GasTaxComplianceNotes />
      <GasTaxDrawer open={!!selectedRow} onClose={() => setSelectedRow(null)} row={selectedRow} />
    </div>
  );
};
