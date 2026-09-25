import {extendedPages,extendedChildren} from "./extended-page-permissions.ts";
export const sectionPermissions: Record<string,string> = {
 "Everyday Closing Reports":"MODULE_DAILY_CLOSING",
 "Grocery":"MODULE_GROCERY",
 "Gas":"MODULE_GAS",
 "Lottery":"MODULE_LOTTERY",
 "Financial and Payment Services":"MODULE_FINANCIAL",
 "Tender Types":"MODULE_TENDERS",
 "Banking Management":"MODULE_BANKING",
 "Sales and Performance Reports":"MODULE_SALES_REPORTS",
 "Inventory Valuation":"MODULE_INVENTORY_VALUATION",
 "Price Book":"MODULE_PRICE_BOOK",
 "Workweek":"MODULE_WORKWEEK",
 "Payroll":"MODULE_PAYROLL",
};
export const pagePermissions: Record<string, Record<string,string>> = {
  "Grocery": {
    "Inventory adjustment": "GROCERY_PAGE_INVENTORY",
    "Purchase Orders": "GROCERY_PAGE_PURCHASE_ORDERS",
    "Edit & view invoices": "GROCERY_PAGE_INVOICES"
  },
  "Gas": {
    "Delivery": "GAS_PAGE_DELIVERY",
    "Gas invoices & payments": "GAS_PAGE_INVOICES",
    "Inventory adjustment": "GAS_PAGE_INVENTORY",
    "Tank report": "GAS_PAGE_TANK_REPORT"
  },
  "Lottery": {
    "Received and confirm delivery": "LOTTERY_PAGE_RECEIVED",
    "Verify and activate packs": "LOTTERY_PAGE_ACTIVATE",
    "Day/shift closing": "LOTTERY_PAGE_CLOSING",
    "Settle and return packs": "LOTTERY_PAGE_RETURNS"
  }
};
for(const page of extendedPages)(pagePermissions[page.module]??={})[page.label]=page.code;
export function pagePermission(nav: string, subpage: string | null) {
 return pagePermissions[nav]?.[subpage === "Customized order guide" ? "Purchase Orders" : subpage ?? "Dashboard"];
}
export const childPermissions: Record<string,Record<string,string>> = {
  "GROCERY_PAGE_PURCHASE_ORDERS": {
    "suggested": "GROCERY_PAGE_PURCHASE_ORDERS_SUGGESTED",
    "history": "GROCERY_PAGE_PURCHASE_ORDERS_HISTORY"
  },
  "LOTTERY_PAGE_ACTIVATE": {
    "verify": "LOTTERY_PAGE_ACTIVATE_VERIFY",
    "activate": "LOTTERY_PAGE_ACTIVATE_ACTIVATE"
  },
  "LOTTERY_PAGE_RETURNS": {
    "settle": "LOTTERY_PAGE_RETURNS_SETTLE",
    "return": "LOTTERY_PAGE_RETURNS_RETURN"
  },
  "GROCERY_PAGE_INVENTORY": {
    "adjustment": "GROCERY_PAGE_INVENTORY_ADJUSTMENT",
    "approvals": "GROCERY_PAGE_INVENTORY_APPROVALS",
    "expired": "GROCERY_PAGE_INVENTORY_EXPIRED",
    "returnable": "GROCERY_PAGE_INVENTORY_RETURNABLE",
    "transfers": "GROCERY_PAGE_INVENTORY_TRANSFERS",
    "shrinkage": "GROCERY_PAGE_INVENTORY_SHRINKAGE"
  },
  "GROCERY_PAGE_INVOICES": {
    "edit": "GROCERY_PAGE_INVOICES_EDIT",
    "approvals": "GROCERY_PAGE_INVOICES_APPROVALS",
    "view": "GROCERY_PAGE_INVOICES_VIEW"
  }
};

for(const child of extendedChildren)(childPermissions[child.parent]??={})[child.tab]=child.code;
// Use the same navigation rules for menus, section defaults and restored routes.
type NavigationAccess = {admin:boolean;roles?:string[];pages:Record<string,boolean>;modules?:Record<string,{view:boolean}>};
const previewOnlyPages = new Set(['GAS_PAGE_INVOICES',...extendedPages.filter(p=>!p.implemented).map(p=>p.code)]);
export function canNavigatePage(access:NavigationAccess|undefined, nav:string, subpage:string|null) {
 if (access?.admin) return true;
 if(nav==='Price Book'&&!(access?.roles?.includes('MANAGER')&&access.modules?.PRICE_BOOK?.view))return false;
 if(nav==='Workweek'&&(subpage==='Employees'||(subpage==='Time Off Approvals'&&!access?.roles?.includes('MANAGER'))))return false;
 if (!pagePermissions[nav]) return canNavigateSection(access,nav);
 if(access?.pages?.[sectionPermissions[nav]]!==true)return false;
 const code=pagePermission(nav,subpage);
 return !!code && !previewOnlyPages.has(code) && access?.pages?.[code]===true;
}
export function firstPermittedPage(access:NavigationAccess|undefined, nav:string):string|null {
 if(access?.admin&&['Grocery','Gas','Lottery'].includes(nav))return 'Dashboard';
 if(access?.admin && pagePermissions[nav])return 'Dashboard' in pagePermissions[nav]?'Dashboard':Object.keys(pagePermissions[nav])[0];
 const defaults:Record<string,string>={'Everyday Closing Reports':'Dashboard','Financial and Payment Services':'Dashboard','Tender Types':'Credit card','Banking Management':'Bank Ledger','Sales and Performance Reports':'POS report','Inventory Valuation':'Current stock','Price Book':'Statistics','Workweek':access?.admin?'Employees':'Week Schedule','Payroll':'Run Payroll'};
 if(!pagePermissions[nav]&&canNavigateSection(access,nav))return defaults[nav]??null;
 return Object.keys(pagePermissions[nav]??{}).find(page=>canNavigatePage(access,nav,page))??null;
}
export function canNavigateSection(access:NavigationAccess|undefined,nav:string) {
 if(access?.admin)return true;
 if(!access||access.pages?.[sectionPermissions[nav]]!==true)return false;
 if(pagePermissions[nav])return firstPermittedPage(access,nav)!==null;
 // Only explicitly granted sections are exposed. A cashier assignment alone
 // never unlocks Price Book or unrelated top-level navigation.
 return nav==='Price Book' ? access.roles?.includes('MANAGER')===true && access.modules?.PRICE_BOOK?.view===true : !!sectionPermissions[nav];
}
