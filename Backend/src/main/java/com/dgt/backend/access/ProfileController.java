package com.dgt.backend.access;

import java.util.*;
import java.nio.charset.StandardCharsets;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/access/profile")
@ConditionalOnProperty(name="app.profile.enabled",havingValue="true")
public class ProfileController {
 private final ScopedAccess access;
 private final PasswordEncoder encoder;
 public ProfileController(ScopedAccess access,PasswordEncoder encoder){this.access=access;this.encoder=encoder;}
 private Map<String,Object> read(long id){return access.db.queryForMap("SELECT first_name,last_name,email,xmin::text AS version FROM users WHERE user_id=?",id);}
 @GetMapping public Object get(){return read(access.user());}
 public record Profile(String firstName,String lastName,String email,String currentPassword){}
 private String required(String value,int max){if(value==null||value.isBlank()||value.strip().length()>max)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Complete all profile fields within their length limits");return value.strip();}
 private Map<String,Object> lock(String version){long id=access.user();var row=access.db.queryForMap("SELECT user_id,email,password_hash,xmin::text AS version FROM users WHERE user_id=? FOR UPDATE",id);if(!Objects.equals(version,row.get("version")))throw new ResponseStatusException(HttpStatus.CONFLICT,"Profile changed; reload before saving");return row;}
 private void verify(String password,Map<String,Object> row){if(password==null||!encoder.matches(password,(String)row.get("password_hash")))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Current password is incorrect");}
 @PatchMapping @Transactional public Object update(@RequestHeader("If-Match") String version,@RequestBody Profile input){
  var row=lock(version);String first=required(input.firstName(),100),last=required(input.lastName(),100),email=required(input.email(),255).toLowerCase(Locale.ROOT);
  if(!email.matches("[^\\s@:]+@[^\\s@]+\\.[^\\s@]+"))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Enter a valid email");
  if(!email.equals(row.get("email")))verify(input.currentPassword(),row);
  if(Boolean.TRUE.equals(access.db.queryForObject("SELECT EXISTS(SELECT 1 FROM users WHERE lower(email)=? AND user_id<>?)",Boolean.class,email,row.get("user_id"))))throw new ResponseStatusException(HttpStatus.CONFLICT,"Email is already in use");
  try{access.db.update("UPDATE users SET first_name=?,last_name=?,email=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?",first,last,email,row.get("user_id"));}
  catch(org.springframework.dao.DuplicateKeyException e){throw new ResponseStatusException(HttpStatus.CONFLICT,"Email is already in use");}
  if(!email.equals(row.get("email")))access.db.update("UPDATE user_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE user_id=? AND revoked_at IS NULL",row.get("user_id"));
  return read(((Number)row.get("user_id")).longValue());
 }
 public record Password(String currentPassword,String newPassword,String confirmPassword){}
 @PutMapping("/password") @Transactional public Object password(@RequestHeader("If-Match") String version,@RequestBody Password input){
  var row=lock(version);verify(input.currentPassword(),row);
  if(input.newPassword()==null||input.newPassword().length()<12||input.newPassword().getBytes(StandardCharsets.UTF_8).length>72)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"New password must be at least 12 characters and at most 72 bytes");
  if(!Objects.equals(input.newPassword(),input.confirmPassword()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"New passwords do not match");
  if(encoder.matches(input.newPassword(),(String)row.get("password_hash")))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Choose a different password");
  access.db.update("UPDATE users SET password_hash=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?",encoder.encode(input.newPassword()),row.get("user_id"));
  access.db.update("UPDATE user_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE user_id=? AND revoked_at IS NULL",row.get("user_id"));
  return Map.of("signInAgain",true);
 }
}
