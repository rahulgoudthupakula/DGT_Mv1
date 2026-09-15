package com.dgt.backend.payroll.service;

import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PayrollService {
    public void unavailable() {
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED,"The inspected database has employee compensation and time entries but no payroll-result tables. Payroll storage and calculation rules require confirmation.");
    }
}
