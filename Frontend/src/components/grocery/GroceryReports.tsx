import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, TrendingUp, ShoppingCart, BarChart3, Package, Cigarette, UtensilsCrossed, History } from "lucide-react";
import { ProfitReport } from "./reports/ProfitReport";
import { SalesReport } from "./reports/SalesReport";
import { PurchaseInvoiceReport } from "./reports/PurchaseInvoiceReport";
import { SingleItemPurchaseHistory } from "./reports/SingleItemPurchaseHistory";
import { InventoryValuationReport } from "./reports/InventoryValuationReport";
import { CigaretteInventoryReport } from "./reports/CigaretteInventoryReport";
import { KeyRatioReport } from "./reports/KeyRatioReport";

type ReportTab = 
  | "profit"
  | "sales"
  | "purchase"
  | "key-ratio"
  | "inventory-valuation"
  | "cigarette-inventory"
  | "deli-sales"
  | "single-item-purchase";

export const GroceryReports = ({storeId}:{storeId:string}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>("profit");
  
  
  const reportTabs = [
    { id: "profit", label: "Profit", icon: TrendingUp },
    { id: "sales", label: "Sales", icon: BarChart3 },
    { id: "purchase", label: "Purchase Invoice Summary", icon: ShoppingCart },
    { id: "key-ratio", label: "Key Ratio", icon: FileText },
    { id: "inventory-valuation", label: "Inventory Valuation", icon: Package },
    { id: "cigarette-inventory", label: "Cigarette Inventory", icon: Cigarette },
    { id: "deli-sales", label: "Deli Sales", icon: UtensilsCrossed },
    { id: "single-item-purchase", label: "Single Item Purchase History", icon: History },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Grocery Reports</h1>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReportTab)}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
          {reportTabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5"
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Profit Report */}
        <TabsContent value="profit" className="mt-6">
          <ProfitReport storeId={storeId}/>
        </TabsContent>

        {/* Sales Report */}
        <TabsContent value="sales" className="mt-6">
          <SalesReport storeId={storeId}/>
        </TabsContent>

        {/* Purchase Invoice Summary */}
        <TabsContent value="purchase" className="mt-6">
          <PurchaseInvoiceReport storeId={storeId}/>
        </TabsContent>

        {/* Key Ratio Report */}
        <TabsContent value="key-ratio" className="mt-6">
          <KeyRatioReport storeId={storeId}/>
        </TabsContent>

        {/* Inventory Valuation Report */}
        <TabsContent value="inventory-valuation" className="mt-6">
          <InventoryValuationReport storeId={storeId}/>
        </TabsContent>

        {/* Cigarette Inventory Report */}
        <TabsContent value="cigarette-inventory" className="mt-6">
          <CigaretteInventoryReport storeId={storeId}/>
        </TabsContent>

        {/* Deli Sales Report */}
        <TabsContent value="deli-sales" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Deli Sales Report</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesReport storeId={storeId} departmentScope="deli"/>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Single Item Purchase History Report */}
        <TabsContent value="single-item-purchase" className="mt-6">
          <SingleItemPurchaseHistory storeId={storeId}/>
        </TabsContent>
      </Tabs>
    </div>
  );
};
