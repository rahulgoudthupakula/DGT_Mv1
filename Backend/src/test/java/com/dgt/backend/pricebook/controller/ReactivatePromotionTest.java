package com.dgt.backend.pricebook.controller;
import com.dgt.backend.access.security.ScopedAccess;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
class ReactivatePromotionTest {
 private StorePromotionController controller(boolean eligible,List<Map<String,Object>> products,List<String> writes){
  var db=new JdbcTemplate(){
   @Override public List<Map<String,Object>> queryForList(String sql,Object... args){
    if(sql.contains("FROM stores"))return List.of(Map.of("dgt_id","STORE"));
    if(sql.contains("FROM promotions")){assertArrayEquals(new Object[]{7L,"STORE","12"},args);assertTrue(sql.contains("NOT is_active AND end_date>=CURRENT_TIMESTAMP"));return eligible?List.of(Map.of("promotion_id",7L)):List.of();}
    if(sql.contains("FROM promotion_products"))return products;
    throw new AssertionError(sql);
   }
   @Override public int update(String sql,Object... args){assertTrue(sql.contains("NOT is_active AND end_date>=CURRENT_TIMESTAMP"));assertArrayEquals(new Object[]{7L,"STORE","12"},args);writes.add(sql);return 1;}
  };
  var access=new ScopedAccess(db,null,null){@Override public void audit(String store,String action,String target,String payload){assertEquals("PROMOTION_REACTIVATED",action);writes.add(action);}};
  return new StorePromotionController(access,null,null);
 }
 @Test void reactivatesSamePromotionWithCurrentVersionAndActiveProducts(){var writes=new ArrayList<String>();assertEquals(Map.of("reactivated",true),controller(true,List.of(Map.of("is_active",true)),writes).applyReactivate("STORE","7","12"));assertEquals(2,writes.size());}
 @Test void rejectsExpiredActiveChangedOrOtherStorePromotion(){var writes=new ArrayList<String>();assertEquals(409,assertThrows(ResponseStatusException.class,()->controller(false,List.of(),writes).applyReactivate("STORE","7","12")).getStatusCode().value());assertTrue(writes.isEmpty());}
 @Test void rejectsInactiveOrMissingProducts(){for(var products:List.<List<Map<String,Object>>>of(List.of(),List.of(Map.of("is_active",false)))){var writes=new ArrayList<String>();assertEquals(400,assertThrows(ResponseStatusException.class,()->controller(true,products,writes).applyReactivate("STORE","7","12")).getStatusCode().value());assertTrue(writes.isEmpty());}}
}
