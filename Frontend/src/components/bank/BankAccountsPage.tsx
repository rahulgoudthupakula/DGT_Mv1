import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Plus,
  Download,
  Eye,
  Pencil,
  Building2,
  ShieldCheck,
  Clock,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type AccountType =
  | "Checking"
  | "Savings"
  | "Credit Line"
  | "Cash on Hand"
  | "ATM Vault"
  | "Safe";

interface BankAccount {
  id: string;
  accountName: string;
  accountType: AccountType;
  bankName: string;
  accountNumber: string;
  routingNumber?: string;
  currentBalance: number;
  openingBalance: number;
  openingDate: string;
  active: boolean;
  defaultSettlement: boolean;
  minBalanceAlert?: number;
  overdraftAllowed: boolean;
  alertThreshold?: number;
  createdBy: string;
  createdAt: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

interface SettlementMapping {
  module: string;
  accountId: string;
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const initialAccounts: BankAccount[] = [
  {
    id: "1",
    accountName: "Primary Checking",
    accountType: "Checking",
    bankName: "Chase Bank",
    accountNumber: "****4521",
    routingNumber: "021000021",
    currentBalance: 48320.5,
    openingBalance: 25000,
    openingDate: "2024-01-15",
    active: true,
    defaultSettlement: true,
    minBalanceAlert: 5000,
    overdraftAllowed: false,
    alertThreshold: 5000,
    createdBy: "Admin",
    createdAt: "2024-01-15 09:00",
  },
  {
    id: "2",
    accountName: "Secondary Checking",
    accountType: "Checking",
    bankName: "Bank of America",
    accountNumber: "****8832",
    currentBalance: 15780.25,
    openingBalance: 10000,
    openingDate: "2024-02-01",
    active: true,
    defaultSettlement: false,
    overdraftAllowed: false,
    createdBy: "Admin",
    createdAt: "2024-02-01 10:30",
  },
  {
    id: "3",
    accountName: "Business Savings",
    accountType: "Savings",
    bankName: "Chase Bank",
    accountNumber: "****7710",
    currentBalance: 120000,
    openingBalance: 100000,
    openingDate: "2024-01-15",
    active: true,
    defaultSettlement: false,
    overdraftAllowed: false,
    createdBy: "Admin",
    createdAt: "2024-01-15 09:00",
  },
  {
    id: "4",
    accountName: "Store Safe",
    accountType: "Safe",
    bankName: "—",
    accountNumber: "N/A",
    currentBalance: 3500,
    openingBalance: 2000,
    openingDate: "2024-01-15",
    active: true,
    defaultSettlement: false,
    overdraftAllowed: false,
    createdBy: "Admin",
    createdAt: "2024-01-15 09:00",
  },
  {
    id: "5",
    accountName: "ATM Vault",
    accountType: "ATM Vault",
    bankName: "—",
    accountNumber: "N/A",
    currentBalance: 18000,
    openingBalance: 20000,
    openingDate: "2024-03-01",
    active: true,
    defaultSettlement: false,
    overdraftAllowed: false,
    createdBy: "Manager",
    createdAt: "2024-03-01 08:00",
  },
  {
    id: "6",
    accountName: "Cash on Hand",
    accountType: "Cash on Hand",
    bankName: "—",
    accountNumber: "N/A",
    currentBalance: 1200,
    openingBalance: 1000,
    openingDate: "2024-01-15",
    active: true,
    defaultSettlement: false,
    overdraftAllowed: false,
    createdBy: "Admin",
    createdAt: "2024-01-15 09:00",
  },
  {
    id: "7",
    accountName: "Credit Line – Wells Fargo",
    accountType: "Credit Line",
    bankName: "Wells Fargo",
    accountNumber: "****3390",
    currentBalance: -8500,
    openingBalance: 0,
    openingDate: "2024-04-01",
    active: false,
    defaultSettlement: false,
    overdraftAllowed: true,
    createdBy: "Admin",
    createdAt: "2024-04-01 11:00",
    lastModifiedBy: "Manager",
    lastModifiedAt: "2024-06-15 14:20",
  },
];

const initialMappings: SettlementMapping[] = [
  { module: "Credit Card Settlement", accountId: "1" },
  { module: "EBT Settlement", accountId: "1" },
  { module: "Fleet Settlement", accountId: "2" },
  { module: "Services Settlement", accountId: "1" },
  { module: "ATM Cash Load", accountId: "5" },
  { module: "Money Order", accountId: "1" },
  { module: "Lottery Settlement", accountId: "1" },
];

const accountTypes: AccountType[] = [
  "Checking",
  "Savings",
  "Credit Line",
  "Cash on Hand",
  "ATM Vault",
  "Safe",
];

const auditLog = [
  { timestamp: "2024-06-15 14:20", user: "Manager", action: "Deactivated account 'Credit Line – Wells Fargo'" },
  { timestamp: "2024-04-01 11:00", user: "Admin", action: "Created account 'Credit Line – Wells Fargo', opening balance $0.00 posted" },
  { timestamp: "2024-03-01 08:00", user: "Manager", action: "Created account 'ATM Vault', opening balance $20,000.00 posted" },
  { timestamp: "2024-02-01 10:30", user: "Admin", action: "Created account 'Secondary Checking', opening balance $10,000.00 posted" },
  { timestamp: "2024-01-15 09:00", user: "Admin", action: "Created accounts: Primary Checking, Business Savings, Store Safe, Cash on Hand" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const emptyForm = (): Omit<BankAccount, "id" | "currentBalance" | "createdBy" | "createdAt"> => ({
  accountName: "",
  accountType: "Checking",
  bankName: "",
  accountNumber: "",
  routingNumber: "",
  openingBalance: 0,
  openingDate: new Date().toISOString().slice(0, 10),
  active: true,
  defaultSettlement: false,
  minBalanceAlert: undefined,
  overdraftAllowed: false,
  alertThreshold: undefined,
});

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const BankAccountsPage = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>(initialAccounts);
  const [mappings, setMappings] = useState<SettlementMapping[]>(initialMappings);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewAccount, setViewAccount] = useState<BankAccount | null>(null);
  const [form, setForm] = useState(emptyForm());

  /* ----- modal helpers ----- */

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (acct: BankAccount) => {
    setEditingId(acct.id);
    setForm({
      accountName: acct.accountName,
      accountType: acct.accountType,
      bankName: acct.bankName,
      accountNumber: acct.accountNumber,
      routingNumber: acct.routingNumber || "",
      openingBalance: acct.openingBalance,
      openingDate: acct.openingDate,
      active: acct.active,
      defaultSettlement: acct.defaultSettlement,
      minBalanceAlert: acct.minBalanceAlert,
      overdraftAllowed: acct.overdraftAllowed,
      alertThreshold: acct.alertThreshold,
    });
    setModalOpen(true);
  };

  const openView = (acct: BankAccount) => {
    setViewAccount(acct);
    setViewModalOpen(true);
  };

  const saveAccount = () => {
    if (editingId) {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === editingId
            ? {
                ...a,
                ...form,
                lastModifiedBy: "Current User",
                lastModifiedAt: new Date().toLocaleString(),
              }
            : a
        )
      );
    } else {
      const newAcct: BankAccount = {
        ...form,
        id: crypto.randomUUID(),
        currentBalance: form.openingBalance,
        createdBy: "Current User",
        createdAt: new Date().toLocaleString(),
      };
      setAccounts((prev) => [...prev, newAcct]);
    }
    setModalOpen(false);
  };

  const updateMapping = (module: string, accountId: string) => {
    setMappings((prev) =>
      prev.map((m) => (m.module === module ? { ...m, accountId } : m))
    );
  };

  const activeAccounts = accounts.filter((a) => a.active);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">
            Manage Bank Accounts
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" /> Add New Account
          </Button>
        </div>
      </div>

      {/* ---- Accounts Table ---- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">All Accounts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-[11px]">
                  <TableHead>Account Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Bank Name</TableHead>
                  <TableHead>Routing #</TableHead>
                  <TableHead>Account #</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-center">Default Settlement</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((acct) => (
                  <TableRow key={acct.id} className="text-[11px]">
                    <TableCell className="font-medium">{acct.accountName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {acct.accountType}
                      </Badge>
                    </TableCell>
                    <TableCell>{acct.bankName}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {acct.routingNumber || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {acct.accountNumber}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={acct.active ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {acct.active ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {acct.defaultSettlement ? (
                        <Badge className="bg-primary/20 text-primary text-[10px]">
                          Yes
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => openEdit(acct)}
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => openView(acct)}
                          title="View"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() =>
                            setAccounts((prev) => prev.filter((a) => a.id !== acct.id))
                          }
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ---- Settlement Mapping ---- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Settlement Mapping
          </CardTitle>
          <p className="text-[11px] text-muted-foreground">
            Map each settlement module to its default bank account for automated
            ledger posting and clean reconciliation.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-[11px]">
                <TableHead>Module</TableHead>
                <TableHead>Default Bank Account</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((m) => (
                <TableRow key={m.module} className="text-[11px]">
                  <TableCell className="font-medium">{m.module}</TableCell>
                  <TableCell>
                    <Select
                      value={m.accountId}
                      onValueChange={(v) => updateMapping(m.module, v)}
                    >
                      <SelectTrigger className="h-8 w-56 text-[11px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {activeAccounts.map((a) => (
                          <SelectItem key={a.id} value={a.id} className="text-[11px]">
                            {a.accountName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ---- Balance Controls & Permissions ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Balance Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-[11px]">
            <p className="text-muted-foreground">
              Per-account settings are managed in the Edit Account modal.
              Global defaults:
            </p>
            <div className="flex items-center justify-between">
              <span>Default minimum balance alert</span>
              <Badge variant="outline">$5,000.00</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Overdraft protection</span>
              <Badge variant="secondary">Disabled by default</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Alert threshold</span>
              <Badge variant="outline">$5,000.00</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-[11px]">
            {[
              { action: "Add account", role: "Admin" },
              { action: "Edit account", role: "Admin, Manager" },
              { action: "Change settlement mapping", role: "Admin" },
              { action: "Set default account", role: "Admin" },
              { action: "Deactivate account", role: "Admin" },
            ].map((p) => (
              <div key={p.action} className="flex items-center justify-between">
                <span>{p.action}</span>
                <Badge variant="outline" className="text-[10px]">
                  {p.role}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ---- Audit Log ---- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-[11px]">
                <TableHead className="w-40">Timestamp</TableHead>
                <TableHead className="w-28">User</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLog.map((entry, i) => (
                <TableRow key={i} className="text-[11px]">
                  <TableCell className="text-muted-foreground font-mono">
                    {entry.timestamp}
                  </TableCell>
                  <TableCell>{entry.user}</TableCell>
                  <TableCell>{entry.action}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ---- Add / Edit Modal ---- */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {editingId ? "Edit Account" : "Add New Account"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2 text-[11px]">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px]">Account Name</Label>
                <Input
                  className="h-8 text-[11px]"
                  value={form.accountName}
                  onChange={(e) =>
                    setForm({ ...form, accountName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Account Type</Label>
                <Select
                  value={form.accountType}
                  onValueChange={(v) =>
                    setForm({ ...form, accountType: v as AccountType })
                  }
                >
                  <SelectTrigger className="h-8 text-[11px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((t) => (
                      <SelectItem key={t} value={t} className="text-[11px]">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px]">Bank Name</Label>
                <Input
                  className="h-8 text-[11px]"
                  value={form.bankName}
                  onChange={(e) =>
                    setForm({ ...form, bankName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Account Number</Label>
                <Input
                  className="h-8 text-[11px]"
                  value={form.accountNumber}
                  onChange={(e) =>
                    setForm({ ...form, accountNumber: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px]">Routing Number (optional)</Label>
                <Input
                  className="h-8 text-[11px]"
                  value={form.routingNumber}
                  onChange={(e) =>
                    setForm({ ...form, routingNumber: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Opening Balance</Label>
                <Input
                  type="number"
                  className="h-8 text-[11px]"
                  value={form.openingBalance}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      openingBalance: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px]">Opening Date</Label>
                <Input
                  type="date"
                  className="h-8 text-[11px]"
                  value={form.openingDate}
                  onChange={(e) =>
                    setForm({ ...form, openingDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Min Balance Alert</Label>
                <Input
                  type="number"
                  className="h-8 text-[11px]"
                  value={form.minBalanceAlert ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      minBalanceAlert: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.active}
                  onCheckedChange={(v) => setForm({ ...form, active: v })}
                />
                <Label className="text-[11px]">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={form.defaultSettlement}
                  onCheckedChange={(v) =>
                    setForm({ ...form, defaultSettlement: v === true })
                  }
                />
                <Label className="text-[11px]">Default Settlement Account</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.overdraftAllowed}
                  onCheckedChange={(v) =>
                    setForm({ ...form, overdraftAllowed: v })
                  }
                />
                <Label className="text-[11px]">Overdraft Allowed</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={saveAccount}>
              {editingId ? "Save Changes" : "Add Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- View Account Modal ---- */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Account Details</DialogTitle>
          </DialogHeader>
          {viewAccount && (
            <div className="space-y-3 text-[11px]">
              {[
                ["Account Name", viewAccount.accountName],
                ["Type", viewAccount.accountType],
                ["Bank Name", viewAccount.bankName],
                ["Account #", viewAccount.accountNumber],
                ["Routing #", viewAccount.routingNumber || "—"],
                ["Opening Balance", fmt(viewAccount.openingBalance)],
                ["Opening Date", viewAccount.openingDate],
                ["Current Balance", fmt(viewAccount.currentBalance)],
                ["Active", viewAccount.active ? "Yes" : "No"],
                ["Default Settlement", viewAccount.defaultSettlement ? "Yes" : "No"],
                ["Overdraft Allowed", viewAccount.overdraftAllowed ? "Yes" : "No"],
                ["Min Balance Alert", viewAccount.minBalanceAlert ? fmt(viewAccount.minBalanceAlert) : "—"],
                ["Created By", viewAccount.createdBy],
                ["Created At", viewAccount.createdAt],
                ["Last Modified By", viewAccount.lastModifiedBy || "—"],
                ["Last Modified At", viewAccount.lastModifiedAt || "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
