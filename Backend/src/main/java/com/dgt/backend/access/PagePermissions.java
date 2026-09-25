package com.dgt.backend.access;
import java.util.*;
import org.springframework.stereotype.Component;
/** Page access is an additional gate; operation/approval permissions remain authoritative. */
@Component
public class PagePermissions {
 public record Section(String code,String label,boolean defaultAllowed){}
 public static final List<Section> SECTIONS=List.of(
  new Section("MODULE_DAILY_CLOSING","Everyday Closing Reports",false),
  new Section("MODULE_GROCERY","Grocery",true),
  new Section("MODULE_GAS","Gas",true),
  new Section("MODULE_LOTTERY","Lottery",true),
  new Section("MODULE_FINANCIAL","Financial and Payment Services",false),
  new Section("MODULE_TENDERS","Tender Types",false),
  new Section("MODULE_BANKING","Banking Management",false),
  new Section("MODULE_SALES_REPORTS","Sales and Performance Reports",false),
  new Section("MODULE_INVENTORY_VALUATION","Inventory Valuation",false),
  new Section("MODULE_PRICE_BOOK","Price Book",true),
  new Section("MODULE_WORKWEEK","Workweek",false),
  new Section("MODULE_PAYROLL","Payroll",false));
 public static boolean sectionAllowed(Map<String,Boolean> rights,String code){return rights.getOrDefault(code,SECTIONS.stream().filter(s->s.code().equals(code)).anyMatch(Section::defaultAllowed));}
 public record Page(String code,String label,String group,boolean implemented){}
 public record Child(String code,String label,String parent,String tab,boolean implemented){ public Child(String code,String label,String parent,String tab){this(code,label,parent,tab,true);} }
 public static final List<Page> PAGES=java.util.stream.Stream.concat(ExtendedPagePermissions.PAGES.stream(),List.of(
  new Page("GROCERY_PAGE_INVENTORY","Inventory adjustment","Grocery Permissions",true),
  new Page("GROCERY_PAGE_PURCHASE_ORDERS","Purchase Orders","Grocery Permissions",true),
  new Page("GROCERY_PAGE_INVOICES","Edit & view invoices","Grocery Permissions",true),
  new Page("GAS_PAGE_DELIVERY","Delivery","Gas Permissions",true),
  new Page("GAS_PAGE_INVOICES","Gas invoices & payments","Gas Permissions",false),
  new Page("GAS_PAGE_INVENTORY","Inventory adjustment","Gas Permissions",true),
  new Page("GAS_PAGE_TANK_REPORT","Tank report","Gas Permissions",true),
  new Page("LOTTERY_PAGE_RECEIVED","Received and confirm delivery","Lottery Permissions",true),
  new Page("LOTTERY_PAGE_ACTIVATE","Verify and activate packs","Lottery Permissions",true),
  new Page("LOTTERY_PAGE_CLOSING","Day/shift closing","Lottery Permissions",true),
  new Page("LOTTERY_PAGE_RETURNS","Settle and return packs","Lottery Permissions",true)).stream()).toList();
 public static final List<Child> CHILDREN=java.util.stream.Stream.concat(ExtendedPagePermissions.CHILDREN.stream(),List.of(
  new Child("GROCERY_PAGE_INVENTORY_ADJUSTMENT","Inventory Adjustment","GROCERY_PAGE_INVENTORY","adjustment"),
  new Child("GROCERY_PAGE_INVENTORY_APPROVALS","Approvals","GROCERY_PAGE_INVENTORY","approvals"),
  new Child("GROCERY_PAGE_INVENTORY_EXPIRED","Expired & Expiring Items","GROCERY_PAGE_INVENTORY","expired"),
  new Child("GROCERY_PAGE_INVENTORY_RETURNABLE","Reduce Inventory (Returnable)","GROCERY_PAGE_INVENTORY","returnable"),
  new Child("GROCERY_PAGE_INVENTORY_TRANSFERS","Store to Store Transfers","GROCERY_PAGE_INVENTORY","transfers"),
  new Child("GROCERY_PAGE_INVENTORY_SHRINKAGE","Inventory Shrinkage & Waste","GROCERY_PAGE_INVENTORY","shrinkage"),
  new Child("GROCERY_PAGE_PURCHASE_ORDERS_SUGGESTED","Suggested Order Guide","GROCERY_PAGE_PURCHASE_ORDERS","suggested"),
  new Child("GROCERY_PAGE_PURCHASE_ORDERS_HISTORY","PO History","GROCERY_PAGE_PURCHASE_ORDERS","history"),
  new Child("GROCERY_PAGE_INVOICES_EDIT","Edit Invoice","GROCERY_PAGE_INVOICES","edit"),
  new Child("GROCERY_PAGE_INVOICES_APPROVALS","Invoice Approvals","GROCERY_PAGE_INVOICES","approvals"),
  new Child("GROCERY_PAGE_INVOICES_VIEW","View Invoice","GROCERY_PAGE_INVOICES","view"),
  new Child("GAS_PAGE_DELIVERY_ADD","Add Delivery","GAS_PAGE_DELIVERY",null),
  new Child("GAS_PAGE_INVENTORY_NEW","New Adjustment","GAS_PAGE_INVENTORY",null),
  new Child("GAS_PAGE_INVOICES_PAYMENT","Record Payment","GAS_PAGE_INVOICES",null),
  new Child("LOTTERY_PAGE_RECEIVED_ADD","Add Received Receipt","LOTTERY_PAGE_RECEIVED",null),
  new Child("LOTTERY_PAGE_ACTIVATE_VERIFY","Verify Packs","LOTTERY_PAGE_ACTIVATE","verify"),
  new Child("LOTTERY_PAGE_ACTIVATE_ACTIVATE","Activate Packs","LOTTERY_PAGE_ACTIVATE","activate"),
  new Child("LOTTERY_PAGE_RETURNS_SETTLE","Settle Packs","LOTTERY_PAGE_RETURNS","settle"),
  new Child("LOTTERY_PAGE_RETURNS_RETURN","Return Packs","LOTTERY_PAGE_RETURNS","return")).stream()).toList();
 private final ScopedAccess access;
 public PagePermissions(ScopedAccess access){this.access=access;}
 public Map<String,Boolean> context(String store){
  access.assigned(store);
  boolean admin=access.admin(access.user(),access.company(store));
  return evaluate(store,access.user(),admin,true);
 }
 public Map<String,Boolean> evaluate(String store,long user,boolean admin,boolean includeOverrides){
  var result=new LinkedHashMap<String,Boolean>();
  var rows=admin?List.<Map<String,Object>>of():access.db.queryForList("SELECT r.role_type_id,p.permission_code,p.allowed FROM user_roles r JOIN role_types t USING(role_type_id) LEFT JOIN store_role_permissions p ON p.dgt_id=r.dgt_id AND p.role_type_id=r.role_type_id WHERE r.user_id=? AND r.dgt_id=? AND r.is_active AND t.is_active AND upper(t.role_type_name) IN ('MANAGER','CASHIER','ACCOUNTANT')",user,store);
  var byRole=new HashMap<Object,Map<String,Boolean>>();
  for(var row:rows)byRole.computeIfAbsent(row.get("role_type_id"),k->new HashMap<>()).put((String)row.get("permission_code"),Boolean.TRUE.equals(row.get("allowed")));
  if(includeOverrides&&!byRole.isEmpty()){
   var overrides=access.db.queryForList("SELECT kv.key,kv.value::boolean AS allowed FROM user_store_permission_overrides o CROSS JOIN LATERAL jsonb_each_text(o.overrides) kv WHERE o.dgt_id=? AND o.user_id=?",store,user);
   for(var role:byRole.values())for(var override:overrides)role.put((String)override.get("key"),Boolean.TRUE.equals(override.get("allowed")));
  }
  for(Section section:SECTIONS)result.put(section.code(),admin||byRole.values().stream().anyMatch(r->sectionAllowed(r,section.code())));
  for(Page page:PAGES){
   String section="MODULE_"+page.code().split("_PAGE_")[0];
   var tabs=CHILDREN.stream().filter(c->c.parent().equals(page.code())&&c.tab()!=null&&c.implemented()).toList();
   boolean visible=admin||page.implemented()&&byRole.values().stream().anyMatch(r->sectionAllowed(r,section)&&r.getOrDefault(page.code(),true)&&(tabs.isEmpty()||tabs.stream().anyMatch(c->r.getOrDefault(c.code(),true))));
   result.put(page.code(),visible);
   for(Child child:CHILDREN.stream().filter(c->c.parent().equals(page.code())).toList())
    result.put(child.code(),admin||page.implemented()&&child.implemented()&&byRole.values().stream().anyMatch(r->sectionAllowed(r,section)&&r.getOrDefault(page.code(),true)&&r.getOrDefault(child.code(),true)));
  }
  return result;
 }
 public void requireAny(String store,String... codes){var rights=context(store);if(Arrays.stream(codes).noneMatch(c->Boolean.TRUE.equals(rights.get(c))))throw access.denied();}
}
