package com.dgt.backend.access;
import java.util.*;
import jakarta.servlet.http.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
@RestController
@RequestMapping("/api/v1/access")
@ConditionalOnProperty(name="app.profile.enabled",havingValue="true")
public class ProfileSessionController {
 private final ScopedAccess access;private final ProfileSessions sessions;
 public ProfileSessionController(ScopedAccess access,ProfileSessions sessions){this.access=access;this.sessions=sessions;}
 @PostMapping("/session") public Object login(HttpServletRequest r,HttpServletResponse response){
  if(r.getHeader("Authorization")==null||!r.getHeader("Authorization").startsWith("Basic "))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Sign in with email and password");
  response.setHeader("Cache-Control","no-store");return sessions.create(r);
 }
 @GetMapping("/profile/history") public Object history(){return access.db.queryForList("SELECT event_id,occurred_at,ip_address,user_agent,status FROM user_login_events WHERE user_id=? ORDER BY occurred_at DESC,event_id DESC LIMIT 100",access.user()).stream().map(com.dgt.backend.common.entity.Rows::normalize).toList();}
 @GetMapping("/profile/sessions") public Object list(HttpServletRequest r){return access.db.queryForList("SELECT s.session_id,s.ip_address,s.user_agent,s.created_at,s.last_active_at,s.expires_at FROM user_sessions s JOIN users u USING(user_id) WHERE s.user_id=? AND s.revoked_at IS NULL AND s.expires_at>CURRENT_TIMESTAMP AND s.credential_fingerprint=? ORDER BY s.created_at DESC",access.user(),fingerprint()).stream().map(row->{var result=com.dgt.backend.common.entity.Rows.normalize(row);result.put("current",Objects.equals(row.get("session_id"),r.getAttribute("dgt.sessionId")));return result;}).toList();}
 private String fingerprint(){var row=access.db.queryForMap("SELECT email,password_hash FROM users WHERE user_id=?",access.user());return ProfileSessions.digest(row.get("email")+":"+row.get("password_hash"));}
 @PostMapping("/profile/sessions/{id}/revoke") public Object revoke(@PathVariable UUID id){int n=access.db.update("UPDATE user_sessions SET revoked_at=coalesce(revoked_at,CURRENT_TIMESTAMP) WHERE session_id=? AND user_id=?",id,access.user());if(n==0)throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Session not found");return Map.of("revoked",true);}
 @PostMapping("/session/logout") public Object logout(HttpServletRequest r){if(r.getAttribute("dgt.sessionId")!=null)revoke((UUID)r.getAttribute("dgt.sessionId"));return Map.of("signedOut",true);}
}
