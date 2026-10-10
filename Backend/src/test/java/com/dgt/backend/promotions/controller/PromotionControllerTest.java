package com.dgt.backend.promotions.controller;

import com.dgt.backend.access.PagePermissions;
import com.dgt.backend.promotions.dto.*;
import com.dgt.backend.promotions.service.PromotionService;
import com.dgt.backend.common.dto.PageResponse;
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

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    value = PromotionController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class}
)
@TestPropertySource(properties = "spring.jackson.property-naming-strategy=SNAKE_CASE")
class PromotionControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockitoBean PromotionService service;
    @MockitoBean PagePermissions pagePermissions;

    private PromotionResponse sampleResponse() {
        return new PromotionResponse(1L, "STORE1", "Summer Sale", "PERCENT", null, null, "ACTIVE", new BigDecimal("10.00"), null, null);
    }

    @Test
    void list_returns200() throws Exception {
        when(service.list(0, 50)).thenReturn(new PageResponse<>(List.of(sampleResponse()), 0, 50, 1L));
        mockMvc.perform(get("/api/v1/promotions"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    void getById_returns200() throws Exception {
        when(service.get(1L)).thenReturn(sampleResponse());
        mockMvc.perform(get("/api/v1/promotions/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.promotion_id").value(1));
    }

    @Test
    void getById_notFound_returns404() throws Exception {
        when(service.get(99L)).thenThrow(new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.NOT_FOUND));
        mockMvc.perform(get("/api/v1/promotions/99"))
            .andExpect(status().isNotFound());
    }

    @Test
    void create_validRequest_returns201() throws Exception {
        var req = new CreatePromotionRequest("STORE1", "Summer Sale", "PERCENT", null, null, "ACTIVE", new BigDecimal("10.00"));
        when(service.create(any())).thenReturn(sampleResponse());
        mockMvc.perform(post("/api/v1/promotions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated());
    }

    @Test
    void create_missingRequired_returns400() throws Exception {
        var req = new CreatePromotionRequest(null, null, null, null, null, null, null);
        mockMvc.perform(post("/api/v1/promotions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void update_returns200() throws Exception {
        var req = new UpdatePromotionRequest(null, "Winter Sale", null, null, null, null, null);
        when(service.update(eq(1L), any())).thenReturn(sampleResponse());
        mockMvc.perform(patch("/api/v1/promotions/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk());
    }
}
