package com.dgt.backend.pricebook.controller;
import com.dgt.backend.access.security.ScopedAccess;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
class ExpiredPromotionTest {
 private StorePromotionController controller(){
  var db=new JdbcTemplate(){
   @Override public List<Map<String,Object>> queryForList(String sql,Object... args){
    if(sql.contains("AS expired")){
     assertArrayEquals(new Object[]{7L,"STORE"},args);
     return List.of(Map.of("expired",true));
    }
    if(sql.contains("FOR UPDATE"))return List.of(Map.of("dgt_id","STORE"));
    throw new AssertionError("Unexpected query: "+sql);
   }
  };
  var access=new ScopedAccess(db,null,null){
   @Override public long user(){return 1;}
   @Override public Grant grant(long user,String store,String module,boolean edit){return new Grant(1,"ADMIN");}
  };
  return new StorePromotionController(access,null,null);
 }
 @Test void rejectsExpiredEditBeforeSubmittingApproval(){
  var error=assertThrows(ResponseStatusException.class,()->controller().update("STORE",7,"1","key",null));
  assertEquals(409,error.getStatusCode().value());
  assertTrue(error.getReason().contains("Expired promotions cannot be edited"));
 }
 @Test void rejectsApprovalThatExecutesAfterExpiry(){
  var error=assertThrows(ResponseStatusException.class,()->controller().apply("STORE","7","1",null));
  assertEquals(409,error.getStatusCode().value());
  assertTrue(error.getReason().contains("Expired promotions cannot be edited"));
 }
}
