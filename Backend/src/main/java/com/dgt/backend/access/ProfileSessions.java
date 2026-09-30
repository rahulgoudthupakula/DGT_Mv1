package com.dgt.backend.access;

import java.util.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Service;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.ApplicationArguments;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.filter.OncePerRequestFilter;

@Service
@ConditionalOnProperty(name="app.profile.enabled",havingValue="true")
public class ProfileSessions implements ApplicationRunner {
 private final ScopedAccess access;
 private final PasswordEncoder encoder;
 private static final java.util.concurrent.ConcurrentHashMap<String,long[]> RATE=new java.util.concurrent.ConcurrentHashMap<>();
 private static final long RATE_MS=5*60_000L;
 private static final int RATE_MAX=10;
 public ProfileSessions(ScopedAccess access,PasswordEncoder encoder){this.access=access;this.encoder=encoder;}
 public void run(ApplicationArguments args){access.db.queryForList("SELECT session_id,credential_fingerprint FROM user_sessions WHERE false");access.db.queryForList("SELECT status FROM user_login_events WHERE false");}
 public static String digest(String text){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(text.getBytes(StandardCharsets.UTF_8)));}catch(NoSuchAlgorithmException e){throw new IllegalStateException(e);}}
 private String agent(HttpServletRequest r){String a=r.getHeader("User-Agent");return a==null?"Unknown":a.substring(0,Math.min(a.length(),512));}
 private void event(long uid,HttpServletRequest r,String status){access.db.update("INSERT INTO user_login_events(user_id,ip_address,user_agent,status) VALUES (?,?,?,?)",uid,r.getRemoteAddr(),agent(r),status);}
 private void checkRate(String ip){long now=System.currentTimeMillis();var w=RATE.compute(ip,(k,v)->{if(v==null||now-v[0]>RATE_MS)return new long[]{now,1};v[1]++;return v;});if(w[1]>RATE_MAX)throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.TOO_MANY_REQUESTS,"Too many sign-in attempts; try again later");}
 @Transactional public Object create(HttpServletRequest request){
  checkRate(request.getRemoteAddr());
  long uid=access.user();var u=access.db.queryForMap("SELECT email,password_hash FROM users WHERE user_id=? FOR UPDATE",uid);
  String raw=new String(Base64.getDecoder().decode(request.getHeader("Authorization").substring(6)),StandardCharsets.UTF_8);int colon=raw.indexOf(':');
  if(colon<0||!encoder.matches(raw.substring(colon+1),(String)u.get("password_hash")))throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED,"Sign in again");
  byte[] bytes=new byte[32];new SecureRandom().nextBytes(bytes);String token=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);UUID id=UUID.randomUUID();
  access.db.update("INSERT INTO user_sessions(session_id,user_id,token_hash,credential_fingerprint,ip_address,user_agent,expires_at) VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP+interval '8 hours')",id,uid,digest(token),digest(u.get("email")+":"+u.get("password_hash")),request.getRemoteAddr(),agent(request));event(uid,request,"SUCCESS");
  return Map.of("token",token,"sessionId",id,"expiresInSeconds",28800);
 }
 public void failed(HttpServletRequest request){
  if(!request.getRequestURI().equals("/api/v1/access/session")||!request.getMethod().equals("POST"))return;
  String header=request.getHeader("Authorization");if(header==null||!header.startsWith("Basic ")||header.length()>4096)return;
  try{String decoded=new String(Base64.getDecoder().decode(header.substring(6)),StandardCharsets.UTF_8);int colon=decoded.indexOf(':');if(colon<0)return;String email=decoded.substring(0,colon);
   var users=access.db.queryForList("SELECT user_id FROM users WHERE email=?",Long.class,email);if(users.size()==1)event(users.getFirst(),request,"FAILED");
  }catch(IllegalArgumentException ignored){}
 }
 public OncePerRequestFilter filter(){return new OncePerRequestFilter(){
  protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain) throws java.io.IOException,ServletException {
   String header=req.getHeader("Authorization");
   if(header==null||!header.startsWith("Bearer ")){chain.doFilter(req,res);return;}
   String token=header.substring(7);if(token.length()>256){res.sendError(401);return;}
   var rows=access.db.queryForList("SELECT s.session_id,u.email FROM user_sessions s JOIN users u USING(user_id) WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>CURRENT_TIMESTAMP AND u.account_status='ACTIVE' AND NOT u.two_factor_authentication",digest(token));
   if(rows.size()!=1){res.sendError(401);return;}var row=rows.getFirst();
   var context=SecurityContextHolder.createEmptyContext();context.setAuthentication(new UsernamePasswordAuthenticationToken(row.get("email"),null,List.of(new SimpleGrantedAuthority("AUTHENTICATED"))));SecurityContextHolder.setContext(context);
   req.setAttribute("dgt.sessionId",row.get("session_id"));
   access.db.update("UPDATE user_sessions SET last_active_at=CURRENT_TIMESTAMP WHERE session_id=? AND last_active_at<CURRENT_TIMESTAMP-interval '1 minute'",row.get("session_id"));
   chain.doFilter(req,res);
  }
 };}
}
