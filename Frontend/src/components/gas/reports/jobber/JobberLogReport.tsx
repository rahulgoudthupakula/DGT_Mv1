import { useState } from "react";
import { JobberLogFilters } from "./JobberLogFilters";
import { JobberLogSummaryCards } from "./JobberLogSummaryCards";
import { JobberLogTable, type JobberLogRow } from "./JobberLogTable";
import { JobberLogDrawer } from "./JobberLogDrawer";

export const JobberLogReport = () => {
  const [dateRange, setDateRange] = useState("this-month");
  const [vendor, setVendor] = useState("all");
  const [fuelType, setFuelType] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedRow, setSelectedRow] = useState<JobberLogRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRowClick = (row: JobberLogRow) => {
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
      <JobberLogFilters
        dateRange={dateRange} onDateRangeChange={setDateRange}
        vendor={vendor} onVendorChange={setVendor}
        fuelType={fuelType} onFuelTypeChange={setFuelType}
        search={search} onSearchChange={setSearch}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />
      <JobberLogSummaryCards />
      <JobberLogTable onRowClick={handleRowClick} vendor={vendor} fuelType={fuelType} search={search} />
      <JobberLogDrawer open={drawerOpen} onOpenChange={setDrawerOpen} row={selectedRow} />
    </div>
  );
};
