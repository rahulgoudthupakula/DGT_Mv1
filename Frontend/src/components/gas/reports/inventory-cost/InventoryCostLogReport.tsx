import { useState } from "react";
import { InventoryCostFilters } from "./InventoryCostFilters";
import { InventoryCostSummaryCards } from "./InventoryCostSummaryCards";
import { InventoryCostTable, type InventoryCostRow } from "./InventoryCostTable";
import { InventoryCostDrawer } from "./InventoryCostDrawer";

export const InventoryCostLogReport = () => {
  const [dateRange, setDateRange] = useState("this-month");
  const [fuelType, setFuelType] = useState("all");
  const [selectedRow, setSelectedRow] = useState<InventoryCostRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRowClick = (row: InventoryCostRow) => {
    setSelectedRow(row);
    setDrawerOpen(true);
  };

  const clearFilters = () => {
    setDateRange("this-month");
    setFuelType("all");
  };

  const hasActiveFilters = fuelType !== "all";

  return (
    <div className="space-y-6">
      <InventoryCostFilters
        dateRange={dateRange} onDateRangeChange={setDateRange}
        fuelType={fuelType} onFuelTypeChange={setFuelType}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />
      <InventoryCostSummaryCards />
      <InventoryCostTable onRowClick={handleRowClick} fuelType={fuelType} />
      <InventoryCostDrawer open={drawerOpen} onOpenChange={setDrawerOpen} row={selectedRow} />
    </div>
  );
};
