import { useState } from "react";
import { TabsList } from "@/components/ui/tabs";
import { PermissionTabs as Tabs, PermissionTabsContent as TabsContent, PermissionTabsTrigger as TabsTrigger } from "@/components/ui/permission-tabs";
import { SlidersHorizontal, RotateCcw, CalendarClock, ArrowRightLeft, AlertTriangle, CheckCircle2 } from "lucide-react";
import { StockAdjustments } from "./StockAdjustments";
import { ReturnableInventory } from "./ReturnableInventory";
import { ExpiredExpiringItems } from "./ExpiredExpiringItems";
import { StoreToStoreTransfers } from "./StoreToStoreTransfers";
import { InventoryShrinkageWaste } from "./InventoryShrinkageWaste";
import { InventoryApprovals } from "./InventoryApprovals";

type InventoryTab = "adjustment" | "approvals" | "expired" | "returnable" | "transfers" | "shrinkage";

export const InventoryManagementPage = ({storeId}:{storeId:string}) => {
  const [activeTab, setActiveTab] = useState<InventoryTab>("adjustment");

  const tabs = [
    { id: "adjustment", label: "Inventory Adjustment", icon: SlidersHorizontal },
    { id: "approvals", label: "Approvals", icon: CheckCircle2 },
    { id: "expired", label: "Expired & Expiring Items", icon: CalendarClock },
    { id: "returnable", label: "Reduce Inventory (Returnable)", icon: RotateCcw },
    { id: "transfers", label: "Store to Store Transfers", icon: ArrowRightLeft },
    { id: "shrinkage", label: "Inventory Shrinkage & Waste", icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
        <p className="text-sm text-muted-foreground">Manage stock adjustments, returns, and expiring items</p>
      </div>

      <Tabs storeId={storeId} parent="GROCERY_PAGE_INVENTORY" value={activeTab} onValueChange={(v) => setActiveTab(v as InventoryTab)}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
          {tabs.map((tab) => (
            <TabsTrigger
              disabled={tab.id==='expired'} key={tab.id}
              value={tab.id}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5"
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="adjustment" className="mt-6">
          <StockAdjustments storeId={storeId} />
        </TabsContent>

        <TabsContent value="approvals" className="mt-6">
          <InventoryApprovals storeId={storeId} />
        </TabsContent>

        <TabsContent value="expired" className="mt-6">
          <ExpiredExpiringItems
            onMoveToReduceInventory={(returnable) =>
              setActiveTab(returnable ? "returnable" : "shrinkage")
            }
          />
        </TabsContent>

        <TabsContent value="returnable" className="mt-6">
          <ReturnableInventory storeId={storeId} />
        </TabsContent>

        <TabsContent value="transfers" className="mt-6">
          <StoreToStoreTransfers storeId={storeId} />
        </TabsContent>

        <TabsContent value="shrinkage" className="mt-6">
          <InventoryShrinkageWaste storeId={storeId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
