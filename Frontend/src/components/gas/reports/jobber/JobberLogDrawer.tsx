import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fuel, CreditCard, DollarSign } from "lucide-react";
import type { JobberLogRow } from "./JobberLogTable";

interface JobberLogDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: JobberLogRow | null;
}

const fmt = (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export const JobberLogDrawer = ({ open, onOpenChange, row }: JobberLogDrawerProps) => {
  if (!row) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg font-semibold flex items-center gap-2">
            <Fuel className="h-5 w-5 text-primary" />
            {row.vendor} — {row.fuelType}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 py-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Fuel className="h-4 w-4 text-primary" />
                Purchase Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs">
                <Detail label="Date" value={`${row.date} (${row.day})`} />
                <Detail label="Vendor / Jobber" value={row.vendor} />
                <Detail label="Fuel Type" value={row.fuelType} />
                <Detail label="Gallons Purchased" value={`${fmt(row.gallonsPurchased)} gal`} />
                <Detail label="Purchased Cost" value={`$${fmt(row.purchasedCost)}`} />
                <Detail label="Total Charges" value={`$${fmt(row.totalCharges)}`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Card & Adjustments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs">
                <Detail label="Credit Card" value={`$${fmt(row.creditCard)}`} />
                <Detail label="CC Fee Adjustments" value={`$${fmt(row.creditCardFeeAdj)}`} />
                <Detail label="Cash Card Credit" value={`$${fmt(row.cashCardCredit)}`} />
                <Detail label="Cash Card Comm. Adj" value={`$${fmt(row.cashCardCommAdj)}`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Expenses & Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs">
                <Detail label="Fuel Expenses" value={`$${fmt(row.fuelExpenses)}`} />
                <Detail label="Non-Fuel Expenses" value={`$${fmt(row.nonFuelExpenses)}`} />
                <Detail label="Payment" value={`$${fmt(row.payment)}`} />
                <Detail label="Balance" value={`$${fmt(row.balance)}`} />
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div>
    <span className="text-muted-foreground">{label}</span>
    <p className="font-medium text-foreground">{value}</p>
  </div>
);
