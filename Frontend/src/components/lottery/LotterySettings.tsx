import {LotteryCounterSetting} from "./LotteryCounterSetting";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Settings, Package, DollarSign, Clock, Shield, RotateCcw, Users, FileText, Save, Download, AlertTriangle, Lock, History } from "lucide-react";
import { toast } from "sonner";

interface SettingChange {
  id: string;
  setting: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedAt: string;
  section: string;
}


const LotterySettingsPreview = () => {
  // Game & Pack Rules
  const [allowPartialReturns, setAllowPartialReturns] = useState(true);
  const [maxOpenPacks, setMaxOpenPacks] = useState("5");

  // Commission & Settlement Rules
  const [defaultCommission, setDefaultCommission] = useState("7.0");
  const [settlementFrequency, setSettlementFrequency] = useState("weekly");
  const [roundingRule, setRoundingRule] = useState("nearest");

  // Shift & Closing Controls
  const [varianceTolerance, setVarianceTolerance] = useState("5.00");
  const [allowReopenClosing, setAllowReopenClosing] = useState(false);


  // Return Rules
  const [returnEligibilityDays, setReturnEligibilityDays] = useState("30");
  const [requireDistributorRef, setRequireDistributorRef] = useState(true);
  const [partialReturnAllowed, setPartialReturnAllowed] = useState(false);

  // System State
  const [isLocked, setIsLocked] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);


  // Audit Log
  const [auditLog] = useState<SettingChange[]>([]);


  const handleSaveSettings = () => {
    toast.success("Settings saved successfully", {
      description: "All changes have been applied."
    });
  };

  const handleExportAuditLog = () => {
    toast.success("Audit log exported", {
      description: "The audit log has been downloaded as CSV."
    });
  };

  const handleLockSettings = () => {
    setIsLocked(true);
    toast.warning("Settings locked", {
      description: "Critical settings are now locked for production."
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lottery Settings</h1>
          <p className="text-muted-foreground">Configure lottery system rules and permissions</p>
        </div>
        <div className="flex gap-2">
          {!isLocked && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Lock className="h-4 w-4" />
                  Lock Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Lock Critical Settings
                  </DialogTitle>
                  <DialogDescription>
                    This will prevent changes to critical settings after go-live. This action cannot be undone without administrator intervention.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive" onClick={handleLockSettings}>Lock Settings</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {isLocked && (
            <Badge variant="secondary" className="gap-1 h-9 px-3">
              <Lock className="h-3 w-3" />
              Settings Locked
            </Badge>
          )}
          <Button onClick={handleSaveSettings} className="gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="game-rules" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="game-rules" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden md:inline">Game Rules</span>
          </TabsTrigger>
          <TabsTrigger value="commission" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden md:inline">Commission</span>
          </TabsTrigger>
          <TabsTrigger value="shift" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden md:inline">Shift</span>
          </TabsTrigger>
          <TabsTrigger value="returns" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            <span className="hidden md:inline">Returns</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden md:inline">Audit</span>
          </TabsTrigger>
        </TabsList>


        {/* Game & Pack Rules */}
        <TabsContent value="game-rules">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Game & Pack Rules
              </CardTitle>
              <CardDescription>Configure pack handling and game-level settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">

                <div className="space-y-2">
                  <Label htmlFor="maxOpenPacks">Max Open Packs per Game</Label>
                  <Input
                    id="maxOpenPacks"
                    type="number"
                    value={maxOpenPacks}
                    onChange={(e) => setMaxOpenPacks(e.target.value)}
                    disabled={isLocked}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of packs that can be active simultaneously per game
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label>Allow Partial Pack Returns</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable returning packs with some tickets already sold
                    </p>
                  </div>
                  <Switch
                    checked={allowPartialReturns}
                    onCheckedChange={setAllowPartialReturns}
                    disabled={isLocked}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commission & Settlement Rules */}
        <TabsContent value="commission">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Commission & Settlement Rules
              </CardTitle>
              <CardDescription>Configure commission rates and settlement schedules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="defaultCommission">Default Commission (%)</Label>
                  <Input
                    id="defaultCommission"
                    type="number"
                    step="0.1"
                    value={defaultCommission}
                    onChange={(e) => setDefaultCommission(e.target.value)}
                    disabled={isLocked}
                  />
                  <p className="text-xs text-muted-foreground">
                    Applied to new games unless overridden
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="settlementFrequency">Settlement Frequency</Label>
                  <Select value={settlementFrequency} onValueChange={setSettlementFrequency} disabled={isLocked}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roundingRule">Rounding Rules</Label>
                  <Select value={roundingRule} onValueChange={setRoundingRule} disabled={isLocked}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nearest">Round to Nearest Cent</SelectItem>
                      <SelectItem value="up">Always Round Up</SelectItem>
                      <SelectItem value="down">Always Round Down</SelectItem>
                      <SelectItem value="none">No Rounding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shift & Closing Controls */}
        <TabsContent value="shift">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Shift & Closing Controls
              </CardTitle>
              <CardDescription>Configure shift closing requirements and variance handling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="varianceTolerance">Variance Tolerance ($)</Label>
                  <Input
                    id="varianceTolerance"
                    type="number"
                    step="0.01"
                    value={varianceTolerance}
                    onChange={(e) => setVarianceTolerance(e.target.value)}
                    disabled={isLocked}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum acceptable cash variance before requiring approval
                  </p>
                </div>
              </div>

              <div className="space-y-4">

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label>Allow Reopen Closing (Admin Only)</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable administrators to reopen submitted shift closings
                    </p>
                  </div>
                  <Switch
                    checked={allowReopenClosing}
                    onCheckedChange={setAllowReopenClosing}
                    disabled={isLocked}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        {/* Return Rules */}
        <TabsContent value="returns">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                Return Rules
              </CardTitle>
              <CardDescription>Configure pack return policies and requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="returnEligibilityDays">Return Eligibility Window (Days)</Label>
                  <Input
                    id="returnEligibilityDays"
                    type="number"
                    value={returnEligibilityDays}
                    onChange={(e) => setReturnEligibilityDays(e.target.value)}
                    disabled={isLocked}
                  />
                  <p className="text-xs text-muted-foreground">
                    Days after receipt within which pack can be returned
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label>Require Distributor Reference Number</Label>
                    <p className="text-sm text-muted-foreground">
                      Return authorization reference required from distributor
                    </p>
                  </div>
                  <Switch
                    checked={requireDistributorRef}
                    onCheckedChange={setRequireDistributorRef}
                    disabled={isLocked}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label>Allow Partial Pack Returns</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable returning packs with some tickets already sold
                    </p>
                  </div>
                  <Switch
                    checked={partialReturnAllowed}
                    onCheckedChange={setPartialReturnAllowed}
                    disabled={isLocked}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        {/* Audit & Compliance */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Audit & Compliance
              </CardTitle>
              <CardDescription>View setting change history and export audit logs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Total Changes:</span>
                    <Badge variant="secondary">{auditLog.length}</Badge>
                  </div>
                </div>
                <Button variant="outline" className="gap-2" onClick={handleExportAuditLog}>
                  <Download className="h-4 w-4" />
                  Export Audit Log
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Setting</TableHead>
                      <TableHead>Old Value</TableHead>
                      <TableHead>New Value</TableHead>
                      <TableHead>Changed By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLog.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">{log.changedAt}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.section}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{log.setting}</TableCell>
                        <TableCell className="text-muted-foreground">{log.oldValue}</TableCell>
                        <TableCell className="text-primary">{log.newValue}</TableCell>
                        <TableCell>{log.changedBy}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    All Setting Changes Logged
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Every change to lottery settings is automatically recorded with timestamp and user information
                  </p>
                </div>
                <Badge variant="secondary" className="bg-primary/20 text-primary">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export const LotterySettings=({storeId}:{storeId:string})=><div className="space-y-6"><LotteryCounterSetting storeId={storeId}/><p className="text-sm text-muted-foreground">The remaining lottery settings below are layout previews and are not connected yet.</p><fieldset disabled {...{inert:""}} className="min-w-0 opacity-60"><LotterySettingsPreview/></fieldset></div>;
