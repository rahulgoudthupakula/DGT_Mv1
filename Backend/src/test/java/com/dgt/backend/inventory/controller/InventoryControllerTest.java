package com.dgt.backend.inventory.controller;

import com.dgt.backend.inventory.dto.*;
import com.dgt.backend.inventory.service.InventoryService;
import com.dgt.backend.common.dto.PageResponse;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.boot.security.autoconfigure.SecurityAutoConfiguration;
import org.springframework.boot.security.autoconfigure.web.servlet.SecurityFilterAutoConfiguration;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import com.dgt.backend.access.PagePermissions;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    value = InventoryController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class}
)
@TestPropertySource(properties = "spring.jackson.property-naming-strategy=SNAKE_CASE")
class InventoryControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockitoBean InventoryService service;
    @MockitoBean PagePermissions pagePermissions;

    private InventoryResponse sampleResponse() {
        return new InventoryResponse(1L, "DGT-1001", 10L,
            new BigDecimal("100.000"), new BigDecimal("5.00"), new BigDecimal("3.00"), null, null);
    }

    @Test
    void list_returns200WithPageResponse() throws Exception {
        var page = new PageResponse<>(List.of(sampleResponse()), 0, 50, 1L);
        when(service.list(0, 50)).thenReturn(page);

        mockMvc.perform(get("/api/v1/inventory").param("page", "0").param("size", "50"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items").isArray())
            .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    void getById_existingId_returns200() throws Exception {
        when(service.get(1L)).thenReturn(sampleResponse());

        mockMvc.perform(get("/api/v1/inventory/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.inventory_id").value(1));
    }

    @Test
    void getById_nonExistingId_returns404() throws Exception {
        when(service.get(99L)).thenThrow(
            new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.NOT_FOUND, "Record not found"));

        mockMvc.perform(get("/api/v1/inventory/99"))
            .andExpect(status().isNotFound());
    }

    @Test
    void create_validRequest_returns201() throws Exception {
        var req = new CreateInventoryRequest("DGT-1001", 10L,
            new BigDecimal("100.000"), new BigDecimal("5.00"), new BigDecimal("3.00"));
        when(service.create(any())).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/v1/inventory")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.inventory_id").value(1));
    }

    @Test
    void create_missingRequiredField_returns400() throws Exception {
        var req = new CreateInventoryRequest(null, null, null, null, null);

        mockMvc.perform(post("/api/v1/inventory")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void update_existingId_returns200() throws Exception {
        var req = new UpdateInventoryRequest(null, null, new BigDecimal("200.000"), null, null);
        when(service.update(eq(1L), any())).thenReturn(sampleResponse());

        mockMvc.perform(patch("/api/v1/inventory/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk());
    }

    @Test
    void update_nonExistingId_returns404() throws Exception {
        when(service.update(eq(99L), any())).thenThrow(
            new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.NOT_FOUND, "Record not found"));

        mockMvc.perform(patch("/api/v1/inventory/99")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpdateInventoryRequest(null, null, null, null, null))))
            .andExpect(status().isNotFound());
    }
}
