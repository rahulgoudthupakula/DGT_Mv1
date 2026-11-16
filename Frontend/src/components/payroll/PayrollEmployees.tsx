import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Pencil, Plus, MoreHorizontal } from "lucide-react";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { request, logout, ApiError, downloadFile } from "@/lib/backend";
import { useStoreDepartments } from "@/hooks/use-store-departments";
import { useStoreAccess } from "@/lib/store-access";

type Deposit={bank_name:string;account_holder:string;account_type:string;account_last_four:string;routing_number:string;active:boolean};
type Deduction={deduction_type:string;amount:number;effective_from:string;effective_to:string|null;active:boolean};
type Employee={website_access_active:boolean;website_access_admin:boolean;last_working_date:string|null;job_title:string|null;id:number;user_id:number|null;first_name:string;last_name:string;name:string;role:string;dept:string;payType:string;rate:number;status:string;version:string};
type EmergencyContact={id?:number;name:string;relationship:string;phone:string};
type EmployeeDocument={id:number;document_type:string;document_name:string;uploaded_at:string;downloadable:boolean};
type EmployeeDetail=Employee&{emergency_contacts:EmergencyContact[];documents:EmployeeDocument[];employment_history:{hired_on:string;ended_on:string|null}[];department_key:string;deposit:Deposit|null;deductions:Deduction[];store_count:number;email:string;hire_date:string;employee_type:string};
type RawEmployeeDetail=Omit<EmployeeDetail,'name'|'payType'>&{pay_type:string};
type SaveResult={version:string;success:boolean;employeeId:number;userId:number|null;signInAgain:boolean};
type RawEmployee=Omit<Employee,'name'|'payType'>&{pay_type:string};
type Data={signInAgain?:boolean;employees:(Omit<Employee,'name'|'payType'>&{pay_type:string})[];today:string};

const emptyForm = {
  email:"",password:"",employeeCode:"",hireDate:"",employeeType:"Full-time", firstName: "", lastName: "", role: "NO_ACCESS", dept: "", payType: "", rate: "", status: "Active",
  lastWorkingDate:"",disableWebsiteAccess:false,acknowledgeFutureShifts:false,
  filingStatus: "", allowances: "", additionalWithholding: "",
  jobTitle:"",accountHolder:"",accountType:"Checking",depositActive:true,healthActive:true,retirementActive:true,healthStart:"",healthEnd:"",retirementStart:"",retirementEnd:"", bankName: "", accountNumber: "", routingNumber: "",
  healthInsurance: "", retirement: "",
};

export const PayrollEmployees = ({storeId}:{storeId:string}) => {
  const access=useStoreAccess(storeId),client=useQueryClient();
  const path=`/access/stores/${encodeURIComponent(storeId)}/employees`;
  const query=useQuery({queryKey:['workweek-employees',storeId],queryFn:()=>request<Data>(path),enabled:access.data?.admin===true,refetchInterval:30000,refetchOnWindowFocus:true});
  const employees:Employee[]=(query.data?.employees??[]).map(e=>({...e,name:`${e.first_name} ${e.last_name}`,payType:e.pay_type??'',rate:Number(e.rate??0)}));
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const [search, setSearch] = useState("");
  const detailRequestId=useRef(0);
  const invalidateDetailRequest=useCallback(()=>{detailRequestId.current++;},[]);
  const [detailRequest,setDetailRequest]=useState<{employee:Employee}|null>(null);
  const [detailError,setDetailError]=useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [assignmentEmployee,setAssignmentEmployee]=useState<Employee|null>(null);
  const [reactivating,setReactivating]=useState(false);
  const [lastWorkingDate,setLastWorkingDate]=useState("");
  const [rehireDate,setRehireDate]=useState("");
  const [acknowledgeFutureShifts,setAcknowledgeFutureShifts]=useState(false);
  const [assignmentError,setAssignmentError]=useState("");
  const [contacts,setContacts]=useState<EmergencyContact[]>([]);
  const [pendingDocuments,setPendingDocuments]=useState<{file:File;type:string}[]>([]);
  const [employeeStep, setEmployeeStep] = useState("basic");
  const employeeSteps = ["basic", "pay", "deposit", "contacts", "documents", "account"];
  const [editingEmployee, setEditingEmployee] = useState<EmployeeDetail | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [pageSize, setPageSize] = useState(10);
  useEffect(()=>{
    setDetailRequest(null);setDetailError('');setEditingEmployee(null);setAddOpen(false);setAssignmentEmployee(null);
    return invalidateDetailRequest;
  },[storeId,invalidateDetailRequest]);
  const departments=useStoreDepartments(storeId,addOpen&&access.data?.admin===true);
  const inactivation=useQuery({queryKey:['employee-inactivation',storeId,assignmentEmployee?.id,lastWorkingDate],queryFn:({signal})=>request<{futureShiftCount:number;inactiveFrom:string}>(`${path}/${assignmentEmployee!.id}/inactivation-preview?lastWorkingDate=${encodeURIComponent(lastWorkingDate)}`,{signal}),enabled:!!assignmentEmployee&&!reactivating&&!!lastWorkingDate,staleTime:0,refetchOnWindowFocus:true});
  const roles=useQuery({queryKey:['employee-account-roles',storeId],queryFn:({signal})=>request<{id:number;name:string}[]>(path+'/account-roles',{signal}),enabled:addOpen&&!editingEmployee&&access.data?.admin===true,staleTime:60000,refetchOnWindowFocus:false});

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.role.toLowerCase().includes(search.toLowerCase())
  );

  const currentPagination = usePagination(filtered.filter(e=>e.status==='Active'), pageSize);

  const formerPagination=usePagination(filtered.filter(e=>e.status!=='Active').sort((a,b)=>(b.last_working_date??'').localeCompare(a.last_working_date??'')||b.id-a.id),pageSize);
  const openAssignment=(e:Employee,reactivate:boolean)=>{
    setAssignmentEmployee(e);setReactivating(reactivate);setRehireDate(query.data?.today??'');setLastWorkingDate(e.last_working_date??query.data?.today??'');setAcknowledgeFutureShifts(false);setAssignmentError('');
  };
  const saveAssignment=async()=>{
    if(!assignmentEmployee)return;
    if(reactivating&&(!rehireDate||rehireDate>(query.data?.today??'')||rehireDate<=(assignmentEmployee.last_working_date??''))){setAssignmentError('Choose a rehire date after the last working date and no later than today.');return;}
    if(!reactivating&&(!lastWorkingDate)){setAssignmentError('Choose a last working date on or after the hire date.');return;}
    if(!reactivating&&(inactivation.isPending||inactivation.isError)){setAssignmentError('Complete the shift check before confirming.');return;}
    if(!reactivating&&(inactivation.data?.futureShiftCount??0)>0&&!acknowledgeFutureShifts){setAssignmentError('Acknowledge the shifts that need review.');return;}
    setBusy(true);setAssignmentError('');
    try{
      const result=await request<{success:boolean;version:string}>(`${path}/${assignmentEmployee.id}/assignment`,{method:'PUT',body:JSON.stringify({reactivate:reactivating,rehireDate:reactivating?rehireDate:null,lastWorkingDate:reactivating?null:lastWorkingDate,disableWebsiteAccess:false,acknowledgeFutureShifts,version:assignmentEmployee.version})});
      if(!result.success)throw new Error('Employment status was not saved.');
      await client.cancelQueries({queryKey:['workweek-employees',storeId]});
      client.setQueryData<Data>(['workweek-employees',storeId],old=>old?{...old,employees:old.employees.map(e=>e.id===assignmentEmployee.id?{...e,last_working_date:reactivating?null:lastWorkingDate,status:reactivating||lastWorkingDate>=old.today?'Active':'Inactive',version:result.version}:e)}:old);
      await Promise.all([client.invalidateQueries({queryKey:['employee-detail',storeId,assignmentEmployee.id],refetchType:'none'}),client.invalidateQueries({queryKey:['workforce',storeId],refetchType:'none'}),client.invalidateQueries({queryKey:['employee-access',storeId],refetchType:'none'})]);setAssignmentEmployee(null);
    }catch(e){if(e instanceof ApiError&&e.status===409)await client.invalidateQueries({queryKey:['workweek-employees',storeId]});setAssignmentError(e instanceof Error?e.message:'Could not update employment status');}finally{setBusy(false);}
  };
  const handleField = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleEdit = (e: EmployeeDetail) => {
    setError('');
    const firstName=e.first_name;
    setForm({
      ...emptyForm,
      email:e.email,hireDate:e.hire_date,employeeType:e.employee_type,firstName,
      lastName: e.last_name,
      role: e.role,
      jobTitle:e.job_title??'',dept:e.department_key,
      bankName:e.deposit?.bank_name??'',accountHolder:e.deposit?.account_holder??'',accountType:e.deposit?.account_type??'Checking',accountNumber:e.deposit?.account_last_four??'',routingNumber:e.deposit?.routing_number??'',depositActive:e.deposit?.active??true,
      healthInsurance:String(e.deductions.find(d=>d.deduction_type==='HEALTH_INSURANCE')?.amount??''),retirement:String(e.deductions.find(d=>d.deduction_type==='RETIREMENT')?.amount??''),
      healthStart:e.deductions.find(d=>d.deduction_type==='HEALTH_INSURANCE')?.effective_from??query.data?.today??'',healthEnd:e.deductions.find(d=>d.deduction_type==='HEALTH_INSURANCE')?.effective_to??'',healthActive:e.deductions.find(d=>d.deduction_type==='HEALTH_INSURANCE')?.active??true,
      retirementStart:e.deductions.find(d=>d.deduction_type==='RETIREMENT')?.effective_from??query.data?.today??'',retirementEnd:e.deductions.find(d=>d.deduction_type==='RETIREMENT')?.effective_to??'',retirementActive:e.deductions.find(d=>d.deduction_type==='RETIREMENT')?.active??true,
      payType: e.payType,
      rate: String(e.rate),
      status: e.last_working_date ? "Inactive" : e.status,
      lastWorkingDate:e.last_working_date??"",
    });
    setContacts(e.emergency_contacts);setPendingDocuments([]);
    setEditingEmployee(e);
    setEmployeeStep("basic");setAddOpen(true);
  };

  const loadEmployee=async(employee:Employee)=>{
    const ticket=++detailRequestId.current;setDetailRequest({employee});setDetailError('');
    try{
      const raw=await client.fetchQuery({queryKey:['employee-detail',storeId,employee.id],queryFn:({signal})=>request<RawEmployeeDetail>(`${path}/${employee.id}`,{signal}),staleTime:0,retry:false});
      if(ticket!==detailRequestId.current)return;
      const fresh:EmployeeDetail={...raw,name:`${raw.first_name} ${raw.last_name}`,payType:raw.pay_type??'',rate:Number(raw.rate??0)};
      setDetailRequest(null);
      handleEdit(fresh);
    }catch(e){if(ticket===detailRequestId.current)setDetailError(e instanceof Error?e.message:'Could not load employee details');}
  };

  const handleCloseSheet = () => {
    if(busy)return;
    setError('');
    setAddOpen(false);
    setEditingEmployee(null);
    setForm(emptyForm);setContacts([]);setPendingDocuments([]);
  };

  const handleSubmit = async () => {
    setError('');
    if(!editingEmployee&&!form.jobTitle.trim()){setError('Job role is required.');return;}
    const websiteAccess=!editingEmployee&&form.role!=='NO_ACCESS';
    if(websiteAccess&&!roles.data?.some(role=>String(role.id)===form.role)){setError('Choose an available account role.');return;}
    if(websiteAccess&&(!form.email.trim()||form.password.length<12||new TextEncoder().encode(form.password).length>72)){setError('Enter an email and a password of at least 12 characters and at most 72 bytes.');return;}
    if(contacts.some(c=>!c.name.trim()||!c.relationship.trim()||!c.phone.trim())){setError('Complete the name, relationship and phone for each emergency contact.');setEmployeeStep('contacts');return;}
    setBusy(true);
    try{
      
      const payload={withoutAccess:!editingEmployee&&!websiteAccess,userId:null,roleTypeId:websiteAccess?Number(form.role):null,firstName:form.firstName,lastName:form.lastName,email:websiteAccess||editingEmployee?.user_id?form.email:null,password:websiteAccess?form.password:null,employeeCode:form.employeeCode,hireDate:form.hireDate,employeeType:form.employeeType,payType:form.payType,rate:form.rate===''?null:Number(form.rate),status:editingEmployee?form.status:'Active',lastWorkingDate:editingEmployee&&form.status==='Inactive'?form.lastWorkingDate:null,disableWebsiteAccess:!!editingEmployee&&form.status==='Inactive'&&form.disableWebsiteAccess,acknowledgeFutureShifts:form.acknowledgeFutureShifts,version:editingEmployee?.version,details:{emergencyContacts:contacts,jobTitle:form.jobTitle,department:form.dept,deposit:form.bankName||form.accountNumber||form.routingNumber||form.accountHolder?{bankName:form.bankName,accountHolder:form.accountHolder,accountType:form.accountType,accountLastFour:form.accountNumber,routingNumber:form.routingNumber,active:form.depositActive}:null,deductions:editingEmployee?undefined:[...(form.healthInsurance!==''?[{type:'HEALTH_INSURANCE',calculation:'FIXED',amount:Number(form.healthInsurance),effectiveFrom:form.healthStart||query.data?.today,effectiveTo:form.healthEnd||null,active:form.healthActive}]:[]),...(form.retirement!==''?[{type:'RETIREMENT',calculation:'PERCENT',amount:Number(form.retirement),effectiveFrom:form.retirementStart||query.data?.today,effectiveTo:form.retirementEnd||null,active:form.retirementActive}]:[])]}};
      let body:string|FormData=JSON.stringify(payload);
      if(pendingDocuments.length){
        const multipart=new FormData();multipart.append('employee',new Blob([body],{type:'application/json'}));multipart.append('documentTypes',new Blob([JSON.stringify(pendingDocuments.map(d=>d.type))],{type:'application/json'}));pendingDocuments.forEach(d=>multipart.append('files',d.file));body=multipart;
      }
      const result=await request<SaveResult>(path+(editingEmployee?`/${editingEmployee.id}`:''),{method:editingEmployee?'PUT':'POST',body});
      if(result.signInAgain){logout();client.clear();window.location.assign('/login');return;}
      // Apply only confirmed submitted values; full details and versions are fetched on demand.
      await client.cancelQueries({queryKey:['workweek-employees',storeId]});
      client.setQueryData<Data>(['workweek-employees',storeId],old=>{
        if(!old)return old;
        const existing=old.employees.find(e=>e.id===result.employeeId);
        const updated:RawEmployee={...(existing??{id:result.employeeId,user_id:result.userId,last_working_date:null,website_access_active:websiteAccess,website_access_admin:false,role:roles.data?.find(r=>String(r.id)===form.role)?.name??'No website access',status:'Active'}),first_name:form.firstName.trim(),last_name:form.lastName.trim(),job_title:form.jobTitle.trim(),dept:departments.data?.find(d=>d.id===form.dept)?.name??(form.dept===editingEmployee?.department_key?editingEmployee.dept:''),pay_type:form.payType,rate:Number(form.rate),version:result.version};
        return {...old,employees:existing?old.employees.map(e=>e.id===result.employeeId?updated:e):[...old.employees,updated]};
      });
      await Promise.all([client.invalidateQueries({queryKey:['employee-detail',storeId,result.employeeId],refetchType:'none'}),client.invalidateQueries({queryKey:['workforce',storeId],refetchType:'none'}),client.invalidateQueries({queryKey:['employee-access',storeId],refetchType:'none'})]);
      setAddOpen(false);setEditingEmployee(null);setForm(emptyForm);
    }catch(e){setError(e instanceof Error?e.message:'Could not save employee');}finally{setBusy(false);}
  };
  const renderEmployees=(pager:ReturnType<typeof usePagination<Employee>>,former:boolean)=>(
      <Card className="border-dashboard-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role / Dept</TableHead>
                <TableHead>Pay Type</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead>Employment Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{!query.isPending&&pager.totalItems===0&&<TableRow><TableCell colSpan={6}>{former?"No former employees match your search.":"No current employees match your search."}</TableCell></TableRow>}
              {pager.paginated.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell>{e.job_title||e.role} · {e.dept}</TableCell>
                  <TableCell>{e.payType}</TableCell>
                  <TableCell className="text-right font-mono">
                    {e.payType === "Hourly" ? `$${e.rate.toFixed(2)}/hr` : `$${e.rate.toLocaleString()}/yr`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={former?"secondary":"default"} className="text-[10px]">{former?"Ended":e.last_working_date?`Leaving on ${e.last_working_date}`:"Active"}</Badge>
                    {former&&e.last_working_date&&<div className="mt-1 text-xs text-muted-foreground">Last working date: {e.last_working_date}</div>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button aria-label={`Edit ${e.name}`} variant="ghost" size="icon" className="h-7 w-7" onClick={() => void loadEmployee(e)}><Pencil className="w-3.5 h-3.5" /></Button>
                    {former?<Button variant="outline" size="sm" className="ml-2" onClick={()=>openAssignment(e,true)}>Rehire Employee</Button>:<DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" disabled={busy} aria-label={`More actions for ${e.name}`}><MoreHorizontal className="w-4 h-4"/></Button></DropdownMenuTrigger><DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={()=>openAssignment(e,false)}>End Employment</DropdownMenuItem>
                    </DropdownMenuContent></DropdownMenu>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination page={pager.page} totalPages={pager.totalPages} totalItems={pager.totalItems} pageSize={pageSize} hasPrev={pager.hasPrev} hasNext={pager.hasNext} onPrev={pager.prevPage} onNext={pager.nextPage} onPageSizeChange={setPageSize}/>
        </CardContent>
      </Card>
  );
  if(access.isPending)return <p>Loading access…</p>;
  if(!access.data?.admin)return <p>Employee management currently requires company admin access.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Employees</h1>
        <Button size="sm" onClick={() => {setContacts([]);setPendingDocuments([]);setForm({...emptyForm,hireDate:query.data?.today??""});setError("");setEmployeeStep("basic");setAddOpen(true);}}><Plus className="w-4 h-4 mr-1" /> Add Employee</Button>
      </div>

      {query.isPending&&<p>Loading employees…</p>}{query.error&&<p role="alert">{query.error.message}</p>}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <section className="space-y-3"><h2 className="text-lg font-semibold">Current Employees</h2>{renderEmployees(currentPagination,false)}</section>
      <section className="space-y-3"><h2 className="text-lg font-semibold">Former Employees</h2><p className="text-sm text-muted-foreground">Most recent employment end dates first.</p>{renderEmployees(formerPagination,true)}</section>

      <Dialog open={!!detailRequest} onOpenChange={open=>{if(!open){detailRequestId.current++;setDetailRequest(null);setDetailError('');}}}>
        <DialogContent><DialogHeader><DialogTitle>Edit — {detailRequest?.employee.name}</DialogTitle></DialogHeader>
          {detailError?<><p role="alert" className="text-red-600 dark:text-red-400">{detailError}</p><Button onClick={()=>{if(detailRequest)void loadEmployee(detailRequest.employee);}}>Retry</Button></>:<p role="status">Loading employee details…</p>}
          <Button variant="outline" onClick={()=>{detailRequestId.current++;setDetailRequest(null);}}>Close</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assignmentEmployee} onOpenChange={open=>{if(!open&&!busy)setAssignmentEmployee(null);}}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{reactivating?'Rehire Employee':'End Employment'} — {assignmentEmployee?.name}</DialogTitle></DialogHeader>
          {reactivating?<div className="space-y-3"><label className="block space-y-1"><span>Rehire Date</span><Input type="date" value={rehireDate} max={query.data?.today} onChange={e=>setRehireDate(e.target.value)}/></label><p>Return this employee to Current Employees at this store. Website access will stay unchanged; restore it separately in Roles &amp; Access if needed.</p></div>:<div className="space-y-3">
            <Label htmlFor="assignment-last-day">Last Working Date</Label>
            <Input id="assignment-last-day" type="date" disabled={busy} value={lastWorkingDate} onChange={e=>{setLastWorkingDate(e.target.value);setAcknowledgeFutureShifts(false);}}/>
            <p className="text-sm text-muted-foreground">The employee stays current through this date and moves to Former Employees the following day in this store’s timezone. Existing shifts and pay history are kept.</p>
            {inactivation.isFetching&&<p role="status">Checking shifts…</p>}
            {inactivation.isError&&<p role="alert" className="text-destructive">Could not check shifts. <button className="underline" onClick={()=>void inactivation.refetch()}>Retry</button></p>}
            {!!inactivation.data?.futureShiftCount&&<div className="rounded-md border p-3 space-y-2"><p role="alert">{inactivation.data.futureShiftCount} shift(s) extend past the last working date. Review or reassign them in Week Schedule; confirming here will not cancel them.</p><label className="flex gap-2"><input type="checkbox" disabled={busy} checked={acknowledgeFutureShifts} onChange={e=>setAcknowledgeFutureShifts(e.target.checked)}/>I will review these shifts separately.</label></div>}
            <p className="text-sm text-muted-foreground">Employment and website access at other stores stay unchanged. Company admin access is managed through company ownership.</p>
          </div>}
          {assignmentError&&<p role="alert" className="text-destructive">{assignmentError}</p>}
          <DialogFooter><Button variant="outline" disabled={busy} onClick={()=>setAssignmentEmployee(null)}>Cancel</Button><Button disabled={busy||(!reactivating&&(inactivation.isFetching||inactivation.isError||!lastWorkingDate))} onClick={()=>void saveAssignment()}>{reactivating?'Confirm Rehire':'Confirm End Employment'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Employee Sheet */}
      <Sheet open={addOpen} onOpenChange={(o) => { if (!o) handleCloseSheet(); }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingEmployee ? `Edit — ${editingEmployee.name}` : "Add New Employee"}</SheetTitle>
          </SheetHeader>

          {editingEmployee&&<p className="mt-3 text-sm text-muted-foreground">{editingEmployee.store_count>1?`This employee works at ${editingEmployee.store_count} stores. Pay, hire date and employment type are shared across those stores. `:''}Job title, department and status apply only to this store. Deposit and deduction instructions are shared across stores. Name and email update the login account across stores. Changing email signs that user out; their password stays the same. Account role is managed in user settings.</p>}
          <Tabs value={employeeStep} onValueChange={setEmployeeStep} className="mt-4">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 sm:grid-cols-3 [&>button]:px-2 [&>button]:py-2 [&>button]:text-xs">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="pay">Pay</TabsTrigger>
              <TabsTrigger value="deposit">Deposit</TabsTrigger>
              <TabsTrigger value="contacts">Emergency Contacts</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="account">Account Role</TabsTrigger>
            </TabsList>

            {/* Basic Info */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <Label>{editingEmployee&&editingEmployee.employment_history.length>1?'Original Hire Date':'Hire Date'}</Label><Input type="date" disabled={!!editingEmployee&&editingEmployee.employment_history.length>1} value={form.hireDate} onChange={e=>handleField('hireDate',e.target.value)}/>
              {editingEmployee&&editingEmployee.employment_history.length>1&&<div className="space-y-1"><Label>Rehired On</Label><Input type="date" readOnly value={editingEmployee.employment_history[0].hired_on}/></div>}
              {editingEmployee&&<section className="rounded border p-3 space-y-2" aria-label="Employment history"><h3 className="text-sm font-semibold">Employment History · This Store</h3><p className="text-xs text-muted-foreground">Most recent first. Earlier periods are shown when recorded.</p><table className="w-full text-sm"><thead><tr><th className="text-left">Hire / Rehire Date</th><th className="text-left">Last Working Date</th></tr></thead><tbody>{editingEmployee.employment_history.map((period,index)=><tr key={`${period.hired_on}-${index}`}><td className="py-1">{period.hired_on}{index<editingEmployee.employment_history.length-1?' (Rehired)':''}</td><td>{period.ended_on??'Current'}</td></tr>)}</tbody></table></section>}
              <label className="block">Employee Type<select className="border rounded p-2 w-full bg-background" value={form.employeeType} onChange={e=>handleField('employeeType',e.target.value)}>{['Full-time','Part-time','Temporary'].map(t=><option key={t}>{t}</option>)}</select></label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">First Name</Label>
                  <Input placeholder="First name" value={form.firstName} onChange={(e) => handleField("firstName", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Last Name</Label>
                  <Input placeholder="Last name" value={form.lastName} onChange={(e) => handleField("lastName", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="employee-job-role">Job Role{!editingEmployee&&" *"}</Label><Input id="employee-job-role" required={!editingEmployee} value={form.jobTitle} maxLength={100} onChange={e=>handleField("jobTitle",e.target.value)}/><Label className="text-xs">Department</Label>
                <select disabled={busy||departments.isPending||departments.isError} className="border rounded p-2 w-full bg-background" value={form.dept} onChange={e=>handleField('dept',e.target.value)}><option value="">No department</option>{(departments.data??[]).map(d=><option key={d.id} value={d.id}>{d.name}</option>)}{form.dept&&!departments.data?.some(d=>d.id===form.dept)&&<option value={form.dept}>{editingEmployee?.dept||form.dept} (currently assigned)</option>}</select>
                {departments.isPending&&<p role="status" className="text-xs text-muted-foreground">Loading departments…</p>}
                {departments.isError&&<p role="alert" className="text-sm text-destructive">Could not load departments. <button type="button" className="underline" onClick={()=>void departments.refetch()}>Retry</button></p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Filing Status (W-4)</Label>
                <Select disabled value={form.filingStatus} onValueChange={(v) => handleField("filingStatus", v)}>
                  <SelectTrigger><SelectValue placeholder="Select filing status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Married">Married</SelectItem>
                    <SelectItem value="Head of Household">Head of Household</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Allowances</Label>
                  <Input type="number" placeholder="0" disabled value={form.allowances} onChange={(e) => handleField("allowances", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Additional Withholding ($)</Label>
                  <Input type="number" placeholder="0.00" disabled value={form.additionalWithholding} onChange={(e) => handleField("additionalWithholding", e.target.value)} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contacts" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">Optional. Contacts are shared across this employee’s stores.</p>
              {contacts.map((contact,index)=><fieldset key={contact.id??`new-${index}`} className="rounded border p-3 space-y-2"><legend className="px-1 text-sm">Contact {index+1}</legend>{(['name','relationship','phone'] as const).map(field=><label key={field} className="block space-y-1 text-sm"><span>{field==='name'?'Full Name':field==='relationship'?'Relationship':'Phone Number'}</span><Input type={field==='phone'?'tel':'text'} maxLength={field==='name'?150:field==='relationship'?50:30} disabled={busy} value={contact[field]} onChange={e=>setContacts(old=>old.map((c,i)=>i===index?{...c,[field]:e.target.value}:c))}/></label>)}{!contact.id&&<Button variant="ghost" size="sm" disabled={busy} onClick={()=>setContacts(old=>old.filter((_,i)=>i!==index))}>Remove Contact</Button>}</fieldset>)}
              <Button variant="outline" disabled={busy||contacts.length>=10} onClick={()=>setContacts(old=>[...old,{name:'',relationship:'',phone:''}])}><Plus className="h-4 w-4 mr-1"/>Add Emergency Contact</Button>
            </TabsContent>
            <TabsContent value="documents" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">Optional. Upload PDF, JPG, JPEG or PNG files, up to 5 MB each and five files per save. Documents are shared across this employee’s stores.</p>
              <label className="block space-y-1 text-sm"><span>Add Documents</span><Input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" disabled={busy} onChange={e=>{const files=Array.from(e.target.files??[]);e.target.value='';if(pendingDocuments.length+files.length>5||files.some(file=>file.size===0||file.size>5*1024*1024||!(/\.(pdf|jpe?g|png)$/i).test(file.name))){setError('Choose up to five PDF/JPG/PNG files, each nonempty and no larger than 5 MB.');return;}setError('');setPendingDocuments(old=>[...old,...files.map(file=>({file,type:'Other'}))]);}}/></label>
              {pendingDocuments.map((document,index)=><div key={index} className="rounded border p-3 space-y-2"><p className="text-sm break-all">{document.file.name}</p><label className="block space-y-1 text-sm"><span>Document Type</span><select className="border rounded p-2 w-full bg-background" disabled={busy} value={document.type} onChange={e=>setPendingDocuments(old=>old.map((d,i)=>i===index?{...d,type:e.target.value}:d))}>{['Identification','Employment Agreement','Tax Form','Certification','Other'].map(type=><option key={type}>{type}</option>)}</select></label><Button variant="ghost" size="sm" disabled={busy} onClick={()=>setPendingDocuments(old=>old.filter((_,i)=>i!==index))}>Remove File</Button></div>)}
              {editingEmployee?.documents.map(document=><div key={document.id} className="rounded border p-3 space-y-1"><p className="text-sm break-all">{document.document_name}</p><p className="text-xs text-muted-foreground">{document.document_type} · {document.uploaded_at.slice(0,10)}</p>{document.downloadable?<Button size="sm" variant="outline" disabled={busy} onClick={async()=>{try{await downloadFile(`${path}/${editingEmployee.id}/documents/${document.id}/download`,document.document_name);}catch(e){setError(e instanceof Error?e.message:'Could not download document');}}}>Download</Button>:<p className="text-xs text-muted-foreground">Previously recorded document. File download unavailable.</p>}</div>)}
            </TabsContent>

            <TabsContent value="account" className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="employee-account-role">Account Role</Label>
                {editingEmployee?<Input id="employee-account-role" disabled value={form.role} />:<>
                  <select id="employee-account-role" className="border rounded p-2 w-full bg-background" disabled={busy} value={form.role} onChange={e=>{const role=e.target.value;setForm(f=>({...f,role,email:role==='NO_ACCESS'?'':f.email,password:''}));}}>
                    <option value="NO_ACCESS">N/A / No access</option>
                    {(roles.data??[]).map(role=><option key={role.id} value={String(role.id)}>{role.name.charAt(0)+role.name.slice(1).toLowerCase()}</option>)}
                  </select>
                  {roles.isPending&&<p role="status" className="text-xs text-muted-foreground">Loading account roles…</p>}
                  {roles.isError&&<p role="alert" className="text-sm text-destructive">Could not load account roles. <button type="button" className="underline" onClick={()=>void roles.refetch()}>Retry</button></p>}
                  {form.role==='NO_ACCESS'?<p className="text-sm text-muted-foreground">This employee will not have website access. You can add it later in Roles &amp; Access.</p>:<>
                    <Label htmlFor="employee-login-email">Login Email</Label><Input id="employee-login-email" type="email" autoComplete="off" required disabled={busy} value={form.email} onChange={e=>handleField('email',e.target.value)} />
                    <Label htmlFor="employee-login-password">Password</Label><Input id="employee-login-password" type="password" autoComplete="new-password" minLength={12} required disabled={busy} value={form.password} onChange={e=>handleField('password',e.target.value)} />
                    <p className="text-xs text-muted-foreground">Use at least 12 characters and at most 72 bytes. The employee signs in with this email and password.</p>
                  </>}
                </>}
              </div>
              {editingEmployee?.user_id&&<><Label>Login Email</Label><Input type="email" value={form.email} onChange={e=>handleField('email',e.target.value)}/></>}
            </TabsContent>

            {/* Pay */}
            <TabsContent value="pay" className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Pay Type</Label>
                <Select value={form.payType} onValueChange={(v) => handleField("payType", v)}>
                  <SelectTrigger><SelectValue placeholder="Select pay type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hourly">Hourly</SelectItem>
                    <SelectItem value="Salary">Salary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{form.payType === "Salary" ? "Annual Salary ($)" : "Hourly Rate ($/hr)"}</Label>
                <Input type="number" placeholder={form.payType === "Salary" ? "e.g. 45000" : "e.g. 16.50"} value={form.rate} onChange={(e) => handleField("rate", e.target.value)} />
              </div>
              <div className="rounded-md bg-muted/40 border border-border p-3 text-xs text-muted-foreground">
                Overtime rules are pending configuration.
              </div>
            </TabsContent>

            {/* Direct Deposit */}
            <TabsContent value="deposit" className="space-y-4 mt-4"><p className="text-sm text-muted-foreground">Test instructions only. Use fictional bank details. This does not send payments; full account numbers are not stored.</p><Label>Account Holder</Label><Input value={form.accountHolder} onChange={e=>handleField('accountHolder',e.target.value)}/><label>Account Type<select className="border rounded p-2 w-full bg-background" value={form.accountType} onChange={e=>handleField('accountType',e.target.value)}><option>Checking</option><option>Savings</option></select></label><label className="flex gap-2"><input type="checkbox" checked={form.depositActive} onChange={e=>setForm(f=>({...f,depositActive:e.target.checked}))}/>Deposit instructions active</label>
              <div className="space-y-1.5">
                <Label className="text-xs">Bank Name</Label>
                <Input placeholder="e.g. Chase, Wells Fargo" value={form.bankName} onChange={(e) => handleField("bankName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Account Last Four (test only)</Label>
                <Input maxLength={4} placeholder="1234" value={form.accountNumber} onChange={(e) => handleField("accountNumber", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Routing Number</Label>
                <Input maxLength={9} placeholder="Test routing number" value={form.routingNumber} onChange={(e) => handleField("routingNumber", e.target.value)} />
              </div>
            </TabsContent>

          </Tabs>

          {error&&<p role="alert" className="text-destructive">{error}</p>}
          <SheetFooter className="mt-6 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleCloseSheet}>Cancel</Button>
            <Button disabled={busy} className="flex-1" onClick={() => {
              if (editingEmployee || employeeStep === "account") { void handleSubmit(); return; }
              setError("");
              setEmployeeStep(employeeSteps[employeeSteps.indexOf(employeeStep) + 1]);
            }}>{editingEmployee ? "Save Changes" : employeeStep === "account" ? "Submit Employee" : "Next"}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

