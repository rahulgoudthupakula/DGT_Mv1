import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SupportDashboard } from "@/components/support/SupportDashboard";
import { SupportTicketsPage } from "@/components/support/SupportTicketsPage";
import { SupportTrainingModulesPage } from "@/components/support/SupportTrainingModulesPage";
import { SupportKnowledgeBasePage } from "@/components/support/SupportKnowledgeBasePage";

const TABS = ["Dashboard", "Tickets", "Training", "Knowledge Base"] as const;
type Tab = (typeof TABS)[number];

export const SupportHubPage = () => {
  const [tab, setTab] = useState<Tab>("Dashboard");

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

      {tab === "Dashboard" && <SupportDashboard onNavigate={(t) => setTab(t as Tab)} />}
      {tab === "Tickets" && <SupportTicketsPage />}
      {tab === "Training" && <SupportTrainingModulesPage />}
      {tab === "Knowledge Base" && <SupportKnowledgeBasePage />}
    </div>
  );
};
