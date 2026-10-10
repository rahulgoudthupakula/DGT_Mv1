package com.dgt.backend.departments.controller;

import com.dgt.backend.departments.dto.*;
import com.dgt.backend.departments.service.DepartmentService;
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

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    value = DepartmentController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class}
)
@TestPropertySource(properties = "spring.jackson.property-naming-strategy=SNAKE_CASE")
class DepartmentControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockitoBean DepartmentService service;
    @MockitoBean PagePermissions pagePermissions;

    private DepartmentResponse sampleResponse() {
        return new DepartmentResponse(1L, "Beverages", false);
    }

    @Test
    void list_returns200() throws Exception {
        when(service.list(0, 50)).thenReturn(new PageResponse<>(List.of(sampleResponse()), 0, 50, 1L));
        mockMvc.perform(get("/api/v1/departments"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items[0].department_name").value("Beverages"));
    }

    @Test
    void getById_returns200() throws Exception {
        when(service.get(1L)).thenReturn(sampleResponse());
        mockMvc.perform(get("/api/v1/departments/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.department_id").value(1));
    }

    @Test
    void getById_notFound_returns404() throws Exception {
        when(service.get(99L)).thenThrow(new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.NOT_FOUND));
        mockMvc.perform(get("/api/v1/departments/99"))
            .andExpect(status().isNotFound());
    }

    @Test
    void create_validRequest_returns201() throws Exception {
        var req = new CreateDepartmentRequest("Beverages", false);
        when(service.create(any())).thenReturn(sampleResponse());
        mockMvc.perform(post("/api/v1/departments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated());
    }

    @Test
    void create_missingRequired_returns400() throws Exception {
        var req = new CreateDepartmentRequest(null, null);
        mockMvc.perform(post("/api/v1/departments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void update_returns200() throws Exception {
        var req = new UpdateDepartmentRequest("Snacks", null);
        when(service.update(eq(1L), any())).thenReturn(sampleResponse());
        mockMvc.perform(patch("/api/v1/departments/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk());
    }
}
