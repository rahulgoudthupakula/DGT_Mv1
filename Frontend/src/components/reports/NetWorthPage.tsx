import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { NetWorthFilters } from "./net-worth/NetWorthFilters";
import { NetWorthHeroCard } from "./net-worth/NetWorthHeroCard";
import { NetWorthPerformance } from "./net-worth/NetWorthPerformance";
import { LineItem, SubtotalRow, ModuleHeader, SectionHeader } from "./net-worth/LineItem";

const fmt = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// --- Mock data (module-sourced) ---
const assets = {
  // Bank / Closing module
  bank: {
    cashInBank: 87320.5,
    undepositedCash: 3280.75,
  },
  // Grocery module
  grocery: {
    inventoryAtCost: 145200.0,
    vendorRebatesReceivable: 1850.0,
  },
  // Gas module
  gas: {
    tankInventoryAtCost: 78500.0,
  },
  // Services / Tender module
  services: {
    creditCardBatchPending: 14200.0,
    ebtFleetPending: 3100.0,
    serviceDepositsPending: 2400.0,
  },
  // Other
  other: {
    cashOnHand: 12450.0,
    atmBalance: 15000.0,
    pettyCash: 500.0,
    customerAccountsReceivable: 2340.0,
    cigaretteInventory: 32800.0,
    deliInventory: 8900.0,
    otherInventory: 4200.0,
  },
};

const liabilities = {
  // Grocery module
  grocery: {
    unpaidInvoices: 42300.0,
    pendingBills: 5600.0,
  },
  // Gas module
  gas: {
    jobberPayable: 28700.0,
    gasTaxPayable: 3200.0,
  },
  // Services module
  services: {
    moProviderPayable: 4800.0,
    billPayPayable: 2100.0,
    transferPayable: 1650.0,
    giftCardLiability: 3200.0,
  },
  // Other
  other: {
    payrollPayable: 12400.0,
    salesTaxPayable: 8900.0,
    creditCardFeesPayable: 2150.0,
    lotteryLiability: 950.0,
  },
};

// Totals
const sumValues = (obj: Record<string, number>) => Object.values(obj).reduce((a, b) => a + b, 0);

const totalBank = sumValues(assets.bank);
const totalGroceryAssets = sumValues(assets.grocery);
const totalGasAssets = sumValues(assets.gas);
const totalServicesAssets = sumValues(assets.services);
const totalOtherAssets = sumValues(assets.other);
const totalAssets = totalBank + totalGroceryAssets + totalGasAssets + totalServicesAssets + totalOtherAssets;

const totalGroceryLiab = sumValues(liabilities.grocery);
const totalGasLiab = sumValues(liabilities.gas);
const totalServicesLiab = sumValues(liabilities.services);
const totalOtherLiab = sumValues(liabilities.other);
const totalLiabilities = totalGroceryLiab + totalGasLiab + totalServicesLiab + totalOtherLiab;

const netWorth = totalAssets - totalLiabilities;
const changeVsLastMonth = 12340.0;

export const NetWorthPage = () => {
  const [asOfDate, setAsOfDate] = useState<Date>(new Date());
  const [includeToday, setIncludeToday] = useState(true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Net Worth Statement</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Balance sheet snapshot as of {format(asOfDate, "MMMM d, yyyy")}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      <NetWorthFilters asOfDate={asOfDate} setAsOfDate={setAsOfDate} includeToday={includeToday} setIncludeToday={setIncludeToday} />
      <NetWorthHeroCard netWorth={netWorth} changeVsLastMonth={changeVsLastMonth} />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ASSETS */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[hsl(var(--success))]" />
              Assets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {/* Bank / Day Closing */}
            <ModuleHeader label="Bank / Day Closing" />
            <LineItem label="Cash in Bank" value={assets.bank.cashInBank} source="Bank module → account balances" />
            <LineItem label="Undeposited Cash" value={assets.bank.undepositedCash} source="Day closing → undeposited funds" />
            <SubtotalRow label="Subtotal" value={totalBank} />

            {/* Grocery */}
            <ModuleHeader label="Grocery Module" />
            <LineItem label="Grocery Inventory at Cost" value={assets.grocery.inventoryAtCost} source="Inventory valuation → on-hand qty × last cost" />
            <LineItem label="Vendor Rebates Receivable" value={assets.grocery.vendorRebatesReceivable} source="Rebate management → earned but unpaid" />
            <SubtotalRow label="Subtotal" value={totalGroceryAssets} />

            {/* Gas */}
            <ModuleHeader label="Gas Module" />
            <LineItem label="Gas Tank Inventory at Cost" value={assets.gas.tankInventoryAtCost} source="Tank report → closing gal × cost/gal" />
            <SubtotalRow label="Subtotal" value={totalGasAssets} />

            {/* Services / Tender */}
            <ModuleHeader label="Services / Tender" />
            <LineItem label="Credit Card Batch Pending" value={assets.services.creditCardBatchPending} source="Credit card settlement → pending batches" />
            <LineItem label="EBT/Fleet Pending Settlement" value={assets.services.ebtFleetPending} source="Tender settlement → pending" />
            <LineItem label="Service Deposits Pending" value={assets.services.serviceDepositsPending} source="Service settlements → not yet deposited" />
            <SubtotalRow label="Subtotal" value={totalServicesAssets} />

            {/* Other */}
            <ModuleHeader label="Other Assets" />
            <LineItem label="Cash on Hand" value={assets.other.cashOnHand} source="Day closing → register count" />
            <LineItem label="ATM Balance" value={assets.other.atmBalance} source="ATM module → current balance" />
            <LineItem label="Petty Cash" value={assets.other.pettyCash} />
            <LineItem label="Customer Accounts Receivable" value={assets.other.customerAccountsReceivable} source="Customer accounts → outstanding balance" />
            <LineItem label="Cigarette Inventory" value={assets.other.cigaretteInventory} source="Inventory valuation → cigarettes at cost" />
            <LineItem label="Deli Inventory" value={assets.other.deliInventory} source="Deli module → inventory at cost" />
            <LineItem label="Other Inventory" value={assets.other.otherInventory} />
            <SubtotalRow label="Subtotal" value={totalOtherAssets} />

            {/* Total Assets */}
            <div className="flex justify-between py-3 border-t-2 border-[hsl(var(--success))]/30 mt-2">
              <span className="font-bold text-[hsl(var(--success))]">Total Assets</span>
              <span className="font-bold text-lg tabular-nums">{fmt(totalAssets)}</span>
            </div>
          </CardContent>
        </Card>

        {/* LIABILITIES */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-destructive" />
              Liabilities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {/* Grocery */}
            <ModuleHeader label="Grocery Module" />
            <LineItem label="Unpaid Purchase Invoices" value={liabilities.grocery.unpaidInvoices} source="Orders/Invoices → status unpaid/partial" />
            <LineItem label="Pending Bills" value={liabilities.grocery.pendingBills} source="Orders/Invoices → accrued expenses" />
            <SubtotalRow label="Subtotal" value={totalGroceryLiab} />

            {/* Gas */}
            <ModuleHeader label="Gas Module" />
            <LineItem label="Jobber Payable / Unpaid Deliveries" value={liabilities.gas.jobberPayable} source="Gas delivery/purchase log → unpaid" />
            <LineItem label="Gas Tax Payable" value={liabilities.gas.gasTaxPayable} source="Gas tax report → tax due" />
            <SubtotalRow label="Subtotal" value={totalGasLiab} />

            {/* Services */}
            <ModuleHeader label="Services Module" />
            <LineItem label="Money Order Provider Payable" value={liabilities.services.moProviderPayable} source="MO transactions → principal not remitted" />
            <LineItem label="Bill Pay Provider Payable" value={liabilities.services.billPayPayable} source="Bill pay → unsettled principal" />
            <LineItem label="Money Transfer Provider Payable" value={liabilities.services.transferPayable} source="Money transfer → unsettled principal" />
            <LineItem label="Gift Card Liability" value={liabilities.services.giftCardLiability} source="Gift cards sold − redeemed" />
            <SubtotalRow label="Subtotal" value={totalServicesLiab} />

            {/* Other */}
            <ModuleHeader label="Other Liabilities" />
            <LineItem label="Payroll Payable" value={liabilities.other.payrollPayable} />
            <LineItem label="Sales Tax Payable" value={liabilities.other.salesTaxPayable} source="Tax tracking → sales tax due" />
            <LineItem label="Credit Card Fees Payable" value={liabilities.other.creditCardFeesPayable} source="Credit card settlement → fee accrual" />
            <LineItem label="Lottery Liability" value={liabilities.other.lotteryLiability} source="Lottery module → unredeemed" />
            <SubtotalRow label="Subtotal" value={totalOtherLiab} />

            {/* Total Liabilities */}
            <div className="flex justify-between py-3 border-t-2 border-destructive/30 mt-2">
              <span className="font-bold text-destructive">Total Liabilities</span>
              <span className="font-bold text-lg tabular-nums">{fmt(totalLiabilities)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <NetWorthPerformance />
    </div>
  );
};
