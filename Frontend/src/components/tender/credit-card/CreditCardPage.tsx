import {CardContext,useCardData,useCards} from './creditCardData';
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, DollarSign, Settings } from "lucide-react";
import { CreditCardSettlementPage } from "./CreditCardSettlementPage";
import { UpdateBatchFeePage } from "./UpdateBatchFeePage";
import { CreditCardSettingsPage } from "./CreditCardSettingsPage";

type CreditCardTab = "settlement" | "batch-fee" | "settings";

export const CreditCardPage = ({storeId}:{storeId:string}) => {
 const card=useCardData(storeId);
 if(card.q.isPending&&!card.q.data)return <p>Loading credit card data…</p>;
 if(card.q.error&&!card.q.data)return <p role="alert">{card.q.error.message}</p>;
 return <CardContext.Provider value={card}><CardPage /></CardContext.Provider>;
};
const CardPage = () => {
  const card=useCards();
  const [activeTab, setActiveTab] = useState<CreditCardTab>("settlement");

  const tabs = [
    { id: "settlement", label: "Credit Card Settlement", icon: CreditCard },
    { id: "batch-fee", label: "Update Batch Fee", icon: DollarSign },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {card.error&&<p role="alert" className="text-destructive">{card.error}</p>}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Credit Card</h1>
        <p className="text-sm text-muted-foreground">Manage credit card settlements, batch fees, and configuration</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CreditCardTab)}>
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

        <TabsContent value="settlement" className="mt-6">
          <CreditCardSettlementPage />
        </TabsContent>

        <TabsContent value="batch-fee" className="mt-6">
          <UpdateBatchFeePage />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <CreditCardSettingsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};
