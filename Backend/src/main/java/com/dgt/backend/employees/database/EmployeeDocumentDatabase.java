package com.dgt.backend.employees.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class EmployeeDocumentDatabase {
    private EmployeeDocumentDatabase() {}
    public static final Table TABLE = new Table("employee_documents","employee_document_id","employees",true,List.of(
        new Column("employee_document_id","int8",false,true,true,0,64,0),
        new Column("employee_id","int8",false,false,false,0,64,0),
        new Column("document_type","varchar",false,false,false,100,0,0),
        new Column("document_name","varchar",false,false,false,255,0,0),
        new Column("document_url","text",false,false,false,0,0,0),
        new Column("uploaded_at","timestamptz",false,true,false,0,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
