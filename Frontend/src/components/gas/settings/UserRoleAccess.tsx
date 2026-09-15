import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const roles = ["Manager", "Cashier", "Attendant"];
const permissions = [
  "View gas data",
  "Add delivery",
  "Reconcile delivery",
  "Create adjustment",
  "Approve adjustment",
  "Record price change",
  "Change settings",
];

const defaults: Record<string, string[]> = {
  Manager: permissions,
  Cashier: ["View gas data", "Add delivery"],
  Attendant: ["View gas data"],
};

export const UserRoleAccess = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-semibold">User Role Access</CardTitle>
      <p className="text-xs text-muted-foreground">Permission grid for gas operations.</p>
    </CardHeader>
    <CardContent className="p-0 overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 font-medium text-muted-foreground">Permission</th>
            {roles.map((r) => (
              <th key={r} className="text-center p-3 font-medium text-muted-foreground w-24">{r}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {permissions.map((p) => (
            <tr key={p} className="border-b last:border-0">
              <td className="p-3 font-medium">{p}</td>
              {roles.map((r) => (
                <td key={r} className="text-center p-3">
                  <Checkbox defaultChecked={defaults[r]?.includes(p)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </CardContent>
  </Card>
);
