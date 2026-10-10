package com.dgt.backend.stores.controller;

import com.dgt.backend.stores.dto.*;
import com.dgt.backend.stores.service.StoreService;
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
    value = StoreController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class}
)
@TestPropertySource(properties = "spring.jackson.property-naming-strategy=SNAKE_CASE")
class StoreControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockitoBean StoreService service;
    @MockitoBean PagePermissions pagePermissions;

    private StoreResponse sampleResponse() {
        return new StoreResponse("DGT-S1", "S001", "Test Store", null, null, null, "America/New_York", null, null, null);
    }

    @Test
    void list_returns200() throws Exception {
        when(service.list(0, 50)).thenReturn(new PageResponse<>(List.of(sampleResponse()), 0, 50, 1L));
        mockMvc.perform(get("/api/v1/stores"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    void getById_returns200() throws Exception {
        when(service.get("DGT-S1")).thenReturn(sampleResponse());
        mockMvc.perform(get("/api/v1/stores/DGT-S1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.dgt_id").value("DGT-S1"));
    }

    @Test
    void getById_notFound_returns404() throws Exception {
        when(service.get("INVALID")).thenThrow(new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.NOT_FOUND));
        mockMvc.perform(get("/api/v1/stores/INVALID"))
            .andExpect(status().isNotFound());
    }

    @Test
    void create_validRequest_returns201() throws Exception {
        var req = new CreateStoreRequest("DGT-S1", "S001", "Test Store", null, null, null, "America/New_York", null);
        when(service.create(any())).thenReturn(sampleResponse());
        mockMvc.perform(post("/api/v1/stores")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated());
    }

    @Test
    void create_missingRequired_returns400() throws Exception {
        var req = new CreateStoreRequest(null, null, null, null, null, null, null, null);
        mockMvc.perform(post("/api/v1/stores")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void update_returns200() throws Exception {
        var req = new UpdateStoreRequest(null, "Updated Name", null, null, null, null, null);
        when(service.update(eq("DGT-S1"), any())).thenReturn(sampleResponse());
        mockMvc.perform(patch("/api/v1/stores/DGT-S1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk());
    }
}
