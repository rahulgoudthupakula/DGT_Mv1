package com.dgt.backend.pricebook.service;

import java.math.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Exact, bounded basket optimization. Quantities consumed by an offer cannot be reused. */
public final class PromotionPricing {
 private PromotionPricing(){}
 public record Line(long lineId,long productId,BigDecimal quantity,BigDecimal unitPrice){}
 public record Offer(long id,String name,String type,BigDecimal value,int buy,int free,Map<Long,Integer> products){}
 public record Allocation(long promotionId,String name,BigDecimal quantity,BigDecimal discount){}
 public record PricedLine(long lineId,BigDecimal gross,BigDecimal discount,BigDecimal net,List<Allocation> promotions){}
 public record Quote(BigDecimal gross,BigDecimal discount,BigDecimal net,List<PricedLine> lines){}
 private record Choice(Offer offer,int[] used,long[] discounts,long saving){}
 private record Best(long saving,Choice choice){}
 private static long cents(BigDecimal n){return n.setScale(2,RoundingMode.HALF_UP).movePointRight(2).longValueExact();}
 private static BigDecimal money(long n){return BigDecimal.valueOf(n,2);}
 private static void invalid(String m){throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,m);}
 public static Quote price(List<Line> input,List<Offer> offers){return new Calculation(input,offers).run();}
 private static final class Calculation {
  final List<Line> lines;final List<Offer> offers;final long[] prices;final int[] counts;final long[] discount;
  final Offer[] single;final List<Choice> groups=new ArrayList<>();final Map<String,Best> memo=new HashMap<>();
  final List<List<Allocation>> allocations=new ArrayList<>();int attempts;long work;
  Calculation(List<Line> lines,List<Offer> offers){
   if(lines==null||lines.isEmpty()||lines.size()>500)invalid("Choose between 1 and 500 sale lines");
   if(offers.size()>500)invalid("Too many eligible promotions to price this basket");
   this.lines=lines;this.offers=offers.stream().sorted(Comparator.comparingLong(Offer::id)).toList();
   prices=new long[lines.size()];counts=new int[lines.size()];discount=new long[lines.size()];single=new Offer[lines.size()];
   var ids=new HashSet<Long>();
   for(int i=0;i<lines.size();i++){
    Line l=lines.get(i);if(!ids.add(l.lineId())||l.quantity()==null||l.quantity().signum()<=0||l.quantity().scale()>3||l.quantity().compareTo(new BigDecimal("1000000"))>0||l.unitPrice()==null||l.unitPrice().signum()<0||l.unitPrice().scale()>2||l.unitPrice().compareTo(new BigDecimal("1000000000"))>0||l.unitPrice().multiply(l.quantity()).compareTo(new BigDecimal("1000000000000"))>0)invalid("Invalid sale quantity or unit price");
    prices[i]=cents(l.unitPrice());allocations.add(new ArrayList<>());
   }
  }
  long simpleDiscount(int i,BigDecimal quantity,Offer offer){
   long gross=cents(lines.get(i).unitPrice().multiply(quantity));
   if(offer==null)return 0;
   return switch(offer.type()){
    case "% Discount"->Math.min(gross,cents(money(gross).multiply(offer.value()).movePointLeft(2)));
    case "Fixed Price"->Math.max(0,gross-cents(offer.value().multiply(quantity)));
    default->0;
   };
  }
  Quote run(){
   int total=0;
   for(int i=0;i<lines.size();i++){
    for(Offer o:offers)if(o.products().containsKey(lines.get(i).productId())&&Set.of("% Discount","Fixed Price").contains(o.type())&&simpleDiscount(i,BigDecimal.ONE,o)>simpleDiscount(i,BigDecimal.ONE,single[i]))single[i]=o;
    final long product=lines.get(i).productId();
    boolean multi=offers.stream().anyMatch(o->Set.of("Bundle","Buy X Get Y").contains(o.type())&&o.products().containsKey(product));
    if(multi){counts[i]=lines.get(i).quantity().intValue();total+=counts[i];}
    else {BigDecimal whole=lines.get(i).quantity().setScale(0,RoundingMode.DOWN);add(i,single[i],whole,simpleDiscount(i,BigDecimal.ONE,single[i])*whole.longValueExact());}
    BigDecimal fraction=lines.get(i).quantity().remainder(BigDecimal.ONE);if(fraction.signum()>0){Offer best=null;for(Offer o:offers)if(o.products().containsKey(product)&&Set.of("% Discount","Fixed Price").contains(o.type())&&simpleDiscount(i,fraction,o)>simpleDiscount(i,fraction,best))best=o;add(i,best,fraction,simpleDiscount(i,fraction,best));}
   }
   if(total>500)invalid("This basket has more than 500 units eligible for multi-item promotions; split the ticket");
   for(Offer o:offers)if(Set.of("Bundle","Buy X Get Y").contains(o.type())){
    var available=new HashMap<Long,Integer>();for(int i=0;i<counts.length;i++)if(o.products().containsKey(lines.get(i).productId()))available.merge(lines.get(i).productId(),counts[i],Integer::sum);
    if(o.type().equals("Bundle")?o.products().entrySet().stream().anyMatch(e->available.getOrDefault(e.getKey(),0)<e.getValue()):available.values().stream().mapToInt(Integer::intValue).sum()<o.buy()+o.free())continue;
    generate(o,0,new int[counts.length],o.type().equals("Bundle")?0:o.buy()+o.free(),new HashMap<>());
   }
   int[] remaining=counts.clone();solve(remaining);
   while(Arrays.stream(remaining).sum()>0){
    Choice c=memo.get(Arrays.toString(remaining)).choice();
    for(int i=0;i<remaining.length;i++)if(c.used()[i]>0){add(i,c.offer(),BigDecimal.valueOf(c.used()[i]),c.discounts()[i]);remaining[i]-=c.used()[i];}
   }
   var result=new ArrayList<PricedLine>();long gross=0,saving=0;
   for(int i=0;i<lines.size();i++){long g=cents(lines.get(i).unitPrice().multiply(lines.get(i).quantity()));gross+=g;saving+=discount[i];result.add(new PricedLine(lines.get(i).lineId(),money(g),money(discount[i]),money(g-discount[i]),List.copyOf(allocations.get(i))));}
   return new Quote(money(gross),money(saving),money(gross-saving),result);
  }
  void add(int i,Offer o,BigDecimal quantity,long amount){discount[i]+=amount;if(o!=null&&quantity.signum()>0){var list=allocations.get(i);for(int x=0;x<list.size();x++)if(list.get(x).promotionId()==o.id()){var previous=list.get(x);list.set(x,new Allocation(o.id(),o.name(),previous.quantity().add(quantity),previous.discount().add(money(amount))));return;}list.add(new Allocation(o.id(),o.name(),quantity,money(amount)));}}
  void generate(Offer o,int at,int[] used,int left,Map<Long,Integer> picked){
   if(++work>2000000)complex();
   if(at==counts.length){
    if(o.type().equals("Bundle")?!picked.equals(o.products()):left!=0)return;
    if(++attempts>30000)complex();
    long gross=0;for(int i=0;i<used.length;i++)gross+=prices[i]*used[i];long[] discounts=new long[used.length];
    if(o.type().equals("Bundle")){
     long saving=gross-cents(o.value());if(saving<=0)return;
     long cumulative=0,allocated=0;
     for(int i=0;i<used.length;i++){cumulative+=prices[i]*used[i];long next=BigDecimal.valueOf(saving).multiply(BigDecimal.valueOf(cumulative)).divide(BigDecimal.valueOf(gross),0,RoundingMode.HALF_UP).longValueExact();discounts[i]=next-allocated;allocated=next;}
    }else{
     int free=o.free();var order=new ArrayList<Integer>();for(int i=0;i<used.length;i++)if(used[i]>0)order.add(i);
     order.sort(Comparator.<Integer>comparingLong(i->prices[i]).thenComparingInt(i->i));
     for(int i:order){int qty=Math.min(free,used[i]);discounts[i]=prices[i]*qty;free-=qty;}
    }
    long saving=Arrays.stream(discounts).sum();if(saving>0)groups.add(new Choice(o,used.clone(),discounts,saving));return;
   }
   long product=lines.get(at).productId();int max=0;
   if(o.products().containsKey(product))max=Math.min(counts[at],o.type().equals("Bundle")?o.products().get(product)-picked.getOrDefault(product,0):left);
   for(int q=0;q<=max;q++){
    used[at]=q;int previous=picked.getOrDefault(product,0);if(q>0)picked.put(product,previous+q);
    generate(o,at+1,used,left-q,picked);
    if(q>0){if(previous==0)picked.remove(product);else picked.put(product,previous);}
   }
   used[at]=0;
  }
  Best solve(int[] remaining){
   String key=Arrays.toString(remaining);Best cached=memo.get(key);if(cached!=null)return cached;
   if(memo.size()>60000||++work>2000000)complex();
   int first=0;while(first<remaining.length&&remaining[first]==0)first++;
   if(first==remaining.length)return new Best(0,null);
   int[] used=new int[remaining.length];long[] saving=new long[remaining.length];used[first]=1;saving[first]=simpleDiscount(first,BigDecimal.ONE,single[first]);
   Choice choice=new Choice(single[first],used,saving,saving[first]);remaining[first]--;long best=choice.saving()+solve(remaining).saving();remaining[first]++;
   for(Choice c:groups){if(++work>2000000)complex();if(c.used()[first]==0)continue;boolean fits=true;for(int i=0;i<remaining.length;i++)if(c.used()[i]>remaining[i]){fits=false;break;}if(!fits)continue;
    for(int i=0;i<remaining.length;i++)remaining[i]-=c.used()[i];long value=c.saving()+solve(remaining).saving();for(int i=0;i<remaining.length;i++)remaining[i]+=c.used()[i];
    if(value>best){best=value;choice=c;}
   }
   Best result=new Best(best,choice);memo.put(key,result);return result;
  }
  void complex(){invalid("Too many overlapping promotion combinations to price exactly; simplify the promotions or split the ticket");}
 }
}
