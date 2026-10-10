package com.dgt.backend.payroll.service;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.*;

class PayrollServiceTest {

    private final PayrollService service = new PayrollService();

    @Test
    void unavailable_throwsNotImplemented() {
        assertThatThrownBy(service::unavailable)
            .isInstanceOf(ResponseStatusException.class)
            .extracting(e -> ((ResponseStatusException) e).getStatusCode())
            .isEqualTo(HttpStatus.NOT_IMPLEMENTED);
    }
}
