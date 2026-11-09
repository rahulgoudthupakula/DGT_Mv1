package com.dgt.backend.access.controller;

import java.util.*;import org.springframework.web.bind.annotation.*;import org.springframework.http.HttpStatus;import com.dgt.backend.portal.PortalBridge;

/**
 * Forwards signup and activation requests to the client-handling service through PortalBridge.
 * This controller does not directly create a user/store or approve a signup.
 */
@RestController public class SignupRequestController {
 private final PortalBridge bridge;public SignupRequestController(PortalBridge bridge){this.bridge=bridge;}
 // Forward the signup payload; HTTP 202 means accepted for processing, not an activated account.
 @PostMapping("/api/v1/signup-requests") @ResponseStatus(HttpStatus.ACCEPTED) public Object submit(@RequestBody Map<String,Object> in){String phone=Objects.toString(in.get("phone"),"");
  String country=Objects.toString(in.get("countryCode"),"+1").trim();
  if(!phone.matches("[0-9]{10}"))throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST,"Phone number must contain exactly 10 digits (0–9). Enter the country code separately.");
  if(!country.matches("\\+[1-9][0-9]{0,2}"))throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST,"Enter a valid country code starting with +.");
  // Preserve the client-handling service's existing single international-phone field.
  var payload=new LinkedHashMap<String,Object>(in);payload.remove("countryCode");payload.put("phone",country+phone);
  return bridge.call("/signup",payload);}
 // Forward activation to the bridge; token/setup validation belongs to the downstream workflow.
 @PostMapping("/api/v1/client-handling/activate") public Object activate(@RequestBody Map<String,Object> in){return bridge.call("/activate",in);}
}
