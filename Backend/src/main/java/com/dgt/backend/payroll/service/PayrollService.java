package com.dgt.backend.payroll.service;

import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class PayrollService {
    public void unavailable() {
        log.warn("Payroll service requested but is not yet implemented");
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED,"The inspected database has employee compensation and time entries but no payroll-result tables. Payroll storage and calculation rules require confirmation.");
    }
}
