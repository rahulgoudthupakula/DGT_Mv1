import {useGasSettings} from "./gasSettingsState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Shield } from "lucide-react";

export const AuditLocking = () => {const {draft,set,editable,audit,exportAudit}=useGasSettings();return (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-semibold">Audit & Locking</CardTitle>
      <p className="text-xs text-muted-foreground">Always on — tracks who changed what & when.</p>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center justify-between border rounded-md p-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <div>
            <p className="text-xs font-medium">Audit trail</p>
            <p className="text-[10px] text-muted-foreground">Track all setting changes with user and timestamp</p>
          </div>
        </div>
        <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-0">Always On</Badge>
      </div>
      <div className="flex items-center justify-between border rounded-md p-3">
        <div>
          <p className="text-xs font-medium">Lock critical settings after first delivery</p>
          <p className="text-[10px] text-muted-foreground">Saved preference; first-delivery enforcement awaits tank receiving linkage. Saved capacity and assignment history are already protected.</p>
        </div>
        <Switch disabled={!editable} checked={Boolean(draft.lock_critical_after_delivery)} onCheckedChange={v=>set("lock_critical_after_delivery",v)} />
      </div>
      <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={exportAudit}>
        <Download className="h-3.5 w-3.5" />
        Export Audit Log
      </Button>
      <div className="max-h-64 overflow-auto text-xs space-y-2">{audit.length===0?<p className="text-muted-foreground">No gas settings changes recorded for this store.</p>:audit.map(row=><details key={row.id} className="border rounded p-2"><summary>{new Date(row.timestamp).toLocaleString()} · {row.actor} · {row.event==='GAS_GRADE_CREATED'?'Fuel grade added':'Settings changed'}</summary><div className="mt-2 space-y-1">{(JSON.parse(row.changes) as {field:string;from:unknown;to:unknown}[]).map((c,i)=><p key={i}>{c.field.split('_').join(' ')}: {c.from==null?'Not set':typeof c.from==='object'?JSON.stringify(c.from):String(c.from)} → {c.to==null?'Not set':typeof c.to==='object'?JSON.stringify(c.to):String(c.to)}</p>)}</div></details>)}</div>
    </CardContent>
  </Card>
);};
