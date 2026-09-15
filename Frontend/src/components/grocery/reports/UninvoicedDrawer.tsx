import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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

interface UninvoicedPO {
  poNumber: string;
  receivedDate: string;
  receivedQty: number;
  totalAmount: number;
  daysPending: number;
}

interface UninvoicedDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorName: string;
  uninvoicedAmount: number;
  pos: UninvoicedPO[];
}

const mockUninvoicedPOs: Record<string, UninvoicedPO[]> = {
  "McLane Company": [
    { poNumber: "PO-4521", receivedDate: "01/28/2026", receivedQty: 480, totalAmount: 750.00, daysPending: 10 },
    { poNumber: "PO-4498", receivedDate: "01/25/2026", receivedQty: 320, totalAmount: 500.00, daysPending: 13 },
  ],
  "Sysco": [
    { poNumber: "PO-3312", receivedDate: "01/30/2026", receivedQty: 200, totalAmount: 420.00, daysPending: 8 },
    { poNumber: "PO-3298", receivedDate: "01/22/2026", receivedQty: 150, totalAmount: 470.00, daysPending: 16 },
  ],
};

export const getUninvoicedPOs = (vendorName: string): UninvoicedPO[] => {
  return mockUninvoicedPOs[vendorName] || [];
};

export const UninvoicedDrawer = ({
  open,
  onOpenChange,
  vendorName,
  uninvoicedAmount,
  pos,
}: UninvoicedDrawerProps) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-base">
            Uninvoiced POs — {vendorName}
          </DrawerTitle>
          <DrawerDescription className="text-xs">
            {pos.length} received purchase order{pos.length !== 1 ? "s" : ""} pending invoice •{" "}
            <span className="font-medium text-[hsl(var(--warning))]">
              ${uninvoicedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} total
            </span>
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-2">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">PO Number</TableHead>
                  <TableHead className="text-xs">Received Date</TableHead>
                  <TableHead className="text-xs text-right">Qty</TableHead>
                  <TableHead className="text-xs text-right">Amount $</TableHead>
                  <TableHead className="text-xs text-right">Days Pending</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pos.map((po) => (
                  <TableRow key={po.poNumber}>
                    <TableCell className="text-xs font-medium">{po.poNumber}</TableCell>
                    <TableCell className="text-xs">{po.receivedDate}</TableCell>
                    <TableCell className="text-xs text-right">{po.receivedQty.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right font-medium">
                      ${po.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-xs text-right">
                      <Badge
                        variant={po.daysPending >= 14 ? "destructive" : "outline"}
                        className="text-[10px] px-1.5"
                      >
                        {po.daysPending}d
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline" size="sm">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
