package com.dgt.backend.access;
import java.util.*;
import jakarta.servlet.http.*;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.*;
import org.springframework.web.servlet.config.annotation.*;
/** Enforce dedicated subpage endpoints independently of the browser navigation. */
@Configuration
public class PagePermissionInterceptor implements WebMvcConfigurer {
 private final PagePermissions pages;
 public PagePermissionInterceptor(PagePermissions pages){this.pages=pages;}
 static String[] modules(String path){
  String resource=path.split("/",2)[0];
  if(resource.startsWith("gas-"))return new String[]{"MODULE_GAS"};
  if(resource.startsWith("lottery-"))return new String[]{"MODULE_LOTTERY"};
  return switch(resource){
   case "purchase-orders","invoice-entry","reductions","grocery-reports" -> new String[]{"MODULE_GROCERY"};
   case "grocery-settings" -> new String[]{"MODULE_GROCERY","MODULE_PRICE_BOOK"};
   case "items","new-arrivals","promotions","discounts","price-groups","rebates","vendors","sales-statistics" -> new String[]{"MODULE_PRICE_BOOK"};
   case "current-stock" -> new String[]{"MODULE_INVENTORY_VALUATION","MODULE_PRICE_BOOK"};
   case "pos-reports" -> new String[]{"MODULE_SALES_REPORTS"};
   case "credit-card","ebt","fleet","tender-reports" -> new String[]{"MODULE_TENDERS"};
   case "workforce","employees","employee-access" -> new String[]{"MODULE_WORKWEEK"};
   case "daily-closing" -> new String[]{"MODULE_DAILY_CLOSING"};
   default -> new String[0];
  };
 }
 static String[] extended(String path,String method){
  boolean read=method.equals("GET");String resource=path.split("/",2)[0];
  if(resource.equals("daily-closing"))return read?new String[]{"DAILY_CLOSING_PAGE_DASHBOARD","DAILY_CLOSING_PAGE_STORE","DAILY_CLOSING_PAGE_REPORTS"}:new String[]{"DAILY_CLOSING_PAGE_STORE"};
  if(resource.equals("workforce")){
   if(read)return new String[]{"WORKWEEK_PAGE_WEEK_SCHEDULE","WORKWEEK_PAGE_TIME_OFF_REQUEST","WORKWEEK_PAGE_TIME_OFF_APPROVALS"};
   if(path.startsWith("workforce/shifts")||path.equals("workforce/week"))return new String[]{"WORKWEEK_PAGE_WEEK_SCHEDULE_SCHEDULE"};
   return new String[]{"WORKWEEK_PAGE_WEEK_SCHEDULE","WORKWEEK_PAGE_TIME_OFF_REQUEST","WORKWEEK_PAGE_TIME_OFF_APPROVALS"};
  }
  if(resource.equals("credit-card")){
   if(read)return new String[]{"TENDERS_PAGE_CREDIT_CARD"};
   if(path.contains("/settings")||path.contains("/processors"))return new String[]{"TENDERS_PAGE_CREDIT_CARD_SETTINGS"};
   return new String[]{path.endsWith("/fee")?"TENDERS_PAGE_CREDIT_CARD_BATCH_FEE":"TENDERS_PAGE_CREDIT_CARD_SETTLEMENT"};
  }
  if(resource.equals("vendors")){
   if(path.startsWith("vendors/pricing"))return new String[]{"PRICE_BOOK_PAGE_VENDOR_MANAGEMENT_PRICING"};
   if(path.startsWith("vendors/contracts"))return new String[]{"PRICE_BOOK_PAGE_VENDOR_MANAGEMENT_CONTRACTS"};
   if(path.equals("vendors/audit"))return new String[]{"PRICE_BOOK_PAGE_VENDOR_MANAGEMENT_AUDIT"};
   if(!read)return new String[]{"PRICE_BOOK_PAGE_VENDOR_MANAGEMENT_VENDORS"};
  }
  if(resource.equals("rebates")&&!read)return new String[]{path.contains("/claims")?"PRICE_BOOK_PAGE_REBATE_MANAGEMENT_CLAIMS_PAYMENTS":path.contains("/items")?"PRICE_BOOK_PAGE_REBATE_MANAGEMENT_REBATE_ITEMS":"PRICE_BOOK_PAGE_REBATE_MANAGEMENT_PROGRAMS"};
  return switch(resource){
   case "ebt" -> new String[]{"TENDERS_PAGE_EBT_FOODSTAMPS"};
   case "fleet" -> new String[]{"TENDERS_PAGE_FLEET_CARDS"};
   case "tender-reports" -> new String[]{"TENDERS_PAGE_REPORTS"};
   case "pos-reports" -> new String[]{"SALES_REPORTS_PAGE_POS_REPORT"};
   case "employees" -> new String[]{"WORKWEEK_PAGE_EMPLOYEES"};
   case "sales-statistics" -> new String[]{"PRICE_BOOK_PAGE_STATISTICS"};
   case "new-arrivals" -> new String[]{"PRICE_BOOK_PAGE_NEW_ARRIVALS"};
   case "items" -> read?new String[]{"PRICE_BOOK_PAGE_ITEMS","PRICE_BOOK_PAGE_BULK_UPDATE","PRICE_BOOK_PAGE_PROMOTIONS","PRICE_BOOK_PAGE_REBATE_MANAGEMENT","PRICE_BOOK_PAGE_PRICE_GROUPS"}:new String[]{"PRICE_BOOK_PAGE_ITEMS","PRICE_BOOK_PAGE_BULK_UPDATE"};
   case "promotions" -> new String[]{"PRICE_BOOK_PAGE_PROMOTIONS"};
   case "discounts" -> new String[]{read?"PRICE_BOOK_PAGE_DISCOUNTS":"PRICE_BOOK_PAGE_DISCOUNTS_REASONS"};
   case "price-groups" -> new String[]{"PRICE_BOOK_PAGE_PRICE_GROUPS"};
   case "vendors" -> new String[]{"PRICE_BOOK_PAGE_VENDOR_MANAGEMENT"};
   case "rebates" -> new String[]{"PRICE_BOOK_PAGE_REBATE_MANAGEMENT"};
   case "current-stock" -> new String[]{"INVENTORY_VALUATION_PAGE_CURRENT_STOCK","PRICE_BOOK_PAGE_INVENTORY_BY_ITEM_CURRENT_STOCK"};
   default -> new String[0];
  };
 }
 static String[] required(String path){
  if(path.equals("grocery-settings/defaults"))return new String[0]; // Price Book lookup; controller retains its own authorization.
  if(path.startsWith("gas-prices"))return new String[0];
  if(path.startsWith("lottery-closing/settings"))return new String[0];
  String resource=path.split("/",2)[0];
  return switch(resource){
   case "purchase-orders" -> new String[]{"GROCERY_PAGE_PURCHASE_ORDERS"};
   case "invoice-entry" -> new String[]{"GROCERY_PAGE_INVOICES"};
   case "reductions" -> new String[]{"GROCERY_PAGE_INVENTORY"};
   case "gas-deliveries" -> new String[]{"GAS_PAGE_DELIVERY"};
   case "gas-adjustments" -> new String[]{"GAS_PAGE_INVENTORY"};
   case "gas-tank-report" -> new String[]{"GAS_PAGE_TANK_REPORT"};
   case "lottery-deliveries" -> new String[]{"LOTTERY_PAGE_RECEIVED"};
   case "lottery-verification" -> new String[]{"LOTTERY_PAGE_ACTIVATE"};
   case "lottery-closing" -> new String[]{"LOTTERY_PAGE_CLOSING"};
   case "lottery-dispositions" -> new String[]{"LOTTERY_PAGE_RETURNS"};
   default -> new String[0];
  };
 }
 static String[] nested(String path,String method){
  boolean read=method.equals("GET");
  if(path.equals("lottery-verification/decision"))return new String[]{"LOTTERY_PAGE_ACTIVATE_VERIFY"};
  if(path.equals("lottery-verification/activation"))return new String[]{"LOTTERY_PAGE_ACTIVATE_ACTIVATE"};
  if(path.equals("lottery-deliveries")&&!read)return new String[]{"LOTTERY_PAGE_RECEIVED_ADD"};
  if(path.equals("gas-deliveries")&&!read)return new String[]{"GAS_PAGE_DELIVERY_ADD"};
  if(path.equals("gas-adjustments")&&!read)return new String[]{"GAS_PAGE_INVENTORY_NEW"};
  if(path.startsWith("invoice-entry")){
   if(path.endsWith("/approve"))return new String[]{"GROCERY_PAGE_INVOICES_APPROVALS"};
   if(!read||path.endsWith("/pending-pos"))return new String[]{"GROCERY_PAGE_INVOICES_EDIT"};
   return new String[]{"GROCERY_PAGE_INVOICES_EDIT","GROCERY_PAGE_INVOICES_APPROVALS","GROCERY_PAGE_INVOICES_VIEW"};
  }
  if(path.startsWith("purchase-orders")){
   if(!read)return new String[]{path.equals("purchase-orders")?"GROCERY_PAGE_PURCHASE_ORDERS_SUGGESTED":"GROCERY_PAGE_PURCHASE_ORDERS_HISTORY"};
   return new String[]{"GROCERY_PAGE_PURCHASE_ORDERS_SUGGESTED","GROCERY_PAGE_PURCHASE_ORDERS_HISTORY"};
  }
  if(path.startsWith("reductions/return-slips"))return new String[]{"GROCERY_PAGE_INVENTORY_RETURNABLE"};
  if(path.startsWith("reductions/transfers"))return new String[]{"GROCERY_PAGE_INVENTORY_TRANSFERS"};
  if(path.startsWith("reductions")&&!read)return new String[]{path.endsWith("/decision")?"GROCERY_PAGE_INVENTORY_APPROVALS":"GROCERY_PAGE_INVENTORY_ADJUSTMENT"};
  return new String[0];
 }
 @Override public void addInterceptors(InterceptorRegistry registry){registry.addInterceptor(new HandlerInterceptor(){
  @Override public boolean preHandle(HttpServletRequest request,HttpServletResponse response,Object handler){
   @SuppressWarnings("unchecked") var variables=(Map<String,String>)request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
   if(variables==null||!variables.containsKey("store"))return true;
   String prefix="/api/v1/access/stores/{store}/";
   String path=(String)request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
   if(path==null)return true;
   if(!path.startsWith(prefix))return true;
   String[] modules=modules(path.substring(prefix.length()));if(modules.length>0)pages.requireAny(variables.get("store"),modules);
   String[] extended=extended(path.substring(prefix.length()),request.getMethod());if(extended.length>0)pages.requireAny(variables.get("store"),extended);
   String[] required=required(path.substring(prefix.length()));if(required.length>0)pages.requireAny(variables.get("store"),required);
   String[] nested=nested(path.substring(prefix.length()),request.getMethod());if(nested.length>0)pages.requireAny(variables.get("store"),nested);
   return true;
  }
 }).addPathPatterns("/api/v1/access/stores/**");}
}
