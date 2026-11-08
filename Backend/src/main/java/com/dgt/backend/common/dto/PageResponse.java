package com.dgt.backend.common.dto;
import java.util.List;

/**
 * Shared pagination envelope: items for this page, zero-based page index, requested size, and total matching records.
 */
public record PageResponse<T>(List<T> items, int page, int size, long total) {}
