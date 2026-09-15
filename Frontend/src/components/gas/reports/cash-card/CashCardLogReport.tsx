import { useState } from "react";
import { CashCardFilters } from "./CashCardFilters";
import { CashCardSummaryCards } from "./CashCardSummaryCards";
import { CashCardTable, type CashCardRow } from "./CashCardTable";
import { CashCardDrawer } from "./CashCardDrawer";


export const CashCardLogReport = () => {
  const [dateRange, setDateRange] = useState("this-month");
  const [tenderType, setTenderType] = useState("all");
  const [fuelType, setFuelType] = useState("all");
  
  const [selectedRow, setSelectedRow] = useState<CashCardRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRowClick = (row: CashCardRow) => {
    setSelectedRow(row);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <CashCardFilters
        dateRange={dateRange} onDateRangeChange={setDateRange}
        tenderType={tenderType} onTenderTypeChange={setTenderType}
        fuelType={fuelType} onFuelTypeChange={setFuelType}
      />
      <CashCardSummaryCards />
      <CashCardTable onRowClick={handleRowClick} />
      <CashCardDrawer open={drawerOpen} onOpenChange={setDrawerOpen} row={selectedRow} />
    </div>
  );
};
