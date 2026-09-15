package com.dgt.backend.common.service;

import java.util.*;
import java.math.*;
import java.time.*;
import org.springframework.stereotype.Component;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;
import com.dgt.backend.common.database.*;

@Component
public class WriteValidator {
    private final ObjectMapper json;
    private final com.dgt.backend.departments.service.DepartmentRules departmentRules;
    public WriteValidator(ObjectMapper json,com.dgt.backend.departments.service.DepartmentRules departmentRules) { this.json=json; this.departmentRules=departmentRules; }
    public Map<String,Object> validate(Table table,Map<String,Object> values,boolean create) {
        if(!table.masterWritable()) throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED,
            "Writes to "+table.name()+" require an approved workflow. Read APIs and entity mappings are available.");
        if(values==null || !create && values.isEmpty()) throw bad("Request body must contain fields");
        var result=new LinkedHashMap<String,Object>();
        for(var entry:values.entrySet()) {
            Column c=table.columns().stream().filter(col -> col.name().equals(entry.getKey())).findFirst()
                .orElseThrow(() -> bad("Unknown field: "+entry.getKey()));
            if(c.readOnly() || !create && c.name().equals(table.key())) throw bad("Read-only field: "+c.name());
            Object v=entry.getValue();
            if(v==null) { if(!c.nullable()) throw bad(c.name()+" cannot be null"); result.put(c.name(),null); continue; }
            try { result.put(c.name(),convert(c,v)); }
            catch(RuntimeException ex) { throw bad("Invalid value for "+c.name()+" ("+c.type()+")"); }
        }
        if(table.name().equals("stores") && result.get("timezone")!=null) {
            String zone=(String)result.get("timezone");
            if(!(zone.equals("UTC") || zone.contains("/")) || !ZoneId.getAvailableZoneIds().contains(zone))
                throw bad("timezone must be an IANA zone such as America/New_York; offsets are not supported");
        }
        if(create) departmentRules.create(table.name(),result);
        if(create) for(Column c:table.columns()) {
            if(!c.nullable() && !c.hasDefault() && !c.readOnly() && !values.containsKey(c.name())) throw bad("Missing required field: "+c.name());
        }
        return result;
    }
    public void validateUpdate(com.dgt.backend.common.database.Table table,Object id,Map<String,Object> values) {
        departmentRules.update(table.name(),id,values);
    }
    private Object convert(Column c,Object v) {
        return switch(c.type()) {
            case "varchar","text" -> {
                if(!(v instanceof String s) || c.maxLength()>0 && s.length()>c.maxLength()) throw new IllegalArgumentException();
                yield s;
            }
            case "int8" -> number(v).longValueExact();
            case "int4" -> number(v).intValueExact();
            case "numeric" -> {
                BigDecimal n=number(v);
                if(c.precision()>0) {
                    n=n.setScale(c.scale(),RoundingMode.UNNECESSARY);
                    if(n.precision()>c.precision()) throw new IllegalArgumentException();
                }
                yield n;
            }
            case "bool" -> { if(!(v instanceof Boolean)) throw new IllegalArgumentException(); yield v; }
            case "date" -> LocalDate.parse((String)v);
            case "time" -> LocalTime.parse((String)v);
            case "timestamptz" -> OffsetDateTime.parse((String)v);
            case "jsonb" -> json.writeValueAsString(v);
            default -> throw new IllegalArgumentException();
        };
    }
    private BigDecimal number(Object v) {
        if(!(v instanceof Number)) throw new IllegalArgumentException();
        return new BigDecimal(v.toString());
    }
    private ResponseStatusException bad(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST,message); }
}
