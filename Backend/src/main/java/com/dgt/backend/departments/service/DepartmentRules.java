package com.dgt.backend.departments.service;

import java.util.*;
import org.springframework.stereotype.Component;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.dgt.backend.departments.repository.DepartmentRulesRepository;

/** Store APIs cannot mutate the global/default definitions or reclassify existing rows. */
@Component
public class DepartmentRules {
    private final DepartmentRulesRepository repository;
    public DepartmentRules(DepartmentRulesRepository repository) { this.repository=repository; }
    public void create(String table,Map<String,Object> values) {
        if(table.equals("departments")) throw forbidden("Global department definitions are read-only through store APIs");
        if(table.equals("store_departments")) {
            values.putIfAbsent("source_type","CUSTOM");
            String source=(String)values.get("source_type");
            if("CUSTOM".equals(source)) {
                if(values.get("department_id")!=null) throw bad("Custom departments must not reference a global default");
            } else if("DEFAULT".equals(source)) {
                if(values.get("department_id")==null) throw bad("Default department assignment requires department_id");
                var definition=repository.defaultDepartment((Long)values.get("department_id"));
                if(!Boolean.TRUE.equals(definition.get("is_default"))) throw bad("Referenced department is not a default");
                if(!Objects.equals(values.get("store_department_name"),definition.get("department_name")))
                    throw bad("Default department name must match its definition");
            } else throw bad("source_type must be DEFAULT or CUSTOM");
        }
        if(table.equals("store_sub_departments")) {
            if(values.containsKey("source_type") && !"CUSTOM".equals(values.get("source_type")))
                throw forbidden("Stores can create only custom subdepartments");
            values.put("source_type","CUSTOM");
        }
    }
    public void update(String table,Object id,Map<String,Object> values) {
        if(table.equals("departments")) throw forbidden("Global department definitions are read-only through store APIs");
        if(!Set.of("store_departments","store_sub_departments").contains(table)) return;
        var current=repository.lock(table,id);
        if(!"CUSTOM".equals(current.get("source_type"))) throw forbidden("Default or unclassified departments cannot be changed through store APIs");
        if(table.equals("store_departments") && current.get("department_id")!=null)
            throw forbidden("Legacy linked custom department requires ownership review before editing");
        for(String key:List.of("source_type","dgt_id","department_id","store_department_id")) {
            if(values.containsKey(key) && !Objects.equals(values.get(key),current.get(key)))
                throw forbidden("Department ownership and source cannot be changed");
        }
    }
    private ResponseStatusException bad(String s) { return new ResponseStatusException(HttpStatus.BAD_REQUEST,s); }
    private ResponseStatusException forbidden(String s) { return new ResponseStatusException(HttpStatus.FORBIDDEN,s); }
}
