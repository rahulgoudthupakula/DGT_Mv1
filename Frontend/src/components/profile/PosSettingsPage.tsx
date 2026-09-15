import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wifi, AlertTriangle, ArrowRightLeft, FileText, ShieldAlert, Fuel } from "lucide-react";

const deptMapping = [
  { pos: "DEPT01", system: "Grocery" },
  { pos: "DEPT02", system: "Deli" },
  { pos: "DEPT03", system: "Beverages" },
  { pos: "DEPT04", system: "Tobacco" },
  { pos: "DEPT05", system: "Snacks" },
];

const tenderMapping = [
  { pos: "TNDR01", system: "Cash" },
  { pos: "TNDR02", system: "Credit Card" },
  { pos: "TNDR03", system: "Debit Card" },
  { pos: "TNDR04", system: "EBT" },
];

const errorLogs = [
  { date: "Feb 12, 2026 8:45 AM", type: "Sync Error", message: "Timeout connecting to POS terminal 2", severity: "warning" },
  { date: "Feb 11, 2026 11:30 PM", type: "Failed Import", message: "Z-Reading import failed: missing fields", severity: "error" },
  { date: "Feb 10, 2026 3:15 PM", type: "Data Mismatch", message: "Department code DEPT06 not mapped", severity: "warning" },
];

const ageRestrictionCards = [
  { item: "Cigarettes", minAge: 21, requireScan: true, bypassAllowed: false },
  { item: "Alcohol / Beer", minAge: 21, requireScan: true, bypassAllowed: false },
  { item: "Tobacco Products", minAge: 21, requireScan: true, bypassAllowed: false },
  { item: "Lottery Tickets", minAge: 18, requireScan: false, bypassAllowed: true },
  { item: "E-Cigarettes / Vape", minAge: 21, requireScan: true, bypassAllowed: false },
];

const gasGradeMapping = [
  { posCode: "GRD01", posName: "REG", systemGrade: "Regular Unleaded", octane: "87" },
  { posCode: "GRD02", posName: "MID", systemGrade: "Mid-Grade Plus", octane: "89" },
  { posCode: "GRD03", posName: "PRM", systemGrade: "Premium", octane: "93" },
  { posCode: "GRD04", posName: "DSL", systemGrade: "Diesel", octane: "N/A" },
];

export const PosSettingsPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">POS Settings</h1>

      {/* Connection Settings */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Wifi className="w-5 h-5" /> Connection Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>POS Type</Label>
              <Select defaultValue="verifone">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="verifone">Verifone Commander</SelectItem>
                  <SelectItem value="gilbarco">Gilbarco Passport</SelectItem>
                  <SelectItem value="ncr">NCR Aloha</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Connection Type</Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-green-600 text-white">API Connected</Badge>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Last Sync Time</Label>
              <Input readOnly value="Feb 12, 2026 9:00 AM" className="bg-muted" />
            </div>
            <div className="space-y-1.5">
              <Label>Sync Frequency</Label>
              <Select defaultValue="15">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">Every 5 minutes</SelectItem>
                  <SelectItem value="15">Every 15 minutes</SelectItem>
                  <SelectItem value="30">Every 30 minutes</SelectItem>
                  <SelectItem value="60">Every hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Mapping */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ArrowRightLeft className="w-5 h-5" /> Data Mapping</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium text-sm mb-2">POS Department → System Department</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>POS Code</TableHead>
                  <TableHead>System Department</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deptMapping.map((m) => (
                  <TableRow key={m.pos}>
                    <TableCell className="font-mono text-xs">{m.pos}</TableCell>
                    <TableCell>{m.system}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="sm" className="h-6 text-[10px]">Edit</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-2">Tender Mapping</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>POS Code</TableHead>
                  <TableHead>System Tender</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenderMapping.map((m) => (
                  <TableRow key={m.pos}>
                    <TableCell className="font-mono text-xs">{m.pos}</TableCell>
                    <TableCell>{m.system}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="sm" className="h-6 text-[10px]">Edit</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Age Restriction Cards */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> Age Restriction Cards</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Configure age verification requirements for restricted items at POS.</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Category</TableHead>
                <TableHead>Minimum Age</TableHead>
                <TableHead>Require ID Scan</TableHead>
                <TableHead>Manager Bypass</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ageRestrictionCards.map((item) => (
                <TableRow key={item.item}>
                  <TableCell className="font-medium text-sm">{item.item}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{item.minAge}+</Badge>
                  </TableCell>
                  <TableCell>
                    <Switch defaultChecked={item.requireScan} />
                  </TableCell>
                  <TableCell>
                    <Switch defaultChecked={item.bypassAllowed} />
                  </TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" className="h-6 text-[10px]">Edit</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button variant="outline" size="sm" className="text-xs">+ Add Restriction</Button>
        </CardContent>
      </Card>

      {/* Gas Grade Mapping */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Fuel className="w-5 h-5" /> Gas Grade Mapping</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Map POS fuel grade codes to system fuel grades for accurate reporting and reconciliation.</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>POS Code</TableHead>
                <TableHead>POS Name</TableHead>
                <TableHead>System Grade</TableHead>
                <TableHead>Octane</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gasGradeMapping.map((g) => (
                <TableRow key={g.posCode}>
                  <TableCell className="font-mono text-xs">{g.posCode}</TableCell>
                  <TableCell className="font-mono text-xs">{g.posName}</TableCell>
                  <TableCell className="text-sm">{g.systemGrade}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{g.octane}</Badge>
                  </TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" className="h-6 text-[10px]">Edit</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button variant="outline" size="sm" className="text-xs">+ Add Grade Mapping</Button>
        </CardContent>
      </Card>

      {/* Z-Reading Configuration */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5" /> Z-Reading Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div><Label>Auto-import Z Reading</Label><p className="text-xs text-muted-foreground">Automatically import Z-Reading data from POS</p></div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div><Label>Manual Override Allowed?</Label><p className="text-xs text-muted-foreground">Allow manual edits to imported Z-Reading data</p></div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div><Label>Require Approval?</Label><p className="text-xs text-muted-foreground">Require manager approval before posting Z-Reading</p></div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Error Logs */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Error Logs</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errorLogs.map((log, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs">{log.date}</TableCell>
                  <TableCell className="text-xs font-medium">{log.type}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{log.message}</TableCell>
                  <TableCell>
                    <Badge variant={log.severity === "error" ? "destructive" : "secondary"} className="text-[10px]">
                      {log.severity}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
