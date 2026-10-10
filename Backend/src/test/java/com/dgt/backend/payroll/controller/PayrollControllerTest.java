package com.dgt.backend.payroll.controller;

import com.dgt.backend.access.PagePermissions;
import com.dgt.backend.payroll.service.PayrollService;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.security.autoconfigure.SecurityAutoConfiguration;
import org.springframework.boot.security.autoconfigure.web.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    value = PayrollController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class}
)
@TestPropertySource(properties = "spring.jackson.property-naming-strategy=SNAKE_CASE")
class PayrollControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockitoBean PayrollService service;
    @MockitoBean PagePermissions pagePermissions;

    @Test
    void get_returns501() throws Exception {
        doThrow(new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.NOT_IMPLEMENTED)).when(service).unavailable();
        mockMvc.perform(get("/api/v1/payroll"))
            .andExpect(status().isNotImplemented());
    }

    @Test
    void create_returns501() throws Exception {
        doThrow(new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.NOT_IMPLEMENTED)).when(service).unavailable();
        mockMvc.perform(post("/api/v1/payroll")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("test", "data"))))
            .andExpect(status().isNotImplemented());
    }
}
