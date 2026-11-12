package com.dgt.backend.pricebook.controller;
import com.dgt.backend.pricebook.service.PromotionPricing;
import com.dgt.backend.pricebook.service.PromotionPricing.*;
import java.math.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
class PromotionPricingTest {
 BigDecimal n(String v){return new BigDecimal(v);}
 Line line(long id,long product,String qty,String price){return new Line(id,product,n(qty),n(price));}
 Offer offer(long id,String type,String value,int buy,int free,Map<Long,Integer> products){return new Offer(id,"Offer "+id,type,n(value),buy,free,products);}
 @Test void choosesBestEligibleOfferBasedOnQuantity(){
  var offers=List.of(offer(1,"% Discount","10",0,0,Map.of(1L,1)),offer(2,"Fixed Price","8",0,0,Map.of(1L,1)),offer(3,"Buy X Get Y","0",2,1,Map.of(1L,1)));
  var chosen=PromotionPricing.price(List.of(line(1,1,"3","10")),offers);assertEquals(n("20.00"),chosen.net());assertEquals(n("3"),chosen.lines().getFirst().promotions().getFirst().quantity());
  assertEquals(n("8.00"),PromotionPricing.price(List.of(line(1,1,"1","10")),offers).net());
 }
 @Test void findsGlobalOptimumInsteadOfGreedilyTakingLargestBundleSaving(){
  var lines=List.of(line(1,1,"1","10"),line(2,2,"1","10"),line(3,3,"1","10"),line(4,4,"1","10"));
  var offers=List.of(offer(1,"Bundle","9",0,0,Map.of(1L,1,2L,1)),offer(2,"Bundle","10",0,0,Map.of(1L,1,3L,1)),offer(3,"Bundle","10",0,0,Map.of(2L,1,4L,1)));
  var quote=PromotionPricing.price(lines,offers);assertEquals(n("20.00"),quote.net());
  assertTrue(quote.lines().stream().flatMap(l->l.promotions().stream()).noneMatch(a->a.promotionId()==1));
 }
 @Test void mixAndMatchUsesCheapestFreeUnitAndCanRepeat(){
  var offers=List.of(offer(1,"Buy X Get Y","0",1,1,Map.of(1L,1,2L,1)));
  assertEquals(n("15.00"),PromotionPricing.price(List.of(line(1,1,"2","10"),line(2,2,"2","5")),offers).net());
  assertEquals(n("10.00"),PromotionPricing.price(List.of(line(1,1,"1","10"),line(2,2,"1","5")),offers).net());
 }
 @Test void bundleRequiresAllProductsAndTheirQuantities(){
  var offer=offer(1,"Bundle","12",0,0,Map.of(1L,2,2L,1));
  assertEquals(n("20.00"),PromotionPricing.price(List.of(line(1,1,"2","10")),List.of(offer)).net());
  assertEquals(n("12.00"),PromotionPricing.price(List.of(line(1,1,"1","10"),line(2,1,"1","10"),line(3,2,"1","5")),List.of(offer)).net());
 }
 @Test void fractionalUnitsCannotQualifyForBuyGetAndPricesNeverIncrease(){
  var offers=List.of(offer(1,"Buy X Get Y","0",1,1,Map.of(1L,1)),offer(2,"Fixed Price","20",0,0,Map.of(1L,1)),offer(3,"% Discount","10",0,0,Map.of(1L,1)));
  assertEquals(n("13.50"),PromotionPricing.price(List.of(line(1,1,"1.5","10")),offers).net());
  assertEquals(n("14.50"),PromotionPricing.price(List.of(line(1,1,"2.5","10")),offers).net());
 }
 @Test void centsAreRoundedPerUnitAndAllocationsReconcile(){
  var offers=List.of(offer(1,"% Discount","50",0,0,Map.of(1L,1)));
  assertEquals(n("0.00"),PromotionPricing.price(List.of(line(1,1,"3","0.01")),offers).net());
  var q=PromotionPricing.price(List.of(line(1,1,"1","0.01"),line(2,2,"1","0.02")),List.of(offer(2,"Bundle","0.01",0,0,Map.of(1L,1,2L,1))));
  assertEquals(n("0.02"),q.lines().stream().map(PricedLine::discount).reduce(BigDecimal.ZERO,BigDecimal::add));
 }
 @Test void tiesAreStableAndNoDiscountIsStacked(){
  var q=PromotionPricing.price(List.of(line(1,1,"1","10")),List.of(offer(9,"Fixed Price","8",0,0,Map.of(1L,1)),offer(2,"% Discount","20",0,0,Map.of(1L,1))));
  assertEquals(n("8.00"),q.net());assertEquals(2,q.lines().getFirst().promotions().getFirst().promotionId());
 }
 @Test void rejectsOversizedSearchRatherThanReturningAnApproximation(){
  assertEquals(422,assertThrows(ResponseStatusException.class,()->PromotionPricing.price(List.of(line(1,1,"501","10")),List.of(offer(1,"Buy X Get Y","0",1,1,Map.of(1L,1))))).getStatusCode().value());
 }
 @Test void optimizerMatchesIndependentExhaustivePartitioning(){
  var random=new Random(917);for(int trial=0;trial<100;trial++){
   int size=2+random.nextInt(5);var lines=new ArrayList<Line>();for(int i=0;i<size;i++)lines.add(line(i+1,i+1,"1",String.valueOf(1+random.nextInt(10))));
   var offers=new ArrayList<Offer>();for(int j=0;j<5;j++){var products=new TreeMap<Long,Integer>();for(int i=0;i<size;i++)if(random.nextBoolean())products.put((long)i+1,1);if(products.isEmpty())products.put(1L,1);offers.add(offer(j+1,j%2==0?"Bundle":"Buy X Get Y",String.valueOf(1+random.nextInt(10)),1,1,products));}
   assertEquals(BigDecimal.valueOf(brute((1<<size)-1,lines,offers,new HashMap<>()),2),PromotionPricing.price(lines,offers).net(),"Trial "+trial);
  }
 }
 long brute(int mask,List<Line> lines,List<Offer> offers,Map<Integer,Long> memo){
  if(mask==0)return 0;if(memo.containsKey(mask))return memo.get(mask);int first=Integer.numberOfTrailingZeros(mask);long best=lines.get(first).unitPrice().movePointRight(2).longValue()+brute(mask^(1<<first),lines,offers,memo);
  for(int subset=mask;subset>0;subset=(subset-1)&mask){if((subset&(1<<first))==0)continue;long gross=0,min=Long.MAX_VALUE;var products=new TreeMap<Long,Integer>();for(int i=0;i<lines.size();i++)if((subset&(1<<i))!=0){long price=lines.get(i).unitPrice().movePointRight(2).longValue();gross+=price;min=Math.min(min,price);products.put(lines.get(i).productId(),1);}
   for(Offer o:offers){long cost=Long.MAX_VALUE;if(o.type().equals("Bundle")&&products.equals(o.products()))cost=o.value().movePointRight(2).longValue();if(o.type().equals("Buy X Get Y")&&Integer.bitCount(subset)==2&&o.products().keySet().containsAll(products.keySet()))cost=gross-min;if(cost!=Long.MAX_VALUE)best=Math.min(best,cost+brute(mask^subset,lines,offers,memo));}
  }memo.put(mask,best);return best;
 }
}
