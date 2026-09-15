import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  BarChart3,
  FileText,
  ShoppingCart,
  Package,
  CreditCard,
  Wallet,
  Receipt,
  ScrollText,
  DollarSign,
} from "lucide-react";
import { GasProfitReport } from "./GasProfitReport";
import { GasSalesReport } from "./sales/GasSalesReport";
import { JobberLogReport } from "./jobber/JobberLogReport";
import { PurchaseLogReport } from "./purchase/PurchaseLogReport";
import { InventoryCostLogReport } from "./inventory-cost/InventoryCostLogReport";
import { CashCardLogReport } from "./cash-card/CashCardLogReport";
import { CashCardBalanceReport } from "./cash-card-balance/CashCardBalanceReport";
import { GasTaxReport } from "./gas-tax/GasTaxReport";
import { SalesVatReport } from "./sales-vat/SalesVatReport";
import { GasProfitVatReport } from "./gas-profit-vat/GasProfitVatReport";

type ReportTab =
  | "gas-profit"
  | "gas-sales"
  | "jobber-log"
  | "purchase-log"
  | "inventory-cost-log"
  | "cash-card-log"
  | "cash-card-balance"
  | "gas-tax"
  | "sales-vat"
  | "gas-profit-vat";

const reportTabs = [
  { id: "gas-profit", label: "Gas Profit", icon: TrendingUp },
  { id: "gas-sales", label: "Gas Sales", icon: BarChart3 },
  { id: "jobber-log", label: "Jobber Log", icon: FileText },
  { id: "purchase-log", label: "Purchase Log", icon: ShoppingCart },
  { id: "inventory-cost-log", label: "Inventory at Cost Log", icon: Package },
  { id: "cash-card-log", label: "Cash Card Log", icon: CreditCard },
  { id: "cash-card-balance", label: "Cash Card Balance", icon: Wallet },
  { id: "gas-tax", label: "Gas Tax Report", icon: Receipt },
  { id: "sales-vat", label: "Sales Log by VAT", icon: ScrollText },
  { id: "gas-profit-vat", label: "Gas Profit by VAT", icon: DollarSign },
];

export const GasReportsPage = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>("gas-profit");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gas Reports</h1>
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

        <TabsContent value="gas-profit" className="mt-6">
          <GasProfitReport />
        </TabsContent>

        <TabsContent value="gas-sales" className="mt-6">
          <GasSalesReport />
        </TabsContent>

        <TabsContent value="jobber-log" className="mt-6">
          <JobberLogReport />
        </TabsContent>

        <TabsContent value="purchase-log" className="mt-6">
          <PurchaseLogReport />
        </TabsContent>

        <TabsContent value="inventory-cost-log" className="mt-6">
          <InventoryCostLogReport />
        </TabsContent>

        <TabsContent value="cash-card-log" className="mt-6">
          <CashCardLogReport />
        </TabsContent>

        <TabsContent value="cash-card-balance" className="mt-6">
          <CashCardBalanceReport />
        </TabsContent>

        <TabsContent value="gas-tax" className="mt-6">
          <GasTaxReport />
        </TabsContent>

        <TabsContent value="sales-vat" className="mt-6">
          <SalesVatReport />
        </TabsContent>

        <TabsContent value="gas-profit-vat" className="mt-6">
          <GasProfitVatReport />
        </TabsContent>
      </Tabs>
    </div>
  );
};
