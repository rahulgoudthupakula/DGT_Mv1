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
import { Search, Eye, Pencil, Plus } from "lucide-react";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { request, logout } from "@/lib/backend";
import { useStoreAccess } from "@/lib/store-access";

type Deposit={bank_name:string;account_holder:string;account_type:string;account_last_four:string;routing_number:string;active:boolean};
type Deduction={deduction_type:string;amount:number;effective_from:string;effective_to:string|null;active:boolean};
type Employee={job_title:string|null;department_key:string;deposit:Deposit|null;deductions:Deduction[];store_count:number;id:number;user_id:number|null;email:string;first_name:string;last_name:string;name:string;role:string;dept:string;payType:string;rate:number;status:string;hire_date:string;employee_type:string;version:string};
type User={user_id:number;role_type_id:number;first_name:string;last_name:string;email:string;role_type_name:string};
type Data={departments:{id:string;name:string}[];signInAgain?:boolean;employees:(Omit<Employee,'name'|'payType'>&{pay_type:string})[];users:User[];today:string};

const emptyForm = {
  userKey:"",email:"",password:"",employeeCode:"",hireDate:"",employeeType:"Full-time", firstName: "", lastName: "", role: "", dept: "", payType: "", rate: "", status: "Active",
  filingStatus: "", allowances: "", additionalWithholding: "",
  jobTitle:"",accountHolder:"",accountType:"Checking",depositActive:true,healthActive:true,retirementActive:true,healthStart:"",healthEnd:"",retirementStart:"",retirementEnd:"", bankName: "", accountNumber: "", routingNumber: "",
  healthInsurance: "", retirement: "",
};

export const PayrollEmployees = ({storeId}:{storeId:string}) => {
  const access=useStoreAccess(storeId),client=useQueryClient();
  const path=`/access/stores/${encodeURIComponent(storeId)}/employees`;
  const query=useQuery({queryKey:['workweek-employees',storeId],queryFn:()=>request<Data>(path),enabled:access.data?.admin===true});
  const employees:Employee[]=(query.data?.employees??[]).map(e=>({...e,name:`${e.first_name} ${e.last_name}`,payType:e.pay_type??'',rate:Number(e.rate??0)}));
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<typeof employees[0] | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<typeof employees[0] | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [pageSize, setPageSize] = useState(10);

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.role.toLowerCase().includes(search.toLowerCase())
  );

  const { paginated, page, totalPages, totalItems, hasPrev, hasNext, prevPage, nextPage } = usePagination(filtered, pageSize);

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
      status: e.status,
    });
    setEditingEmployee(e);
    setAddOpen(true);
  };

  const handleCloseSheet = () => {
    if(busy)return;
    setError('');
    setAddOpen(false);
    setEditingEmployee(null);
    setForm(emptyForm);
  };

  const handleSubmit = async () => {
    setBusy(true);setError('');
    try{
      const user=query.data?.users.find(u=>`${u.user_id}:${u.role_type_id}`===form.userKey);
      
      const data=await request<Data>(path+(editingEmployee?`/${editingEmployee.id}`:''),{method:editingEmployee?'PUT':'POST',body:JSON.stringify({withoutAccess:!editingEmployee,userId:user?.user_id??null,roleTypeId:user?.role_type_id??null,firstName:form.firstName,lastName:form.lastName,email:form.email,password:form.password,employeeCode:form.employeeCode,hireDate:form.hireDate,employeeType:form.employeeType,payType:form.payType,rate:form.rate===''?null:Number(form.rate),status:form.status,version:editingEmployee?.version,details:{jobTitle:form.jobTitle,department:form.dept,deposit:form.bankName||form.accountNumber||form.routingNumber||form.accountHolder?{bankName:form.bankName,accountHolder:form.accountHolder,accountType:form.accountType,accountLastFour:form.accountNumber,routingNumber:form.routingNumber,active:form.depositActive}:null,deductions:[...(form.healthInsurance!==''?[{type:'HEALTH_INSURANCE',calculation:'FIXED',amount:Number(form.healthInsurance),effectiveFrom:form.healthStart||query.data?.today,effectiveTo:form.healthEnd||null,active:form.healthActive}]:[]),...(form.retirement!==''?[{type:'RETIREMENT',calculation:'PERCENT',amount:Number(form.retirement),effectiveFrom:form.retirementStart||query.data?.today,effectiveTo:form.retirementEnd||null,active:form.retirementActive}]:[])]}})});
      if(data.signInAgain){logout();client.clear();window.location.assign('/login');return;}
      client.setQueryData(['workweek-employees',storeId],data);await client.invalidateQueries({queryKey:['workweek-employees']});setAddOpen(false);setEditingEmployee(null);setForm(emptyForm);
    }catch(e){setError(e instanceof Error?e.message:'Could not save employee');}finally{setBusy(false);}
  };
  if(access.isPending)return <p>Loading access…</p>;
  if(!access.data?.admin)return <p>Employee management currently requires company admin access.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Employees</h1>
        <Button size="sm" onClick={() => {setForm({...emptyForm,hireDate:query.data?.today??""});setError("");setAddOpen(true);}}><Plus className="w-4 h-4 mr-1" /> Add Employee</Button>
      </div>

      {query.isPending&&<p>Loading employees…</p>}{query.error&&<p role="alert">{query.error.message}</p>}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card className="border-dashboard-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role / Dept</TableHead>
                <TableHead>Pay Type</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{!query.isPending&&employees.length===0&&<TableRow><TableCell colSpan={6}>No employees assigned to this store yet. Use Add Employee to create one.</TableCell></TableRow>}
              {paginated.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell>{e.job_title||e.role} · {e.dept}</TableCell>
                  <TableCell>{e.payType}</TableCell>
                  <TableCell className="text-right font-mono">
                    {e.payType === "Hourly" ? `$${e.rate.toFixed(2)}/hr` : `$${e.rate.toLocaleString()}/yr`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={e.status === "Active" ? "default" : "secondary"} className="text-[10px]">{e.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelected(e)}><Eye className="w-3.5 h-3.5" /></Button>
                    <Button aria-label={`Edit ${e.name}`} variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(e)}><Pencil className="w-3.5 h-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize}
            hasPrev={hasPrev} hasNext={hasNext} onPrev={prevPage} onNext={nextPage}
            onPageSizeChange={(s) => setPageSize(s)}
          />
        </CardContent>
      </Card>

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
          <Tabs defaultValue="basic" className="mt-4">
            <TabsList className="grid w-full grid-cols-4 text-[10px]">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="pay">Pay</TabsTrigger>
              <TabsTrigger value="deposit">Deposit</TabsTrigger>
              <TabsTrigger value="deductions">Deductions</TabsTrigger>
            </TabsList>

            {/* Basic Info */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              {!editingEmployee&&<p className="text-sm text-muted-foreground">This creates an employee without website access. Set their email, password and website role later in Roles &amp; Access.</p>}
              {editingEmployee?.user_id&&<><Label>Login Email</Label><Input type="email" value={form.email} onChange={e=>handleField('email',e.target.value)}/></>}
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
                <Label className="text-xs">Account Role</Label>
                <Input disabled placeholder="" value={form.role} onChange={(e) => handleField("role", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Job Title</Label><Input value={form.jobTitle} maxLength={100} onChange={e=>handleField("jobTitle",e.target.value)}/><Label className="text-xs">Department</Label>
                <select className="border rounded p-2 w-full bg-background" value={form.dept} onChange={e=>handleField('dept',e.target.value)}><option value="">No department</option>{query.data?.departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={(v) => handleField("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
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

            {/* Deductions */}
            <TabsContent value="deductions" className="space-y-4 mt-4"><p className="text-sm text-muted-foreground">Per pay period instructions only; payroll calculation is not connected. Disable an existing deduction instead of clearing its amount.</p>
              <div className="space-y-1.5">
                <Label className="text-xs">Health Insurance ($/pay period)</Label>
                <Input type="number" placeholder="e.g. 120.00" value={form.healthInsurance} onChange={(e) => handleField("healthInsurance", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="flex gap-2"><input type="checkbox" checked={form.healthActive} onChange={e=>setForm(f=>({...f,healthActive:e.target.checked}))}/>Health insurance active</label><Label>Health insurance effective dates</Label><Input type="date" value={form.healthStart} onChange={e=>handleField('healthStart',e.target.value)}/><Input type="date" value={form.healthEnd} onChange={e=>handleField('healthEnd',e.target.value)}/>
<Label className="text-xs">401(k) Contribution (%)</Label>
                <Input type="number" placeholder="e.g. 3" value={form.retirement} onChange={(e) => handleField("retirement", e.target.value)} /><label className="flex gap-2"><input type="checkbox" checked={form.retirementActive} onChange={e=>setForm(f=>({...f,retirementActive:e.target.checked}))}/>Retirement active</label><Label>Retirement effective dates</Label><Input type="date" value={form.retirementStart} onChange={e=>handleField('retirementStart',e.target.value)}/><Input type="date" value={form.retirementEnd} onChange={e=>handleField('retirementEnd',e.target.value)}/>
              </div>
            </TabsContent>
          </Tabs>

          {error&&<p role="alert" className="text-destructive">{error}</p>}
          <SheetFooter className="mt-6 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleCloseSheet}>Cancel</Button>
            <Button disabled={busy} className="flex-1" onClick={handleSubmit}>{editingEmployee ? "Save Changes" : "Submit Employee"}</Button>
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

