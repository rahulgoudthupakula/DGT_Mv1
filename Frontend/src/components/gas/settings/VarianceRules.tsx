import {useGasSettings} from "./gasSettingsState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export const VarianceRules = () => {const {draft,set,editable}=useGasSettings();return (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-semibold">Variance & Adjustment Rules</CardTitle>
      <p className="text-xs text-muted-foreground">Threshold preferences are saved here. Automatic flagging and Gas adjustment approval enforcement are pending those workflows.</p>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Allowed Variance % (Delivery vs Tank Gain)</Label>
          <Input type="number" aria-label="allowed_variance_percentage" disabled={!editable} value={String(draft.allowed_variance_percentage)} onChange={e=>set("allowed_variance_percentage",e.target.value)} className="h-8 text-xs" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Allowed Daily Loss Threshold (gallons)</Label>
          <Input type="number" aria-label="daily_loss_threshold_gallons" disabled={!editable} value={String(draft.daily_loss_threshold_gallons)} onChange={e=>set("daily_loss_threshold_gallons",e.target.value)} className="h-8 text-xs" />
        </div>
      </div>
      <div className="flex items-center justify-between border rounded-md p-3">
        <div>
          <p className="text-xs font-medium">Auto-flag when exceeded</p>
          <p className="text-[10px] text-muted-foreground">Automatically flag variances exceeding thresholds</p>
        </div>
        <Switch disabled={!editable} checked={Boolean(draft.auto_flag_variance)} onCheckedChange={v=>set("auto_flag_variance",v)} />
      </div>
      <div className="flex items-center justify-between border rounded-md p-3">
        <div>
          <p className="text-xs font-medium">Approval required beyond threshold</p>
          <p className="text-[10px] text-muted-foreground">Require manager approval for adjustments exceeding limits</p>
        </div>
        <Switch disabled={!editable} checked={Boolean(draft.variance_approval_required)} onCheckedChange={v=>set("variance_approval_required",v)} />
      </div>
    </CardContent>
  </Card>
);};
