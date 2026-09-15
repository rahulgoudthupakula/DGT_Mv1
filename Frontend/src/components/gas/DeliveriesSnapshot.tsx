import { Plus, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Delivery {
  date: string;
  vendor: string;
  fuelType: string;
  gallons: number;
  cost: number;
  invoice: string;
  status: "Received" | "Pending";
}

const deliveries: Delivery[] = [
  {
    date: "Feb 09, 2026",
    vendor: "Gulf Supply",
    fuelType: "Regular (87)",
    gallons: 8200,
    cost: 25538.00,
    invoice: "INV-4821",
    status: "Received",
  },
  {
    date: "Feb 08, 2026",
    vendor: "Gulf Supply",
    fuelType: "Premium (93)",
    gallons: 4000,
    cost: 14120.00,
    invoice: "INV-4819",
    status: "Received",
  },
  {
    date: "Feb 08, 2026",
    vendor: "Diesel Direct",
    fuelType: "Diesel",
    gallons: 3500,
    cost: 11025.00,
    invoice: "—",
    status: "Pending",
  },
  {
    date: "Feb 07, 2026",
    vendor: "Gulf Supply",
    fuelType: "Plus (89)",
    gallons: 4500,
    cost: 14850.00,
    invoice: "INV-4815",
    status: "Received",
  },
];

export const DeliveriesSnapshot = () => {
  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Truck className="h-4.5 w-4.5 text-primary" />
            Deliveries — This Week
          </CardTitle>
          <Button size="sm" className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add Delivery
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[11px]">Date</TableHead>
              <TableHead className="text-[11px]">Vendor</TableHead>
              <TableHead className="text-[11px]">Fuel Type</TableHead>
              <TableHead className="text-[11px] text-right">Delivered Gal</TableHead>
              <TableHead className="text-[11px] text-right">Delivered Cost</TableHead>
              <TableHead className="text-[11px]">Invoice #</TableHead>
              <TableHead className="text-[11px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliveries.map((d, i) => (
              <TableRow key={i}>
                <TableCell className="text-xs">{d.date}</TableCell>
                <TableCell className="text-xs font-medium">{d.vendor}</TableCell>
                <TableCell className="text-xs">{d.fuelType}</TableCell>
                <TableCell className="text-xs text-right font-medium">
                  {d.gallons.toLocaleString()}
                </TableCell>
                <TableCell className="text-xs text-right">
                  ${d.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{d.invoice}</TableCell>
                <TableCell>
                  <Badge
                    variant={d.status === "Received" ? "default" : "outline"}
                    className={`text-[10px] ${
                      d.status === "Received"
                        ? "bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20"
                        : "bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/20"
                    }`}
                  >
                    {d.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
