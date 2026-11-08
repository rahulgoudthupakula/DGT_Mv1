package com.dgt.backend.common.converter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA conversion between Jackson JSON trees and stored JSON text; preserves null in both directions.
 */

@Converter
public class JsonNodeConverter implements AttributeConverter<JsonNode, String> {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    // Serialize a non-null JSON tree; serialization errors propagate as runtime exceptions.
    @Override
    public String convertToDatabaseColumn(JsonNode attr) {
        if (attr == null) return null;
        try { return MAPPER.writeValueAsString(attr); } catch (Exception e) { throw new RuntimeException(e); }
    }
    // Parse stored JSON text; malformed JSON fails instead of silently returning an empty value.
    @Override
    public JsonNode convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        try { return MAPPER.readTree(dbData); } catch (Exception e) { throw new RuntimeException(e); }
    }
}
