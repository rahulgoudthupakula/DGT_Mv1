import { Fuel, AlertTriangle, Gauge, FileText, Droplets } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface TankData {
  id: string;
  fuelType: string;
  currentGallons: number;
  capacity: number;
  lastReading: string;
  lowAlert: boolean;
  waterAlert: boolean;
}

const tanks: TankData[] = [
  {
    id: "T-01",
    fuelType: "Regular (87)",
    currentGallons: 5200,
    capacity: 10000,
    lastReading: "Today, 6:00 AM",
    lowAlert: false,
    waterAlert: false,
  },
  {
    id: "T-02",
    fuelType: "Plus (89)",
    currentGallons: 1800,
    capacity: 8000,
    lastReading: "Today, 6:00 AM",
    lowAlert: true,
    waterAlert: false,
  },
  {
    id: "T-03",
    fuelType: "Premium (93)",
    currentGallons: 4100,
    capacity: 8000,
    lastReading: "Today, 6:00 AM",
    lowAlert: false,
    waterAlert: false,
  },
  {
    id: "T-04",
    fuelType: "Diesel",
    currentGallons: 800,
    capacity: 6000,
    lastReading: "Yesterday, 10:00 PM",
    lowAlert: true,
    waterAlert: true,
  },
];

const getCapacityColor = (percent: number) => {
  if (percent <= 20) return "bg-red-500";
  if (percent <= 40) return "bg-amber-500";
  return "bg-emerald-500";
};

export const TankStatusPanel = () => {
  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Droplets className="h-4.5 w-4.5 text-primary" />
            Tank Status
          </CardTitle>
          <span className="text-[11px] text-muted-foreground">
            {tanks.length} tanks monitored
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tanks.map((tank) => {
            const percent = Math.round((tank.currentGallons / tank.capacity) * 100);
            const capacityColor = getCapacityColor(percent);

            return (
              <div
                key={tank.id}
                className="border border-border rounded-lg p-4 space-y-3 bg-muted/20"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm text-foreground">
                      {tank.fuelType}
                    </span>
                    <span className="text-xs text-muted-foreground">({tank.id})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {tank.lowAlert && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        <AlertTriangle className="h-3 w-3 mr-0.5" />
                        Low
                      </Badge>
                    )}
                    {tank.waterAlert && (
                      <Badge className="text-[10px] px-1.5 py-0 bg-amber-500/90 hover:bg-amber-500 text-white border-0">
                        <Droplets className="h-3 w-3 mr-0.5" />
                        Water
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Capacity Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {tank.currentGallons.toLocaleString()} / {tank.capacity.toLocaleString()} gal
                    </span>
                    <span className="font-semibold text-foreground">{percent}%</span>
                  </div>
                  <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${capacityColor}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Last Reading */}
                <div className="text-[11px] text-muted-foreground">
                  Last reading: {tank.lastReading}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <Button variant="ghost" size="sm" className="text-[11px] h-7 gap-1">
                    <FileText className="h-3 w-3" />
                    View Tank Report
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
