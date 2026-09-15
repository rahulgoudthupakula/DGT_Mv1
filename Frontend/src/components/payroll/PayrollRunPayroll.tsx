import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2, Lock, FileText, Printer, ChevronRight, ChevronLeft,
  CalendarDays, Clock, DollarSign, Receipt, Eye, AlertTriangle
} from "lucide-react";

const steps = [
  { label: "Select Pay Period", icon: CalendarDays },
  { label: "Review Hours & Earnings", icon: Clock },
  { label: "Taxes & Deductions", icon: Receipt },
  { label: "Preview Summary", icon: Eye },
  { label: "Approve & Lock", icon: Lock },
];

type Employee = {
  id: number;
  name: string;
  type: "hourly" | "salary";
  rate: number;
  regular: number;
  ot: number;
  gross: number;
  federal: number;
  state: number;
  fica: number;
  health: number;
  retirement: number;
  otherDed: number;
  net: number;
  method: "Direct Deposit" | "Check";
};

const employees: Employee[] = [
  {
    id: 1, name: "Maria Lopez", type: "hourly", rate: 18, regular: 38, ot: 2,
    gross: 726.00, federal: 72.60, state: 36.30, fica: 55.54, health: 80.00, retirement: 36.30, otherDed: 3.70, net: 441.56,
    method: "Direct Deposit",
  },
  {
    id: 2, name: "James Carter", type: "hourly", rate: 17, regular: 38, ot: 0,
    gross: 646.00, federal: 64.60, state: 32.30, fica: 49.42, health: 80.00, retirement: 32.30, otherDed: 0, net: 387.38,
    method: "Direct Deposit",
  },
  {
    id: 3, name: "Aisha Patel", type: "salary", rate: 52000, regular: 40, ot: 0,
    gross: 2000.00, federal: 300.00, state: 100.00, fica: 153.00, health: 120.00, retirement: 100.00, otherDed: 7.00, net: 1220.00,
    method: "Direct Deposit",
  },
  {
    id: 4, name: "Sarah Kim", type: "salary", rate: 45000, regular: 40, ot: 5,
    gross: 1875.00, federal: 281.25, state: 93.75, fica: 143.44, health: 80.00, retirement: 93.75, otherDed: 3.75, net: 1179.06,
    method: "Check",
  },
];

const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

const PAY_PERIODS = [
  { value: "feb-1-15", label: "Feb 1 – Feb 15, 2026" },
  { value: "jan-16-31", label: "Jan 16 – Jan 31, 2026" },
  { value: "jan-1-15", label: "Jan 1 – Jan 15, 2026" },
];

export const PayrollRunPayroll = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [payPeriod, setPayPeriod] = useState("feb-1-15");
  const [payFrequency, setPayFrequency] = useState("biweekly");
  const [locked, setLocked] = useState(false);

  const selectedPeriodLabel = PAY_PERIODS.find(p => p.value === payPeriod)?.label ?? "";

  const totals = {
    gross: sum(employees.map(e => e.gross)),
    federal: sum(employees.map(e => e.federal)),
    state: sum(employees.map(e => e.state)),
    fica: sum(employees.map(e => e.fica)),
    health: sum(employees.map(e => e.health)),
    retirement: sum(employees.map(e => e.retirement)),
    otherDed: sum(employees.map(e => e.otherDed)),
    net: sum(employees.map(e => e.net)),
    totalTaxes: sum(employees.map(e => e.federal + e.state + e.fica)),
    totalDed: sum(employees.map(e => e.health + e.retirement + e.otherDed)),
  };

  const canProceed = () => currentStep < steps.length - 1;
  const canGoBack = () => currentStep > 0;

  /* ─── Step renderers ─── */

  const renderStep0 = () => (
    <div className="space-y-6">
      <Card className="border-dashboard-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground" /> Pay Period Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Pay Frequency</label>
              <Select value={payFrequency} onValueChange={setPayFrequency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-Weekly (every 2 weeks)</SelectItem>
                  <SelectItem value="semimonthly">Semi-Monthly (1st & 15th)</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Pay Period</label>
              <Select value={payPeriod} onValueChange={setPayPeriod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAY_PERIODS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Employees", value: employees.length },
              { label: "Pay Date", value: "Feb 20, 2026" },
              { label: "Frequency", value: payFrequency === "biweekly" ? "Bi-Weekly" : payFrequency },
              { label: "Period", value: selectedPeriodLabel },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-muted/40 p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Ensure all time sheets are approved in <strong>Time &amp; Attendance</strong> before proceeding. Missing punches may affect gross pay calculations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep1 = () => (
    <Card className="border-dashboard-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Hours &amp; Earnings — {selectedPeriodLabel}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Regular Hrs</TableHead>
              <TableHead className="text-right">OT Hrs</TableHead>
              <TableHead className="text-right">OT Pay</TableHead>
              <TableHead className="text-right">Gross Pay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map(e => {
              const regularPay = e.type === "hourly" ? e.rate * e.regular : e.gross - e.rate / 26 * 0;
              const otPay = e.type === "hourly" ? e.rate * 1.5 * e.ot : 0;
              return (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] capitalize">{e.type}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {e.type === "hourly" ? `$${e.rate}/hr` : `$${e.rate.toLocaleString()}/yr`}
                  </TableCell>
                  <TableCell className="text-right font-mono">{e.regular}</TableCell>
                  <TableCell className="text-right font-mono">
                    {e.ot > 0
                      ? <span className="text-amber-600 font-semibold">{e.ot}</span>
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {e.ot > 0 ? fmt(otPay) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">{fmt(e.gross)}</TableCell>
                </TableRow>
              );
            })}
            <TableRow className="bg-muted/30 font-semibold">
              <TableCell colSpan={6}>Totals</TableCell>
              <TableCell className="text-right font-mono">{fmt(totals.gross)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="border-dashboard-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Taxes &amp; Deductions — {selectedPeriodLabel}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead className="text-right">Gross</TableHead>
              <TableHead className="text-right">Federal Tax</TableHead>
              <TableHead className="text-right">State Tax</TableHead>
              <TableHead className="text-right">FICA</TableHead>
              <TableHead className="text-right">Health Ins.</TableHead>
              <TableHead className="text-right">401(k)</TableHead>
              <TableHead className="text-right">Other</TableHead>
              <TableHead className="text-right">Net Pay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map(e => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.name}</TableCell>
                <TableCell className="text-right font-mono text-xs">{fmt(e.gross)}</TableCell>
                <TableCell className="text-right font-mono text-xs text-destructive">{fmt(e.federal)}</TableCell>
                <TableCell className="text-right font-mono text-xs text-destructive">{fmt(e.state)}</TableCell>
                <TableCell className="text-right font-mono text-xs text-destructive">{fmt(e.fica)}</TableCell>
                <TableCell className="text-right font-mono text-xs">{fmt(e.health)}</TableCell>
                <TableCell className="text-right font-mono text-xs">{fmt(e.retirement)}</TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {e.otherDed > 0 ? fmt(e.otherDed) : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">{fmt(e.net)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/30 font-semibold text-xs">
              <TableCell>Totals</TableCell>
              <TableCell className="text-right font-mono">{fmt(totals.gross)}</TableCell>
              <TableCell className="text-right font-mono text-destructive">{fmt(totals.federal)}</TableCell>
              <TableCell className="text-right font-mono text-destructive">{fmt(totals.state)}</TableCell>
              <TableCell className="text-right font-mono text-destructive">{fmt(totals.fica)}</TableCell>
              <TableCell className="text-right font-mono">{fmt(totals.health)}</TableCell>
              <TableCell className="text-right font-mono">{fmt(totals.retirement)}</TableCell>
              <TableCell className="text-right font-mono">{fmt(totals.otherDed)}</TableCell>
              <TableCell className="text-right font-mono">{fmt(totals.net)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Gross", value: fmt(totals.gross), icon: DollarSign, color: "text-foreground" },
          { label: "Total Taxes", value: fmt(totals.totalTaxes), icon: Receipt, color: "text-destructive" },
          { label: "Total Deductions", value: fmt(totals.totalDed), icon: Receipt, color: "text-muted-foreground" },
          { label: "Total Net Pay", value: fmt(totals.net), icon: DollarSign, color: "text-primary" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="border-dashboard-border">
            <CardContent className="p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
              <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashboard-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Full Payroll Preview — {selectedPeriodLabel}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Taxes</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead>Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell className="text-right font-mono">{fmt(e.gross)}</TableCell>
                  <TableCell className="text-right font-mono text-destructive">{fmt(e.federal + e.state + e.fica)}</TableCell>
                  <TableCell className="text-right font-mono">{fmt(e.health + e.retirement + e.otherDed)}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">{fmt(e.net)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">{e.method}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30 font-semibold">
                <TableCell>Totals</TableCell>
                <TableCell className="text-right font-mono">{fmt(totals.gross)}</TableCell>
                <TableCell className="text-right font-mono text-destructive">{fmt(totals.totalTaxes)}</TableCell>
                <TableCell className="text-right font-mono">{fmt(totals.totalDed)}</TableCell>
                <TableCell className="text-right font-mono">{fmt(totals.net)}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <Card className="border-dashboard-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" /> Approve &amp; Lock Payroll
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {locked ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20 p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Payroll Approved &amp; Locked</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {selectedPeriodLabel} · Locked on Feb 18, 2026 at 2:34 PM
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 p-4 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Once approved, this payroll run will be <strong>locked and cannot be edited</strong>. ACH files and checks will be generated upon locking.
              </p>
            </div>
          )}

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/40 p-3 space-y-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Period</p>
              <p className="text-sm font-semibold">{selectedPeriodLabel}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 space-y-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Net Pay</p>
              <p className="text-sm font-semibold font-mono text-primary">{fmt(totals.net)}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 space-y-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Employees</p>
              <p className="text-sm font-semibold">{employees.length}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 space-y-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pay Date</p>
              <p className="text-sm font-semibold">Feb 20, 2026</p>
            </div>
          </div>

          {/* Method breakdown */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell className="text-right font-mono">{fmt(e.net)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">{e.method}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {locked
                      ? <Badge variant="default" className="text-[10px] bg-emerald-600 hover:bg-emerald-600">Queued</Badge>
                      : <Badge variant="outline" className="text-[10px]">Pending</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!locked && (
            <div className="flex gap-3">
              <Button
                onClick={() => setLocked(true)}
                className="gap-2"
              >
                <Lock className="w-4 h-4" /> Approve &amp; Lock Payroll
              </Button>
              <Button variant="outline" size="default" className="gap-2">
                <FileText className="w-4 h-4" /> Preview Paystubs
              </Button>
            </div>
          )}

          {locked && (
            <div className="flex gap-3">
              <Button className="gap-2">
                <Printer className="w-4 h-4" /> Generate ACH / Print Checks
              </Button>
              <Button variant="outline" className="gap-2">
                <FileText className="w-4 h-4" /> Download Paystubs
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const stepContent = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Run Payroll</h1>

      {/* Stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center gap-1">
            <button
              onClick={() => setCurrentStep(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                i === currentStep
                  ? "bg-primary text-primary-foreground"
                  : i < currentStep
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < currentStep
                ? <CheckCircle2 className="w-3.5 h-3.5" />
                : <s.icon className="w-3.5 h-3.5" />}
              <span>{i + 1}. {s.label}</span>
            </button>
            {i < steps.length - 1 && <div className="w-4 h-px bg-border shrink-0" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      {stepContent[currentStep]()}

      {/* Navigation */}
      <div className="flex items-center gap-3">
        {canGoBack() && (
          <Button variant="outline" size="sm" onClick={() => setCurrentStep(s => s - 1)} className="gap-1">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
        )}
        {canProceed() && (
          <Button size="sm" onClick={() => setCurrentStep(s => s + 1)} className="gap-1">
            Continue <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
