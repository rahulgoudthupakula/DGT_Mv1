import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export const PriceTrackingRules = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-semibold">Price Tracking Rules</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center justify-between border rounded-md p-3">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-xs font-medium">POS is price master</p>
            <p className="text-[10px] text-muted-foreground">POS system is the source of truth for pricing</p>
          </div>
          <Badge variant="secondary" className="text-[10px]">Default</Badge>
        </div>
        <Switch defaultChecked />
      </div>
      <div className="flex items-center justify-between border rounded-md p-3">
        <div>
          <p className="text-xs font-medium">Allow manual price record</p>
          <p className="text-[10px] text-muted-foreground">Enable manual price entries alongside POS sync</p>
        </div>
        <Switch defaultChecked />
      </div>
      <div className="flex items-center justify-between border rounded-md p-3">
        <div>
          <p className="text-xs font-medium">Allow scheduled price change record</p>
          <p className="text-[10px] text-muted-foreground">Allow future-dated price change scheduling</p>
        </div>
        <Switch defaultChecked />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Margin alert threshold (¢/gallon)</Label>
        <Input type="number" defaultValue={5} className="h-8 text-xs w-32" />
      </div>
    </CardContent>
  </Card>
);
