package com.dgt.backend.common.service;

import java.util.*;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import com.dgt.backend.common.database.SchemaCatalog;
import com.dgt.backend.common.repository.SchemaInspectionRepository;

/** Read-only startup validation. Never creates, migrates or alters the user's schema. */
@Component
public class SchemaVerifier implements ApplicationRunner {
    private final SchemaCatalog catalog;
    private final SchemaInspectionRepository repository;
    public SchemaVerifier(SchemaCatalog catalog,SchemaInspectionRepository repository) { this.catalog=catalog; this.repository=repository; }
    @Override public void run(ApplicationArguments args) {
        var actual=repository.columnTypes();var missing=new ArrayList<String>();
        for(var table:catalog.tables()) for(var column:table.columns()) {
            String key=table.name()+"."+column.name();
            if(!column.type().equals(actual.get(key))) missing.add(key+" expected "+column.type());
        }
        if(!missing.isEmpty()) throw new IllegalStateException("Database schema does not match inspected schema: "+String.join(", ",missing));
    }
}
