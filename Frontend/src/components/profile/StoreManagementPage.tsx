import { DepartmentAccessPanel } from "./DepartmentAccessPanel";
import { StoreRoleMatrix } from "./StoreRoleMatrix";
import { RolePermissionsPanel } from "./RolePermissionsPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Key } from "lucide-react";
import { useState } from "react";



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

        <TabsContent value="departments" className="space-y-6">
          <DepartmentAccessPanel key={storeId} storeId={storeId} />
        </TabsContent>

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
