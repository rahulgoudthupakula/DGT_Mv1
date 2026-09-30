package com.dgt.backend.reports.service;

import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.dgt.backend.reports.entity.*;
import com.dgt.backend.reports.repository.ReportsRepository;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ReportsService {
    private final ReportsRepository repository;
    public ReportsService(ReportsRepository repository) { this.repository=repository; }
    public List<SalesSummary> sales(String store,OffsetDateTime from,OffsetDateTime to) {
        log.debug("Fetching sales report store={} from={} to={}", store, from, to);
        if(!to.isAfter(from) || to.isAfter(from.plusYears(1))) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Use a positive report interval of at most one year");
        return repository.sales(store,from,to);
    }
    public List<InventorySnapshot> inventory(String store,int page,int size) {
        log.debug("Fetching inventory snapshot store={} page={} size={}", store, page, size);
        if(page<0 || page>1_000_000 || size<1 || size>200) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid pagination");
        return repository.inventory(store,page,size);
    }
}
