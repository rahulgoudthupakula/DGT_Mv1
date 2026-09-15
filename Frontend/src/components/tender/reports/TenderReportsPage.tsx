import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Wallet, FileText, BarChart3 } from "lucide-react";
import { CreditCardBatchLogReport } from "./CreditCardBatchLogReport";
import { CreditCardBalanceReport } from "./CreditCardBalanceReport";
import { TenderBatchLogReport } from "./TenderBatchLogReport";
import { TenderBalanceReport } from "./TenderBalanceReport";

type ReportTab = "cc-batch-log" | "cc-balance" | "tender-batch-log" | "tender-balance";

export const TenderReportsPage = ({storeId}:{storeId:string}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>("cc-batch-log");

  const reportTabs = [
    { id: "cc-batch-log", label: "Credit Card Batch Log", icon: CreditCard },
    { id: "cc-balance", label: "Credit Card Balance Report", icon: BarChart3 },
    { id: "tender-batch-log", label: "Tender Batch Log", icon: FileText },
    { id: "tender-balance", label: "Tender Balance Report", icon: Wallet },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tender Type Reports</h1>
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

        <TabsContent value="cc-batch-log" className="mt-6">
          <CreditCardBatchLogReport storeId={storeId} />
        </TabsContent>

        <TabsContent value="cc-balance" className="mt-6">
          <CreditCardBalanceReport storeId={storeId} />
        </TabsContent>

        <TabsContent value="tender-batch-log" className="mt-6">
          <TenderBatchLogReport storeId={storeId} />
        </TabsContent>

        <TabsContent value="tender-balance" className="mt-6">
          <TenderBalanceReport storeId={storeId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
