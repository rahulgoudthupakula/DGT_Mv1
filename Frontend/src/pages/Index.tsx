import {ManageStoresPage} from "@/components/profile/ManageStoresPage";
import {PageTabAccess} from "@/components/ui/tabs";
import { childPermissions, pagePermission, sectionPermissions, pagePermissions, canNavigatePage, canNavigateSection, firstPermittedPage } from "@/lib/page-permissions";
import {disabledModules} from '@/lib/moduleAvailability';
import { useStoreAccess } from "@/lib/store-access";
import { useQuery } from "@tanstack/react-query";
import { listStores } from "@/lib/backend";
import { useState, useCallback, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { GroceryDaySales } from "@/components/grocery/GroceryDaySales";
import { InventoryManagementPage } from "@/components/grocery/InventoryManagementPage";
import { NonScannedItemPage } from "@/components/grocery/NonScannedItemPage";
import { PurchaseOrdersPage } from "@/components/grocery/PurchaseOrdersPage";

import { EditViewInvoicesPage } from "@/components/grocery/EditViewInvoicesPage";
import { GrocerySettings } from "@/components/grocery/GrocerySettings";
import { RebateManagementPage } from "@/components/grocery/rebate/RebateManagementPage";
import { VendorList } from "@/components/grocery/VendorList";
import { VendorProfile } from "@/components/grocery/VendorProfile";
import { LotteryDashboard } from "@/components/lottery/LotteryDashboard";
import { ReceivedDelivery } from "@/components/lottery/ReceivedDelivery";

import { VerifyActivatePacks } from "@/components/lottery/VerifyActivatePacks";
import { DayShiftClosing } from "@/components/lottery/DayShiftClosing";
import { SettleReturnPacks } from "@/components/lottery/SettleReturnPacks";
import { LotteryGames } from "@/components/lottery/LotteryGames";
import { PackHistory } from "@/components/lottery/PackHistory";
import { LotterySettlement } from "@/components/lottery/LotterySettlement";
import { LotterySettings } from "@/components/lottery/LotterySettings";
import { DayClosingDashboard } from "@/components/closing/DayClosingDashboard";
import { StoreClosingPage } from "@/components/closing/StoreClosingPage";
import { DeliClosingPage } from "@/components/closing/deli/DeliClosingPage";
import { CheckCashingClosingPage } from "@/components/closing/check-cashing/CheckCashingClosingPage";
import { ClosingReportsPage } from "@/components/closing/ClosingReportsPage";

import { GroceryReports } from "@/components/grocery/GroceryReports";
import { InventoryByItem } from "@/components/pricebook/InventoryByItem";
import { InventoryValuationReport } from "@/components/grocery/reports/InventoryValuationReport";
import { PricebookStatisticsPage } from "@/components/pricebook/PricebookStatisticsPage";
import { ItemsPage } from "@/components/pricebook/ItemsPage";
import { NewArrivalsPage } from "@/components/pricebook/NewArrivalsPage";
import { BulkUpdatePage } from "@/components/pricebook/BulkUpdatePage";
import { DiscountsPage } from "@/components/pricebook/DiscountsPage";
import { PromotionsPage } from "@/components/pricebook/PromotionsPage";
import { PriceGroupsPage } from "@/components/pricebook/PriceGroupsPage";
import { GasDashboard } from "@/components/gas/GasDashboard";
import { GasStatisticsPage } from "@/components/gas/GasStatisticsPage";
import { GasDeliveryPage } from "@/components/gas/delivery/GasDeliveryPage";
import { GasPaymentPage } from "@/components/gas/payment/GasPaymentPage";
import { GasInventoryAdjustmentPage } from "@/components/gas/inventory/GasInventoryAdjustmentPage";
import { TankReportPage } from "@/components/gas/tank-report/TankReportPage";
import { GasPricePage } from "@/components/gas/price/GasPricePage";
import { GasSettingsPage } from "@/components/gas/settings/GasSettingsPage";
import { GasReportsPage } from "@/components/gas/reports/GasReportsPage";
import { FuelExpensesPage } from "@/components/gas/FuelExpensesPage";
import { MoneyOrderPage } from "@/components/services/money-order/MoneyOrderPage";
import { BillPayPage } from "@/components/services/bill-pay/BillPayPage";
import { MoneyTransferPage } from "@/components/services/money-transfer/MoneyTransferPage";
import { AtmPage } from "@/components/services/atm/AtmPage";
import { ServicesReportsPage } from "@/components/services/reports/ServicesReportsPage";
import { ServicesDashboard } from "@/components/services/dashboard/ServicesDashboard";
import { CreditCardPage } from "@/components/tender/credit-card/CreditCardPage";
import { EbtFoodstampsPage } from "@/components/tender/ebt/EbtFoodstampsPage";
import { FleetCardsPage } from "@/components/tender/fleet-cards/FleetCardsPage";
import { CustomerAccountsPage } from "@/components/tender/customer-accounts/CustomerAccountsPage";
import { TenderReportsPage } from "@/components/tender/reports/TenderReportsPage";
import { BankLedgerPage } from "@/components/bank/BankLedgerPage";
import { FundTransferPage } from "@/components/bank/FundTransferPage";
import { BankReconcilePage } from "@/components/bank/BankReconcilePage";
import { BankAccountsPage } from "@/components/bank/BankAccountsPage";
import { NetWorthPage } from "@/components/reports/NetWorthPage";
import { PosReportsHub } from "@/components/reports/pos-report/PosReportsHub";
import { ExpensesCpaPage } from "@/components/reports/ExpensesCpaPage";
import { OtherIncomeCpaPage } from "@/components/reports/OtherIncomeCpaPage";
import { WorkforcePage } from "@/components/payroll/WorkforcePage";
import { PayrollEmployees } from "@/components/payroll/PayrollEmployees";
import { WeekSchedulePage } from "@/components/payroll/WeekSchedulePage";
import { PayrollTimeAttendance } from "@/components/payroll/PayrollTimeAttendance";
import { TimeOffRequestPage } from "@/components/payroll/TimeOffRequestPage";
import { TimeOffApprovalsPage } from "@/components/payroll/TimeOffApprovalsPage";
import { PayrollRunPayroll } from "@/components/payroll/PayrollRunPayroll";
import { PayrollPaystubs } from "@/components/payroll/PayrollPaystubs";
import { PayrollDirectDeposit } from "@/components/payroll/PayrollDirectDeposit";
import { PayrollTaxesFiling } from "@/components/payroll/PayrollTaxesFiling";
import { PayrollLedger } from "@/components/payroll/PayrollLedger";
import {
  NavigationProvider,
  type NavigationParams,
} from "@/contexts/NavigationContext";
import { StoreAccountOverview } from "@/components/profile/StoreAccountOverview";
import { StoreManagementPage } from "@/components/profile/StoreManagementPage";
import { UserProfileManagementPage } from "@/components/profile/UserProfileManagementPage";
import { SubscriptionsBillingPage } from "@/components/profile/SubscriptionsBillingPage";
import { PosSettingsPage } from "@/components/profile/PosSettingsPage";
import { SupportHubPage } from "@/components/support/SupportHubPage";
import { FloatingAIButton } from "@/components/FloatingAIButton";
import { LiveCounterPage } from "@/components/live-counter/LiveCounterPage";

import { SyncToChildStoresBanner } from "@/components/SyncToChildStoresBanner";

const SESSION_KEY = "nav_state";

const getInitialState = () => {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old "Timesheet" nav name to "Workweek"
      if (parsed.activeNav === "Timesheet") {
        parsed.activeNav = "Workweek";
      }
      if(disabledModules.has(parsed.activeNav)){parsed.activeNav="Home";parsed.activeSubNav="Dashboard";parsed.activeSubPage=null;parsed.navParams={};}
      return parsed;
    }
  } catch {}
  return null;
};

const Index = ({ onLogout }: { onLogout: () => void }) => {
  const initial = getInitialState();
  const [activeNav, setActiveNav] = useState<string>(initial?.activeNav ?? "Basic Tasks");
  const [activeSubNav, setActiveSubNav] = useState<string | null>(initial?.activeSubNav ?? null);
  const [activeSubPage, setActiveSubPage] = useState<string | null>(initial?.activeSubPage ?? null);
  const [navParams, setNavParams] = useState<NavigationParams>(initial?.navParams ?? {});
  const [activeProfilePage, setActiveProfilePage] = useState<string | null>(initial && "activeProfilePage" in initial ? initial.activeProfilePage : "Store Account Overview");
  const [showLiveCounter, setShowLiveCounter] = useState<boolean>(initial?.showLiveCounter ?? false);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(initial?.selectedStoreId ?? "");

  const storeAccess = useStoreAccess(selectedStoreId);
  const connectedPage = (!activeProfilePage && activeNav === "Lottery" && ["Received and confirm delivery","Verify and activate packs","Day/shift closing","Settle and return packs","Games","Pack history","Settings"].includes(activeSubNav??"")) || (!activeProfilePage && activeNav === "Sales and Performance Reports" && activeSubNav === "POS report") || (!activeProfilePage && activeNav === "Tender Types" && ["Credit card","EBT/Foodstamps","Fleet cards","Reports"].includes(activeSubNav??"")) || (!activeProfilePage && activeNav === "Everyday Closing Reports" && ["Dashboard","Store","Reports"].includes(activeSubNav??"")) || showLiveCounter || !showLiveCounter && ((!activeProfilePage && activeNav === "Gas" && ["Dashboard","Settings","Delivery","Gas price","Inventory adjustment","Tank report"].includes(activeSubNav??"")) || (!activeProfilePage && activeNav === "Grocery" && ["Dashboard","Purchase Orders","Customized order guide","Edit & view invoices","Inventory adjustment","Settings","Reports"].includes(activeSubNav??"")) || (!activeProfilePage && activeNav === "Inventory Valuation" && activeSubNav === "Current stock") || (!activeProfilePage && activeNav === "Price Book" && ["Statistics","New arrivals","Items","Vendor management","Rebate management","Promotions","Discounts","Bulk update","Price groups","Inventory by item (current stock)"].includes(activeSubNav??"")) || (!activeProfilePage && activeNav === "Workweek" && ["Employees","Week Schedule","Time Off Request","Time Off Approvals"].includes(activeSubNav??"")) || ["Support & Training","Manage Stores","Store Account Overview","Access & Integrations","User Profile Management","Subscriptions & Billing"].includes(activeProfilePage ?? ""));
  const governedPage = !activeProfilePage && !showLiveCounter;
  const pageAccessPending = governedPage && storeAccess.isPending;
  const pageAccessDenied = governedPage && !storeAccess.isPending && !canNavigatePage(storeAccess.data,activeNav,activeSubNav);
  useEffect(() => {
    if (!pageAccessDenied) return;
    // Saved/deep navigation may point to a page that was subsequently revoked.
    const section = canNavigateSection(storeAccess.data,activeNav) ? activeNav : Object.keys(sectionPermissions).find(nav=>canNavigateSection(storeAccess.data,nav));
    const next = section ? firstPermittedPage(storeAccess.data,section) : null;
    if(next&&section) {setActiveNav(section);setActiveSubNav(next);}
    else {setActiveProfilePage("User Profile Management");setActiveSubNav(null);}
    setActiveSubPage(null);
    setNavParams({});
  }, [pageAccessDenied, selectedStoreId, activeNav, storeAccess.data]);
  const layoutOnly = !connectedPage && storeAccess.data?.admin === true;

  const storesQuery = useQuery({ queryKey: ["backend-stores"], queryFn: listStores });
  const stores = storesQuery.data ?? [];
  useEffect(() => {
    if (storesQuery.data && !storesQuery.data.some(s => s.dgt_id === selectedStoreId)) {
      setSelectedStoreId(storesQuery.data[0]?.dgt_id ?? "");
    }
  }, [storesQuery.data, selectedStoreId]);
  // Data synchronization is a separate feature; hierarchy does not enable it.
  const isParentStore = false;
  // Persist nav state to sessionStorage on every change
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        activeNav, activeSubNav, activeSubPage, navParams, activeProfilePage, showLiveCounter, selectedStoreId,
      }));
    } catch {}
  }, [activeNav, activeSubNav, activeSubPage, navParams, activeProfilePage, showLiveCounter, selectedStoreId]);

  const handleNavClick = (nav: string) => {
    if(disabledModules.has(nav)||!canNavigateSection(storeAccess.data,nav))return;
    setActiveNav(nav);
    // Default to the "Dashboard" sub-page when available so each section
    // lands on its dashboard view.
    const defaults: Record<string, string> = {
      "Workweek": "Employees",
      "Home": "Dashboard",
      "Everyday Closing Reports": "Dashboard",
      "Grocery": "Dashboard",
      "Gas": "Dashboard",
      "Lottery": "Dashboard",
      "Financial and Payment Services": "Dashboard",
      "Tender Types": "Dashboard",
      "Banking Management": "Dashboard",
    };
    setActiveSubNav(firstPermittedPage(storeAccess.data,nav) ?? defaults[nav] ?? null);
    setActiveSubPage(null);
    setNavParams({});
    setActiveProfilePage(null);
    setShowLiveCounter(false);
  };

  const handleSubNavClick = (subNav: string, subPage?: string) => {
    setActiveSubNav(subNav);
    setActiveSubPage(subPage || null);
    setNavParams({});
    setActiveProfilePage(null);
  };

  const handleProfilePageClick = (page: string) => {
    setActiveProfilePage(page);
    setActiveSubNav(null);
    setActiveSubPage(null);
  };

  const handleContextNavigate = useCallback(
    (nav: string, subNav: string, subPage?: string, params?: NavigationParams) => {
      if(disabledModules.has(nav)||!canNavigateSection(storeAccess.data,nav))return;
    setActiveNav(nav);
      setActiveSubNav(subNav);
      setActiveSubPage(subPage || null);
      setNavParams(params ?? {});
    },
    [storeAccess.data]
  );

  // Vendor profile view
  const showVendorProfile =
    activeNav === "Price Book" &&
    activeSubNav === "Vendor management" &&
    activeSubPage === "vendor-profile" &&
    navParams.vendorName;

  // Check if we should show Grocery Day Sales view (Dashboard is Day Sales)
  const showGroceryDaySales =
    activeNav === "Grocery" &&
    activeSubNav === "Dashboard";

  // Inventory adjustment — tab page
  const showInventoryManagement =
    activeNav === "Grocery" &&
    activeSubNav === "Inventory adjustment";

  // Check if we should show Order Guide view
  const showOrderGuide =
    activeNav === "Grocery" &&
    (activeSubNav === "Purchase Orders" || activeSubNav === "Customized order guide");


  // Edit & view invoices — tab page
  const showEditViewInvoices =
    activeNav === "Grocery" &&
    activeSubNav === "Edit & view invoices";

  // Check if we should show Grocery Reports view
  const showGroceryReports =
    activeNav === "Grocery" &&
    activeSubNav === "Reports";

  // Check if we should show Grocery Settings view
  const showGrocerySettings =
    activeNav === "Grocery" &&
    activeSubNav === "Settings";

  // Rebate management — single tab page
  const showRebateManagement = activeNav === "Price Book" && activeSubNav === "Rebate management";

  // Non-scanned item
  const showNonScannedItem = activeNav === "Grocery" && activeSubNav === "Non-scanned item";

  // Check if we should show Vendor Management view
  const showVendorList =
    activeNav === "Price Book" &&
    activeSubNav === "Vendor management" &&
    !showVendorProfile;

  // Check if we should show Expired & Expiring Items view
  const showExpiredExpiringItems =
    activeNav === "Grocery" &&
    activeSubNav === "Inventory adjustment" &&
    activeSubPage === "Expired & Expiring Items";

  // Check if we should show Lottery Dashboard view
  const showLotteryDashboard =
    activeNav === "Lottery" &&
    activeSubNav === "Dashboard";

  // Check if we should show Lottery Received & Confirm Delivery view
  const showLotteryReceivedDelivery =
    activeNav === "Lottery" &&
    activeSubNav === "Received and confirm delivery";


  // Check if we should show Lottery Verify & Activate Packs view
  const showLotteryVerifyActivate =
    activeNav === "Lottery" &&
    activeSubNav === "Verify and activate packs";

  // Check if we should show Lottery Day/Shift Closing view
  const showLotteryDayShiftClosing =
    activeNav === "Lottery" &&
    activeSubNav === "Day/shift closing";

  // Check if we should show Lottery Settle & Return Packs view
  const showLotterySettleReturn =
    activeNav === "Lottery" &&
    activeSubNav === "Settle and return packs";

  // Check if we should show Lottery Games view
  const showLotteryGames =
    activeNav === "Lottery" &&
    activeSubNav === "Games";

  // Check if we should show Lottery Pack History view
  const showLotteryPackHistory =
    activeNav === "Lottery" &&
    activeSubNav === "Pack history";

  // Check if we should show Lottery Settlement view
  const showLotterySettlement =
    activeNav === "Lottery" &&
    activeSubNav === "Lottery settlement";

  // Check if we should show Lottery Settings view
  const showLotterySettingsView =
    activeNav === "Lottery" &&
    activeSubNav === "Settings";

  const showDayClosingDashboard =
    activeNav === "Everyday Closing Reports" &&
    activeSubNav === "Dashboard";

  const showStoreClosing =
    activeNav === "Everyday Closing Reports" &&
    activeSubNav === "Store";

  const showDeliClosing =
    activeNav === "Everyday Closing Reports" &&
    activeSubNav === "Deli";

  const showCheckCashingClosing =
    activeNav === "Everyday Closing Reports" &&
    activeSubNav === "Check Cashing";

  const showClosingReports =
    activeNav === "Everyday Closing Reports" &&
    activeSubNav === "Reports";

  // Check if we should show Price Book - Statistics (Dashboard)
  const showPricebookStatistics =
    activeNav === "Price Book" &&
    activeSubNav === "Statistics";

  // Check if we should show Price Book - Inventory by item
  const showPricebookInventoryByItem =
    activeNav === "Price Book" &&
    activeSubNav === "Inventory by item (current stock)";

  const showPricebookItems = activeNav === "Price Book" && activeSubNav === "Items";
  const showPricebookNewArrivals = activeNav === "Price Book" && activeSubNav === "New arrivals";
  const showPricebookBulkUpdate = activeNav === "Price Book" && activeSubNav === "Bulk update";
  const showPricebookPromotions = activeNav === "Price Book" && activeSubNav === "Promotions";
  const showPricebookPriceGroups = activeNav === "Price Book" && activeSubNav === "Price groups";

  const showInventoryCurrentStock = activeNav === "Inventory Valuation" && activeSubNav === "Current stock";
  const showInventoryValuation = activeNav === "Inventory Valuation" && activeSubNav === "Valuation";

  // Check if we should show Gas Dashboard view
  const showGasDashboard =
    activeNav === "Gas" &&
    activeSubNav === "Dashboard";

  const showGasStatistics =
    activeNav === "Gas" &&
    activeSubNav === "Gas statistics";

  // Check if we should show Gas Delivery view
  const showGasDelivery =
    activeNav === "Gas" &&
    activeSubNav === "Delivery";

  // Check if we should show Gas Payments view
  const showGasPayments =
    activeNav === "Gas" &&
    activeSubNav === "Gas invoices & payments";

  // Check if we should show Gas Inventory Adjustment view
  const showGasInventoryAdjustment =
    activeNav === "Gas" &&
    activeSubNav === "Inventory adjustment";

  // Check if we should show Gas Tank Report view
  const showGasTankReport =
    activeNav === "Gas" &&
    activeSubNav === "Tank report";

  const showGasReports =
    activeNav === "Gas" &&
    activeSubNav === "Reports";

  const showGasPrice =
    activeNav === "Gas" &&
    activeSubNav === "Gas price";

  const showGasSettings =
    activeNav === "Gas" &&
    activeSubNav === "Settings";

  const showFuelExpenses = activeNav === "Gas" && activeSubNav === "Fuel expenses";

  const showMoneyOrder =
    activeNav === "Financial and Payment Services" &&
    activeSubNav === "Money order";

  const showBillPay =
    activeNav === "Financial and Payment Services" &&
    activeSubNav === "Bill pay";

  const showMoneyTransfer =
    activeNav === "Financial and Payment Services" &&
    activeSubNav === "Money transfer";

  const showAtm =
    activeNav === "Financial and Payment Services" &&
    activeSubNav === "ATM";

  const showServiceSettlements =
    activeNav === "Financial and Payment Services" &&
    activeSubNav === "Reports";

  const showServicesDashboard =
    activeNav === "Financial and Payment Services" &&
    activeSubNav === "Dashboard";

  // Credit card — tab page
  const showCreditCard =
    activeNav === "Tender Types" &&
    activeSubNav === "Credit card";

  const showEbtFoodstamps =
    activeNav === "Tender Types" &&
    activeSubNav === "EBT/Foodstamps";

  const showFleetCards =
    activeNav === "Tender Types" &&
    activeSubNav === "Fleet cards";

  const showCustomerAccounts =
    activeNav === "Tender Types" &&
    activeSubNav === "Customer accounts";

  const showTenderReports =
    activeNav === "Tender Types" &&
    activeSubNav === "Reports";

  const showBankLedger =
    activeNav === "Banking Management" &&
    activeSubNav === "Bank Ledger";

  const showFundTransfer =
    activeNav === "Banking Management" &&
    activeSubNav === "Fund transfer";

  const showBankReconcile =
    activeNav === "Banking Management" &&
    activeSubNav === "Reconcile";

  const showBankAccounts =
    activeNav === "Banking Management" &&
    activeSubNav === "Bank accounts";

  const showNetWorth =
    activeNav === "Sales and Performance Reports" &&
    activeSubNav === "Net worth";

  const showPosReport =
    activeNav === "Sales and Performance Reports" &&
    activeSubNav === "POS report";

  const showExpensesCpa = activeNav === "Sales and Performance Reports" && activeSubNav === "Expenses CPA";
  const showOtherIncomeCpa = activeNav === "Sales and Performance Reports" && activeSubNav === "Other income CPA";


  const showPayrollEmployees = activeNav === "Workweek" && activeSubNav === "Employees";
  const showPayrollWeekSchedule = activeNav === "Workweek" && activeSubNav === "Week Schedule";
  const showPayrollTime = activeNav === "Workweek" && activeSubNav === "Time & Attendance";
  const showTimeOffRequest = activeNav === "Workweek" && activeSubNav === "Time Off Request";
  const showTimeOffApprovals = activeNav === "Workweek" && activeSubNav === "Time Off Approvals";
  const showPayrollRun = activeNav === "Payroll" && activeSubNav === "Run Payroll";
  const showPayrollPaystubs = activeNav === "Payroll" && activeSubNav === "Paystubs";
  const showPayrollDirectDeposit = activeNav === "Payroll" && activeSubNav === "Direct Deposit";
  const showPayrollTaxes = activeNav === "Payroll" && activeSubNav === "Taxes & Filing";
  const showPayrollLedger = activeNav === "Payroll" && activeSubNav === "Payroll Ledger";


  return (
    <NavigationProvider onNavigate={handleContextNavigate} params={navParams}>
      <div className="min-h-screen bg-background">
        <DashboardHeader
          activeNav={activeNav}
          activeSubNav={activeSubNav}
          onNavClick={handleNavClick}
          onSubNavClick={handleSubNavClick}
          onProfilePageClick={handleProfilePageClick}
          onLiveCounterClick={() => { setShowLiveCounter(true); setActiveProfilePage(null); setActiveSubNav(null); setActiveSubPage(null); }}
          stores={stores}
          selectedStoreId={selectedStoreId}
          onStoreChange={setSelectedStoreId}
          onLogout={onLogout}
          hideSubNav={!!activeProfilePage || showLiveCounter}
        />

        <main className="container mx-auto px-6 py-8">
          {layoutOnly && <div role="status" className="mb-6 rounded border bg-muted p-4 text-sm">Admin layout preview. Existing example content is for layout review only; database actions are not connected.</div>}
          <PageTabAccess.Provider value={activeProfilePage||showLiveCounter||['Grocery','Gas','Lottery'].includes(activeNav)?{}:Object.fromEntries(Object.entries(childPermissions[pagePermission(activeNav,activeSubNav)??'']??{}).map(([tab,code])=>[tab,storeAccess.data?.admin===true||storeAccess.data?.pages[code]===true]))}>
          <fieldset disabled={layoutOnly && !showOrderGuide && !showGasDelivery} className="min-w-0 border-0 p-0 m-0" {...(layoutOnly && !showOrderGuide && !showGasDelivery ? {inert:""} : {})}>
          {pageAccessPending ? <p>Loading page access…</p> : pageAccessDenied ? null : !connectedPage && !layoutOnly ? (
            <div className="space-y-3"><p>This page is not connected to store permissions yet.</p><button className="underline" onClick={()=>{setShowLiveCounter(false);setActiveProfilePage("Store Account Overview");}}>Store Account Overview</button><span> · </span><button className="underline" onClick={()=>{setShowLiveCounter(false);setActiveProfilePage("Access & Integrations");}}>Access &amp; Integrations</button></div>
          ) : showLiveCounter ? (
            <LiveCounterPage key={selectedStoreId} storeId={selectedStoreId} onOpenDailyClosing={() => handleNavClick("Everyday Closing Reports")} />
          ) : activeProfilePage === "Manage Stores" ? (
            <ManageStoresPage key={selectedStoreId} storeId={selectedStoreId} onSelect={setSelectedStoreId} onSetup={(id,page)=>{setSelectedStoreId(id);setActiveSubPage(null);setNavParams({});setShowLiveCounter(false);if(page==='employees'){setActiveProfilePage(null);setActiveNav('Workweek');setActiveSubNav('Employees');}else{setActiveProfilePage(page==='permissions'?'Access & Integrations':'Store Account Overview');setActiveSubNav(null);}}}/>
          ) : activeProfilePage === "Store Account Overview" ? (
            <>
              {storesQuery.isPending ? <p>Loading stores…</p> : storesQuery.error ?
                <p role="alert">{storesQuery.error.message} <button onClick={() => storesQuery.refetch()}>Retry</button></p> :
                <StoreAccountOverview key={selectedStoreId} storeId={selectedStoreId} />}
            </>
          ) : activeProfilePage === "Access & Integrations" ? (
            <StoreManagementPage key={selectedStoreId} storeId={selectedStoreId} />
          ) : activeProfilePage === "User Profile Management" ? (
            <UserProfileManagementPage onSignOut={onLogout} />
          ) : activeProfilePage === "Subscriptions & Billing" ? (
            <SubscriptionsBillingPage key={selectedStoreId} storeId={selectedStoreId} />
          ) : activeProfilePage === "POS Settings" ? (
            <PosSettingsPage />
          ) : activeProfilePage === "Support & Training" ? (
            <SupportHubPage key={selectedStoreId} storeId={selectedStoreId} />
          ) : showVendorProfile ? (
            <VendorProfile
              vendorName={navParams.vendorName!} storeId={selectedStoreId} vendorId={navParams.vendorId}
              onBack={() => {
                setActiveSubPage(null);
                setNavParams({});
              }}
            />
          ) : showGroceryDaySales ? (
            <GroceryDaySales key={selectedStoreId} storeId={selectedStoreId} />
          ) : showInventoryManagement ? (
            <InventoryManagementPage key={selectedStoreId} storeId={selectedStoreId} />
          ) : showOrderGuide ? (
            <PurchaseOrdersPage key={selectedStoreId} storeId={selectedStoreId} />
          ) : showEditViewInvoices ? (
            <EditViewInvoicesPage key={selectedStoreId} storeId={selectedStoreId} />
          ) : showGroceryReports ? (
            <GroceryReports key={selectedStoreId} storeId={selectedStoreId}/>
          ) : showGrocerySettings ? (
            <GrocerySettings key={selectedStoreId} storeId={selectedStoreId} />
          ) : showRebateManagement ? (
            <RebateManagementPage key={selectedStoreId} storeId={selectedStoreId} isParentStore={isParentStore} />
          ) : showNonScannedItem ? (
            <NonScannedItemPage />
          ) : showVendorList ? (
            <VendorList key={selectedStoreId} storeId={selectedStoreId} />
          ) : showLotteryDashboard ? (
            <LotteryDashboard />
          ) : showLotteryReceivedDelivery ? (
            <ReceivedDelivery key={selectedStoreId} storeId={selectedStoreId} />
          ) : showLotteryVerifyActivate ? (
            <VerifyActivatePacks key={selectedStoreId} storeId={selectedStoreId} />
          ) : showLotteryDayShiftClosing ? (
            <DayShiftClosing key={selectedStoreId} storeId={selectedStoreId} />
          ) : showLotterySettleReturn ? (
            <SettleReturnPacks key={selectedStoreId} storeId={selectedStoreId} />
          ) : showLotteryGames ? (
            <LotteryGames key={selectedStoreId} storeId={selectedStoreId} />
          ) : showLotteryPackHistory ? (
            <PackHistory key={selectedStoreId} storeId={selectedStoreId} />
          ) : showLotterySettlement ? (
            <LotterySettlement />
          ) : showLotterySettingsView ? (
            <LotterySettings key={selectedStoreId} storeId={selectedStoreId} />
          ) : showDayClosingDashboard ? (
            <StoreClosingPage key={selectedStoreId} storeId={selectedStoreId} />
          ) : showStoreClosing ? (
            <StoreClosingPage key={selectedStoreId} storeId={selectedStoreId} />
          ) : showDeliClosing ? (
            <DeliClosingPage />
          ) : showCheckCashingClosing ? (
            <CheckCashingClosingPage />
          ) : showClosingReports ? (
            <ClosingReportsPage key={selectedStoreId} storeId={selectedStoreId} />
          ) : showPricebookStatistics ? (
            <PricebookStatisticsPage key={selectedStoreId} storeId={selectedStoreId} />
          ) : showPricebookInventoryByItem ? (
            <InventoryByItem key={selectedStoreId} storeId={selectedStoreId} />
          ) : showPricebookItems ? (
            <ItemsPage key={selectedStoreId} storeId={selectedStoreId} />
          ) : showPricebookNewArrivals ? (
            <NewArrivalsPage key={selectedStoreId} storeId={selectedStoreId} />
          ) : showPricebookBulkUpdate ? (
            <BulkUpdatePage key={selectedStoreId} storeId={selectedStoreId} />
          ) : activeNav === "Price Book" && activeSubNav === "Discounts" ? (
            <DiscountsPage key={selectedStoreId} storeId={selectedStoreId} />
          ) : showPricebookPromotions ? (
            <PromotionsPage key={selectedStoreId} storeId={selectedStoreId} />
          ) : showPricebookPriceGroups ? (
            <PriceGroupsPage key={selectedStoreId} storeId={selectedStoreId} />
          ) : showInventoryCurrentStock ? (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Current Available Stock</h1>
                <p className="text-sm text-muted-foreground">Live snapshot of on-hand inventory across all items</p>
              </div>
              <InventoryByItem key={selectedStoreId} storeId={selectedStoreId} />
            </div>
          ) : showInventoryValuation ? (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Inventory Valuation</h1>
                <p className="text-sm text-muted-foreground">Stock value at cost or retail, by date or category</p>
              </div>
              <InventoryValuationReport storeId={selectedStoreId}/>
            </div>
          ) : showGasDashboard ? (
            <GasDashboard key={selectedStoreId} storeId={selectedStoreId} />
          ) : showGasStatistics ? (
            <GasStatisticsPage />
          ) : showGasDelivery ? (
            <GasDeliveryPage key={selectedStoreId} storeId={selectedStoreId} />
          ) : showGasPayments ? (
            <GasPaymentPage key={selectedStoreId} storeId={selectedStoreId} />
          ) : showGasInventoryAdjustment ? (
            <GasInventoryAdjustmentPage key={selectedStoreId} storeId={selectedStoreId} />
          ) : showGasTankReport ? (
            <TankReportPage key={selectedStoreId} storeId={selectedStoreId} />
          ) : showGasReports ? (
            <GasReportsPage />
          ) : showGasPrice ? (
            <GasPricePage key={selectedStoreId} storeId={selectedStoreId} />
          ) : showGasSettings ? (
            <GasSettingsPage key={selectedStoreId} storeId={selectedStoreId} />
          ) : showFuelExpenses ? (
            <FuelExpensesPage />
          ) : showMoneyOrder ? (
            <MoneyOrderPage />
          ) : showBillPay ? (
            <BillPayPage />
          ) : showMoneyTransfer ? (
            <MoneyTransferPage />
          ) : showAtm ? (
            <AtmPage />
          ) : showServiceSettlements ? (
            <ServicesReportsPage />
          ) : showServicesDashboard ? (
            <ServicesDashboard />
          ) : showCreditCard ? (
            <CreditCardPage key={selectedStoreId} storeId={selectedStoreId} />
          ) : showEbtFoodstamps ? (
            <EbtFoodstampsPage key={selectedStoreId} storeId={selectedStoreId} />
          ) : showFleetCards ? (
            <FleetCardsPage key={selectedStoreId} storeId={selectedStoreId} />
          ) : showCustomerAccounts ? (
            <CustomerAccountsPage />
          ) : showTenderReports ? (
            <TenderReportsPage key={selectedStoreId} storeId={selectedStoreId} />
          ) : showBankLedger ? (
            <BankLedgerPage />
          ) : showFundTransfer ? (
            <FundTransferPage />
          ) : showBankReconcile ? (
            <BankReconcilePage />
          ) : showBankAccounts ? (
            <BankAccountsPage />
          ) : showNetWorth ? (
            <NetWorthPage />
          ) : showPosReport ? (
            <PosReportsHub key={selectedStoreId} storeId={selectedStoreId}/>
          ) : showExpensesCpa ? (
            <ExpensesCpaPage />
          ) : showOtherIncomeCpa ? (
            <OtherIncomeCpaPage />
          ) : showPayrollEmployees ? (
            <PayrollEmployees key={selectedStoreId} storeId={selectedStoreId} />
          ) : showPayrollWeekSchedule ? (
            <WorkforcePage key={selectedStoreId+"schedule"} storeId={selectedStoreId} />
          ) : showPayrollTime ? (
            <PayrollTimeAttendance />
          ) : showTimeOffRequest ? (
            <WorkforcePage key={selectedStoreId+"requests"} storeId={selectedStoreId} view="requests" />
          ) : showTimeOffApprovals ? (
            <WorkforcePage key={selectedStoreId+"approvals"} storeId={selectedStoreId} view="approvals" />
          ) : showPayrollRun ? (
            <PayrollRunPayroll />
          ) : showPayrollPaystubs ? (
            <PayrollPaystubs />
          ) : showPayrollDirectDeposit ? (
            <PayrollDirectDeposit />
          ) : showPayrollTaxes ? (
            <PayrollTaxesFiling />
          ) : showPayrollLedger ? (
            <PayrollLedger />
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>Select a navigation item to view its content</p>
            </div>
          )}
          </fieldset>
          </PageTabAccess.Provider>
        </main>
        <FloatingAIButton />
      </div>
    </NavigationProvider>
  );
};

export default Index;
