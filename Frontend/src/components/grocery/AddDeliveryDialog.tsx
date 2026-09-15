import { useMemo, useState } from "react";
import { Plus, Trash2, Search } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { pricebookItems } from "@/data/pricebookItems";
import { postDelivery } from "@/lib/postDelivery";
import { toast } from "sonner";


export type DeliveryLineDraft = {
  key: string;
  sku: string;
  barcode: string;
  itemName: string;
  quantity: number;
  unitType: "item" | "case";
  unitsPerCase: number;
  unitCost: number;
};

const newLine = (): DeliveryLineDraft => ({
  key: Math.random().toString(36).slice(2),
  sku: "",
  barcode: "",
  itemName: "",
  quantity: 0,
  unitType: "item",
  unitsPerCase: 12,
  unitCost: 0,
});

const vendors = Array.from(new Set(pricebookItems.map((i) => i.vendor))).sort();

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export const AddDeliveryDialog = ({ open, onOpenChange, onSaved }: Props) => {
  const [vendor, setVendor] = useState("");
  const [invoice, setInvoice] = useState("");
  const [deliveryDate, setDeliveryDate] = useState<Date>(new Date());
  const [status, setStatus] = useState<"Pending" | "Received" | "Verified" | "Posted">("Received");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DeliveryLineDraft[]>([newLine()]);
  const [productSearch, setProductSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setVendor("");
    setInvoice("");
    setDeliveryDate(new Date());
    setStatus("Received");
    setNotes("");
    setLines([newLine()]);
    setProductSearch("");
  };

  const catalog = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    const base = vendor ? pricebookItems.filter((i) => i.vendor === vendor) : pricebookItems;
    if (!q) return base;
    return base.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        i.barcode.includes(q)
    );
  }, [productSearch, vendor]);

  const updateLine = (key: string, patch: Partial<DeliveryLineDraft>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const pickProduct = (key: string, sku: string) => {
    const item = pricebookItems.find((i) => i.sku === sku);
    if (!item) return;
    updateLine(key, {
      sku: item.sku,
      barcode: item.barcode,
      itemName: item.name,
      unitCost: item.cost,
    });
  };

  const unitsFor = (l: DeliveryLineDraft) =>
    l.unitType === "case" ? l.quantity * (l.unitsPerCase || 1) : l.quantity;
  const lineTotal = (l: DeliveryLineDraft) => l.quantity * l.unitCost;

  const validLines = lines.filter((l) => l.sku && l.quantity > 0);
  const totalUnits = validLines.reduce((s, l) => s + unitsFor(l), 0);
  const totalCost = validLines.reduce((s, l) => s + lineTotal(l), 0);

  const canSave = vendor.trim() !== "" && validLines.length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await postDelivery({
        vendor,
        invoice,
        deliveryDate: format(deliveryDate, "yyyy-MM-dd"),
        status,
        notes,
        lines: validLines.map((l) => ({
          sku: l.sku,
          barcode: l.barcode,
          itemName: l.itemName,
          quantity: l.quantity,
          unitType: l.unitType,
          unitsPerCase: l.unitsPerCase,
          unitCost: l.unitCost,
        })),
      });

      toast.success(`Delivery saved — ${totalUnits} units added to stock`);
      reset();
      onOpenChange(false);
      onSaved();
    } catch (e) {
      console.error(e);
      toast.error("Could not save the delivery. Please try again.");
    } finally {
      setSaving(false);
    }
  };


  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Delivery</DialogTitle>
          <DialogDescription>
            Record what arrived. Quantities are added to the stock shown on Items and Bulk Update.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label>Vendor</Label>
            <Select value={vendor} onValueChange={setVendor}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invoice">Invoice #</Label>
            <Input
              id="invoice"
              className="h-9 text-xs"
              value={invoice}
              onChange={(e) => setInvoice(e.target.value)}
              placeholder="INV-0001"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Delivery Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start gap-1.5 text-xs h-9">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(deliveryDate, "MMM dd, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarPicker
                  mode="single"
                  selected={deliveryDate}
                  onSelect={(d) => d && setDeliveryDate(d)}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Received">Received</SelectItem>
                <SelectItem value="Verified">Verified</SelectItem>
                <SelectItem value="Posted">Posted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm font-semibold">Products Received</Label>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-8 h-8 text-xs w-[200px]"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setLines((prev) => [...prev, newLine()])}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Line
              </Button>
            </div>
          </div>

          <div className="border border-border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px]">Product</TableHead>
                  <TableHead className="text-[11px] w-[110px]">Unit</TableHead>
                  <TableHead className="text-[11px] w-[90px] text-right">Qty</TableHead>
                  <TableHead className="text-[11px] w-[110px] text-right">Units/Case</TableHead>
                  <TableHead className="text-[11px] w-[110px] text-right">Unit Cost</TableHead>
                  <TableHead className="text-[11px] w-[90px] text-right">Units</TableHead>
                  <TableHead className="text-[11px] w-[110px] text-right">Line Total</TableHead>
                  <TableHead className="w-[44px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((l) => (
                  <TableRow key={l.key}>
                    <TableCell>
                      <Select value={l.sku} onValueChange={(v) => pickProduct(l.key, v)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[280px]">
                          {catalog.map((i) => (
                            <SelectItem key={i.sku} value={i.sku}>
                              {i.name} — {i.sku}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={l.unitType}
                        onValueChange={(v) => updateLine(l.key, { unitType: v as "item" | "case" })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="item">Item</SelectItem>
                          <SelectItem value="case">Case</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        className="h-8 text-xs text-right"
                        value={l.quantity || ""}
                        onChange={(e) => updateLine(l.key, { quantity: parseInt(e.target.value) || 0 })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        disabled={l.unitType !== "case"}
                        className="h-8 text-xs text-right"
                        value={l.unitType === "case" ? l.unitsPerCase || "" : ""}
                        onChange={(e) => updateLine(l.key, { unitsPerCase: parseInt(e.target.value) || 1 })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        className="h-8 text-xs text-right"
                        value={l.unitCost || ""}
                        onChange={(e) => updateLine(l.key, { unitCost: parseFloat(e.target.value) || 0 })}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-right">{unitsFor(l)}</TableCell>
                    <TableCell className="text-xs text-right font-medium">
                      ${lineTotal(l).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setLines((prev) => (prev.length === 1 ? [newLine()] : prev.filter((x) => x.key !== l.key)))}
                        aria-label="Remove line"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-md border border-border p-3">
              <p className="text-[11px] text-muted-foreground">Lines</p>
              <p className="text-lg font-bold">{validLines.length}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="text-[11px] text-muted-foreground">Total Units</p>
              <p className="text-lg font-bold">{totalUnits.toLocaleString()}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="text-[11px] text-muted-foreground">Total Cost</p>
              <p className="text-lg font-bold">
                ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              className="h-9 text-xs"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" disabled={!canSave} onClick={handleSave}>
            {saving ? "Saving..." : "Post Delivery"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
