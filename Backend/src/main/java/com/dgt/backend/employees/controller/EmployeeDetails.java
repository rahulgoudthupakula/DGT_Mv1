package com.dgt.backend.employees.controller;
import com.dgt.backend.access.security.ScopedAccess;
import com.dgt.backend.common.entity.Rows;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.*;import java.time.*;import java.math.BigDecimal;

/**
 * Validates and persists employee job details, deposit instructions, and supported deductions.
 * The caller supplies employee authorization and the transaction; no bank payment is initiated here.
 */
@Component
public class EmployeeDetails {
 private final ScopedAccess a;public EmployeeDetails(ScopedAccess a){this.a=a;}
 // Deposit instructions retain only the account last four digits and the routing number.
 public record Deposit(String bankName,String accountHolder,String accountType,String accountLastFour,String routingNumber,boolean active){}
 // Supported deduction amount, calculation type, effective dates, and activation state.
 public record Deduction(String type,String calculation,BigDecimal amount,LocalDate effectiveFrom,LocalDate effectiveTo,boolean active){}
 // Optional detail section carried by the store employee form.
 public record EmergencyContact(Long id,String name,String relationship,String phone){}
 public record Input(String jobTitle,String department,Deposit deposit,List<Deduction> deductions,List<EmergencyContact> emergencyContacts){}
 private ResponseStatusException bad(String s){return new ResponseStatusException(HttpStatus.BAD_REQUEST,s);}
 // Use store-owned names and activation while preserving existing assignment keys.
 public List<Map<String,Object>> departments(String store){return a.db.queryForList("SELECT CASE WHEN department_id IS NOT NULL THEN 'default-'||department_id ELSE 'store-'||store_department_id END AS id,store_department_name AS name FROM store_departments WHERE dgt_id=? AND is_active ORDER BY name",store);}
 // Attach stored deposit instructions and deductions to a previously authorized employee row.
 public void enrich(Map<String,Object> row){long id=((Number)row.get("id")).longValue();var deposit=a.db.queryForList("SELECT bank_name,account_holder,account_type,account_last_four,routing_number,active FROM employee_deposit_instructions WHERE employee_id=?",id);row.put("emergency_contacts",a.db.queryForList("SELECT emergency_contact_id AS id,contact_name AS name,relationship,phone FROM employee_emergency_contacts WHERE employee_id=? ORDER BY emergency_contact_id",id));row.put("documents",a.db.queryForList("SELECT employee_document_id AS id,document_type,document_name,uploaded_at,document_url LIKE 'private:%' AS downloadable FROM employee_documents WHERE employee_id=? ORDER BY uploaded_at DESC,employee_document_id DESC",id).stream().map(Rows::normalize).toList());row.put("deposit",deposit.isEmpty()?null:Rows.normalize(deposit.getFirst()));row.put("deductions",a.db.queryForList("SELECT deduction_type,amount,effective_from,effective_to,active FROM employee_deductions WHERE employee_id=? ORDER BY deduction_type",id).stream().map(Rows::normalize).toList());}
 // Trim required deposit text and enforce its maximum length.
 private String contactText(String value,int max){if(value==null||value.isBlank()||value.strip().length()>max)throw bad("Complete emergency contact name, relationship and phone within their length limits");return value.strip();}
 private String text(String s,int max){if(s==null||s.isBlank()||s.strip().length()>max)throw bad("Complete deposit fields within their length limits");return s.strip();}
 // Save details within the caller transaction; a missing detail section leaves all details unchanged.
 public void save(String store,long id,Input in){if(in==null)return;
  if(in.jobTitle()!=null&&in.jobTitle().length()>100)throw bad("Job title maximum is 100 characters");
  String dep=in.department();Long defaultId=null,storeId=null;
  // Accept department identifiers only from this store active choices.
  if(dep!=null&&!dep.isBlank()){
   if(departments(store).stream().noneMatch(d->dep.equals(d.get("id"))))throw bad("Choose an active department for this store");
   if(dep.startsWith("default-"))defaultId=Long.valueOf(dep.substring(8));else storeId=Long.valueOf(dep.substring(6));
  }
  a.db.update("UPDATE employee_store_assignments SET job_title=?,department_id=?,store_department_id=?,updated_at=CURRENT_TIMESTAMP WHERE employee_id=? AND dgt_id=?",in.jobTitle()==null?null:in.jobTitle().strip(),defaultId,storeId,id,store);
  // Validate account format before upserting instructions; this does not verify bank ownership.
  if(in.deposit()!=null){var d=in.deposit();String bank=text(d.bankName(),100),holder=text(d.accountHolder(),200);
   if(!Set.of("Checking","Savings").contains(d.accountType()==null?"":d.accountType())||d.accountLastFour()==null||!d.accountLastFour().matches("[0-9]{4}")||d.routingNumber()==null||!d.routingNumber().matches("[0-9]{9}"))throw bad("Use Checking/Savings, four account digits and nine test routing digits");
   a.db.update("INSERT INTO employee_deposit_instructions(employee_id,bank_name,account_holder,account_type,account_last_four,routing_number,active) VALUES (?,?,?,?,?,?,?) ON CONFLICT(employee_id) DO UPDATE SET bank_name=excluded.bank_name,account_holder=excluded.account_holder,account_type=excluded.account_type,account_last_four=excluded.account_last_four,routing_number=excluded.routing_number,active=excluded.active,updated_at=CURRENT_TIMESTAMP",id,bank,holder,d.accountType(),d.accountLastFour(),d.routingNumber(),d.active());
  }
  if(in.emergencyContacts()!=null){
   if(in.emergencyContacts().size()>10)throw bad("Use at most 10 emergency contacts");
   Set<Long> seen=new HashSet<>();
   for(var c:in.emergencyContacts()){
    if(c==null)throw bad("Complete the emergency contact fields");
    String name=contactText(c.name(),150),relationship=contactText(c.relationship(),50),phone=contactText(c.phone(),30);
    if(!phone.matches("[+0-9(). xX-]{7,30}")||phone.replaceAll("[^0-9]","").length()<7)throw bad("Enter a valid emergency contact phone number");
    if(c.id()==null)a.db.update("INSERT INTO employee_emergency_contacts(employee_id,contact_name,relationship,phone) VALUES (?,?,?,?)",id,name,relationship,phone);
    else{
     if(!seen.add(c.id())||a.db.update("UPDATE employee_emergency_contacts SET contact_name=?,relationship=?,phone=?,updated_at=CURRENT_TIMESTAMP WHERE emergency_contact_id=? AND employee_id=?",name,relationship,phone,c.id(),id)!=1)throw bad("Emergency contact does not belong to this employee");
    }
   }
  }
  // Upsert submitted deduction types; omitted deductions remain unchanged.
  if(in.deductions()!=null){Set<String> seen=new HashSet<>();for(var d:in.deductions()){
   if(d==null||!Set.of("HEALTH_INSURANCE","RETIREMENT").contains(d.type()==null?"":d.type())||!seen.add(d.type()))throw bad("Choose unique supported deduction types");
   // Retirement uses a percentage; health insurance uses a fixed amount per pay period.
   String expected=d.type().equals("RETIREMENT")?"PERCENT":"FIXED";
   if(!expected.equals(d.calculation())||d.amount()==null||d.amount().signum()<0||d.amount().scale()>2||d.amount().compareTo(new BigDecimal(expected.equals("PERCENT")?"100":"9999999999.99"))>0||d.effectiveFrom()==null||(d.effectiveTo()!=null&&d.effectiveTo().isBefore(d.effectiveFrom())))throw bad("Invalid deduction amount or effective dates");
   a.db.update("INSERT INTO employee_deductions(employee_id,deduction_type,calculation_type,amount,frequency,effective_from,effective_to,active) VALUES (?,?,?,?,'PER_PAY_PERIOD',?,?,?) ON CONFLICT(employee_id,deduction_type) DO UPDATE SET calculation_type=excluded.calculation_type,amount=excluded.amount,effective_from=excluded.effective_from,effective_to=excluded.effective_to,active=excluded.active,updated_at=CURRENT_TIMESTAMP",id,d.type(),expected,d.amount(),d.effectiveFrom(),d.effectiveTo(),d.active());
  }}
 }
}
