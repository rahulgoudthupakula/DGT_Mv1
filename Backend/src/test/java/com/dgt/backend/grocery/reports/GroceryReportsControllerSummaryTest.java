package com.dgt.backend.grocery.reports;

import com.dgt.backend.access.security.ScopedAccess;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static com.dgt.backend.grocery.reports.GroceryReportSummaries.*;

/** Verifies summary adapters preserve store/filter boundaries and never expose the source ledger. */
class GroceryReportsControllerSummaryTest {
 static class Sources extends GroceryReportsController {
  Object salesData,purchaseData; String requestedStore; int salesReads; boolean denied;
  Sources(){super(null);}
  @Override public Object sales(String store,LocalDate start,LocalDate end){requestedStore=store;salesReads++;if(denied)throw new ResponseStatusException(HttpStatus.FORBIDDEN);return salesData;}
  @Override public Object purchases(String store,LocalDate start,LocalDate end){requestedStore=store;return purchaseData;}
 }

 @SuppressWarnings("unchecked") private Map<String,Object> result(Object value){return (Map<String,Object>)value;}
 @Test void salesSummaryScopesDepartmentBeforeCalculatingPercentages(){
  var c=new Sources();
  var start=LocalDate.parse("2026-08-01");var end=LocalDate.parse("2026-08-02");
  var row=map("id","1","name","Milk","scanCode","001","category","Dairy","department","Grocery","date",start.toString(),"unitsSold",n("2"),"netSales",n("4"));
  var other=new LinkedHashMap<>(row);other.put("department","Lottery");other.put("id","2");
  c.salesData=map("rows",List.of(row,other),"start",start.toString(),"end",end.toString(),"days",2L);
  var report=result(c.salesSummary("STORE-A",start,end,"grocery"));assertFalse(report.containsKey("rows"));assertEquals(1,((List<?>)report.get("items")).size());assertEquals("STORE-A",c.requestedStore);
 }
 @Test void sourceAuthorizationFailureIsNotBypassed(){
  var c=new Sources();
  c.denied=true;
  assertEquals(HttpStatus.FORBIDDEN,assertThrows(ResponseStatusException.class,()->c.salesSummary("STORE-B",null,null,"")).getStatusCode());
 }
 @Test void purchaseTotalsFollowVendorAndSearchFilters(){
  var c=new Sources();
  var a=map("vendor","A","productName","Milk","scanCode","001","receivedQty",n("2"),"extendedCost",n("4"),"netCost",n("4"),"rebate",null,"unitCost",n("2"),"prevUnitCost",n("1"));
  var b=new LinkedHashMap<>(a);b.put("vendor","B");
  c.purchaseData=map("items",List.of(a,b),"invoices",List.of());
  var report=result(c.purchaseSummary("STORE-A",null,null,"001","A","invoiced"));assertEquals(1,((List<?>)report.get("items")).size());assertEquals(n("4"),result(report.get("itemTotals")).get("netCost"));assertNull(result(report.get("itemTotals")).get("rebate"));assertEquals(2,((List<?>)report.get("vendors")).size());
 }
 @Test void cigaretteInvalidRangeIsRejectedBeforeReadingSources(){
  var c=new Sources();
  assertThrows(ResponseStatusException.class,()->c.cigaretteSummary("STORE-A",LocalDate.parse("2026-08-02"),LocalDate.parse("2026-08-01"),false));assertEquals(0,c.salesReads);
 }
}
