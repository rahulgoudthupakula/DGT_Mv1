package com.dgt.backend.grocery.reports;

import org.junit.jupiter.api.Test;
import java.util.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import static org.junit.jupiter.api.Assertions.*;
import static com.dgt.backend.grocery.reports.GroceryReportSummaries.*;

class GroceryReportSummariesTest {
 private void decimal(String expected,Object actual){assertNotNull(actual);assertEquals(0,new BigDecimal(expected).compareTo(n(actual)));}
 private Map<String,Object> sale(String date,String units,String amount){return map("id","01","name","Milk","scanCode","00123","department","Grocery","category","Dairy","date",date,"unitsSold",n(units),"netSales",n(amount),"tax",n("0.20"));}
 @SuppressWarnings("unchecked") private List<Map<String,Object>> rows(Map<String,Object> r,String key){return (List<Map<String,Object>>)r.get(key);}
 @SuppressWarnings("unchecked") private Map<String,Object> object(Map<String,Object> r,String key){return (Map<String,Object>)r.get(key);}
 @Test void salesSeparatesPriorPeriodAndPreservesFractionalRefunds(){
  var report=sales(List.of(sale("2026-07-31","4","10"),sale("2026-08-01","2.5","6.25"),sale("2026-08-02","-0.5","-1.25")),"2026-08-01",2);
  var item=rows(report,"items").getFirst();decimal("2",item.get("unitsSold"));decimal("5",item.get("netSales"));decimal("4",item.get("previousUnits"));decimal("2.5",item.get("avgPrice"));decimal("1",item.get("velocity"));assertEquals("00123",item.get("scanCode"));assertEquals("down",item.get("trend"));assertEquals(2,rows(item,"dailySales").size());
 }
 @Test void categoriesCombineProductsAndCalculateContribution(){
  var first=sale("2026-08-01","1","0.10");var second=new LinkedHashMap<>(first);second.put("id","02");second.put("netSales",n("0.20"));
  var report=sales(List.of(first,second),"2026-08-01",1);var category=rows(report,"categories").getFirst();decimal("0.30",category.get("netSales"));decimal("100",category.get("percentOfTotal"));assertEquals(2L,category.get("itemCount"));
 }
 @Test void stockMissingCostDoesNotBecomeZeroOrPartialTotal(){
  var report=stock(List.of(map("category","A","qty",n("2"),"cost",n("3"),"retail",n("5")),map("category","B","qty",n("1"),"cost",null,"retail",n("4"))));
  var summary=object(report,"summary");assertNull(summary.get("totalValue"));decimal("14",summary.get("totalRetailValue"));assertNull(summary.get("ratio"));assertNull(rows(report,"categories").getFirst().get("pctOfTotal"));
 }
 @Test void stockUsesDecimalValuesAndMissingQuantityPropagates(){
  var report=stock(List.of(map("category","A","qty",n("1.5"),"cost",n("0.10"),"retail",n("0.20"))));decimal("0.15",object(report,"summary").get("totalValue"));decimal("0.5",object(report,"summary").get("ratio"));
  var missing=stock(List.of(map("category","A","qty",null,"cost",n("1"),"retail",n("2"))));assertNull(object(missing,"summary").get("totalQty"));assertNull(object(missing,"summary").get("totalRetailValue"));
 }
 @Test void ratioExcludesComparisonSalesAndHandlesZeroPurchases(){
  var source=List.of(sale("2026-07-31","1","100"),sale("2026-08-01","1","20"));
  var report=ratio(source,List.of(map("dateKey","2026-08-01","purchaseAmount",n("10"))),"2026-08-01","2026-08-02");decimal("2",report.get("ratio"));decimal("20",report.get("totalSales"));
  assertNull(ratio(source,List.of(),"2026-08-01","2026-08-02").get("ratio"));
 }
 @Test void profitSearchKeepsHistoricalCostsUnknown(){
  var report=profit(List.of(sale("2026-08-01","1","3")),"2026-08-01",1,"00123");decimal("3",object(report,"summary").get("netSales"));assertNull(object(report,"summary").get("cogs"));assertNull(object(report,"dailyTotals").get("netCashFlow"));assertTrue(rows(profit(List.of(sale("2026-08-01","1","3")),"2026-08-01",1,"other"),"items").isEmpty());
 }
 @Test void purchaseUnknownPaymentTotalsStayUnknown(){assertNull(totals(List.of(map("paidAmount",n("5")),map("paidAmount",null)),"paidAmount").get("paidAmount"));}
 @Test void cigaretteCountsReverseLaterMovementsAndFilterDateTotals(){
  var item=map("id","01","brand","Brand","category","Cigarettes","department","Cigarettes","unit","packs","qty",n("10"),"cost",n("2"),"retail",n("3"));
  var report=cigarettes(List.of(sale("2026-08-01","2","6")),List.of(item),List.of(map("productId","01","date","2026-08-02","type","PURCHASE","qty",n("4"))),List.of(),"2026-08-01");
  report=cigaretteWindow(report,LocalDate.parse("2026-08-01"),LocalDate.parse("2026-08-01"),false);decimal("6",rows(report,"rows").getFirst().get("systemCount"));decimal("2",object(report,"totals").get("soldPack"));assertNull(object(report,"totals").get("manualCount"));decimal("20",report.get("cost"));
 }
 @Test void emptyReportsReturnEmptyCollectionsWithoutDivisionErrors(){assertTrue(rows(sales(List.of(),"2026-08-01",1),"items").isEmpty());assertNull(object(stock(List.of()),"summary").get("ratio"));assertTrue(rows(cigarettes(List.of(),List.of(),List.of(),List.of(),"2026-08-01"),"rows").isEmpty());}
}
