package com.dgt.backend.productbarcodes.service;

import com.dgt.backend.productbarcodes.repository.BarcodeLookupRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BarcodeLookupServiceTest {

    @Mock BarcodeLookupRepository repository;
    @InjectMocks BarcodeLookupService service;

    @Test
    void lookup_found_returnsFirstRow() {
        Map<String, Object> row = Map.of("product_id", 1L, "barcode", "012345678901");
        when(repository.lookup(anyString(), anyString())).thenReturn(List.of(row));
        Map<String, Object> result = service.lookup("STORE1", "012345678901");
        assertThat(result).containsKey("product_id");
    }

    @Test
    void lookup_notFound_throwsNotFound() {
        when(repository.lookup(anyString(), anyString())).thenReturn(List.of());
        assertThatThrownBy(() -> service.lookup("STORE1", "000000000000"))
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
