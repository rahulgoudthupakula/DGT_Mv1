package com.dgt.backend.invoices.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class InvoiceAuditLogDatabase {
    private InvoiceAuditLogDatabase() {}
    public static final Table TABLE = new Table("invoice_audit_log","invoice_audit_log_id","invoices",false,List.of(
        new Column("invoice_audit_log_id","int8",false,true,true,0,64,0),
        new Column("invoice_id","int8",false,false,false,0,64,0),
        new Column("action_type","varchar",false,false,false,50,0,0),
        new Column("action_by","int8",false,false,false,0,64,0),
        new Column("old_value","text",true,false,false,0,0,0),
        new Column("new_value","text",true,false,false,0,0,0)));
}
