package com.dgt.backend.products.service;

import com.dgt.backend.products.dto.BrandResponse;
import com.dgt.backend.products.dto.CreateBrandRequest;
import com.dgt.backend.products.dto.UpdateBrandRequest;
import com.dgt.backend.products.entity.Brand;
import com.dgt.backend.products.repository.BrandRepository;
import com.dgt.backend.common.dto.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class BrandService {
    private final BrandRepository repository;
    public BrandService(BrandRepository repository) { this.repository = repository; }

    public PageResponse<BrandResponse> list(int page, int size) {
        log.debug("Listing brand page={} size={}", page, size);
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("brandId")));
        log.debug("Brand list: {} items total={}", p.getContent().size(), p.getTotalElements());
        return new PageResponse<>(p.getContent().stream().map(BrandResponse::from).toList(), page, size, p.getTotalElements());
    }

    public BrandResponse get(Long id) {
        log.debug("Fetching brand id={}", id);
        return BrandResponse.from(repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Brand not found id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                }));
    
    }

    @Transactional
    public BrandResponse create(CreateBrandRequest req) {
        log.info("Creating brand");
        var entity = Brand.builder()
                .brandName(req.brandName())
                .description(req.description())
                .build();
        var saved = repository.save(entity);
        log.info("Created brand id={}", saved.getBrandId());
        return BrandResponse.from(saved);
    }

    @Transactional
    public BrandResponse update(Long id, UpdateBrandRequest req) {
        log.info("Updating brand id={}", id);
        var entity = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Brand not found for update id={}", id);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
                });
        if (req.brandName() != null) entity.setBrandName(req.brandName());
        if (req.description() != null) entity.setDescription(req.description());
        var saved = repository.save(entity);
        log.info("Updated brand id={}", id);
        return BrandResponse.from(saved);
    }
}
