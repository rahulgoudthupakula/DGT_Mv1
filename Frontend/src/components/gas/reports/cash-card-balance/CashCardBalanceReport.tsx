import { useState } from "react";
import { CashCardBalanceFilters } from "./CashCardBalanceFilters";
import { CashCardBalanceSummaryCards } from "./CashCardBalanceSummaryCards";
import { CashCardBalanceTable, type BalanceRow } from "./CashCardBalanceTable";
import { CashCardBalanceDrawer } from "./CashCardBalanceDrawer";

export const CashCardBalanceReport = () => {
  const [asOfDate, setAsOfDate] = useState("today");
  const [tenderType, setTenderType] = useState("all");
  const [processor, setProcessor] = useState("all");
  const [selectedRow, setSelectedRow] = useState<BalanceRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRowClick = (row: BalanceRow) => {
    setSelectedRow(row);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <CashCardBalanceFilters
        asOfDate={asOfDate} onAsOfDateChange={setAsOfDate}
        tenderType={tenderType} onTenderTypeChange={setTenderType}
        processor={processor} onProcessorChange={setProcessor}
      />
      <CashCardBalanceSummaryCards />
      <CashCardBalanceTable onRowClick={handleRowClick} />
      <CashCardBalanceDrawer open={drawerOpen} onOpenChange={setDrawerOpen} row={selectedRow} />
    </div>
  );
};
