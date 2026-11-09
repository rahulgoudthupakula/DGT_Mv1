package com.dgt.backend.grocery.reports;

import java.math.*;
import java.util.*;

/** Pure decimal report aggregation. Null amounts remain unknown, never an invented zero. */
public final class GroceryReportSummaries {
 private GroceryReportSummaries() {}
 static BigDecimal n(Object x){return x==null?BigDecimal.ZERO:new BigDecimal(x.toString());}
 static Map<String,Object> map(Object... pairs){var m=new LinkedHashMap<String,Object>();for(int i=0;i<pairs.length;i+=2)m.put((String)pairs[i],pairs[i+1]);return m;}
 static BigDecimal sum(List<Map<String,Object>> rows,String key){return rows.stream().map(r->n(r.get(key))).reduce(BigDecimal.ZERO,BigDecimal::add);}
 static BigDecimal knownSum(List<Map<String,Object>> rows,String key){return rows.stream().anyMatch(r->r.get(key)==null)?null:sum(rows,key);}
 static BigDecimal divide(Object a,Object b){return a==null||b==null||n(b).signum()==0?null:n(a).divide(n(b),10,RoundingMode.HALF_UP);}
 static Object percent(Object a,Object b){var d=divide(a,b);return d==null?null:d.multiply(BigDecimal.valueOf(100));}
 static List<Map<String,Object>> filter(List<Map<String,Object>> rows,String key,String value){return rows.stream().filter(r->Objects.equals(r.get(key),value)).toList();}
 public static List<Map<String,Object>> groups(List<Map<String,Object>> rows,String start,long days,boolean category){
  var grouped=new LinkedHashMap<String,List<Map<String,Object>>>();
  for(var r:rows)grouped.computeIfAbsent(r.get(category?"category":"id").toString(),k->new ArrayList<>()).add(r);
  var result=new ArrayList<Map<String,Object>>();
  for(var entry:grouped.entrySet()){
   var all=entry.getValue();var current=all.stream().filter(r->r.get("date").toString().compareTo(start)>=0).toList();var prior=all.stream().filter(r->r.get("date").toString().compareTo(start)<0).toList();
   var row=new LinkedHashMap<String,Object>(all.getFirst());var units=sum(current,"unitsSold");var previous=sum(prior,"unitsSold");var sales=sum(current,"netSales");
   row.putAll(map("name",category?entry.getKey():row.get("name"),"unitsSold",units,"netSales",sales,"previousUnits",previous,"itemCount",all.stream().map(r->r.get("id")).distinct().count(),"avgPrice",units.signum()==0?BigDecimal.ZERO:divide(sales,units),"velocity",divide(units,days),"prevVelocity",divide(previous,days),"trend",units.compareTo(previous)>0?"up":units.compareTo(previous)<0?"down":"flat","adjustments",0,"highlight",units.signum()==0?"zero":previous.signum()>0&&divide(units,previous).compareTo(n("0.7"))<0?"drop":previous.signum()>0&&divide(units.subtract(previous).abs(),previous).compareTo(n("0.05"))<0&&divide(units,days).compareTo(n("10"))>0?"consistent":null,"dailySales",current.stream().map(r->map("date",r.get("date"),"units",r.get("unitsSold"),"sales",r.get("netSales"))).toList()));result.add(row);
  }
  var total=sum(result,"netSales");for(var r:result)r.put("percentOfTotal",total.signum()>0?n(percent(r.get("netSales"),total)).setScale(1,RoundingMode.HALF_UP):BigDecimal.ZERO);
  return result;
 }
 public static Map<String,Object> sales(List<Map<String,Object>> rows,String start,long days){return map("items",groups(rows,start,days,false),"categories",groups(rows,start,days,true));}
 public static Map<String,Object> stock(List<Map<String,Object>> items){
  var categories=new ArrayList<Map<String,Object>>();
  for(String category:items.stream().map(r->r.get("category").toString()).distinct().toList()){
   var selected=filter(items,"category",category);var valued=new ArrayList<Map<String,Object>>();
   for(var i:selected)valued.add(map("qty",i.get("qty"),"cost",i.get("qty")==null||i.get("cost")==null?null:n(i.get("qty")).multiply(n(i.get("cost"))),"retail",i.get("qty")==null||i.get("retail")==null?null:n(i.get("qty")).multiply(n(i.get("retail")))));
   var qty=knownSum(valued,"qty");var cost=knownSum(valued,"cost");var retail=knownSum(valued,"retail");
   categories.add(map("category",category,"onHandQty",qty,"inventoryValue",cost,"inventoryValueRetail",retail,"avgCost",divide(cost,qty),"avgRetail",divide(retail,qty),"potentialMargin",cost==null||retail==null?null:percent(retail.subtract(cost),retail),"actualInventory",null,"variation",null,"ratio",divide(cost,retail)));
  }
  var cost=knownSum(categories,"inventoryValue");var retail=knownSum(categories,"inventoryValueRetail");
  for(var r:categories)r.put("pctOfTotal",percent(r.get("inventoryValue"),cost));
  return map("categories",categories,"summary",map("totalQty",knownSum(categories,"onHandQty"),"totalValue",cost,"totalRetailValue",retail,"totalActual",null,"totalVar",null,"ratio",divide(cost,retail)));
 }
 public static Map<String,Object> profit(List<Map<String,Object>> rows,String start,long days,String search){
  var current=rows.stream().filter(r->r.get("date").toString().compareTo(start)>=0&&(search==null||r.get("name").toString().toLowerCase(Locale.ROOT).contains(search.toLowerCase(Locale.ROOT))||r.get("scanCode").toString().contains(search))).toList();
  var items=groups(current,start,days,false);var categories=groups(current,start,days,true);
  // Historical cost snapshots are not available: preserve unavailable profit rather than substituting current cost.
  for(var r:items)r.putAll(map("avgCost",null,"cogs",null,"grossProfit",null,"margin",null,"rebateImpact",null,"trend","flat"));
  for(var r:categories)r.putAll(map("cogs",null,"grossProfit",null,"margin",null,"rebateImpact",null,"trend","flat"));
  var daily=new ArrayList<Map<String,Object>>();
  for(String date:current.stream().map(r->r.get("date").toString()).distinct().sorted().toList()){
   var selected=filter(current,"date",date);var byCategory=new LinkedHashMap<String,Object>();for(var r:selected)byCategory.put(r.get("category").toString(),null);
   daily.add(map("date",date,"day",java.time.LocalDate.parse(date).getDayOfWeek().getDisplayName(java.time.format.TextStyle.SHORT,Locale.US),"categories",byCategory,"total",null,"totalTax",sum(selected,"tax"),"sales",sum(selected,"netSales"),"purchases",null,"netCashFlow",null));
  }
  return map("items",items,"categories",categories,"days",daily,"dailyTotals",totals(daily,"sales","purchases","netCashFlow"),"categoryNames",categories.stream().map(r->r.get("name")).toList(),"summary",map("netSales",sum(items,"netSales"),"cogs",items.isEmpty()?BigDecimal.ZERO:null,"grossProfit",items.isEmpty()?BigDecimal.ZERO:null,"grossMargin",null));
 }
 public static Map<String,Object> ratio(List<Map<String,Object>> sales,List<Map<String,Object>> invoices,String start,String end){
  var current=sales.stream().filter(r->r.get("date").toString().compareTo(start)>=0).toList();var purchases=invoices.stream().filter(r->r.get("dateKey").toString().compareTo(end)<=0).toList();
  var dates=new TreeSet<String>();current.forEach(r->dates.add(r.get("date").toString()));purchases.forEach(r->dates.add(r.get("dateKey").toString()));
  return map("totalSales",sum(current,"netSales"),"totalPurchases",sum(purchases,"purchaseAmount"),"ratio",divide(sum(current,"netSales"),sum(purchases,"purchaseAmount")),"trend",dates.stream().map(d->map("date",d,"ratio",divide(sum(filter(current,"date",d),"netSales"),sum(filter(purchases,"dateKey",d),"purchaseAmount")))).toList());
 }
 public static Map<String,Object> totals(List<Map<String,Object>> rows,String... keys){var result=new LinkedHashMap<String,Object>();for(String key:keys)result.put(key,knownSum(rows,key));return result;}
 public static Map<String,Object> cigarettes(List<Map<String,Object>> sales,List<Map<String,Object>> stock,List<Map<String,Object>> movements,List<Map<String,Object>> purchases,String start){
  var items=stock.stream().filter(r->r.get("department").toString().trim().equalsIgnoreCase("cigarettes")).toList();
  var ids=items.stream().map(r->r.get("id")).collect(java.util.stream.Collectors.toSet());
  var sold=sales.stream().filter(r->ids.contains(r.get("id"))&&r.get("date").toString().compareTo(start)>=0).toList();
  var moves=movements.stream().filter(r->ids.contains(r.get("productId"))).toList();var lines=purchases.stream().filter(r->ids.contains(r.get("productId"))).toList();
  var dates=new TreeSet<String>();sold.forEach(r->dates.add(r.get("date").toString()));moves.forEach(r->dates.add(r.get("date").toString()));lines.forEach(r->dates.add(r.get("dateKey").toString()));
  var result=new ArrayList<Map<String,Object>>();var summary=new ArrayList<Map<String,Object>>();
  for(String date:dates){
   var daily=new ArrayList<Map<String,Object>>();
   for(Object brand:items.stream().map(r->r.get("brand")).distinct().toList()){
    var selected=items.stream().filter(r->Objects.equals(r.get("brand"),brand)).toList();var brandIds=selected.stream().map(r->r.get("id")).collect(java.util.stream.Collectors.toSet());
    var brandSales=filter(sold,"date",date).stream().filter(r->brandIds.contains(r.get("id"))).toList();
    var packIds=selected.stream().filter(r->unit(r).equals("pack")).map(r->r.get("id")).toList();var cartonIds=selected.stream().filter(r->unit(r).equals("carton")).map(r->r.get("id")).toList();
    var count=knownSum(selected,"qty");var later=sum(moves.stream().filter(r->brandIds.contains(r.get("productId"))&&r.get("date").toString().compareTo(date)>0).toList(),"qty");
    var row=map("date",java.time.LocalDate.parse(date).format(java.time.format.DateTimeFormatter.ofPattern("MM/dd/yyyy")),"dateKey",date,"day",java.time.LocalDate.parse(date).getDayOfWeek().getDisplayName(java.time.format.TextStyle.SHORT,Locale.US),"brand",brand,
      "soldPack",sum(brandSales.stream().filter(r->packIds.contains(r.get("id"))).toList(),"unitsSold"),"soldCarton",sum(brandSales.stream().filter(r->cartonIds.contains(r.get("id"))).toList(),"unitsSold"),
      "purchase",sum(filter(lines,"dateKey",date).stream().filter(r->brandIds.contains(r.get("productId"))).toList(),"receivedQty"),
      "adjustments",sum(filter(moves,"date",date).stream().filter(r->brandIds.contains(r.get("productId"))&&!Set.of("PURCHASE","SALE","DELIVERY").contains(r.get("type"))).toList(),"qty"),
      "systemCount",count==null?null:count.subtract(later),"manualCount",null,"missingExtra",null);daily.add(row);result.add(row);
   }
   var row=new LinkedHashMap<String,Object>(daily.getFirst());row.putAll(totals(daily,"soldPack","soldCarton","purchase","adjustments","systemCount"));summary.addFirst(row);
  }
  var valuation=stock(items);@SuppressWarnings("unchecked") var values=(Map<String,Object>)valuation.get("summary");
  return map("rows",result,"summary",summary,"cost",values.get("totalValue"),"retail",values.get("totalRetailValue"),"missingUnits",items.stream().anyMatch(r->!Set.of("pack","carton").contains(unit(r))),"packs",sum(items.stream().filter(r->unit(r).equals("pack")).toList(),"qty"),"cartons",sum(items.stream().filter(r->unit(r).equals("carton")).toList(),"qty"));
 }
 private static String unit(Map<String,Object> row){return Objects.toString(row.get("unit"),"").toLowerCase(Locale.ROOT).replaceAll("s$","");}

 @SuppressWarnings("unchecked")
 public static Map<String,Object> cigaretteWindow(Map<String,Object> report,java.time.LocalDate start,java.time.LocalDate end,boolean latest){
  var all=(List<Map<String,Object>>)report.get("rows");
  String last=all.isEmpty()?"":all.getLast().get("dateKey").toString();
  java.util.function.Predicate<Map<String,Object>> include=r->{String date=r.get("dateKey").toString();return (!latest||date.equals(last))&&(start==null||date.compareTo(start.toString())>=0)&&(end==null||date.compareTo(end.toString())<=0);};
  var selected=all.stream().filter(include).toList();var summary=((List<Map<String,Object>>)report.get("summary")).stream().filter(include).toList();
  report.put("rows",selected);report.put("summary",summary);report.put("totals",totals(summary,"soldCarton","soldPack","purchase","adjustments","systemCount","manualCount","missingExtra"));return report;
 }

}
