import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { request, isPendingChange } from "@/lib/backend";
import { useStoreAccess } from "@/lib/store-access";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Subdepartment { id?: string; name: string; active: boolean; }
interface Department { id: string; name: string; active: boolean; version: string; subDepartmentDetails: Subdepartment[]; }

type DepartmentResponse = Omit<Department, "subDepartmentDetails"> & { subDepartmentDetails?: Subdepartment[]; subDepartments?: string[] };

/** Store-owned hierarchy; the server validates names, permissions, approvals and versions. */
export function DepartmentAccessPanel({ storeId }: { storeId: string }) {
  const access = useStoreAccess(storeId);
  const client = useQueryClient();
  const canEdit = access.data?.modules.DEPARTMENTS.edit === true;
  const path = `/stores/${encodeURIComponent(storeId)}/department-access`;
  const query = useQuery({ queryKey: ["department-access", storeId], queryFn: () => request<DepartmentResponse[]>(path), enabled: !!storeId && access.data?.modules.DEPARTMENTS.view === true });
  // A running older backend (or cached query) can still return only child names.
  // Display those names, but do not submit edits without persisted child identities.
  const hierarchyReady = query.isSuccess && query.data.every(department => Array.isArray(department.subDepartmentDetails));
  const departments: Department[] = (query.data ?? []).map(department => ({
    ...department,
    subDepartmentDetails: department.subDepartmentDetails ?? (department.subDepartments ?? []).map(name => ({ name, active: true })),
  }));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [children, setChildren] = useState<Subdepartment[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [statusError, setStatusError] = useState("");

  const refresh = async () => {
    // Price Book and other department selectors must refresh after catalog changes too.
    await client.invalidateQueries({ predicate: query => query.queryKey.includes(storeId) });
  };
  const beginEdit = (department: Department | null) => {
    setEditing(department); setName(department?.name ?? "");
    setChildren(department?.subDepartmentDetails.map(child => ({ ...child })) ?? [{ name: "", active: true }]);
    setError(""); setOpen(true);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (busy) return;
    const populated = children.filter(child => child.id || child.name.trim());
    if (!name.trim() || populated.some(child => !child.name.trim())) { setError("Enter a name for the department and each existing subdepartment."); return; }
    if (new Set(populated.map(child => child.name.trim().toLowerCase())).size !== populated.length) { setError("Subdepartment names must be unique."); return; }
    setBusy(true); setError("");
    try {
      const result = await request(editing ? `${path}/${editing.id}` : path, {
        method: editing ? "PUT" : "POST", headers: editing ? { "If-Match": editing.version } : {},
        body: JSON.stringify({ name: name.trim(), sub_departments: populated.map(child => ({ ...child, name: child.name.trim() })) }),
      });
      if (isPendingChange(result)) toast({ title: `Submitted for approval (#${result.requestId})` });
      await refresh(); setOpen(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save department"); }
    finally { setBusy(false); }
  };
  const toggle = async (department: Department, active: boolean, childId?: string) => {
    if (busy) return; setBusy(true); setStatusError("");
    try {
      const result = await request(`${path}/${department.id}`, {
        method: childId ? "PUT" : "PATCH", headers: { "If-Match": department.version },
        body: JSON.stringify(childId ? { name: department.name, sub_departments: department.subDepartmentDetails.map(child => child.id === childId ? { ...child, active } : child) } : { active }),
      });
      if (isPendingChange(result)) toast({ title: `Submitted for approval (#${result.requestId})` });
    } catch (e) { setStatusError(e instanceof Error ? e.message : "Could not save status"); }
    finally { await refresh(); setBusy(false); }
  };
  const updateChild = (index: number, values: Partial<Subdepartment>) => setChildren(current => current.map((child, i) => i === index ? { ...child, ...values } : child));

  return <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Department Access</CardTitle>
        <Button disabled={!canEdit || busy || !hierarchyReady} onClick={() => beginEdit(null)}>Add Department</Button>
      </CardHeader>
      <CardContent>
        {query.isSuccess && !hierarchyReady && <p role="alert" className="mb-4 text-destructive">The running backend needs the department update. Restart the backend with migration V19 enabled, then reload this page. Editing is unavailable until the update is applied.</p>}
        {!storeId ? <p>Select a store first.</p> : !access.isPending && !access.data?.modules.DEPARTMENTS.view ? <p>Department access is not granted.</p> : query.isPending ? <p>Loading departments…</p> : query.error ? <p role="alert" className="text-destructive">{query.error.message} <Button variant="outline" onClick={() => query.refetch()}>Retry</Button></p> : <Table>
          <TableHeader><TableRow><TableHead>Department / Subdepartment</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{departments.map(department => <TableRow key={department.id}>
            <TableCell colSpan={3} className="p-0">
              <div className="flex items-center gap-4 p-4">
                <span className="flex-1 font-medium">{department.name}</span>
                <Badge variant={department.active ? "default" : "secondary"}>{department.active ? "Active" : "Inactive"}</Badge>
                <Button variant="outline" size="sm" disabled={!canEdit || busy || !hierarchyReady} onClick={() => beginEdit(department)} aria-label={`Edit ${department.name}`}>Edit</Button>
                <Switch checked={department.active} disabled={!canEdit || busy || !hierarchyReady} onCheckedChange={active => toggle(department, active)} aria-label={`${department.name} status`} />
              </div>
              {!!department.subDepartmentDetails.length && <details className="mx-4 mb-4 rounded-md border bg-muted/30 p-3">
                <summary className="cursor-pointer text-sm">Subdepartments ({department.subDepartmentDetails.length})</summary>
                <ul className="mt-2 divide-y">{department.subDepartmentDetails.map(child => <li key={child.id ?? child.name} className="flex items-center gap-4 py-3 pl-3">
                  <span className="flex-1 text-sm">{child.name}</span>
                  <Badge variant={child.active && department.active ? "default" : "secondary"}>{!child.active ? "Inactive" : !department.active ? "Parent inactive" : "Active"}</Badge>
                  <Switch checked={child.active} disabled={!canEdit || busy || !hierarchyReady} onCheckedChange={active => toggle(department, active, child.id)} aria-label={`${department.name} / ${child.name} status`} />
                </li>)}</ul>
              </details>}
            </TableCell>
          </TableRow>)}</TableBody>
        </Table>}
        {query.isSuccess && !query.data.length && <p>No departments yet.</p>}
        {statusError && <p role="alert" className="text-destructive">{statusError}</p>}
        <p className="mt-3 text-xs text-muted-foreground">Changes apply only to this store. An inactive department makes all its subdepartments unavailable for item selection. Existing product assignments are retained.</p>
      </CardContent>
    </Card>
    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Edit Department" : "Add Department"}</DialogTitle><DialogDescription>Manage the department and its subdepartments for this store.</DialogDescription></DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="department-name">Department name</Label><Input id="department-name" required maxLength={150} disabled={busy} value={name} onChange={event => setName(event.target.value)} /></div>
          <div className="space-y-3"><p className="font-medium">Subdepartments</p>{children.map((child, index) => <div key={child.id ?? `new-${index}`} className="space-y-2">
            <Label htmlFor={`subdepartment-${index}`}>Subdepartment {index + 1}</Label>
            <div className="flex items-center gap-2"><Input id={`subdepartment-${index}`} required={!!child.id} maxLength={150} disabled={busy} value={child.name} onChange={event => updateChild(index, { name: event.target.value })} placeholder="Subdepartment name" />
              <Switch checked={child.active} disabled={busy} onCheckedChange={active => updateChild(index, { active })} aria-label={`Subdepartment ${index + 1} active`} />
              {!child.id && <Button type="button" variant="ghost" disabled={busy} onClick={() => setChildren(current => current.filter((_, i) => i !== index))}>Remove</Button>}
            </div>
          </div>)}<Button type="button" variant="outline" disabled={busy || children.length >= 500} onClick={() => setChildren(current => [...current, { name: "", active: true }])}>Add Subdepartment</Button></div>
          {error && <p role="alert" className="text-destructive">{error}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={busy || !name.trim()}>{busy ? "Saving…" : "Save"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}
