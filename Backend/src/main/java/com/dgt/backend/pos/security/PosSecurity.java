package com.dgt.backend.pos.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.context.annotation.*;
import org.springframework.core.annotation.Order;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

// Separate stateless security chain for connector endpoints, ahead of the employee API chain.
@Configuration
public class PosSecurity {
 // Hash high-entropy connector credentials and serialized transaction fingerprints with SHA-256.
 public static String hash(String value){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException(e);}}
 // Fail closed unless the flag is enabled and the environment is explicitly development or testing.
 public static boolean simulatorAllowed(boolean enabled,String environment){return enabled&&Set.of("development","testing").contains(environment);}
 // Restrict this chain to POS URLs and deny paths outside the three supported connector endpoints.
 @Bean @Order(1)
 SecurityFilterChain connectorSecurity(HttpSecurity http,JdbcTemplate db,
  @Value("${app.pos.simulator-enabled:false}") boolean enabled,
  @Value("${app.environment:production}") String environment) throws Exception {
  boolean permitted=simulatorAllowed(enabled,environment);
  var filter=new OncePerRequestFilter(){
   protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain)throws java.io.IOException,ServletException{
    if(!permitted){response.sendError(403);return;}
    String header=request.getHeader("Authorization");
    if(header==null||!header.startsWith("Bearer ")||header.length()>200){response.sendError(401);return;}
    // Only an active credential with exactly one database match can authenticate.
    var rows=db.queryForList("SELECT connector_id,dgt_id FROM pos_connectors WHERE credential_hash=? AND active",hash(header.substring(7)));
    if(rows.size()!=1){response.sendError(401);return;}
    // Bind authentication to the stored connector/store pair without employee authorities.
    var row=rows.getFirst();var context=SecurityContextHolder.createEmptyContext();
    context.setAuthentication(new UsernamePasswordAuthenticationToken(new PosIdentity((UUID)row.get("connector_id"),(String)row.get("dgt_id")),null,List.of()));
    SecurityContextHolder.setContext(context);
    // Clear the thread-local identity after the request, including when downstream processing fails.
    try{chain.doFilter(request,response);}finally{SecurityContextHolder.clearContext();}
   }
  };
  return http.securityMatcher("/api/v1/pos/**").csrf(c->c.disable())
   .sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
   .addFilterBefore(filter,BasicAuthenticationFilter.class)
   .authorizeHttpRequests(a->a.requestMatchers("/api/v1/pos/sales","/api/v1/pos/heartbeat","/api/v1/pos/configuration").authenticated().anyRequest().denyAll()).build();
 }
}
