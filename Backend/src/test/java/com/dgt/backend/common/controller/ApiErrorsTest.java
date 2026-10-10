package com.dgt.backend.common.controller;

import com.dgt.backend.access.PagePermissions;
import com.dgt.backend.inventory.controller.InventoryController;
import com.dgt.backend.inventory.service.InventoryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.security.autoconfigure.SecurityAutoConfiguration;
import org.springframework.boot.security.autoconfigure.web.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    value = InventoryController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class}
)
@TestPropertySource(properties = "spring.jackson.property-naming-strategy=SNAKE_CASE")
class ApiErrorsTest {

    @Autowired MockMvc mockMvc;
    @MockitoBean InventoryService inventoryService;
    @MockitoBean PagePermissions pagePermissions;

    @Test
    void responseStatusException_4xx_returns4xxStatus() throws Exception {
        when(inventoryService.get(1L)).thenThrow(
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));

        mockMvc.perform(get("/api/v1/inventory/1"))
            .andExpect(status().isNotFound());
    }

    @Test
    void responseStatusException_5xx_returns5xxStatus() throws Exception {
        when(inventoryService.get(2L)).thenThrow(
            new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Internal error"));

        mockMvc.perform(get("/api/v1/inventory/2"))
            .andExpect(status().isInternalServerError());
    }

    @Test
    void dataIntegrityViolationException_returns409() throws Exception {
        when(inventoryService.get(3L)).thenThrow(
            new DataIntegrityViolationException("Unique constraint violated"));

        mockMvc.perform(get("/api/v1/inventory/3"))
            .andExpect(status().isConflict());
    }

    @Test
    void unhandledException_returns500() throws Exception {
        when(inventoryService.get(4L)).thenThrow(new RuntimeException("Unexpected failure"));

        mockMvc.perform(get("/api/v1/inventory/4"))
            .andExpect(status().isInternalServerError());
    }

    @Test
    void responseStatusException_403_returns403() throws Exception {
        when(inventoryService.get(5L)).thenThrow(
            new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden"));

        mockMvc.perform(get("/api/v1/inventory/5"))
            .andExpect(status().isForbidden());
    }

    @Test
    void responseStatusException_400_returns400() throws Exception {
        when(inventoryService.get(6L)).thenThrow(
            new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bad request"));

        mockMvc.perform(get("/api/v1/inventory/6"))
            .andExpect(status().isBadRequest());
    }
}
