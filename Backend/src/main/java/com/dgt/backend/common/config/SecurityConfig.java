package com.dgt.backend.common.config;

import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.*;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }
    @Bean SecurityFilterChain security(HttpSecurity http,CorsConfigurationSource cors,org.springframework.beans.factory.ObjectProvider<com.dgt.backend.access.ProfileSessions> provider) throws Exception {
        var sessions=provider.getIfAvailable();
        if(sessions!=null)http.addFilterBefore(sessions.filter(),org.springframework.security.web.authentication.www.BasicAuthenticationFilter.class);
        return http.cors(c -> c.configurationSource(cors)).csrf(c -> c.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a.dispatcherTypeMatchers(jakarta.servlet.DispatcherType.ERROR).permitAll().requestMatchers("/api/v1/internal/client-handling/**").permitAll().requestMatchers(org.springframework.http.HttpMethod.POST,"/api/v1/client-handling/activate").permitAll().requestMatchers(org.springframework.http.HttpMethod.POST,"/api/v1/signup-requests").permitAll().requestMatchers("/api/v1/health").permitAll().requestMatchers("/swagger-ui/**","/swagger-ui.html","/v3/api-docs/**").permitAll().requestMatchers("/api/v1/access/**", "/api/v1/stores/*/settings", "/api/v1/stores/*/business-day", "/api/v1/stores/*/department-access", "/api/v1/stores/*/department-access/*").authenticated().anyRequest().denyAll())
            .httpBasic(b->b.authenticationEntryPoint((request,response,error)->{if(sessions!=null)sessions.failed(request);response.setHeader("WWW-Authenticate","Basic realm=\"DGT\"");response.sendError(401);})).build();
    }
    @Bean CorsConfigurationSource cors(@Value("${app.cors-origins}") String origins) {
        var c=new CorsConfiguration();
        c.setAllowedOrigins(Arrays.asList(origins.split(",")));
        c.setAllowedMethods(List.of("GET","POST","PATCH","PUT","OPTIONS"));
        c.setAllowedHeaders(List.of("Authorization","Content-Type","If-Match","Idempotency-Key"));
        var source=new UrlBasedCorsConfigurationSource();source.registerCorsConfiguration("/**",c);return source;
    }
}
