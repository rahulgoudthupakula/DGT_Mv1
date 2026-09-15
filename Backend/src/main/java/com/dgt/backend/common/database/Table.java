package com.dgt.backend.common.database;

import java.util.List;

public record Table(String name,String key,String module,boolean masterWritable,List<Column> columns) {
    public Column column(String name) {
        return columns.stream().filter(c -> c.name().equals(name)).findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Unknown column"));
    }
    public String selectColumns() {
        return String.join(",", columns.stream().filter(c -> !c.name().equals("password_hash"))
            .map(c -> "\""+c.name()+"\"").toList());
    }
    public String qualifiedName() { return "public.\""+name+"\""; }
}
