import {useProfitReport,ProfitDataProvider} from './ProfitData';
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, BarChart3, ShoppingCart } from "lucide-react";
import { ProfitFilters } from "./ProfitFilters";
import { ProfitSummaryCards } from "./ProfitSummaryCards";
import { InventoryImpactRow } from "./InventoryImpactRow";
import { ProfitMarginView } from "./ProfitMarginView";
import { ProfitSalesView } from "./ProfitSalesView";
import { ProfitPurchaseView } from "./ProfitPurchaseView";

type ProfitTab = "margin" | "sales" | "purchase";

export const ProfitReport = ({storeId}:{storeId:string}) => {
  const [activeTab, setActiveTab] = useState<ProfitTab>("margin");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [store, setStore] = useState("all");
  const [department, setDepartment] = useState("all");
  const [vendor, setVendor] = useState("all");
  const [itemSearch, setItemSearch] = useState("");

  const report=useProfitReport(storeId,startDate,endDate,itemSearch);
  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setStore("all");
    setDepartment("all");
    setVendor("all");
    setItemSearch("");
  };

  return (
    <ProfitDataProvider value={report}><div className="space-y-5">
      {/* Common filters */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <ProfitFilters
            startDate={startDate}
            endDate={endDate}
            store={store}
            department={department}
            vendor={vendor}
            itemSearch={itemSearch}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onStoreChange={setStore}
            onDepartmentChange={setDepartment}
            onVendorChange={setVendor}
            onItemSearchChange={setItemSearch}
            onClearFilters={clearFilters}
          />
        </CardContent>
      </Card>

      {/* Summary cards with comparison signals */}
      <p className="text-sm text-muted-foreground">Net sales are connected. COGS, profit and margins await historical costs recorded against sales. Current item costs are not substituted.</p>{report.pending?<p>Loading report…</p>:report.error?<p role="alert">{String(report.error)}</p>:<ProfitSummaryCards data={report.summary}/>}

      {/* Inventory Impact context row */}
      <InventoryImpactRow data={{openingInventory:null,closingInventory:null,inventoryChange:null,shrinkAdjustments:null}} />

      {/* Sub-tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProfitTab)}>
        <TabsList>
          <TabsTrigger value="margin" className="gap-1.5 text-xs">
            <TrendingUp className="h-3.5 w-3.5" />
            Margin View
          </TabsTrigger>
          <TabsTrigger value="sales" className="gap-1.5 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            Day-wise Profit Margin
          </TabsTrigger>
          <TabsTrigger value="purchase" className="gap-1.5 text-xs">
            <ShoppingCart className="h-3.5 w-3.5" />
            Day-wise Profit by Net Sales &amp; COGS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="margin" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Margin Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfitMarginView />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Day-wise Profit Margin</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfitSalesView />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchase" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Day-wise Profit by Net Sales &amp; COGS</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfitPurchaseView />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div></ProfitDataProvider>
  );
};
