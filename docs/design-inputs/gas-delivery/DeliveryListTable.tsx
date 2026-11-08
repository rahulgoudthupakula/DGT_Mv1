import { useState } from "react";
import { Eye } from "lucide-react";
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
import { DeliveryReconciliation } from "./DeliveryReconciliation";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/ui/table-pagination";

const deliveries = [
  { id: "1", date: "Feb 09, 2026 06:15 AM", vendor: "Sunoco LP", fuelType: "Regular", bol: "BOL-90234", invoice: "INV-44210", gallons: 8500, cost: 21250, costPerGal: 2.5, tank: "Tank #1", status: "Reconciled" },
  { id: "2", date: "Feb 08, 2026 02:30 PM", vendor: "Marathon Petroleum", fuelType: "Premium", bol: "BOL-90235", invoice: "INV-44211", gallons: 6200, cost: 18600, costPerGal: 3.0, tank: "Tank #4", status: "Received" },
  { id: "3", date: "Feb 08, 2026 08:00 AM", vendor: "Sunoco LP", fuelType: "Diesel", bol: "BOL-90236", invoice: "", gallons: 7800, cost: 23400, costPerGal: 3.0, tank: "Tank #5", status: "Pending" },
  { id: "4", date: "Feb 07, 2026 10:45 AM", vendor: "Shell Oil", fuelType: "Plus", bol: "BOL-90230", invoice: "INV-44198", gallons: 5400, cost: 14580, costPerGal: 2.7, tank: "Tank #3", status: "Posted" },
  { id: "5", date: "Feb 06, 2026 04:20 PM", vendor: "ExxonMobil", fuelType: "Regular", bol: "BOL-90228", invoice: "INV-44190", gallons: 9000, cost: 22050, costPerGal: 2.45, tank: "Tank #2", status: "Reconciled" },
];

const statusColors: Record<string, string> = {
  Pending: "bg-warning/15 text-warning border-warning/30",
  Received: "bg-primary/10 text-primary border-primary/30",
  Reconciled: "bg-success/15 text-success border-success/30",
  Posted: "bg-muted text-muted-foreground border-border",
};

interface Props {
  vendor: string;
  fuelType: string;
  status: string;
  startDate: Date;
  endDate: Date;
}

export const DeliveryListTable = ({ vendor, fuelType, status, startDate, endDate }: Props) => {
  const [viewDelivery, setViewDelivery] = useState<(typeof deliveries)[0] | null>(null);
  const [pageSize, setPageSize] = useState(10);

  const filtered = deliveries.filter((d) => {
    if (vendor !== "all") {
      const v = vendor.toLowerCase();
      if (!d.vendor.toLowerCase().includes(v)) return false;
    }
    if (fuelType !== "all" && d.fuelType.toLowerCase() !== fuelType.toLowerCase()) return false;
    if (status !== "all" && d.status.toLowerCase() !== status.toLowerCase()) return false;
    return true;
  });

  const { paginated, page, totalPages, totalItems, hasPrev, hasNext, prevPage, nextPage } = usePagination(filtered, pageSize);

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-[11px] font-semibold">Delivery Date/Time</TableHead>
              <TableHead className="text-[11px] font-semibold">Vendor</TableHead>
              <TableHead className="text-[11px] font-semibold">Fuel Type</TableHead>
              <TableHead className="text-[11px] font-semibold">BOL #</TableHead>

              <TableHead className="text-[11px] font-semibold text-right">Delivered Gal</TableHead>
              <TableHead className="text-[11px] font-semibold text-right">Cost $</TableHead>
              <TableHead className="text-[11px] font-semibold text-right">$/Gal</TableHead>
              <TableHead className="text-[11px] font-semibold">Tank</TableHead>
              <TableHead className="text-[11px] font-semibold">Status</TableHead>
              <TableHead className="text-[11px] font-semibold text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-xs text-muted-foreground py-8">
                  No deliveries match the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((d) => (
                <TableRow key={d.id} className="hover:bg-muted/30">
                  <TableCell className="text-xs">{d.date}</TableCell>
                  <TableCell className="text-xs font-medium">{d.vendor}</TableCell>
                  <TableCell className="text-xs">{d.fuelType}</TableCell>
                  <TableCell className="text-xs font-mono">{d.bol}</TableCell>
                  <TableCell className="text-xs text-right font-medium">{d.gallons.toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-right font-medium">${d.cost.toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-right">${d.costPerGal.toFixed(2)}</TableCell>
                  <TableCell className="text-xs">{d.tank}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${statusColors[d.status] || ""}`}>
                      {d.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewDelivery(d)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize}
          hasPrev={hasPrev} hasNext={hasNext} onPrev={prevPage} onNext={nextPage}
          onPageSizeChange={(s) => setPageSize(s)}
        />
      </div>

      <DeliveryReconciliation
        open={!!viewDelivery}
        onOpenChange={(open) => !open && setViewDelivery(null)}
        delivery={viewDelivery}
      />
    </>
  );
};
