import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Tag, BarChart2, FileText } from "lucide-react";
import { RebateProgramsPage } from "./RebateProgramsPage";
import { RebateItemsPage } from "./RebateItemsPage";
import { RebateReportsPage } from "./RebateReportsPage";
import { RebateClaimsPaymentsPage } from "./RebateClaimsPaymentsPage";
import { RebateProgramDetailsPage, ProgramDetail } from "./RebateProgramDetailsPage";
import { SyncToChildStoresBanner } from "@/components/SyncToChildStoresBanner";

type RebateTab = "programs" | "rebate-items" | "claims-payments" | "rebate-reports";

interface RebateManagementPageProps {
  storeId:string;
  isParentStore?: boolean;
}

export const RebateManagementPage = ({ storeId,isParentStore = false }: RebateManagementPageProps) => {
  const [activeTab, setActiveTab] = useState<RebateTab>("programs");
  const [selectedProgramId,setSelectedProgramId]=useState<string>();
  const [detailProgram, setDetailProgram] = useState<ProgramDetail | null>(null);
  const [editRequest, setEditRequest] = useState<ProgramDetail | null>(null);
  const [duplicateRequest, setDuplicateRequest] = useState<ProgramDetail | null>(null);

  const tabs = [
    { id: "programs", label: "Programs", icon: Gift },
    { id: "rebate-items", label: "Rebate Items", icon: Tag },
    { id: "claims-payments", label: "Claims & Payments", icon: FileText },
    { id: "rebate-reports", label: "Rebate Reports", icon: BarChart2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Rebate Management</h1>
        <p className="text-sm text-muted-foreground">
          Manage rebate and incentive programs, qualification, claims and payments.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as RebateTab)}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              disabled={tab.id==='rebate-reports'}
              value={tab.id}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5"
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="programs" className="mt-6 space-y-4">
          {detailProgram ? (
            <RebateProgramDetailsPage storeId={storeId}
              program={detailProgram}
              onBack={() => setDetailProgram(null)}
              onEdit={(p) => { setDetailProgram(null); setEditRequest(p); }}
              onDuplicate={(p) => { setDetailProgram(null); setDuplicateRequest(p); }}
              onManageItems={() => {setSelectedProgramId(detailProgram.id); setDetailProgram(null); setActiveTab("rebate-items"); }}
              onViewClaims={() => { setDetailProgram(null); setActiveTab("claims-payments"); }}
            />
          ) : (
            <>
              {isParentStore && <SyncToChildStoresBanner dataLabel="rebate programs" />}
              <RebateProgramsPage storeId={storeId}
                onViewDetails={setDetailProgram}
                onManageItems={() => setActiveTab("rebate-items")}
                onViewClaims={() => setActiveTab("claims-payments")}
                editRequest={editRequest}
                duplicateRequest={duplicateRequest}
                onRequestHandled={() => { setEditRequest(null); setDuplicateRequest(null); }}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="rebate-items" className="mt-6 space-y-4">
          {isParentStore && <SyncToChildStoresBanner dataLabel="rebate items" />}
          <RebateItemsPage storeId={storeId} selectedProgramId={selectedProgramId} />
        </TabsContent>

        <TabsContent value="claims-payments" className="mt-6 space-y-6">
          <RebateClaimsPaymentsPage storeId={storeId}/>
        </TabsContent>

        <TabsContent value="rebate-reports" className="mt-6">
          <p>Rebate earnings reports are not connected yet.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};
