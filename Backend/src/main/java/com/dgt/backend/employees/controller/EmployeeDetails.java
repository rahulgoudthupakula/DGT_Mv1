package com.dgt.backend.employees.controller;
import com.dgt.backend.access.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.*;import java.time.*;import java.math.BigDecimal;
@Component
public class EmployeeDetails {
 private final ScopedAccess a;public EmployeeDetails(ScopedAccess a){this.a=a;}
 public record Deposit(String bankName,String accountHolder,String accountType,String accountLastFour,String routingNumber,boolean active){}
 public record Deduction(String type,String calculation,BigDecimal amount,LocalDate effectiveFrom,LocalDate effectiveTo,boolean active){}
 public record Input(String jobTitle,String department,Deposit deposit,List<Deduction> deductions){}
 private ResponseStatusException bad(String s){return new ResponseStatusException(HttpStatus.BAD_REQUEST,s);}
 public List<Map<String,Object>> departments(String store){return a.db.queryForList("SELECT 'default-'||d.department_id AS id,d.department_name AS name FROM departments d WHERE d.is_default AND NOT EXISTS(SELECT 1 FROM store_departments sd WHERE sd.dgt_id=? AND sd.department_id=d.department_id AND sd.source_type='DEFAULT' AND NOT sd.is_active) UNION ALL SELECT 'store-'||store_department_id,store_department_name FROM store_departments WHERE dgt_id=? AND is_active AND (source_type<>'DEFAULT' OR department_id IS NULL) ORDER BY name",store,store);}
 public void enrich(Map<String,Object> row){long id=((Number)row.get("id")).longValue();var deposit=a.db.queryForList("SELECT bank_name,account_holder,account_type,account_last_four,routing_number,active,is_test FROM employee_deposit_instructions WHERE employee_id=?",id);row.put("deposit",deposit.isEmpty()?null:Rows.normalize(deposit.getFirst()));row.put("deductions",a.db.queryForList("SELECT deduction_type,calculation_type,amount,frequency,effective_from,effective_to,active FROM employee_deductions WHERE employee_id=? ORDER BY deduction_type",id).stream().map(Rows::normalize).toList());}
 private String text(String s,int max){if(s==null||s.isBlank()||s.strip().length()>max)throw bad("Complete deposit fields within their length limits");return s.strip();}
 public void save(String store,long id,Input in){if(in==null)return;
  if(in.jobTitle()!=null&&in.jobTitle().length()>100)throw bad("Job title maximum is 100 characters");
  String dep=in.department();Long defaultId=null,storeId=null;
  if(dep!=null&&!dep.isBlank()){
   if(departments(store).stream().noneMatch(d->dep.equals(d.get("id"))))throw bad("Choose an active department for this store");
   if(dep.startsWith("default-"))defaultId=Long.valueOf(dep.substring(8));else storeId=Long.valueOf(dep.substring(6));
  }
  a.db.update("UPDATE employee_store_assignments SET job_title=?,department_id=?,store_department_id=?,updated_at=CURRENT_TIMESTAMP WHERE employee_id=? AND dgt_id=?",in.jobTitle()==null?null:in.jobTitle().strip(),defaultId,storeId,id,store);
  if(in.deposit()!=null){var d=in.deposit();String bank=text(d.bankName(),100),holder=text(d.accountHolder(),200);
   if(!Set.of("Checking","Savings").contains(d.accountType()==null?"":d.accountType())||d.accountLastFour()==null||!d.accountLastFour().matches("[0-9]{4}")||d.routingNumber()==null||!d.routingNumber().matches("[0-9]{9}"))throw bad("Use Checking/Savings, four account digits and nine test routing digits");
   a.db.update("INSERT INTO employee_deposit_instructions(employee_id,bank_name,account_holder,account_type,account_last_four,routing_number,active) VALUES (?,?,?,?,?,?,?) ON CONFLICT(employee_id) DO UPDATE SET bank_name=excluded.bank_name,account_holder=excluded.account_holder,account_type=excluded.account_type,account_last_four=excluded.account_last_four,routing_number=excluded.routing_number,active=excluded.active,updated_at=CURRENT_TIMESTAMP",id,bank,holder,d.accountType(),d.accountLastFour(),d.routingNumber(),d.active());
  }
  if(in.deductions()!=null){Set<String> seen=new HashSet<>();for(var d:in.deductions()){
   if(d==null||!Set.of("HEALTH_INSURANCE","RETIREMENT").contains(d.type()==null?"":d.type())||!seen.add(d.type()))throw bad("Choose unique supported deduction types");
   String expected=d.type().equals("RETIREMENT")?"PERCENT":"FIXED";
   if(!expected.equals(d.calculation())||d.amount()==null||d.amount().signum()<0||d.amount().scale()>2||d.amount().compareTo(new BigDecimal(expected.equals("PERCENT")?"100":"9999999999.99"))>0||d.effectiveFrom()==null||(d.effectiveTo()!=null&&d.effectiveTo().isBefore(d.effectiveFrom())))throw bad("Invalid deduction amount or effective dates");
   a.db.update("INSERT INTO employee_deductions(employee_id,deduction_type,calculation_type,amount,frequency,effective_from,effective_to,active) VALUES (?,?,?,?,'PER_PAY_PERIOD',?,?,?) ON CONFLICT(employee_id,deduction_type) DO UPDATE SET calculation_type=excluded.calculation_type,amount=excluded.amount,effective_from=excluded.effective_from,effective_to=excluded.effective_to,active=excluded.active,updated_at=CURRENT_TIMESTAMP",id,d.type(),expected,d.amount(),d.effectiveFrom(),d.effectiveTo(),d.active());
  }}
 }
}
