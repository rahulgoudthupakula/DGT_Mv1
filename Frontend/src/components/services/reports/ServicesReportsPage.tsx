import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText } from "lucide-react";
import { ServiceSettlementsPage } from "./ServiceSettlementsPage";

type ServicesReportsTab = "settlements";

export const ServicesReportsPage = () => {
  const [activeTab, setActiveTab] = useState<ServicesReportsTab>("settlements");

  const tabs = [
    { id: "settlements", label: "Service Settlements", icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground">Financial and payment services reports</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ServicesReportsTab)}>
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

        <TabsContent value="settlements" className="mt-6">
          <ServiceSettlementsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};
