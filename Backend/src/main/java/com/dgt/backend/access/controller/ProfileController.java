package com.dgt.backend.access.controller;
import java.util.*;
import org.springframework.web.bind.annotation.*;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import com.dgt.backend.access.dto.ChangePasswordRequest;
import com.dgt.backend.access.dto.UpdateProfileRequest;
import com.dgt.backend.access.service.ProfileService;

/** HTTP routes only; ProfileService owns validation, authorization and transactions. */
@RestController
@RequestMapping("/api/v1/access/profile")
@ConditionalOnProperty(name="app.profile.enabled",havingValue="true")
public class ProfileController {
    private final ProfileService service;
    public ProfileController(ProfileService service) { this.service = service; }

    @GetMapping
    public Object get(){
        return service.get();
    }

    @PatchMapping
    public Object update(@RequestHeader("If-Match") String version,@RequestBody UpdateProfileRequest input){
        return service.update(version, input);
    }

    @PutMapping("/password")
    public Object password(@RequestHeader("If-Match") String version,@RequestBody ChangePasswordRequest input){
        return service.password(version, input);
    }
}
