import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckCircle, Send, DollarSign } from "lucide-react";

const auditLog = [
  { id: 1, action: "Claim Submitted", reference: "CLM-001", user: "John Manager", timestamp: "2024-02-05 10:30 AM", details: "Submitted rebate claim for Coca-Cola Q1" },
  { id: 2, action: "Claim Approved", reference: "CLM-002", user: "Sarah Admin", timestamp: "2024-01-15 02:15 PM", details: "Approved Mars Candy rebate claim" },
  { id: 3, action: "Payment Received", reference: "PAY-001", user: "System", timestamp: "2024-01-25 09:00 AM", details: "Payment received for CLM-002" },
];

export const RebateControlsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Rebate Controls</h1>
        <p className="text-sm text-muted-foreground">Configure rules, alerts, and review the audit trail</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rules & Alerts */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Rules & Alerts</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Auto-expiry Alert</Label>
                <p className="text-sm text-muted-foreground">Notify before program ends</p>
              </div>
              <div className="flex items-center gap-2">
                <Select defaultValue="7">
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
                <Switch defaultChecked />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Claim Approval Required</Label>
                <p className="text-sm text-muted-foreground">Require manager approval for claims</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Variance Alert Threshold</Label>
                <p className="text-sm text-muted-foreground">Alert when payment differs from expected</p>
              </div>
              <div className="flex items-center gap-2">
                <Input type="number" defaultValue="5" className="w-20" />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Missed Rebate Reminder</Label>
                <p className="text-sm text-muted-foreground">Alert for claimable rebates not submitted</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Audit Trail */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Audit Trail</CardTitle>
            <Button variant="ghost" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auditLog.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="mt-0.5">
                    {entry.action.includes("Approved") ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : entry.action.includes("Submitted") ? (
                      <Send className="h-4 w-4 text-blue-600" />
                    ) : (
                      <DollarSign className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{entry.action}</span>
                      <span className="text-xs text-primary">{entry.reference}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{entry.details}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{entry.user}</span>
                      <span>•</span>
                      <span>{entry.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
