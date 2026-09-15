import { StoreRoleMatrix } from "./StoreRoleMatrix";
import { RolePermissionsPanel } from "./RolePermissionsPanel";
import { useStoreAccess } from "@/lib/store-access";
import { isPendingChange } from "@/lib/backend";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Key } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/backend";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
interface DepartmentAccess { version: string; subDepartments: string[]; id: string; name: string; source_type: string; active: boolean; }



const roles = ["Admin", "Manager", "Cashier", "Accountant"];
const permissions = [
  "View reports",
  "Edit daily closing",
  "Run payroll",
  "Modify invoices",
  "Adjust inventory",
];

const permissionMatrix: Record<string, boolean[]> = {
  Admin: [true, true, true, true, true],
  Manager: [true, true, false, true, true],
  Accountant: [true, false, false, true, false],
  Viewer: [true, false, false, false, false],
};

const groceryPermissions = [
  "View inventory",
  "Adjust stock",
  "Reduce stock",
  "Create PO",
  "Approve PO",
  "Receive inventory",
  "Approve invoice",
  "Change grocery settings",
];

const groceryPermissionMatrix: Record<string, boolean[]> = {
  Admin: [true, true, true, true, true, true, true, true],
  Manager: [true, true, true, true, true, true, false, true],
  Accountant: [true, false, false, false, false, false, true, false],
  Viewer: [true, false, false, false, false, false, false, false],
};

const lotteryPermissions = [
  "Receive delivery",
  "Confirm packs",
  "Activate packs",
  "Close shift",
  "Return packs",
  "Settle packs",
  "View lottery reports",
  "Change lottery settings",
];

const lotteryPermissionMatrix: Record<string, boolean[]> = {
  Admin: [true, true, true, true, true, true, true, true],
  Manager: [true, true, true, true, true, true, true, false],
  Accountant: [false, false, false, false, false, true, true, false],
  Viewer: [false, false, false, false, false, false, true, false],
};

const integrations = [
  { name: "POS Connection", status: "", lastSync: "" },
  { name: "QuickBooks Sync", status: "", lastSync: "" },
  { name: "Bank Integration", status: "", lastSync: "" },
  { name: "Payment Gateway", status: "", lastSync: "" },
];

export const StoreManagementPage = ({storeId}: {storeId: string}) => {
  const [apiKeys, setApiKeys] = useState<{ value: string; created: string }[]>([]);
  const access=useStoreAccess(storeId);
  const client=useQueryClient();
  const [addOpen,setAddOpen]=useState(false);
  const [name,setName]=useState("");
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const path=`/stores/${encodeURIComponent(storeId)}/department-access`;
  const query=useQuery({queryKey:["department-access",storeId],queryFn:()=>request<DepartmentAccess[]>(path),enabled:!!storeId&&access.data?.modules.DEPARTMENTS.view===true});
  const departments=query.data ?? [];
  const [toggling,setToggling]=useState(false);
  const [toggleError,setToggleError]=useState("");
  const toggleDepartment=async (department: DepartmentAccess, active: boolean)=>{
    if(toggling)return;setToggling(true);setToggleError("");
    try{const result=await request(`${path}/${encodeURIComponent(department.id)}`,{method:"PATCH",headers:{"If-Match":department.version},body:JSON.stringify({active})});if(isPendingChange(result))toast({title:`Submitted for approval (#${result.requestId})`});}
    catch(e){setToggleError(e instanceof Error?e.message:"Could not save status");}
    finally{await client.invalidateQueries({queryKey:["department-access",storeId]});setToggling(false);}
  };
  const addDepartment=async (event: React.FormEvent)=>{
    event.preventDefault(); if(saving||!name.trim()||!storeId)return;
    setSaving(true);setError("");
    try { const result=await request(path,{method:"POST",body:JSON.stringify({name:name.trim()})});if(isPendingChange(result))toast({title:`Submitted for approval (#${result.requestId})`});
      await client.invalidateQueries({queryKey:["department-access",storeId]});setAddOpen(false);setName("");
    }catch(e){setError(e instanceof Error?e.message:"Could not add department");}finally{setSaving(false);}
  };

  const generateKey = () => {
    const value = "dgt_" + Array.from(crypto.getRandomValues(new Uint8Array(20))).map((b) => b.toString(16).padStart(2, "0")).join("");
    setApiKeys([...apiKeys, { value: `${value.slice(0, 12)}••••••••${value.slice(-4)}`, created: new Date().toLocaleString() }]);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Access & Integrations</h1>

      <Tabs defaultValue="departments">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="departments">Department Access</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="integrations">Integration & API Key</TabsTrigger>
        </TabsList>

        {/* Tab 0 — Department Access */}
        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-lg">Department Access</CardTitle>
              <Button disabled={!storeId || query.isPending || !!query.error || !access.data?.modules.DEPARTMENTS.edit} onClick={()=>{setName("");setError("");setAddOpen(true);}}>Add Department</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department Access</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Active / Inactive</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!storeId && <TableRow><TableCell colSpan={3}>Select a store first.</TableCell></TableRow>}
                  {storeId && !access.isPending && !access.data?.modules.DEPARTMENTS.view && <TableRow><TableCell colSpan={3}>Department access is not granted.</TableCell></TableRow>}
                  {storeId && access.data?.modules.DEPARTMENTS.view && query.isPending && <TableRow><TableCell colSpan={3}>Loading departments…</TableCell></TableRow>}
                  {query.error && <TableRow><TableCell colSpan={3}><span role="alert">{query.error.message}</span> <Button variant="outline" onClick={()=>query.refetch()}>Retry</Button></TableCell></TableRow>}
                  {storeId && query.isSuccess && !departments.length && <TableRow><TableCell colSpan={3}>No departments yet.</TableCell></TableRow>}
                  {departments.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.subDepartments.length ? <details><summary className="cursor-pointer">{d.name} <span className="text-muted-foreground text-xs">({d.subDepartments.length})</span></summary><ul className="mt-2 ml-4 space-y-1 text-sm font-normal">{d.subDepartments.map(name=><li key={name}>{name}</li>)}</ul></details> : d.name}</TableCell>
                      <TableCell>
                        <Badge variant={d.active ? "default" : "secondary"}>
                          {d.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch checked={d.active} disabled={toggling || !access.data?.modules.DEPARTMENTS.edit} onCheckedChange={active=>toggleDepartment(d,active)} aria-label={`${d.name} status`} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {toggleError && <p role="alert" className="text-destructive">{toggleError}</p>}
              <p className="mt-3 text-xs text-muted-foreground">Active/Inactive applies only to the selected store. Inactive departments remain listed; departments cannot be deleted here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <Dialog open={addOpen} onOpenChange={open=>{if(!saving)setAddOpen(open);}}>
          <DialogContent><DialogHeader><DialogTitle>Add Department</DialogTitle><DialogDescription>This department will appear only for the selected store ({storeId}).</DialogDescription></DialogHeader>
            <form onSubmit={addDepartment} className="space-y-4"><Label htmlFor="new-department-name">Department name</Label><Input id="new-department-name" autoFocus maxLength={150} required disabled={saving} value={name} onChange={e=>setName(e.target.value)} />
              {error && <p role="alert" className="text-destructive">{error}</p>}
              <Button type="submit" disabled={saving||!name.trim()}>{saving?"Adding…":"Add Department"}</Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Tab 1 — Roles & Permissions */}
        <TabsContent value="roles" className="space-y-6">
          <RolePermissionsPanel key={storeId} storeId={storeId} />

          <StoreRoleMatrix key={storeId} storeId={storeId}/>
        </TabsContent>

        {/* Tab 2 — Integrations */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Integrations</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Integration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Sync</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {integrations.map((int) => (
                    <TableRow key={int.name}>
                      <TableCell className="font-medium">{int.name}</TableCell>
                      <TableCell>
                        <Badge variant={int.status === "Connected" ? "default" : "secondary"}>
                          {int.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{int.lastSync}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" disabled>
                          {int.status === "Connected" ? "Disconnect" : "Connect"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* API Keys */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><Key className="w-5 h-5" /> API Keys</CardTitle>
              <Button disabled>Generate New Key</Button>
            </CardHeader>
            <CardContent>
              {apiKeys.length === 0 ? (
                <p className="text-sm text-muted-foreground">API key management is not connected yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((k) => (
                      <TableRow key={k.value}>
                        <TableCell className="font-mono text-xs">{k.value}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{k.created}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="destructive" size="sm" onClick={() => setApiKeys(apiKeys.filter((x) => x.value !== k.value))}>Revoke</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
