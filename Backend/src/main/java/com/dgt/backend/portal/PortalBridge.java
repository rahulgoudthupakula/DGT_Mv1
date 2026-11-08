package com.dgt.backend.portal;
import java.net.*;import java.net.http.*;import java.time.Duration;import java.nio.charset.StandardCharsets;import java.security.MessageDigest;
import org.springframework.stereotype.Service;import org.springframework.beans.factory.annotation.Value;import org.springframework.http.HttpStatus;import org.springframework.web.server.ResponseStatusException;import tools.jackson.databind.ObjectMapper;
// Authenticated HTTP bridge to the separate client-handling backend.
// Configuration supplies the base URL and shared bridge key; defaults target the local portal backend.
@Service public class PortalBridge {
 // Use a five-second connection timeout; each outbound request also has a thirty-second timeout.
 private final String base,key;private final ObjectMapper json;private final HttpClient http=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
 public PortalBridge(@Value("${PORTAL_BACKEND_URL:http://127.0.0.1:8182/api/v1/internal}") String base,@Value("${DGT_BRIDGE_KEY:}") String key,ObjectMapper json){this.base=base;this.key=key;this.json=json;}
 // Reject missing/short configured keys and compare supplied key bytes with MessageDigest.isEqual.
 public void require(String given){if(key.length()<32||given==null||!MessageDigest.isEqual(key.getBytes(StandardCharsets.UTF_8),given.getBytes(StandardCharsets.UTF_8)))throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);}
 // POST a JSON command with the bridge key and decode the response.
 // Map remote failures to safe client messages; preserve thread interruption and do not retry automatically.
 public Object call(String path,Object body){if(key.length()<32)throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Client services are not configured");try{var b=HttpRequest.newBuilder(URI.create(base+path)).timeout(Duration.ofSeconds(30)).header("X-DGT-Bridge-Key",key).header("Content-Type","application/json").POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)));var r=http.send(b.build(),HttpResponse.BodyHandlers.ofString());if(r.statusCode()>=400){if(r.statusCode()==400)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Check your details or request a fresh setup link");if(r.statusCode()==409)throw new ResponseStatusException(HttpStatus.CONFLICT,"This request was already used for different details");if(r.statusCode()==404)throw new ResponseStatusException(HttpStatus.NOT_FOUND);throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Client services are unavailable; retry shortly");}return json.readValue(r.body(),Object.class);}catch(java.io.IOException e){throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Client services are unavailable; retry shortly");}catch(InterruptedException e){Thread.currentThread().interrupt();throw new ResponseStatusException(HttpStatus.BAD_GATEWAY);}}
}
