import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SalesFilters, type GroupBy } from "./SalesFilters";
import { SalesTable } from "./SalesTable";

export const SalesReport = ({storeId,departmentScope}:{storeId:string;departmentScope?:string}) => {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [store, setStore] = useState("all");
  const [department, setDepartment] = useState("all");
  const [vendor, setVendor] = useState("all");
  const [itemSearch, setItemSearch] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("item");

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setStore("all");
    setDepartment("all");
    setVendor("all");
    setItemSearch("");
  };

  return (
    <div className="space-y-5">
      {/* Sticky Filters */}
      <Card className="sticky top-0 z-10 shadow-sm">
        <CardContent className="pt-5 pb-4">
          <SalesFilters
            startDate={startDate}
            endDate={endDate}
            store={store}
            department={department}
            vendor={vendor}
            itemSearch={itemSearch}
            groupBy={groupBy}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onStoreChange={setStore}
            onDepartmentChange={setDepartment}
            onVendorChange={setVendor}
            onItemSearchChange={setItemSearch}
            onGroupByChange={setGroupBy}
            onClearFilters={clearFilters}
          />
        </CardContent>
      </Card>

      {/* Sales Table with View Tabs & Smart Highlights */}
      <SalesTable departmentScope={departmentScope} storeId={storeId} startDate={startDate} endDate={endDate} groupBy={groupBy} itemSearch={itemSearch} />
    </div>
  );
};
