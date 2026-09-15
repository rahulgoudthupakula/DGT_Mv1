package com.dgt.backend.reports.repository;

import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import com.dgt.backend.reports.entity.*;
import static com.dgt.backend.reports.database.ReportsDatabase.*;

@Repository
public class ReportsRepository {
    private final JdbcTemplate db;
    public ReportsRepository(JdbcTemplate db) { this.db=db; }
    public List<SalesSummary> sales(String store,OffsetDateTime from,OffsetDateTime to) {
        return db.query(SALES,(rs,n) -> new SalesSummary(rs.getObject("sale_date",LocalDate.class),rs.getLong("transactions"),rs.getBigDecimal("subtotal"),rs.getBigDecimal("tax_amount"),rs.getBigDecimal("total_amount")),store,from,to);
    }
    public List<InventorySnapshot> inventory(String store,int page,int size) {
        return db.query(INVENTORY,(rs,n) -> new InventorySnapshot(rs.getLong("inventory_id"),rs.getString("dgt_id"),rs.getLong("product_id"),rs.getString("product_name"),rs.getBigDecimal("available_quantity"),rs.getBigDecimal("cost"),rs.getBigDecimal("return_cost")),store,size,(long)page*size);
    }
}
