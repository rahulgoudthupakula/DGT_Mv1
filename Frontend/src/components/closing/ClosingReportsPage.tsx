import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, UtensilsCrossed, Landmark, CalendarDays, BarChart3 } from "lucide-react";
import { DailySummaryReport } from "./reports/DailySummaryReport";
import { DailyDeliSummaryReport } from "./reports/DailyDeliSummaryReport";
import { CheckCashingSummaryReport } from "./reports/CheckCashingSummaryReport";
import { MonthlyTotalsReport } from "./reports/MonthlyTotalsReport";
import { DeliMonthlyTotalsReport } from "./reports/DeliMonthlyTotalsReport";

type ReportTab =
  | "daily-summary"
  | "daily-deli-summary"
  | "check-cashing-summary"
  | "monthly-totals"
  | "deli-monthly-totals";

const reportTabs = [
  { id: "daily-summary", label: "Daily Summary", icon: FileText },
  { id: "daily-deli-summary", label: "Daily Deli Summary", icon: UtensilsCrossed },
  { id: "check-cashing-summary", label: "Check Cashing Summary", icon: Landmark },
  { id: "monthly-totals", label: "Monthly Totals", icon: CalendarDays },
  { id: "deli-monthly-totals", label: "Deli Monthly Totals", icon: BarChart3 },
];

export const ClosingReportsPage = ({storeId}:{storeId:string}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>("daily-summary");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Closing Reports</h1>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReportTab)}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
          {reportTabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              disabled={!["daily-summary","monthly-totals"].includes(tab.id)}
              value={tab.id}
              className="flex items-center gap-1.5 text-xs data-[state=active]:bg-background"
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="daily-summary"><DailySummaryReport storeId={storeId} /></TabsContent>
        <TabsContent value="daily-deli-summary"><DailyDeliSummaryReport /></TabsContent>
        <TabsContent value="check-cashing-summary"><CheckCashingSummaryReport /></TabsContent>
        <TabsContent value="monthly-totals"><DailySummaryReport storeId={storeId} monthly /></TabsContent>
        <TabsContent value="deli-monthly-totals"><DeliMonthlyTotalsReport /></TabsContent>
      </Tabs>
    </div>
  );
};
