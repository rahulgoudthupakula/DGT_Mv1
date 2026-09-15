package com.dgt.backend.employees.database;

import java.util.List;
import com.dgt.backend.common.database.Column;
import com.dgt.backend.common.database.Table;
public final class EmployeeTimeOffRequestDatabase {
    private EmployeeTimeOffRequestDatabase() {}
    public static final Table TABLE = new Table("employee_time_off_requests","time_off_request_id","employees",false,List.of(
        new Column("time_off_request_id","int8",false,true,true,0,64,0),
        new Column("employee_id","int8",false,false,false,0,64,0),
        new Column("request_type","jsonb",false,false,false,0,0,0),
        new Column("start_date","date",false,false,false,0,0,0),
        new Column("end_date","date",false,false,false,0,0,0),
        new Column("hours_requested","numeric",true,false,false,0,8,2),
        new Column("reason","varchar",false,false,false,500,0,0),
        new Column("status_type_id","int8",false,false,false,0,64,0),
        new Column("requested_at","timestamptz",false,true,false,0,0,0),
        new Column("reviewed_by","int8",true,false,false,0,64,0),
        new Column("reviewed_at","timestamptz",true,false,false,0,0,0),
        new Column("rejected_reason","varchar",true,false,false,500,0,0),
        new Column("created_at","timestamptz",false,true,true,0,0,0),
        new Column("updated_at","timestamptz",false,true,true,0,0,0)));
}
