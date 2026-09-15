import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, AlertTriangle, FileText, Fuel, Gauge } from "lucide-react";

interface DeliveryReconciliationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delivery: {
    id: string;
    date: string;
    vendor: string;
    fuelType: string;
    bol: string;
    invoice: string;
    gallons: number;
    cost: number;
    costPerGal: number;
    tank: string;
    status: string;
  } | null;
}

export const DeliveryReconciliation = ({
  open,
  onOpenChange,
  delivery,
}: DeliveryReconciliationProps) => {
  const [readingBefore, setReadingBefore] = useState("4,250");
  const [readingAfter, setReadingAfter] = useState("");
  const [varianceReason, setVarianceReason] = useState("");

  if (!delivery) return null;

  const expectedGain = delivery.gallons;
  const actualGain =
    readingAfter && readingBefore
      ? parseFloat(readingAfter.replace(/,/g, "")) - parseFloat(readingBefore.replace(/,/g, ""))
      : null;
  const variance = actualGain !== null ? actualGain - expectedGain : null;
  const variancePct = variance !== null && expectedGain > 0 ? ((variance / expectedGain) * 100).toFixed(1) : null;
  const overTolerance = variance !== null && Math.abs(variance) > expectedGain * 0.02;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Delivery Details — {delivery.bol}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* A) Delivery Details (read-only) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Fuel className="h-4 w-4 text-primary" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Vendor</span>
                  <p className="font-medium text-foreground">{delivery.vendor}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Delivery Date</span>
                  <p className="font-medium text-foreground">{delivery.date}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fuel Type</span>
                  <p className="font-medium text-foreground">{delivery.fuelType}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">BOL #</span>
                  <p className="font-medium text-foreground">{delivery.bol}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Invoice #</span>
                  <p className="font-medium text-foreground">{delivery.invoice || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tank Assigned</span>
                  <p className="font-medium text-foreground">{delivery.tank}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Delivered Gallons</span>
                  <p className="font-medium text-foreground">{delivery.gallons.toLocaleString()} gal</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cost</span>
                  <p className="font-medium text-foreground">
                    ${delivery.cost.toLocaleString()} (${delivery.costPerGal}/gal)
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <Badge
                  variant={
                    delivery.status === "Reconciled"
                      ? "default"
                      : delivery.status === "Received"
                      ? "secondary"
                      : "outline"
                  }
                  className="text-[10px]"
                >
                  {delivery.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* B) Tank Reading Comparison */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Gauge className="h-4 w-4 text-primary" />
                Tank Reading Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tank Reading Before</Label>
                  <Input
                    className="h-9 text-xs"
                    value={readingBefore}
                    onChange={(e) => setReadingBefore(e.target.value)}
                    placeholder="Gallons"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tank Reading After</Label>
                  <Input
                    className="h-9 text-xs"
                    value={readingAfter}
                    onChange={(e) => setReadingAfter(e.target.value)}
                    placeholder="Gallons"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-muted text-center">
                  <p className="text-muted-foreground">Expected Gain</p>
                  <p className="font-semibold text-foreground mt-1">{expectedGain.toLocaleString()} gal</p>
                </div>
                <div className="p-3 rounded-lg bg-muted text-center">
                  <p className="text-muted-foreground">Actual Gain</p>
                  <p className="font-semibold text-foreground mt-1">
                    {actualGain !== null ? `${actualGain.toLocaleString()} gal` : "—"}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-lg text-center ${
                    overTolerance
                      ? "bg-destructive/10"
                      : variance !== null
                      ? "bg-success/10"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-muted-foreground">Variance (gal)</p>
                  <p
                    className={`font-semibold mt-1 ${
                      overTolerance ? "text-destructive" : "text-success"
                    }`}
                  >
                    {variance !== null ? `${variance > 0 ? "+" : ""}${variance.toLocaleString()}` : "—"}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-lg text-center ${
                    overTolerance
                      ? "bg-destructive/10"
                      : variance !== null
                      ? "bg-success/10"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-muted-foreground">Variance (%)</p>
                  <p
                    className={`font-semibold mt-1 ${
                      overTolerance ? "text-destructive" : "text-success"
                    }`}
                  >
                    {variancePct !== null ? `${variancePct}%` : "—"}
                  </p>
                </div>
              </div>

              {overTolerance && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                    Variance Reason <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    placeholder="Explain variance reason (required for tolerance > 2%)"
                    className="text-xs min-h-[60px]"
                    value={varianceReason}
                    onChange={(e) => setVarianceReason(e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* C) Outcome */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Outcome
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button size="sm" className="text-xs gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" />
                Mark as Reconciled
              </Button>
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Create Inventory Adjustment
              </Button>
            </CardContent>
          </Card>
        </div>

        <SheetFooter className="pt-4 border-t border-border">
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
