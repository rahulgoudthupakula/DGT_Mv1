package com.dgt.backend.productbarcodes.controller;

import com.dgt.backend.access.PagePermissions;
import com.dgt.backend.productbarcodes.service.BarcodeLookupService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.security.autoconfigure.SecurityAutoConfiguration;
import org.springframework.boot.security.autoconfigure.web.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    value = BarcodeLookupController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class}
)
@TestPropertySource(properties = "spring.jackson.property-naming-strategy=SNAKE_CASE")
class BarcodeLookupControllerTest {

    @Autowired MockMvc mockMvc;
    @MockitoBean BarcodeLookupService service;
    @MockitoBean PagePermissions pagePermissions;

    @Test
    void lookup_found_returns200() throws Exception {
        when(service.lookup(anyString(), anyString())).thenReturn(Map.of("product_id", 1, "barcode", "012345678901"));
        mockMvc.perform(get("/api/v1/barcode-lookup")
                .param("storeId", "STORE1")
                .param("barcode", "012345678901"))
            .andExpect(status().isOk());
    }

    @Test
    void lookup_notFound_returns404() throws Exception {
        when(service.lookup(anyString(), anyString())).thenThrow(new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.NOT_FOUND));
        mockMvc.perform(get("/api/v1/barcode-lookup")
                .param("storeId", "STORE1")
                .param("barcode", "000000000000"))
            .andExpect(status().isNotFound());
    }
}
