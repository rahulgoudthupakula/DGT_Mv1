package com.dgt.backend.common.converter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class JsonNodeConverter implements AttributeConverter<JsonNode, String> {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    @Override
    public String convertToDatabaseColumn(JsonNode attr) {
        if (attr == null) return null;
        try { return MAPPER.writeValueAsString(attr); } catch (Exception e) { throw new RuntimeException(e); }
    }
    @Override
    public JsonNode convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        try { return MAPPER.readTree(dbData); } catch (Exception e) { throw new RuntimeException(e); }
    }
}
