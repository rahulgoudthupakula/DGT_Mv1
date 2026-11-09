package com.dgt.backend.common.config;

import java.util.*;
import com.dgt.backend.access.security.JwtService;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.web.cors.*;

/**
 * Configures stateless JWT request authentication, endpoint access rules, CORS, and password hashing.
 */

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    // Use BCrypt with cost 12 for stored password hashes.
    @Bean
    PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }

    // Install JWT authentication before applying endpoint authorization; HTTP Basic is disabled.
    @Bean
    SecurityFilterChain security(
            HttpSecurity http,
            CorsConfigurationSource cors,
            JwtService jwtService,
            ObjectProvider<com.dgt.backend.access.service.ProfileSessions> profileSessions) throws Exception {

        // The JWT filter establishes the authenticated principal from the incoming token.
        http.addFilterBefore(jwtService.authFilter(), BasicAuthenticationFilter.class);

        return http
                .cors(c -> c.configurationSource(cors))
                .csrf(c -> c.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Public matchers bypass this authentication gate; all unlisted routes are denied.
                .authorizeHttpRequests(a -> a
                        .dispatcherTypeMatchers(jakarta.servlet.DispatcherType.ERROR).permitAll()
                        .requestMatchers("/api/v1/internal/client-handling/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/client-handling/activate").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/signup-requests").permitAll()
                        .requestMatchers("/api/v1/health").permitAll()
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/access/session").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/access/session/refresh").permitAll()
                        .requestMatchers("/api/v1/access/**",
                                "/api/v1/stores/*/settings",
                                "/api/v1/stores/*/business-day",
                                "/api/v1/stores/*/department-access",
                                "/api/v1/stores/*/department-access/*").authenticated()
                        .anyRequest().denyAll())
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((request, response, ex) -> {
                            // Log failed Basic Auth login attempts
                            profileSessions.ifAvailable(s -> s.failed(request));
                            response.setStatus(HttpStatus.UNAUTHORIZED.value());
                            response.setContentType("application/json");
                            response.getWriter().write("{\"status\":401,\"title\":\"Unauthorized\",\"detail\":\"Authentication required\"}");
                        }))
                .httpBasic(b -> b.disable())
                .build();
    }

    // Allow configured browser origins and the headers used for authentication and concurrent updates.
    @Bean
    CorsConfigurationSource cors(@Value("${app.cors-origins}") String origins) {
        var c = new CorsConfiguration();
        c.setAllowedOrigins(Arrays.asList(origins.split(",")));
        c.setAllowedMethods(List.of("GET", "POST", "PATCH", "PUT", "OPTIONS"));
        c.setAllowedHeaders(List.of("Authorization", "Content-Type", "If-Match", "Idempotency-Key"));
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", c);
        return source;
    }
}
