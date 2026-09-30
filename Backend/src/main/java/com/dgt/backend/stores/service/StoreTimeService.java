package com.dgt.backend.stores.service;

import java.time.*;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.dgt.backend.stores.repository.StoreRepository;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class StoreTimeService {
    private final StoreRepository repository;
    public StoreTimeService(StoreRepository repository) { this.repository=repository; }
    public record BusinessDay(String dgtId,String timezone,LocalDate date,Instant startInclusive,Instant endExclusive) {}
    public BusinessDay businessDay(String id,LocalDate date) {
        log.debug("Resolving business day store={} date={}", id, date);
        String timezone=repository.findById(id).orElseThrow(() -> {
            log.warn("Store not found for business day id={}", id);
            return new ResponseStatusException(HttpStatus.NOT_FOUND, "Store not found");
        }).getTimezone();
        if(timezone==null) throw new ResponseStatusException(HttpStatus.CONFLICT,"Set this store's timezone before using local business dates");
        return window(id,timezone,date);
    }
    public static BusinessDay window(String id,String timezone,LocalDate date) {
        ZoneId zone=ZoneId.of(timezone);
        Instant start=date.atStartOfDay(zone).toInstant();
        Instant end=date.plusDays(1).atStartOfDay(zone).toInstant();
        if(!end.isAfter(start)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"This local date does not exist in the selected timezone");
        return new BusinessDay(id,timezone,date,start,end);
    }
}
