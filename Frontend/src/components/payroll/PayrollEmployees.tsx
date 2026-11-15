import { useState } from "react";
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
import { Search, Eye, Pencil, Plus } from "lucide-react";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { request, logout } from "@/lib/backend";
import { useStoreDepartments } from "@/hooks/use-store-departments";
import { useStoreAccess } from "@/lib/store-access";

type Deposit={bank_name:string;account_holder:string;account_type:string;account_last_four:string;routing_number:string;active:boolean};
type Deduction={deduction_type:string;amount:number;effective_from:string;effective_to:string|null;active:boolean};
type Employee={last_working_date:string|null;job_title:string|null;department_key:string;deposit:Deposit|null;deductions:Deduction[];store_count:number;id:number;user_id:number|null;email:string;first_name:string;last_name:string;name:string;role:string;dept:string;payType:string;rate:number;status:string;hire_date:string;employee_type:string;version:string};
type User={user_id:number;role_type_id:number;first_name:string;last_name:string;email:string;role_type_name:string};
type Data={signInAgain?:boolean;employees:(Omit<Employee,'name'|'payType'>&{pay_type:string})[];users:User[];today:string};

const emptyForm = {
  userKey:"",email:"",password:"",employeeCode:"",hireDate:"",employeeType:"Full-time", firstName: "", lastName: "", role: "NO_ACCESS", dept: "", payType: "", rate: "", status: "Active",
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
  const [selected, setSelected] = useState<typeof employees[0] | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [assignmentEmployee,setAssignmentEmployee]=useState<Employee|null>(null);
  const [reactivating,setReactivating]=useState(false);
  const [lastWorkingDate,setLastWorkingDate]=useState("");
  const [disableWebsiteAccess,setDisableWebsiteAccess]=useState(false);
  const [acknowledgeFutureShifts,setAcknowledgeFutureShifts]=useState(false);
  const [assignmentError,setAssignmentError]=useState("");
  const [employeeStep, setEmployeeStep] = useState("basic");
  const employeeSteps = ["basic", "pay", "deposit", "account"];
  const [editingEmployee, setEditingEmployee] = useState<typeof employees[0] | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [pageSize, setPageSize] = useState(10);
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
    setAssignmentEmployee(e);setReactivating(reactivate);setLastWorkingDate(e.last_working_date??query.data?.today??'');setDisableWebsiteAccess(false);setAcknowledgeFutureShifts(false);setAssignmentError('');
  };
  const saveAssignment=async()=>{
    if(!assignmentEmployee)return;
    if(!reactivating&&(!lastWorkingDate||lastWorkingDate<assignmentEmployee.hire_date)){setAssignmentError('Choose a last working date on or after the hire date.');return;}
    if(!reactivating&&(inactivation.isPending||inactivation.isError)){setAssignmentError('Complete the shift check before confirming.');return;}
    if(!reactivating&&(inactivation.data?.futureShiftCount??0)>0&&!acknowledgeFutureShifts){setAssignmentError('Acknowledge the shifts that need review.');return;}
    setBusy(true);setAssignmentError('');
    try{
      const data=await request<Data>(`${path}/${assignmentEmployee.id}/assignment`,{method:'PUT',body:JSON.stringify({reactivate:reactivating,lastWorkingDate:reactivating?null:lastWorkingDate,disableWebsiteAccess:!reactivating&&disableWebsiteAccess,acknowledgeFutureShifts,version:assignmentEmployee.version})});
      client.setQueryData(['workweek-employees',storeId],data);
      await Promise.all([client.invalidateQueries({queryKey:['workweek-employees',storeId]}),client.invalidateQueries({queryKey:['workforce',storeId]}),client.invalidateQueries({queryKey:['employee-access',storeId]})]);setAssignmentEmployee(null);
    }catch(e){setAssignmentError(e instanceof Error?e.message:'Could not update assignment');}finally{setBusy(false);}
  };
  const handleField = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleEdit = (e: typeof employees[0]) => {
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
    setEditingEmployee(e);
    setEmployeeStep("basic");setAddOpen(true);
  };

  const handleCloseSheet = () => {
    if(busy)return;
    setError('');
    setAddOpen(false);
    setEditingEmployee(null);
    setForm(emptyForm);
  };

  const handleSubmit = async () => {
    setError('');
    if(!editingEmployee&&!form.jobTitle.trim()){setError('Job role is required.');return;}
    const websiteAccess=!editingEmployee&&form.role!=='NO_ACCESS';
    if(websiteAccess&&!roles.data?.some(role=>String(role.id)===form.role)){setError('Choose an available account role.');return;}
    if(websiteAccess&&(!form.email.trim()||form.password.length<12||new TextEncoder().encode(form.password).length>72)){setError('Enter an email and a password of at least 12 characters and at most 72 bytes.');return;}
    setBusy(true);
    try{
      
      const data=await request<Data>(path+(editingEmployee?`/${editingEmployee.id}`:''),{method:editingEmployee?'PUT':'POST',body:JSON.stringify({withoutAccess:!editingEmployee&&!websiteAccess,userId:null,roleTypeId:websiteAccess?Number(form.role):null,firstName:form.firstName,lastName:form.lastName,email:websiteAccess||editingEmployee?.user_id?form.email:null,password:websiteAccess?form.password:null,employeeCode:form.employeeCode,hireDate:form.hireDate,employeeType:form.employeeType,payType:form.payType,rate:form.rate===''?null:Number(form.rate),status:editingEmployee?form.status:'Active',lastWorkingDate:editingEmployee&&form.status==='Inactive'?form.lastWorkingDate:null,disableWebsiteAccess:!!editingEmployee&&form.status==='Inactive'&&form.disableWebsiteAccess,acknowledgeFutureShifts:form.acknowledgeFutureShifts,version:editingEmployee?.version,details:{jobTitle:form.jobTitle,department:form.dept,deposit:form.bankName||form.accountNumber||form.routingNumber||form.accountHolder?{bankName:form.bankName,accountHolder:form.accountHolder,accountType:form.accountType,accountLastFour:form.accountNumber,routingNumber:form.routingNumber,active:form.depositActive}:null,deductions:[...(form.healthInsurance!==''?[{type:'HEALTH_INSURANCE',calculation:'FIXED',amount:Number(form.healthInsurance),effectiveFrom:form.healthStart||query.data?.today,effectiveTo:form.healthEnd||null,active:form.healthActive}]:[]),...(form.retirement!==''?[{type:'RETIREMENT',calculation:'PERCENT',amount:Number(form.retirement),effectiveFrom:form.retirementStart||query.data?.today,effectiveTo:form.retirementEnd||null,active:form.retirementActive}]:[])]}})});
      if(data.signInAgain){logout();client.clear();window.location.assign('/login');return;}
      client.setQueryData(['workweek-employees',storeId],data);await Promise.all([client.invalidateQueries({queryKey:['workweek-employees']}),client.invalidateQueries({queryKey:['workforce',storeId]}),client.invalidateQueries({queryKey:['employee-access',storeId]})]);setAddOpen(false);setEditingEmployee(null);setForm(emptyForm);
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
                <TableHead>{former?"Last Working Date":"Assignment"}</TableHead>
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
                    <Badge variant={former?"secondary":"default"} className="text-[10px]">{former?e.last_working_date??"Ended":e.last_working_date?`Leaving on ${e.last_working_date}`:"Current"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelected(e)}><Eye className="w-3.5 h-3.5" /></Button>
                    <Button aria-label={`Edit ${e.name}`} variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(e)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="outline" size="sm" className="ml-2" onClick={()=>openAssignment(e,former)}>{former?"Reactivate":e.last_working_date?"Change End Date":"End Assignment"}</Button>
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
        <Button size="sm" onClick={() => {setForm({...emptyForm,hireDate:query.data?.today??""});setError("");setEmployeeStep("basic");setAddOpen(true);}}><Plus className="w-4 h-4 mr-1" /> Add Employee</Button>
      </div>

      {query.isPending&&<p>Loading employees…</p>}{query.error&&<p role="alert">{query.error.message}</p>}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <section className="space-y-3"><h2 className="text-lg font-semibold">Current Employees</h2>{renderEmployees(currentPagination,false)}</section>
      <section className="space-y-3"><h2 className="text-lg font-semibold">Former Employees</h2><p className="text-sm text-muted-foreground">Most recently ended assignments first.</p>{renderEmployees(formerPagination,true)}</section>

      <Dialog open={!!assignmentEmployee} onOpenChange={open=>{if(!open&&!busy)setAssignmentEmployee(null);}}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>{reactivating?'Reactivate':'End Assignment'} — {assignmentEmployee?.name}</DialogTitle></DialogHeader>
          {reactivating?<p>Restore this employee’s assignment at this store. Website access will stay unchanged; restore it separately in Roles &amp; Access if needed.</p>:<div className="space-y-3">
            <Label htmlFor="assignment-last-day">Last Working Date</Label>
            <Input id="assignment-last-day" type="date" disabled={busy} min={assignmentEmployee?.hire_date} value={lastWorkingDate} onChange={e=>{setLastWorkingDate(e.target.value);setAcknowledgeFutureShifts(false);}}/>
            <p className="text-sm text-muted-foreground">The employee stays current through this date and moves to Former Employees the following day in this store’s timezone. Existing shifts and pay history are kept.</p>
            {inactivation.isFetching&&<p role="status">Checking shifts…</p>}
            {inactivation.isError&&<p role="alert" className="text-destructive">Could not check shifts. <button className="underline" onClick={()=>void inactivation.refetch()}>Retry</button></p>}
            {!!inactivation.data?.futureShiftCount&&<div className="rounded-md border p-3 space-y-2"><p role="alert">{inactivation.data.futureShiftCount} shift(s) extend past the last working date. Review or reassign them in Week Schedule; confirming here will not cancel them.</p><label className="flex gap-2"><input type="checkbox" disabled={busy} checked={acknowledgeFutureShifts} onChange={e=>setAcknowledgeFutureShifts(e.target.checked)}/>I will review these shifts separately.</label></div>}
            {!!assignmentEmployee?.user_id&&<label className="flex gap-2"><input type="checkbox" disabled={busy} checked={disableWebsiteAccess} onChange={e=>setDisableWebsiteAccess(e.target.checked)}/>Disable website access for this store immediately</label>}
            <p className="text-sm text-muted-foreground">Other store assignments and access stay unchanged. Company admin access is managed through company ownership.</p>
          </div>}
          {assignmentError&&<p role="alert" className="text-destructive">{assignmentError}</p>}
          <DialogFooter><Button variant="outline" disabled={busy} onClick={()=>setAssignmentEmployee(null)}>Cancel</Button><Button disabled={busy||(!reactivating&&(inactivation.isFetching||inactivation.isError||!lastWorkingDate))} onClick={()=>void saveAssignment()}>{reactivating?'Confirm Reactivation':'Confirm End Assignment'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selected?.name}</SheetTitle>
          </SheetHeader>
          <Tabs defaultValue="personal" className="mt-4">
            <TabsList className="grid w-full grid-cols-6 text-[10px]">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="pay">Pay</TabsTrigger>
              <TabsTrigger value="deposit">Deposit</TabsTrigger>
              <TabsTrigger value="deductions">Deductions</TabsTrigger>
              <TabsTrigger value="timeoff">Timeoff</TabsTrigger>
              <TabsTrigger value="docs">Docs</TabsTrigger>
            </TabsList>
            <TabsContent value="personal" className="space-y-3 mt-4">
              <InfoRow label="Filing Status" value="" />
              <InfoRow label="Allowances" value="" />
              <InfoRow label="Additional Withholding" value="" />
            </TabsContent>
            <TabsContent value="pay" className="space-y-3 mt-4">
              <InfoRow label="Pay Type" value={selected?.payType || ""} />
              <InfoRow label="Rate" value={selected?.payType === "Hourly" ? `$${selected.rate.toFixed(2)}/hr` : `$${selected?.rate.toLocaleString()}/yr`} />
              <InfoRow label="OT Rule" value="" />
            </TabsContent>
            <TabsContent value="deposit" className="space-y-3 mt-4">
              <InfoRow label="Account Holder" value={selected?.deposit?.account_holder??""}/><InfoRow label="Account Type" value={selected?.deposit?.account_type??""}/><InfoRow label="Status" value={selected?.deposit?(selected.deposit.active?"Active":"Inactive"):""}/><InfoRow label="Bank (test)" value={selected?.deposit?.bank_name??""} />
              <InfoRow label="Account" value={selected?.deposit?"••••"+selected.deposit.account_last_four:""} />
              <InfoRow label="Routing (test)" value={selected?.deposit?.routing_number??""} />
            </TabsContent>
            <TabsContent value="deductions" className="space-y-3 mt-4">
              {selected?.deductions.map(d=><div key={d.deduction_type} className="space-y-2"><InfoRow label={d.deduction_type==='RETIREMENT'?'Retirement':'Health Insurance'} value={`${d.deduction_type==='RETIREMENT'?d.amount+'%':'$'+Number(d.amount).toFixed(2)} per pay period`}/><InfoRow label="Status" value={d.active?'Active':'Inactive'}/><InfoRow label="Effective dates" value={`${d.effective_from} — ${d.effective_to??'No end date'}`}/></div>)}
            </TabsContent>
            <TabsContent value="timeoff" className="mt-4">
              <p className="text-muted-foreground">Time off will be connected in the Time Off section.</p>
            </TabsContent>
            <TabsContent value="docs" className="space-y-3 mt-4">
              <InfoRow label="W-4" value="" />
              <InfoRow label="I-9" value="" />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Add Employee Sheet */}
      <Sheet open={addOpen} onOpenChange={(o) => { if (!o) handleCloseSheet(); }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingEmployee ? `Edit — ${editingEmployee.name}` : "Add New Employee"}</SheetTitle>
          </SheetHeader>

          {editingEmployee&&<p className="mt-3 text-sm text-muted-foreground">{editingEmployee.store_count>1?`This employee works at ${editingEmployee.store_count} stores. Pay, hire date and employment type are shared across those stores. `:''}Job title, department and status apply only to this store. Deposit and deduction instructions are shared across stores. Name and email update the login account across stores. Changing email signs that user out; their password stays the same. Account role is managed in user settings.</p>}
          <Tabs value={employeeStep} onValueChange={setEmployeeStep} className="mt-4">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 sm:grid-cols-4 [&>button]:px-2 [&>button]:py-2 [&>button]:text-xs">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="pay">Pay</TabsTrigger>
              <TabsTrigger value="deposit">Deposit</TabsTrigger>
              <TabsTrigger value="account">Account Role</TabsTrigger>
            </TabsList>

            {/* Basic Info */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <Label>Hire Date</Label><Input type="date" value={form.hireDate} onChange={e=>handleField('hireDate',e.target.value)}/>
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

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between border-b border-dashboard-border pb-2">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-foreground">{value}</span>
  </div>
);

