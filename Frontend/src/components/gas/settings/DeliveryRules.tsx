import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export const DeliveryRules = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-semibold">Delivery Rules</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center justify-between border rounded-md p-3">
        <div>
          <p className="text-xs font-medium">Delivery reconciliation required</p>
          <p className="text-[10px] text-muted-foreground">Require reconciliation before posting deliveries</p>
        </div>
        <Switch defaultChecked />
      </div>
      <div className="flex items-center justify-between border rounded-md p-3">
        <div>
          <p className="text-xs font-medium">Invoice mandatory before posting</p>
          <p className="text-[10px] text-muted-foreground">Block posting without an attached invoice</p>
        </div>
        <Switch defaultChecked />
      </div>
      <div className="flex items-center justify-between border rounded-md p-3">
        <div>
          <p className="text-xs font-medium">BOL required</p>
          <p className="text-[10px] text-muted-foreground">Require Bill of Lading number for all deliveries</p>
        </div>
        <Switch defaultChecked />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Max days allowed without reconciliation</Label>
        <Input type="number" defaultValue={3} className="h-8 text-xs w-32" />
      </div>
    </CardContent>
  </Card>
);
