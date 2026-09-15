import { useState } from "react";
import { PurchaseLogFilters } from "./PurchaseLogFilters";
import { PurchaseLogSummaryCards } from "./PurchaseLogSummaryCards";
import { PurchaseLogTable, type PurchaseLogRow } from "./PurchaseLogTable";
import { PurchaseLogDrawer } from "./PurchaseLogDrawer";

export const PurchaseLogReport = () => {
  const [dateRange, setDateRange] = useState("this-month");
  const [vendor, setVendor] = useState("all");
  const [fuelType, setFuelType] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedRow, setSelectedRow] = useState<PurchaseLogRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRowClick = (row: PurchaseLogRow) => {
    setSelectedRow(row);
    setDrawerOpen(true);
  };

  const clearFilters = () => {
    setDateRange("this-month");
    setVendor("all");
    setFuelType("all");
    setSearch("");
  };

  const hasActiveFilters = vendor !== "all" || fuelType !== "all" || search.trim() !== "";

  return (
    <div className="space-y-6">
      <PurchaseLogFilters
        dateRange={dateRange} onDateRangeChange={setDateRange}
        vendor={vendor} onVendorChange={setVendor}
        fuelType={fuelType} onFuelTypeChange={setFuelType}
        search={search} onSearchChange={setSearch}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />
      <PurchaseLogSummaryCards />
      <PurchaseLogTable onRowClick={handleRowClick} vendor={vendor} fuelType={fuelType} search={search} />
      <PurchaseLogDrawer open={drawerOpen} onOpenChange={setDrawerOpen} row={selectedRow} />
    </div>
  );
};
