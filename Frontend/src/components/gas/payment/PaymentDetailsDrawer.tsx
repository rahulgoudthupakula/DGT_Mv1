import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PaymentDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    vendor: string;
    invoiceNo: string;
    bolNo: string;
    totalAmount: number;
    paidAmount: number;
    outstanding: number;
    status: string;
  } | null;
  onRecordPayment: () => void;
}

const linkedDeliveries = [
  { date: "Feb 01, 2026", bolNo: "BOL-2401", fuelType: "Regular", gallons: "8,200", cost: "$18,450.00" },
  { date: "Feb 03, 2026", bolNo: "BOL-2405", fuelType: "Premium", gallons: "3,500", cost: "$9,100.00" },
];

const paymentHistory = [
  { date: "Feb 02, 2026", method: "ACH", amount: "$12,000.00", reference: "ACH-88412", notes: "Partial payment" },
  { date: "Feb 05, 2026", method: "Check", amount: "$6,200.00", reference: "CHK-4421", notes: "" },
];

export const PaymentDetailsDrawer = ({
  open,
  onOpenChange,
  invoice,
  onRecordPayment,
}: PaymentDetailsDrawerProps) => {
  if (!invoice) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="flex items-center justify-between border-b border-border pb-3">
          <DrawerTitle className="text-base">
            Payment Details — {invoice.invoiceNo}
          </DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Vendor</p>
              <p className="text-sm font-semibold text-foreground">{invoice.vendor}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Amount</p>
              <p className="text-sm font-semibold text-foreground">${invoice.totalAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Paid</p>
              <p className="text-sm font-semibold text-success">${invoice.paidAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Remaining</p>
              <p className="text-sm font-semibold text-destructive">${invoice.outstanding.toLocaleString()}</p>
            </div>
          </div>

          {/* Linked Deliveries */}
          <div>
            <h3 className="text-xs font-semibold text-foreground mb-2">Linked Deliveries</h3>
            <div className="border border-border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-[10px] h-8">Date</TableHead>
                    <TableHead className="text-[10px] h-8">BOL #</TableHead>
                    <TableHead className="text-[10px] h-8">Fuel Type</TableHead>
                    <TableHead className="text-[10px] h-8 text-right">Gallons</TableHead>
                    <TableHead className="text-[10px] h-8 text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linkedDeliveries.map((d) => (
                    <TableRow key={d.bolNo}>
                      <TableCell className="text-xs py-2">{d.date}</TableCell>
                      <TableCell className="text-xs py-2 font-medium text-primary">{d.bolNo}</TableCell>
                      <TableCell className="text-xs py-2">{d.fuelType}</TableCell>
                      <TableCell className="text-xs py-2 text-right">{d.gallons}</TableCell>
                      <TableCell className="text-xs py-2 text-right">{d.cost}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Payment History */}
          <div>
            <h3 className="text-xs font-semibold text-foreground mb-2">Payment History</h3>
            <div className="border border-border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-[10px] h-8">Date</TableHead>
                    <TableHead className="text-[10px] h-8">Method</TableHead>
                    <TableHead className="text-[10px] h-8 text-right">Amount</TableHead>
                    <TableHead className="text-[10px] h-8">Reference</TableHead>
                    <TableHead className="text-[10px] h-8">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.map((p) => (
                    <TableRow key={p.reference}>
                      <TableCell className="text-xs py-2">{p.date}</TableCell>
                      <TableCell className="text-xs py-2">
                        <Badge variant="outline" className="text-[10px] py-0">{p.method}</Badge>
                      </TableCell>
                      <TableCell className="text-xs py-2 text-right font-medium">{p.amount}</TableCell>
                      <TableCell className="text-xs py-2 text-muted-foreground">{p.reference}</TableCell>
                      <TableCell className="text-xs py-2 text-muted-foreground">{p.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Action */}
          {invoice.outstanding > 0 && (
            <div className="flex justify-end pt-2 border-t border-border">
              <Button size="sm" className="text-xs gap-1.5" onClick={onRecordPayment}>
                Record Payment
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
