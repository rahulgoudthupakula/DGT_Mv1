package com.dgt.backend.identity.service;

import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import com.dgt.backend.identity.repository.AuthenticationRepository;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class DatabaseUserDetailsService implements UserDetailsService {
    private final AuthenticationRepository repository;
    public DatabaseUserDetailsService(AuthenticationRepository repository) { this.repository=repository; }
    @Override public UserDetails loadUserByUsername(String email) {
        log.debug("Loading user details for authentication");
        var users=repository.findByEmail(email);
        if(users.size()!=1) {
            log.warn("Authentication failed: user not found");
            throw new UsernameNotFoundException("Unknown account");
        }
        var user=users.getFirst();
        // Basic authentication cannot satisfy a second factor; do not bypass enabled MFA.
        boolean enabled="ACTIVE".equals(user.get("account_status")) && !Boolean.TRUE.equals(user.get("two_factor_authentication"));
        return User.withUsername((String)user.get("email")).password((String)user.get("password_hash"))
            .disabled(!enabled).authorities("AUTHENTICATED").build();
    }
}
