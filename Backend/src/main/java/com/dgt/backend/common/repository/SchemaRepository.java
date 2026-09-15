package com.dgt.backend.common.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.dgt.backend.common.database.Table;
import com.dgt.backend.common.entity.Rows;

/** SQL identifiers are generated from the inspected schema, never supplied by API callers. */
@Repository
public class SchemaRepository {
    private final JdbcTemplate db;
    public SchemaRepository(JdbcTemplate db) { this.db=db; }
    private static final Set<String> ARCHIVABLE=Set.of("product_barcodes","promotion_products","product_price_groups","product_vendors","grocery_invoice_items","fuel_delivery_lines","fuel_adjustment_lines","daily_expenses","daily_closing_tenders","daily_closing_deposits","employee_compensation");
    private String current(Table t) { return ARCHIVABLE.contains(t.name())?"archived_at IS NULL":"true"; }
    private String projection(Table t) { return t.selectColumns()+",xmin::text AS \"_version\""; }
    public Map<String,Object> list(Table t,int page,int size) {
        if(page<0 || page>1_000_000 || size<1 || size>200) throw bad("page must be 0..1000000; size must be 1..200");
        var items=db.queryForList("SELECT "+projection(t)+" FROM "+t.qualifiedName()+" WHERE "+current(t)+" ORDER BY \""+t.key()+"\" LIMIT ? OFFSET ?",size,(long)page*size);
        return Map.of("items",items.stream().map(Rows::normalize).toList(),"page",page,"size",size,
            "total",db.queryForObject("SELECT count(*) FROM "+t.qualifiedName()+" WHERE "+current(t),Long.class));
    }
    public Map<String,Object> get(Table t,Object id) {
        var rows=db.queryForList("SELECT "+projection(t)+" FROM "+t.qualifiedName()+" WHERE "+current(t)+" AND \""+t.key()+"\"=?",id);
        if(rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Record not found");
        return Rows.normalize(rows.getFirst());
    }
    public Map<String,Object> insert(Table t,Map<String,Object> values) {
        var cols=new ArrayList<>(values.keySet());
        String insert=cols.isEmpty()?" DEFAULT VALUES":" ("+String.join(",",cols.stream().map(c -> "\""+c+"\"").toList())+") VALUES ("+
            String.join(",",cols.stream().map(c -> placeholder(t,c)).toList())+")";
        return Rows.normalize(db.queryForMap("INSERT INTO "+t.qualifiedName()+insert+" RETURNING "+projection(t),values.values().toArray()));
    }
    public Map<String,Object> update(Table t,Object id,Map<String,Object> values,String expected) {
        if(expected==null || !expected.matches("\"?[0-9]+\"?")) throw bad("If-Match must contain the _version value from the last read");
        get(t,id);
        var clauses=new ArrayList<String>();
        for(String c:values.keySet()) clauses.add("\""+c+"\"="+placeholder(t,c));
        if(t.columns().stream().anyMatch(c -> c.name().equals("updated_at"))) clauses.add("updated_at=CURRENT_TIMESTAMP");
        if(t.columns().stream().anyMatch(c -> c.name().equals("updated_date"))) clauses.add("updated_date=CURRENT_TIMESTAMP");
        var args=new ArrayList<>(values.values()); args.add(id); args.add(expected.replace("\"",""));
        var rows=db.queryForList("UPDATE "+t.qualifiedName()+" SET "+String.join(",",clauses)+" WHERE "+current(t)+" AND \""+t.key()+"\"=? AND xmin::text=? RETURNING "+projection(t),args.toArray());
        if(rows.isEmpty()) throw new ResponseStatusException(HttpStatus.CONFLICT,"Record changed; reload it before updating");
        return Rows.normalize(rows.getFirst());
    }
    private String placeholder(Table t,String c) { return t.column(c).type().equals("jsonb")?"CAST(? AS jsonb)":"?"; }
    private ResponseStatusException bad(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST,message); }
}
