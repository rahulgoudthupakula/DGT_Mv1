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

@Service
public class BrandService {
    private final BrandRepository repository;
    public BrandService(BrandRepository repository) { this.repository = repository; }

    public PageResponse<BrandResponse> list(int page, int size) {
        var p = repository.findAll(PageRequest.of(page, size, Sort.by("brandId")));
        return new PageResponse<>(p.getContent().stream().map(BrandResponse::from).toList(), page, size, p.getTotalElements());
    }

    public BrandResponse get(Long id) {
        return BrandResponse.from(repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found")));
    }

    @Transactional
    public BrandResponse create(CreateBrandRequest req) {
        var entity = Brand.builder()
                .brandName(req.brandName())
                .description(req.description())
                .build();
        return BrandResponse.from(repository.save(entity));
    }

    @Transactional
    public BrandResponse update(Long id, UpdateBrandRequest req) {
        var entity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));
        if (req.brandName() != null) entity.setBrandName(req.brandName());
        if (req.description() != null) entity.setDescription(req.description());
        return BrandResponse.from(repository.save(entity));
    }
}
