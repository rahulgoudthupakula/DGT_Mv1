import {useCards,exportRows,type Processor} from './creditCardData';
import {ProcessorDialog} from './ProcessorDialog';
import { useState,useEffect,createContext,useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Save, Settings, CreditCard, Shield, AlertTriangle, Users, ClipboardList } from "lucide-react";

const SettingsContext=createContext<{values:Record<string,string|number|boolean>;set:(key:string,value:string|boolean)=>void;locked:boolean}|null>(null);
const labels:Record<string,string>={default_fee_percent:'Default Rate (%)',per_transaction_fee:'Fee per Swipe ($)',fee_difference_percent:'Allowed Fee Difference (%)',deposit_tolerance:'Allowed Deposit Variance ($)'};
const SettingNumber=({name}:{name:string})=>{const c=useContext(SettingsContext)!;return <Input aria-label={labels[name]} className="h-9 text-xs" value={String(c.values[name]??'')} disabled={c.locked} onChange={e=>c.set(name,e.target.value)}/>;};
const SettingSwitch=({name}:{name:string})=>{const c=useContext(SettingsContext)!;return <Switch aria-label={name} checked={Boolean(c.values[name])} disabled={c.locked} onCheckedChange={v=>c.set(name,v)}/>;};

/* ─── Processor Configuration ─── */
const ProcessorConfig = () => {
  const c=useCards();const [editing,setEditing]=useState<Processor|null|undefined>(undefined);
  const processors=c.q.data!.processors.map(p=>({name:p.processor_name,active:p.is_active,frequency:p.settlement_frequency,delay:'T+'+p.deposit_delay_days,bank:p.settlement_destination+' · '+p.destination_label,raw:p}));
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Processor Accounts</h3>
          <p className="text-xs text-muted-foreground">Configure payment processors and their deposit settings</p>
        </div>
        <Button size="sm" variant="outline" disabled={c.busy||c.q.data!.settingsLocked} onClick={()=>setEditing(null)}>+ Add Processor</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px]">Processor Name</TableHead>
                <TableHead className="text-[11px]">Active</TableHead>
                <TableHead className="text-[11px]">Settlement Frequency</TableHead>
                <TableHead className="text-[11px]">Deposit Delay</TableHead>
                <TableHead className="text-[11px]">Settlement Destination</TableHead>
                <TableHead className="text-[11px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processors.length===0&&<TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No processors configured for this store.</TableCell></TableRow>}
              {processors.map((p, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-medium">{p.name}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] ${p.active ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-muted text-muted-foreground"}`}>
                      {p.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{p.frequency}</TableCell>
                  <TableCell className="text-xs">{p.delay}</TableCell>
                  <TableCell className="text-xs">{p.bank}</TableCell>
                  <TableCell><Button variant="ghost" size="sm" className="text-xs h-7" disabled={c.busy||c.q.data!.settingsLocked} onClick={()=>setEditing(p.raw)}>Edit</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {editing!==undefined&&<ProcessorDialog processor={editing} onClose={()=>setEditing(undefined)}/>}
    </div>
  );
};

/* ─── Fee Structure ─── */
const FeeStructure = () => (
  <div className="space-y-6">
    <div>
      <h3 className="text-sm font-semibold text-foreground">Default Fee Structure</h3>
      <p className="text-xs text-muted-foreground">Set default fee expectations — actual fees can be adjusted per batch in "Update Batch Fee"</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Percentage Fee</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Default Rate (%)</Label>
            <SettingNumber name="default_fee_percent"/>
          </div>
          <p className="text-[10px] text-muted-foreground">Applied to gross card sales per batch</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Per Transaction Fee</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Fee per Swipe ($)</Label>
            <SettingNumber name="per_transaction_fee"/>
          </div>
          <p className="text-[10px] text-muted-foreground">Charged per card transaction in the batch</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Flat Monthly Fee</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Switch checked={false} disabled title="Pending source integration" />
            <span className="text-xs text-muted-foreground">Enable monthly fee</span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Monthly Amount ($)</Label>
            <Input type="number" step="0.01" defaultValue="0.00" className="h-9 text-xs" disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Additional Fee Types</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {[
              { label: "Chargeback Fee", value: "25.00" },
              { label: "PCI Compliance Fee", value: "9.95" },
              { label: "Downgrade Fee", value: "0.50" },
            ].map((fee) => (
              <div key={fee.label} className="flex items-center gap-3">
                <Switch checked={false} disabled title="Enter actual fees per batch; automatic allocation is pending" />
                <span className="text-xs w-32">{fee.label}</span>
                <Input type="number" step="0.01" value="" placeholder="—" disabled className="h-8 text-xs w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

/* ─── Settlement Rules ─── */
const SettlementRules = () => (
  <div className="space-y-6">
    <div>
      <h3 className="text-sm font-semibold text-foreground">Settlement Rules</h3>
      <p className="text-xs text-muted-foreground">Control batch lifecycle and reconciliation requirements</p>
    </div>

    <Card>
      <CardContent className="pt-6 space-y-5">
        {[
          { label: "Auto-close batch at POS sync", desc: "Automatically close open batches when POS sync completes", on: true },
          { label: "Require processor file upload before settlement", desc: "Block settlement until processor file is imported and matched", on: false },
          { label: "Require fee update before reconciliation", desc: "Prevent reconciliation unless actual fees have been reviewed", on: true },
        ].map((rule) => (
          <div key={rule.label} className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">{rule.label}</p>
              <p className="text-xs text-muted-foreground">{rule.desc}</p>
            </div>
            {rule.label==="Require fee update before reconciliation"?<SettingSwitch name="require_fee_review"/>:<Switch checked={false} disabled title="Pending source integration"/>}
          </div>
        ))}

        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Auto-mark as settled after</p>
              <p className="text-xs text-muted-foreground">Automatically transition submitted batches to settled status</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={false} disabled title="Pending source integration" />
              <Input type="number" defaultValue="3" className="h-8 text-xs w-16" disabled />
              <span className="text-xs text-muted-foreground">days</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

/* ─── Variance Controls ─── */
const VarianceControls = () => (
  <div className="space-y-6">
    <div>
      <h3 className="text-sm font-semibold text-foreground">Variance Controls</h3>
      <p className="text-xs text-muted-foreground">Set tolerance thresholds for fee differences and deposit variances</p>
    </div>

    <Card>
      <CardContent className="pt-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs">Allowed Fee Difference (%)</Label>
            <SettingNumber name="fee_difference_percent"/>
            <p className="text-[10px] text-muted-foreground">Fee differences above this percentage of the batch fee base require a reason.</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Allowed Deposit Variance ($)</Label>
            <SettingNumber name="deposit_tolerance"/>
            <p className="text-[10px] text-muted-foreground">Differences within this tolerance do not need an additional review note; reconciliation remains explicit.</p>
          </div>
        </div>

        <div className="border-t border-border pt-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Require manager approval if exceeded</p>
            <p className="text-xs text-muted-foreground">Lock settlement until a manager reviews and approves the variance</p>
          </div>
          <SettingSwitch name="require_variance_review"/>
        </div>
      </CardContent>
    </Card>
  </div>
);

/* ─── Chargeback Handling ─── */
const ChargebackHandling = () => (
  <div className="space-y-6">
    <div>
      <h3 className="text-sm font-semibold text-foreground">Chargeback Handling</h3>
      <p className="text-xs text-muted-foreground">Configure how chargebacks are tracked and processed</p>
    </div>

    <Card>
      <CardContent className="pt-6 space-y-5">
        {[
          { label: "Enable chargeback tracking", desc: "Track chargebacks as part of settlement reconciliation", on: true },
          { label: "Auto-create adjustment entry", desc: "Automatically create a fee adjustment when a chargeback is detected", on: true },
          { label: "Require reason logging", desc: "Mandate a reason code for every chargeback entry", on: true },
        ].map((rule) => (
          <div key={rule.label} className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">{rule.label}</p>
              <p className="text-xs text-muted-foreground">{rule.desc}</p>
            </div>
            {rule.label==="Auto-create adjustment entry"?<Switch checked={false} disabled title="Automatic detection is pending"/>:<SettingSwitch name={rule.label==="Enable chargeback tracking"?"enable_chargebacks":"require_chargeback_reason"}/>}
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

/* ─── User Role Permissions ─── */
const UserRolePermissions = () => {
  const roles = ["Company Admin", "Manager", "Cashier", "Accountant"];
  const permissions = [
    { action: "Update batch fee", roles: [true, true, false, true] },
    { action: "Mark batch as settled", roles: [true, true, false, false] },
    { action: "Override variance", roles: [true, true, false, false] },
    { action: "Edit processor settings", roles: [true, false, false, false] },
    { action: "Import processor file", roles: [true, true, false, true] },
    { action: "Export settlement data", roles: [true, true, false, true] },
    { action: "View settlement details", roles: [true, true, true, true] },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">User Role Permissions</h3>
        <p className="text-xs text-muted-foreground">Current server-enforced access: company admins and assigned managers. Configurable role delegation is pending.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px]">Action</TableHead>
                {roles.map((r) => (
                  <TableHead key={r} className="text-[11px] text-center">{r}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((p) => (
                <TableRow key={p.action}>
                  <TableCell className="text-xs font-medium">{p.action}</TableCell>
                  {p.roles.map((checked, i) => (
                    <TableCell key={i} className="text-center">
                      <Checkbox checked={p.action!=="Import processor file"&&i<2} disabled />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

/* ─── Audit Controls ─── */
const AuditControls = () => {
  const c=useCards();const logs=c.q.data!.audit.map(e=>{let change:{before?:unknown;after?:unknown}={};try{change=typeof e.changes==='string'?JSON.parse(e.changes):e.changes as typeof change;}catch{}return {date:new Date(e.created_at).toLocaleString(),user:e.actor,action:e.event_type,from:JSON.stringify(change.before??{}),to:JSON.stringify(change.after??{})};});
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Audit Controls</h3>
          <p className="text-xs text-muted-foreground">Track all setting changes with timestamps and user attribution</p>
        </div>
        <Button variant="outline" size="sm" onClick={()=>exportRows("credit-card-audit",logs)}><Download className="w-4 h-4 mr-1" />Export Audit Trail</Button>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Lock settings after first settlement</p>
              <p className="text-xs text-muted-foreground">Prevent changes to processor and fee settings after the first batch is settled</p>
            </div>
            <SettingSwitch name="lock_settings_after_settlement"/>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Change Log</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px]">Date & Time</TableHead>
                <TableHead className="text-[11px]">User</TableHead>
                <TableHead className="text-[11px]">Action</TableHead>
                <TableHead className="text-[11px]">Previous Value</TableHead>
                <TableHead className="text-[11px]">New Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs text-muted-foreground">{l.date}</TableCell>
                  <TableCell className="text-xs font-medium">{l.user}</TableCell>
                  <TableCell className="text-xs">{l.action}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs break-words">{l.from}</TableCell>
                  <TableCell className="text-xs max-w-xs break-words">{l.to}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

/* ─── Main Settings Page ─── */
export const CreditCardSettingsPage = () => {
 const c=useCards(),data=c.q.data!;const numeric=['default_fee_percent','per_transaction_fee','fee_difference_percent','deposit_tolerance'];const flags=['require_fee_review','require_variance_review','enable_chargebacks','require_chargeback_reason','lock_settings_after_settlement'];
 const [values,setValues]=useState(data.settings);
 useEffect(()=>setValues(data.settings),[data.settings.version]);
 const valid=numeric.every(k=>/^\d+(\.\d{1,4})?$/.test(String(values[k]))&&Number(values[k])>=0&&Number(values[k])<=(k.endsWith('percent')?100:9999999999.99));
 const save=()=>void c.mutate('/settings',{version:data.settings.version,values:Object.fromEntries([...numeric.map(k=>[k,Number(values[k])]),...flags.map(k=>[k,Boolean(values[k])])])},'PUT').catch(()=>{});

  const [activeTab, setActiveTab] = useState("processors");

  return (
    <SettingsContext.Provider value={{values,set:(key,value)=>setValues(old=>({...old,[key]:value})),locked:c.busy||data.settingsLocked}}><div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Credit Card Settings</h1>
          <p className="text-sm text-muted-foreground">Configure processors, fees, settlement rules, and access controls</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={()=>exportRows("credit-card-settings",[data.settings])}><Download className="w-4 h-4 mr-1" />Export</Button>
          <Button size="sm" disabled={c.busy||data.settingsLocked||!valid} onClick={save}><Save className="w-4 h-4 mr-1" />Save All Changes</Button>
        </div>
      </div>

<p className="text-xs text-muted-foreground">{data.settingsLocked?"Settings are locked after settlement.":"Rates are copied into new batches; saved batches keep their original rate."} Disabled controls await POS/import or monthly-fee allocation support.</p>
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="processors" className="text-xs gap-1"><CreditCard className="w-3.5 h-3.5" />Processors</TabsTrigger>
          <TabsTrigger value="fees" className="text-xs gap-1"><Settings className="w-3.5 h-3.5" />Fee Structure</TabsTrigger>
          <TabsTrigger value="settlement" className="text-xs gap-1"><Settings className="w-3.5 h-3.5" />Settlement Rules</TabsTrigger>
          <TabsTrigger value="variance" className="text-xs gap-1"><AlertTriangle className="w-3.5 h-3.5" />Variance Controls</TabsTrigger>
          <TabsTrigger value="chargebacks" className="text-xs gap-1"><Shield className="w-3.5 h-3.5" />Chargebacks</TabsTrigger>
          <TabsTrigger value="roles" className="text-xs gap-1"><Users className="w-3.5 h-3.5" />User Roles</TabsTrigger>
          <TabsTrigger value="audit" className="text-xs gap-1"><ClipboardList className="w-3.5 h-3.5" />Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="processors"><ProcessorConfig /></TabsContent>
        <TabsContent value="fees"><FeeStructure /></TabsContent>
        <TabsContent value="settlement"><SettlementRules /></TabsContent>
        <TabsContent value="variance"><VarianceControls /></TabsContent>
        <TabsContent value="chargebacks"><ChargebackHandling /></TabsContent>
        <TabsContent value="roles"><UserRolePermissions /></TabsContent>
        <TabsContent value="audit"><AuditControls /></TabsContent>
      </Tabs>
    </div></SettingsContext.Provider>
  );
};
