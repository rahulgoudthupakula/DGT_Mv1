import {disabledModules} from '@/lib/moduleAvailability';
import type { StoreRecord } from "@/lib/backend";
import { useRef, useEffect, useState } from "react";
import { ChevronDown, Menu, User, Building2, CreditCard, Settings, Monitor, MessageSquareText, Bell, Activity, Store, Check, MapPin, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  stores: StoreRecord[];
  activeNav: string;
  activeSubNav?: string | null;
  onNavClick: (nav: string) => void;
  onSubNavClick?: (subNav: string, subPage?: string) => void;
  onProfilePageClick?: (page: string) => void;
  onLiveCounterClick?: () => void;
  selectedStoreId: string;
  onStoreChange: (storeId: string) => void;
  onLogout?: () => void;
  hideSubNav?: boolean;
}

const navItems = [
  "Home",
  "Everyday Closing Reports",
  "Grocery",
  "Gas",
  "Lottery",
  "Financial and Payment Services",
  "Tender Types",
  "Banking Management",
  
  "Sales and Performance Reports",

  "Inventory Valuation",

  "Price Book",
  "Workweek",
  "Payroll",
];

const subNavItems: Record<string, string[]> = {
  "Home": ["Dashboard", "Quick Actions", "Overview"],
  "Everyday Closing Reports": ["Dashboard", "Store", "Deli", "Check Cashing", "Reports", "Settings"],
  "Grocery": [
    "Dashboard",
    "Inventory adjustment",
    "Purchase Orders",
    "Edit & view invoices",
    "Reports",
    "Non-scanned item",
    "Settings",
  ],
  "Gas": [
    "Dashboard",
    "Gas statistics",
    "Delivery",
    "Gas invoices & payments",
    "Inventory adjustment",
    "Tank report",
    "Reports",
    "Fuel expenses",
    "Gas price",
    "Settings",
  ],
  "Lottery": [
    "Dashboard",
    "Received and confirm delivery",
    "Verify and activate packs",
    "Day/shift closing",
    "Settle and return packs",
    "Games",
    "Pack history",
    "Lottery settlement",
    "Settings",
  ],
  "Financial and Payment Services": [
    "Dashboard",
    "Money order",
    "Bill pay",
    "Money transfer",
    "ATM",
    "Reports",
  ],
  "Tender Types": [
    "Dashboard",
    "Credit card",
    "EBT/Foodstamps",
    "Fleet cards",
    "Customer accounts",
    "Reports",
  ],
  "Banking Management": [
    "Dashboard",
    "Bank Ledger",
    "Fund transfer",
    "Reconcile",
    "Bank accounts",
  ],
  
  "Sales and Performance Reports": [
    "Net worth",
    "POS report",
    "Expenses CPA",
    "Other income CPA",
  ],

  "Inventory Valuation": [
    "Current stock",
    "Valuation",
  ],

  "Price Book": [
    "Statistics",
    "Items",
    "New arrivals",
    "Bulk update",
    "Promotions",
    "Discounts",
    "Inventory by item (current stock)",
    "Price groups",
    "Vendor management",
    "Rebate management",
  ],
  "Workweek": [
    "Employees",
    "Week Schedule",
    "Time & Attendance",
    "Time Off Request",
    "Time Off Approvals",
  ],
  "Payroll": [
    "Run Payroll",
    "Paystubs",
    "Direct Deposit",
    "Taxes & Filing",
    "Payroll Ledger",
  ],
};

// Optional 3rd-level pages: show a dropdown only when an entry exists for a sub-tab.
// Key format: "<Main Nav>|<Sub Nav>"
const subPageItems: Record<string, string[]> = {
  // Example:
  // "Grocery|Dashboard": ["Today", "Trends", "Alerts"],

  // All sub-sections now use internal tab pages — no dropdowns needed
  
};

const NavPillBar = ({ navItems, activeNav, onNavClick }: { navItems: string[]; activeNav: string; onNavClick: (nav: string) => void }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [activeNav]);

  return (
    <div
      ref={scrollRef}
      className="hidden lg:flex items-center gap-0.5 bg-nav-pill rounded-full px-2 py-1 relative overflow-x-auto scrollbar-hide max-w-full"
    >
      {navItems.map((item) => (
        <div key={item} ref={activeNav === item ? activeRef : undefined} className="relative flex flex-col items-center flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            disabled={disabledModules.has(item)}
            title={disabledModules.has(item)?"Temporarily disabled":undefined}
            onClick={() => onNavClick(item)}
            className={`whitespace-nowrap transition-all duration-200 ease-out px-3 h-7 text-[11px] rounded-full relative z-10 ${
              activeNav === item
                ? "bg-background text-foreground font-bold shadow-md -translate-y-2 scale-[1.08] ring-1 ring-border/40"
                : "text-background/90 hover:text-background hover:bg-background/10 hover:scale-[1.02] translate-y-0"
            }`}
          >
            {item}
          </Button>
        </div>
      ))}
    </div>
  );
};

export const DashboardHeader = ({ stores, activeNav, activeSubNav, onNavClick, onSubNavClick, onProfilePageClick, onLiveCounterClick, selectedStoreId, onStoreChange, onLogout, hideSubNav }: DashboardHeaderProps) => {
  const [storeSearch, setStoreSearch] = useState("");

  const allStores = stores.map(s => ({id: s.dgt_id, name: s.store_name, address: s.dgt_id, isParent: false}));
  const selectedStore = allStores.find(s => s.id === selectedStoreId);
  const filteredStores = allStores.filter(s =>
    s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
    s.address.toLowerCase().includes(storeSearch.toLowerCase())
  );

  return (
    <header className="bg-nav border-b border-dashboard-border">
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-dashboard-border/20 bg-background">
        <div className="flex items-center gap-3">
          <h2 className="text-foreground font-semibold text-sm">DGT Project</h2>
        </div>

        <div className="flex items-center gap-1">
          {/* Choose Store */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative p-2 rounded-full hover:bg-foreground/10 transition-colors" title="Choose Store">
                <Store className="w-4.5 h-4.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-72 bg-popover z-50 p-0">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">Choose Store</p>
                <p className="text-xs text-muted-foreground">Switch between your stores</p>
              </div>
              <div className="px-3 py-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Search stores..."
                    value={storeSearch}
                    onChange={(e) => setStoreSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              {filteredStores.length === 0 && (
                <div className="px-4 py-3 text-xs text-muted-foreground text-center">No stores found</div>
              )}
              {/* Parent Store */}
              {filteredStores.filter(s => s.isParent).map((store) => {
                const isActive = store.id === selectedStoreId;
                return (
                  <DropdownMenuItem
                    key={store.id}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer ${isActive ? "bg-primary/5" : ""}`}
                    onSelect={() => onStoreChange(store.id)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5 ring-1 ring-primary/30">
                      <Store className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-foreground">{store.name}</p>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">Parent</span>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {store.address}
                      </p>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-primary mt-1 flex-shrink-0" />}
                  </DropdownMenuItem>
                );
              })}
              {/* Child Stores */}
              {filteredStores.some(s => !s.isParent) && (
                <div className="px-4 pt-2 pb-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Stores</p>
                </div>
              )}
              {filteredStores.filter(s => !s.isParent).map((store) => {
                const isActive = store.id === selectedStoreId;
                return (
                  <DropdownMenuItem
                    key={store.id}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer ml-2 ${isActive ? "bg-primary/5" : ""}`}
                    onSelect={() => onStoreChange(store.id)}
                  >
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Store className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{store.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {store.address}
                      </p>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-primary mt-1 flex-shrink-0" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Feedback */}
          <button className="relative p-2 rounded-full hover:bg-foreground/10 transition-colors" title="Feedback">
            <MessageSquareText className="w-4.5 h-4.5 text-muted-foreground" />
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-full hover:bg-foreground/10 transition-colors" title="Notifications">
            <Bell className="w-4.5 h-4.5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
          </button>

          {/* Live Counter */}
          <button className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-foreground/10 transition-colors" title="Live Activity" onClick={() => onLiveCounterClick?.()}>
            
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-[11px] font-semibold text-foreground/80">Live Activity</span>
            
          </button>

          {/* Profile */}
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 cursor-pointer hover:bg-foreground/10 rounded-full px-3 py-1.5 transition-colors">
              <div className="w-9 h-9 rounded-full bg-foreground/10 flex items-center justify-center">
                <span className="text-foreground font-semibold text-xs">MA</span>
              </div>
              <span className="text-foreground text-sm font-medium">{selectedStore?.name ?? "Choose a store"}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-56 bg-popover z-50">
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onSelect={() => onProfilePageClick?.("Store Account Overview")}>
              <Building2 className="w-4 h-4" />
              <span>Store Account Overview</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onSelect={() => onProfilePageClick?.("Access & Integrations")}>
              <Settings className="w-4 h-4" />
              <span>Access & Integrations</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onSelect={() => onProfilePageClick?.("User Profile Management")}>
              <User className="w-4 h-4" />
              <span>User Profile Management</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onSelect={() => onProfilePageClick?.("Subscriptions & Billing")}>
              <CreditCard className="w-4 h-4" />
              <span>Subscriptions & Billings</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onSelect={() => onProfilePageClick?.("POS Settings")}>
              <Monitor className="w-4 h-4" />
              <span>POS Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onSelect={() => onProfilePageClick?.("Support & Training")}>
              <MessageSquareText className="w-4 h-4" />
              <span>Support &amp; Training</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive" onSelect={() => onLogout?.()}>
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>

      {/* Compact Navigation bar - pill style */}
      <nav className="px-2 sm:px-4 pt-3 pb-1 border-b border-dashboard-border/20 bg-background flex justify-center">
        {/* Mobile: dropdown menu */}
        <div className="flex lg:hidden w-full justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2 h-8 text-xs">
                <Menu className="w-4 h-4" />
                <span className="font-semibold">{activeNav}</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-64 max-h-80 overflow-y-auto z-50 bg-popover">
              {navItems.map((item) => (
                <DropdownMenuItem
                  key={item}
                  disabled={disabledModules.has(item)}
                  onSelect={() => onNavClick(item)}
                  className={activeNav === item ? "bg-primary text-primary-foreground font-semibold" : ""}
                >
                  {item}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop: scrollable pill bar */}
        <NavPillBar navItems={navItems} activeNav={activeNav} onNavClick={onNavClick} />
      </nav>

      {/* Secondary Navigation - Sub items */}
      {!hideSubNav && subNavItems[activeNav] && (
        <nav className="py-2 bg-background border-b border-dashboard-border/20 flex justify-center overflow-x-auto scrollbar-hide">
          <div className="inline-flex items-center gap-2 px-4 flex-nowrap">
            {subNavItems[activeNav].map((subItem) => (
              (() => {
                const pages = subPageItems[`${activeNav}|${subItem}`];
                const hasDropdown = Array.isArray(pages) && pages.length > 0;

                const isActive = activeSubNav === subItem;
                const pillClass = isActive
                  ? "whitespace-nowrap transition-colors px-3 py-1 h-7 text-[10px] rounded-md bg-primary text-primary-foreground font-semibold"
                  : "whitespace-nowrap transition-colors px-3 py-1 h-7 text-[10px] rounded-md bg-muted text-foreground hover:bg-foreground/15 hover:text-foreground";

                if (!hasDropdown) {
                  return (
                    <Button
                      key={subItem}
                      variant="ghost"
                      size="sm"
                      onClick={() => onSubNavClick?.(subItem)}
                      className={pillClass}
                    >
                      {subItem}
                    </Button>
                  );
                }

                return (
                  <DropdownMenu key={subItem}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className={pillClass}>
                        <span>{subItem}</span>
                        <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="bottom" className="z-50">
                      {pages.map((page) => {
                        // Special-case: nested options for Grocery → Inventory adjustment → Reduce inventory
                        const shouldNestReduceInventory =
                          activeNav === "Grocery" && subItem === "Inventory adjustment" && page === "Reduce inventory";

                        if (!shouldNestReduceInventory) {
                          return (
                            <DropdownMenuItem key={page} onSelect={() => onSubNavClick?.(subItem, page)}>
                              {page}
                            </DropdownMenuItem>
                          );
                        }

                        return (
                          <DropdownMenuSub key={page}>
                            <DropdownMenuSubTrigger>
                              <span>{page}</span>
                            </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="z-50">
                              <DropdownMenuItem onSelect={() => onSubNavClick?.(subItem, "Returnable")}>Returnable</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => onSubNavClick?.(subItem, "Non-returnable")}>Non-returnable</DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })()
            ))}
          </div>
        </nav>
      )}
    </header>
  );
};
