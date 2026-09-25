import { useState } from "react";
import { useAppNavigation } from "@/contexts/NavigationContext";
import { TabsList } from "@/components/ui/tabs";
import { PermissionTabs as Tabs, PermissionTabsContent as TabsContent, PermissionTabsTrigger as TabsTrigger } from "@/components/ui/permission-tabs";
import { Pencil, Eye, CheckCircle2 } from "lucide-react";
import { OrdersInvoices } from "./OrdersInvoices";
import { ViewInvoice } from "./ViewInvoice";
import { InvoiceApprovals } from "./InvoiceApprovals";

type InvoiceTab = "edit" | "approvals" | "view";

export const EditViewInvoicesPage = ({storeId}:{storeId:string}) => {
  const {params}=useAppNavigation();
  const [activeTab, setActiveTab] = useState<InvoiceTab>(params.invoiceId?"view":"edit");

  const tabs = [
    { id: "edit", label: "Edit Invoice", icon: Pencil },
    { id: "approvals", label: "Invoice Approvals", icon: CheckCircle2 },
    { id: "view", label: "View Invoice", icon: Eye },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit &amp; View Invoices</h1>
        <p className="text-sm text-muted-foreground">Manage and review purchase invoices</p>
      </div>

      <Tabs storeId={storeId} parent="GROCERY_PAGE_INVOICES" value={activeTab} onValueChange={(v) => setActiveTab(v as InvoiceTab)}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
          {tabs.map((tab) => (
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

        <TabsContent value="edit" className="mt-6">
          <OrdersInvoices key={storeId} storeId={storeId} />
        </TabsContent>

        <TabsContent value="approvals" className="mt-6">
          <InvoiceApprovals key={storeId} storeId={storeId} />
        </TabsContent>

        <TabsContent value="view" className="mt-6">
          <ViewInvoice key={storeId} storeId={storeId} initialInvoiceId={params.invoiceId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
