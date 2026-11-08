package com.dgt.backend.access.service;
import com.dgt.backend.access.repository.ProfileRepository;
import com.dgt.backend.access.security.ScopedAccess;
import com.dgt.backend.access.dto.ChangePasswordRequest;
import com.dgt.backend.access.dto.UpdateProfileRequest;

import java.util.*;
import java.nio.charset.StandardCharsets;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.server.ResponseStatusException;

/**
 * Reads and updates the current user's profile and password. Writes use the saved profile version
 * to detect concurrent edits; sensitive changes verify the current password against its stored
 * hash.
 */

@org.springframework.stereotype.Service

@ConditionalOnProperty(name="app.profile.enabled",havingValue="true")
public class ProfileService {
 private final ProfileRepository repository;
 private final ScopedAccess access;
 private final PasswordEncoder encoder;
 public ProfileService(ScopedAccess access,PasswordEncoder encoder, ProfileRepository repository){this.repository=repository;this.access=access;this.encoder=encoder;}
 private Map<String,Object> read(long id){return repository.findProfile(id);}
 // Return the current profile plus its version, which clients send back through If-Match on
 // writes.
  public Object get(){return read(access.user());}

 private String required(String value,int max){if(value==null||value.isBlank()||value.strip().length()>max)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Complete all profile fields within their length limits");return value.strip();}
 // Lock the account row and compare its xmin version before validating or applying a profile
 // change.
 private Map<String,Object> lock(String version){long id=access.user();var row=repository.lockAccount(id);if(!Objects.equals(version,row.get("version")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Profile changed; reload before saving");return row;}
 private void verify(String password,Map<String,Object> row){if(password==null||!encoder.matches(password,(String)row.get("password_hash")))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Current password is incorrect");}
 // Name changes need no password; changing email requires the current password and a unique
 // normalized address.
  @Transactional public Object update(String version,UpdateProfileRequest input){
  var row=lock(version);String first=required(input.firstName(),100),last=required(input.lastName(),100),email=required(input.email(),255).toLowerCase(Locale.ROOT);
  if(!email.matches("[^\\s@:]+@[^\\s@]+\\.[^\\s@]+"))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Enter a valid email");
  if(!email.equals(row.get("email")))verify(input.currentPassword(),row);
  if(Boolean.TRUE.equals(repository.emailInUse(email, row.get("user_id"))))throw new ResponseStatusException(HttpStatus.CONFLICT,"Email is already in use");
  try{repository.updateProfile(first, last, email, row.get("user_id"));}
  catch(org.springframework.dao.DuplicateKeyException e){throw new ResponseStatusException(HttpStatus.CONFLICT,"Email is already in use");}
  return read(((Number)row.get("user_id")).longValue());
 }

 // Verify current password, confirmation and length before storing the new encoded hash.
 // signInAgain is a client instruction; this method does not revoke JWTs or refresh tokens.
  @Transactional public Object password(String version,ChangePasswordRequest input){
  var row=lock(version);verify(input.currentPassword(),row);
  if(input.newPassword()==null||input.newPassword().length()<12||input.newPassword().getBytes(StandardCharsets.UTF_8).length>72)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"New password must be at least 12 characters and at most 72 bytes");
  if(!Objects.equals(input.newPassword(),input.confirmPassword()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"New passwords do not match");
  if(encoder.matches(input.newPassword(),(String)row.get("password_hash")))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Choose a different password");
  repository.updatePassword(encoder.encode(input.newPassword()), row.get("user_id"));
  return Map.of("signInAgain",true);
 }
}
