import { useState } from "react";
import { Button } from "@/components/ui/button";
import {useQuery} from "@tanstack/react-query";
import {request} from "@/lib/backend";
import { SupportTicketsPage } from "@/components/support/SupportTicketsPage";
import { SupportTrainingModulesPage } from "@/components/support/SupportTrainingModulesPage";
import { SupportKnowledgeBasePage } from "@/components/support/SupportKnowledgeBasePage";

const TABS = ["Dashboard", "Tickets", "Training", "Knowledge Base"] as const;
type Tab = (typeof TABS)[number];

export const SupportHubPage = ({storeId}: {storeId:string}) => {
  const summary=useQuery({queryKey:["support-summary",storeId],queryFn:()=>request<{status:string}[]>(`/access/stores/${encodeURIComponent(storeId)}/support-tickets`),refetchInterval:15000});
  const [tab, setTab] = useState<Tab>("Tickets");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <Button
            key={t}
            variant="ghost"
            size="sm"
            onClick={() => setTab(t)}
            className={
              tab === t
                ? "h-7 px-3 text-[11px] rounded-md bg-primary text-primary-foreground font-semibold"
                : "h-7 px-3 text-[11px] rounded-md bg-muted text-foreground hover:bg-foreground/15"
            }
          >
            {t}
          </Button>
        ))}
      </div>

      {tab === "Dashboard" && <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{summary.error?<p role="alert">{summary.error.message}</p>:summary.isLoading?<p>Loading tickets…</p>:["Open","In Progress","Resolved"].map(status=><button key={status} className="rounded-xl border p-6 text-left" onClick={()=>setTab("Tickets")}><p>{status}</p><strong className="text-2xl">{summary.data?.filter(t=>t.status===status).length??0}</strong></button>)}</div>}
      {tab === "Tickets" && <SupportTicketsPage key={storeId} storeId={storeId} />}
      {tab === "Training" && <SupportTrainingModulesPage />}
      {tab === "Knowledge Base" && <SupportKnowledgeBasePage />}
    </div>
  );
};
