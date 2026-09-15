import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ratio, FileBarChart, Package, TrendingDown } from "lucide-react";
import { SalesPurchaseRatio } from "./SalesPurchaseRatio";
import { SalesPurchaseAdjusted } from "./SalesPurchaseAdjusted";
import { InventoryCostRetailRatio } from "./InventoryCostRetailRatio";
import { MarginImpactView } from "./MarginImpactView";

type KeyRatioTab =
  | "sales-purchase-ratio"
  | "sales-purchase-adjusted"
  | "inventory-cost-retail"
  | "margin-impact";

export const KeyRatioReport = ({storeId}:{storeId:string}) => {
  const [activeTab, setActiveTab] = useState<KeyRatioTab>(
    "sales-purchase-ratio"
  );

  return (
    <div className="space-y-5">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as KeyRatioTab)}
      >
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
          <TabsTrigger
            value="sales-purchase-ratio"
            className="gap-1.5 text-xs"
          >
            <Ratio className="h-3.5 w-3.5" />
            Sales / Purchase Ratio
          </TabsTrigger>
          <TabsTrigger
            value="sales-purchase-adjusted"
            className="gap-1.5 text-xs"
          >
            <FileBarChart className="h-3.5 w-3.5" />
            Sales vs Purchases (Adjusted)
          </TabsTrigger>
          <TabsTrigger
            value="inventory-cost-retail"
            className="gap-1.5 text-xs"
          >
            <Package className="h-3.5 w-3.5" />
            Cost / Retail Ratio
          </TabsTrigger>
          <TabsTrigger value="margin-impact" className="gap-1.5 text-xs">
            <TrendingDown className="h-3.5 w-3.5" />
            Margin Impact
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales-purchase-ratio" className="mt-4">
          <SalesPurchaseRatio storeId={storeId}/>
        </TabsContent>

        <TabsContent value="sales-purchase-adjusted" className="mt-4">
          <p>Uninvoiced receipts and allocated purchase adjustments are not recorded sufficiently to calculate an adjusted ratio.</p>
        </TabsContent>

        <TabsContent value="inventory-cost-retail" className="mt-4">
          <InventoryCostRetailRatio storeId={storeId}/>
        </TabsContent>

        <TabsContent value="margin-impact" className="mt-4">
          <p>Historical cost, price override and earned rebate attribution are needed to calculate margin impact.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};
