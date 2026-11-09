package com.dgt.backend.pricebook.service;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
class VendorPhoneTest {
 @Test void acceptsDifferentNationalLengthsAndPreservesZeros() {
  assertEquals("+12025550123",VendorPhone.normalize("+12025550123","US"));
  assertEquals("+919876543210",VendorPhone.normalize("+919876543210","IN"));
  assertEquals("+6561234567",VendorPhone.normalize("+6561234567","SG"));
  assertEquals("+390236618300",VendorPhone.normalize("+390236618300","IT"));
 }
 @Test void rejectsLettersMissingShortLongAndWrongCountry() {
  for(String phone:new String[]{"+1abc5550123","+12","+1202555012345678","2025550123",""})
   assertThrows(ResponseStatusException.class,()->VendorPhone.normalize(phone,"US"));
  assertThrows(ResponseStatusException.class,()->VendorPhone.normalize(null,"US"));
  assertThrows(ResponseStatusException.class,()->VendorPhone.normalize("+12025550123","IN"));
 }
 @Test void supportsExistingClientsWithoutCountry() {
  assertEquals("+442079460018",VendorPhone.normalize("+442079460018",null));
 }
}
