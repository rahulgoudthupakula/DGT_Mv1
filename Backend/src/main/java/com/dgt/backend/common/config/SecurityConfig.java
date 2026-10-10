package com.dgt.backend.common.config;

import java.util.*;
import com.dgt.backend.access.JwtService;
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

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }

    @Bean
    SecurityFilterChain security(
            HttpSecurity http,
            CorsConfigurationSource cors,
            JwtService jwtService,
            ObjectProvider<com.dgt.backend.access.ProfileSessions> profileSessions) throws Exception {

        http.addFilterBefore(jwtService.authFilter(), BasicAuthenticationFilter.class);

        return http
                .cors(c -> c.configurationSource(cors))
                .csrf(c -> c.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a
                        .dispatcherTypeMatchers(jakarta.servlet.DispatcherType.ERROR).permitAll()
                        .requestMatchers("/api/v1/internal/client-handling/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/client-handling/activate").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/signup-requests").permitAll()
                        .requestMatchers("/api/v1/health").permitAll()
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
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
