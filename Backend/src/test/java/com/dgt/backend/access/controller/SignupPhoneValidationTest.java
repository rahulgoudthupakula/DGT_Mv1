package com.dgt.backend.access.controller;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
class SignupPhoneValidationTest {
 @Test void rejectsMissingShortLongAndNonNumericPhoneBeforeForwarding(){
  var controller=new SignupRequestController(null);
  for(String phone:new String[]{"","123456789","12345678901","123456789a","202-555-0123"}) {
   var error=assertThrows(ResponseStatusException.class,()->controller.submit(Map.of("phone",phone,"countryCode","+1")));
   assertEquals(400,error.getStatusCode().value());assertTrue(error.getReason().contains("10 digits"));
  }
 }
 @Test void rejectsMalformedCountryCodes(){
  var controller=new SignupRequestController(null);
  for(String code:new String[]{"","1","+0","+1234","+a"})assertThrows(ResponseStatusException.class,()->controller.submit(Map.of("phone","2025550123","countryCode",code)));
 }
}
