package com.dgt.backend.access;
import java.util.*;import org.springframework.web.bind.annotation.*;import org.springframework.http.HttpStatus;import com.dgt.backend.portal.PortalBridge;
@RestController public class SignupRequestController {
 private final PortalBridge bridge;public SignupRequestController(PortalBridge bridge){this.bridge=bridge;}
 @PostMapping("/api/v1/signup-requests") @ResponseStatus(HttpStatus.ACCEPTED) public Object submit(@RequestBody Map<String,Object> in){return bridge.call("/signup",in);}
 @PostMapping("/api/v1/client-handling/activate") public Object activate(@RequestBody Map<String,Object> in){return bridge.call("/activate",in);}
}
