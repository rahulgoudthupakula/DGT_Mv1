import { useState } from "react";
import { X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { toast } from "sonner";

interface RecordPaymentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefill?: {
    vendor: string;
    invoiceNo: string;
    outstanding: number;
  } | null;
}

export const RecordPaymentDrawer = ({ open, onOpenChange, prefill }: RecordPaymentDrawerProps) => {
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const outstanding = prefill?.outstanding ?? 0;
  const amountNum = parseFloat(amountPaid) || 0;
  const isOverpaying = amountNum > outstanding;
  const willFullyPay = amountNum === outstanding;

  const handleSave = (markPaid: boolean) => {
    if (!paymentMethod || !amountPaid) {
      toast.error("Please fill in required fields.");
      return;
    }
    if (isOverpaying) {
      toast.error("Amount cannot exceed outstanding balance.");
      return;
    }
    toast.success(markPaid ? "Payment recorded & marked as Paid." : "Payment recorded.");
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="flex items-center justify-between border-b border-border pb-3">
          <DrawerTitle className="text-base">Record Payment</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="p-4 space-y-5 overflow-y-auto">
          {/* Read-only context */}
          {prefill && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Vendor</span>
                <span className="font-medium text-foreground">{prefill.vendor}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Invoice / BOL</span>
                <span className="font-medium text-foreground">{prefill.invoiceNo}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Outstanding</span>
                <span className="font-semibold text-destructive">${outstanding.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Payment Date */}
          <div className="space-y-1.5">
            <Label className="text-xs">Payment Date *</Label>
            <Input
              type="date"
              className="h-9 text-xs"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <Label className="text-xs">Payment Method *</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ach">ACH</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label className="text-xs">Amount Paid *</Label>
            <Input
              type="number"
              className="h-9 text-xs"
              placeholder="0.00"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
            />
            {isOverpaying && (
              <p className="text-[10px] text-destructive">Cannot exceed outstanding balance (${outstanding.toLocaleString()})</p>
            )}
          </div>

          {/* Reference # */}
          <div className="space-y-1.5">
            <Label className="text-xs">Reference # (check no / ACH trace)</Label>
            <Input
              className="h-9 text-xs"
              placeholder="e.g. CHK-4421"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea
              className="text-xs min-h-[60px]"
              placeholder="Additional notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Attachment */}
          <div className="space-y-1.5">
            <Label className="text-xs">Attachment (optional)</Label>
            <div className="border border-dashed border-border rounded-md p-4 text-center cursor-pointer hover:bg-muted/30 transition-colors">
              <Upload className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground">Upload receipt (PDF / Image)</p>
            </div>
          </div>
        </div>

        <DrawerFooter className="border-t border-border pt-3">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => handleSave(false)}
            >
              Save
            </Button>
            <Button
              size="sm"
              className="flex-1 text-xs"
              disabled={!willFullyPay || isOverpaying}
              onClick={() => handleSave(true)}
            >
              Save & Mark Paid
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
