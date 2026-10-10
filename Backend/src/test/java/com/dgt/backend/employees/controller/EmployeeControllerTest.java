package com.dgt.backend.employees.controller;

import com.dgt.backend.employees.dto.*;
import com.dgt.backend.employees.service.EmployeeService;
import com.dgt.backend.common.dto.PageResponse;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.security.autoconfigure.SecurityAutoConfiguration;
import org.springframework.boot.security.autoconfigure.web.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import com.dgt.backend.access.PagePermissions;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.*;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    value = EmployeeController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class}
)
@TestPropertySource(properties = "spring.jackson.property-naming-strategy=SNAKE_CASE")
class EmployeeControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockitoBean EmployeeService service;
    @MockitoBean PagePermissions pagePermissions;

    private EmployeeResponse sampleResponse() {
        return new EmployeeResponse(1L, LocalDate.of(2024,1,15), null, "FULL_TIME", 100L, null, null);
    }

    @Test
    void list_returns200() throws Exception {
        when(service.list(0, 50)).thenReturn(new PageResponse<>(List.of(sampleResponse()), 0, 50, 1L));
        mockMvc.perform(get("/api/v1/employees"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    void getById_returns200() throws Exception {
        when(service.get(1L)).thenReturn(sampleResponse());
        mockMvc.perform(get("/api/v1/employees/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.employee_id").value(1));
    }

    @Test
    void getById_notFound_returns404() throws Exception {
        when(service.get(99L)).thenThrow(new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.NOT_FOUND));
        mockMvc.perform(get("/api/v1/employees/99"))
            .andExpect(status().isNotFound());
    }

    @Test
    void create_validRequest_returns201() throws Exception {
        var req = new CreateEmployeeRequest(LocalDate.of(2024,1,15), null, "FULL_TIME", 100L);
        when(service.create(any())).thenReturn(sampleResponse());
        mockMvc.perform(post("/api/v1/employees")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated());
    }

    @Test
    void update_returns200() throws Exception {
        var req = new UpdateEmployeeRequest(null, LocalDate.of(2025,6,1), null, null);
        when(service.update(eq(1L), any())).thenReturn(sampleResponse());
        mockMvc.perform(patch("/api/v1/employees/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk());
    }

    @Test
    void update_notFound_returns404() throws Exception {
        when(service.update(eq(99L), any())).thenThrow(new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.NOT_FOUND));
        mockMvc.perform(patch("/api/v1/employees/99")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpdateEmployeeRequest(null, null, null, null))))
            .andExpect(status().isNotFound());
    }
}
