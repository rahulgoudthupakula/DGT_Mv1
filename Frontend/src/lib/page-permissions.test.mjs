import {extendedPages} from './extended-page-permissions.ts';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canNavigatePage,canNavigateSection,firstPermittedPage} from './page-permissions.ts';
const cashier={admin:false,pages:{...Object.fromEntries(extendedPages.map(p=>[p.code,p.implemented])),MODULE_LOTTERY:true,MODULE_GROCERY:true,MODULE_GAS:true,MODULE_PRICE_BOOK:true,LOTTERY_PAGE_RECEIVED:true,LOTTERY_PAGE_ACTIVATE:false,LOTTERY_PAGE_CLOSING:true}};
test('cashier sees permitted lottery pages, not excluded or disabled pages',()=>{
 for(const name of ['Dashboard','Games','Pack history','Lottery settlement','Settings','Verify and activate packs'])assert.equal(canNavigatePage(cashier,'Lottery',name),false,name);
 assert.equal(canNavigatePage(cashier,'Lottery','Received and confirm delivery'),true);
 assert.equal(firstPermittedPage(cashier,'Lottery'),'Received and confirm delivery');
});
test('revoked saved selection resolves to the next permitted page',()=>{
 const changed={...cashier,pages:{...cashier.pages,LOTTERY_PAGE_RECEIVED:false}};
 assert.equal(canNavigatePage(changed,'Lottery','Received and confirm delivery'),false);
 assert.equal(firstPermittedPage(changed,'Lottery'),'Day/shift closing');
});
test('empty section and loading permissions stay hidden',()=>{
 assert.equal(canNavigateSection(undefined,'Lottery'),false);
 assert.equal(canNavigateSection({admin:false,pages:{}},'Lottery'),false);
 assert.equal(firstPermittedPage({admin:false,pages:{}},'Lottery'),null);
});
test('admin retains excluded pages and layout previews',()=>{
 const admin={admin:true,pages:{}};
 assert.equal(canNavigatePage(admin,'Lottery','Dashboard'),true);
 assert.equal(firstPermittedPage(admin,'Lottery'),'Dashboard');
 assert.equal(canNavigateSection(admin,'Gas'),true);
});
test('excluded grocery and gas pages and unconnected previews are hidden for staff',()=>{
 for(const name of ['Dashboard','Reports','Non-scanned item','Settings'])assert.equal(canNavigatePage(cashier,'Grocery',name),false);
 for(const name of ['Dashboard','Gas statistics','Reports','Fuel expenses','Gas price','Settings'])assert.equal(canNavigatePage(cashier,'Gas',name),false);
 assert.equal(canNavigatePage({admin:false,pages:{GAS_PAGE_INVOICES:true}},'Gas','Gas invoices & payments'),false);
});
test('cashier has only the three permitted operational sections',()=>{
 const user={...cashier,roles:['CASHIER'],pages:{...cashier.pages,GROCERY_PAGE_INVENTORY:true,GAS_PAGE_DELIVERY:true},modules:{PRICE_BOOK:{view:true}}};
 const menu=['Home','Everyday Closing Reports','Grocery','Gas','Lottery','Tender Types','Banking Management','Sales and Performance Reports','Inventory Valuation','Price Book','Workweek','Payroll'];
 assert.deepEqual(menu.filter(nav=>canNavigateSection(user,nav)),['Grocery','Gas','Lottery']);
 assert.equal(canNavigatePage(user,'Home','Dashboard'),false);
});
test('manager gets Price Book only with the explicit module grant',()=>{
 const manager={...cashier,roles:['MANAGER'],modules:{PRICE_BOOK:{view:false}}};
 assert.equal(canNavigateSection(manager,'Price Book'),false);
 assert.equal(canNavigateSection({...manager,modules:{PRICE_BOOK:{view:true}}},'Price Book'),true);
 for(const nav of ['Home','Payroll','Workweek','Everyday Closing Reports'])assert.equal(canNavigateSection(manager,nav),false);
 assert.equal(canNavigatePage(manager,'Lottery','Verify and activate packs'),false);
});

test('parent module denial overrides enabled page and hides section',()=>{
 const denied={...cashier,pages:{...cashier.pages,MODULE_LOTTERY:false}};
 assert.equal(canNavigateSection(denied,'Lottery'),false);
 assert.equal(canNavigatePage(denied,'Lottery','Received and confirm delivery'),false);
 assert.equal(firstPermittedPage(denied,'Lottery'),null);
});
test('manager module grants expose enabled sections only',()=>{
 const manager={...cashier,roles:['MANAGER'],pages:{...cashier.pages,MODULE_DAILY_CLOSING:true,MODULE_WORKWEEK:true,MODULE_PAYROLL:false}};
 assert.equal(canNavigateSection(manager,'Everyday Closing Reports'),true);
 assert.equal(firstPermittedPage(manager,'Workweek'),'Week Schedule');
 assert.equal(canNavigateSection(manager,'Payroll'),false);
 assert.equal(canNavigatePage(manager,'Payroll','Run Payroll'),false);
});

test('cashier granted Workweek lands on schedule without admin employee access',()=>{
 const employee={...cashier,roles:['CASHIER'],pages:{...cashier.pages,MODULE_WORKWEEK:true}};
 assert.equal(canNavigateSection(employee,'Workweek'),true);
 assert.equal(firstPermittedPage(employee,'Workweek'),'Week Schedule');
 assert.equal(canNavigatePage(employee,'Workweek','Employees'),false);
 assert.equal(canNavigatePage(employee,'Workweek','Time Off Approvals'),false);
 assert.equal(canNavigatePage(employee,'Workweek','Time Off Request'),true);
});

test('new page permissions hide denied pages and choose an allowed fallback',()=>{
 const user={...cashier,roles:['MANAGER'],pages:{...cashier.pages,MODULE_TENDERS:true,TENDERS_PAGE_CREDIT_CARD:false,TENDERS_PAGE_EBT_FOODSTAMPS:true}};
 assert.equal(canNavigatePage(user,'Tender Types','Credit card'),false);
 assert.equal(firstPermittedPage(user,'Tender Types'),'EBT/Foodstamps');
 const noPages={...user,pages:{...user.pages,TENDERS_PAGE_EBT_FOODSTAMPS:false,TENDERS_PAGE_FLEET_CARDS:false,TENDERS_PAGE_REPORTS:false}};
 assert.equal(canNavigateSection(noPages,'Tender Types'),false);
});
test('unfinished module pages remain hidden despite an explicit grant',()=>{
 const user={...cashier,pages:{...cashier.pages,MODULE_PAYROLL:true,PAYROLL_PAGE_RUN_PAYROLL:true}};
 assert.equal(canNavigatePage(user,'Payroll','Run Payroll'),false);
 assert.equal(canNavigateSection(user,'Payroll'),false);
});
