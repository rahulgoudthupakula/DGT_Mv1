package com.dgt.backend.common.entity;

import java.util.*;
import java.time.*;
import java.sql.*;
import tools.jackson.databind.*;
import tools.jackson.databind.json.JsonMapper;

public final class Rows {
    private static final ObjectMapper JSON=JsonMapper.builder().build();
    private Rows() {}
    public static Map<String,Object> normalize(Map<String,Object> row) {
        Map<String,Object> result=new LinkedHashMap<>();
        row.forEach((key,value) -> {
            if(key.equals("password_hash")) return;
            if(value instanceof java.sql.Date d) value=d.toLocalDate();
            else if(value instanceof Time t) value=t.toLocalTime();
            else if(value instanceof Timestamp t) value=t.toInstant().atOffset(ZoneOffset.UTC);
            else if(value!=null && value.getClass().getName().equals("org.postgresql.util.PGobject")) value=JSON.readTree(value.toString());
            result.put(key,value);
        });
        return result;
    }
    public static <T> T value(Map<String,Object> row,String column,Class<T> type) {
        Object value=row.get(column);
        if(value==null) return null;
        if(type==Long.class && value instanceof Number n) value=n.longValue();
        if(type==Integer.class && value instanceof Number n) value=n.intValue();
        return type.cast(value);
    }
}
