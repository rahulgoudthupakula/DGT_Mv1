package com.dgt.backend.fuel.controller;

import com.dgt.backend.access.PagePermissions;
import com.dgt.backend.fuel.dto.*;
import com.dgt.backend.fuel.service.FuelInvoiceDetailService;
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
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    value = FuelInvoiceDetailController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class}
)
@TestPropertySource(properties = "spring.jackson.property-naming-strategy=SNAKE_CASE")
class FuelInvoiceDetailControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockitoBean FuelInvoiceDetailService service;
    @MockitoBean PagePermissions pagePermissions;

    private FuelInvoiceDetailResponse sampleResponse() {
        return new FuelInvoiceDetailResponse(
                1L, 1L, "DN-001", "BOL-001", "Carrier Co",
                LocalDate.of(2025, 1, 1), new BigDecimal("1000.000"),
                new BigDecimal("2500.00"), new BigDecimal("50.00"),
                OffsetDateTime.now(), OffsetDateTime.now());
    }

    @Test
    void list_returns200() throws Exception {
        when(service.list(0, 50)).thenReturn(new PageResponse<>(List.of(sampleResponse()), 0, 50, 1L));
        mockMvc.perform(get("/api/v1/fuel-invoice-details"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    void getById_returns200() throws Exception {
        when(service.get(1L)).thenReturn(sampleResponse());
        mockMvc.perform(get("/api/v1/fuel-invoice-details/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.fuel_invoice_details_id").value(1));
    }

    @Test
    void getById_notFound_returns404() throws Exception {
        when(service.get(99L)).thenThrow(new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.NOT_FOUND));
        mockMvc.perform(get("/api/v1/fuel-invoice-details/99"))
            .andExpect(status().isNotFound());
    }

    @Test
    void create_validRequest_returns201() throws Exception {
        var req = new CreateFuelInvoiceDetailRequest(1L, "DN-001", "BOL-001", "Carrier Co",
                LocalDate.of(2025, 1, 1), new BigDecimal("1000.000"),
                new BigDecimal("2500.00"), new BigDecimal("50.00"));
        when(service.create(any())).thenReturn(sampleResponse());
        mockMvc.perform(post("/api/v1/fuel-invoice-details")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated());
    }

    @Test
    void create_missingRequired_returns400() throws Exception {
        var req = new CreateFuelInvoiceDetailRequest(null, null, null, null, null, null, null, null);
        mockMvc.perform(post("/api/v1/fuel-invoice-details")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void update_returns200() throws Exception {
        var req = new UpdateFuelInvoiceDetailRequest(null, "DN-002", null, null, null, null, null, null);
        when(service.update(eq(1L), any())).thenReturn(sampleResponse());
        mockMvc.perform(patch("/api/v1/fuel-invoice-details/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk());
    }
}
