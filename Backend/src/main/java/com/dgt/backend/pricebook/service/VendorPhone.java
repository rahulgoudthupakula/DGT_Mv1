package com.dgt.backend.pricebook.service;

import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.NumberParseException;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Validates vendor contact numbers and stores them in international E.164 format. */
public final class VendorPhone {
 private VendorPhone() {}
 public static String normalize(String value, String country) {
  var phones = PhoneNumberUtil.getInstance();
  if (value == null || !value.matches("\\+[1-9][0-9]{1,14}")) throw invalid();
  try {
   var number = phones.parse(value, "ZZ");
   // Older API clients may omit country; international validation still applies.
   if (!phones.isValidNumber(number) || (country != null &&
       (!phones.getSupportedRegions().contains(country) || !phones.isValidNumberForRegion(number,country)))) throw invalid();
   return phones.format(number, PhoneNumberUtil.PhoneNumberFormat.E164);
  } catch (NumberParseException e) { throw invalid(); }
 }
 private static ResponseStatusException invalid() {
  return new ResponseStatusException(HttpStatus.BAD_REQUEST,"Enter a valid phone number with the correct country code and country-specific length.");
 }
}
