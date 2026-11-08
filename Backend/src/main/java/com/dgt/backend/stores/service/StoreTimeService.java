package com.dgt.backend.stores.service;

import java.time.*;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.dgt.backend.stores.repository.StoreRepository;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
// Translate store-local calendar dates into absolute reporting boundaries.
public class StoreTimeService {
    private final StoreRepository repository;
    public StoreTimeService(StoreRepository repository) { this.repository=repository; }
    // Represent a business day as a half-open interval: inclusive start and exclusive end.
    public record BusinessDay(String dgtId,String timezone,LocalDate date,Instant startInclusive,Instant endExclusive) {}
    // Load the store timezone; missing stores return 404 and unset timezones return 409.
    public BusinessDay businessDay(String id,LocalDate date) {
        log.debug("Resolving business day store={} date={}", id, date);
        String timezone=repository.findById(id).orElseThrow(() -> {
            log.warn("Store not found for business day id={}", id);
            return new ResponseStatusException(HttpStatus.NOT_FOUND, "Store not found");
        }).getTimezone();
        if(timezone==null) throw new ResponseStatusException(HttpStatus.CONFLICT,"Set this store's timezone before using local business dates");
        return window(id,timezone,date);
    }
    // Resolve each midnight independently so daylight-saving days need not be 24 hours long.
    public static BusinessDay window(String id,String timezone,LocalDate date) {
        ZoneId zone=ZoneId.of(timezone);
        Instant start=date.atStartOfDay(zone).toInstant();
        Instant end=date.plusDays(1).atStartOfDay(zone).toInstant();
        // Reject a local date skipped entirely by a timezone transition.
        if(!end.isAfter(start)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"This local date does not exist in the selected timezone");
        return new BusinessDay(id,timezone,date,start,end);
    }
}
