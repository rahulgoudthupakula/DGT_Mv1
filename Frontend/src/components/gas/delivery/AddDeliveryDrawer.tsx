import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { format } from "date-fns";

interface AddDeliveryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddDeliveryDrawer = ({ open, onOpenChange }: AddDeliveryDrawerProps) => {
  const [deliveryDate, setDeliveryDate] = useState<Date>(new Date());
  const [vendor, setVendor] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [tank, setTank] = useState("");
  const [gallons, setGallons] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [bolNumber, setBolNumber] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [driverTruckId, setDriverTruckId] = useState("");

  const costPerGallon =
    gallons && totalCost && parseFloat(gallons) > 0
      ? (parseFloat(totalCost) / parseFloat(gallons)).toFixed(4)
      : "—";

  const handleReset = () => {
    setDeliveryDate(new Date());
    setVendor("");
    setFuelType("");
    setTank("");
    setGallons("");
    setTotalCost("");
    setBolNumber("");
    setInvoiceNumber("");
    setDriverTruckId("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg font-semibold">Add Delivery</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 py-6">
          {/* Vendor */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Vendor <span className="text-destructive">*</span>
            </Label>
            <Select value={vendor} onValueChange={setVendor}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sunoco">Sunoco LP</SelectItem>
                <SelectItem value="marathon">Marathon Petroleum</SelectItem>
                <SelectItem value="shell">Shell Oil</SelectItem>
                <SelectItem value="exxon">ExxonMobil</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Delivery Date/Time */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Delivery Date / Time <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs h-9">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(deliveryDate, "MMM dd, yyyy — hh:mm a")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarPicker mode="single" selected={deliveryDate} onSelect={(d) => d && setDeliveryDate(d)} />
              </PopoverContent>
            </Popover>
          </div>

          {/* Fuel Type + Tank (side by side) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Fuel Type <span className="text-destructive">*</span>
              </Label>
              <Select value={fuelType} onValueChange={setFuelType}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select fuel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="plus">Plus</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Tank <span className="text-destructive">*</span>
              </Label>
              <Select value={tank} onValueChange={setTank}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Assign tank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tank-1">Tank #1 — Regular</SelectItem>
                  <SelectItem value="tank-2">Tank #2 — Regular</SelectItem>
                  <SelectItem value="tank-3">Tank #3 — Plus</SelectItem>
                  <SelectItem value="tank-4">Tank #4 — Premium</SelectItem>
                  <SelectItem value="tank-5">Tank #5 — Diesel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Gallons + Total Cost (side by side) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Delivered Gallons <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                placeholder="0"
                className="h-9 text-xs"
                value={gallons}
                onChange={(e) => setGallons(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Total Cost $ <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                placeholder="0.00"
                className="h-9 text-xs"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
              />
            </div>
          </div>

          {/* Calculated Cost per Gallon */}
          <div className="px-3 py-2 rounded-md bg-muted text-xs">
            <span className="text-muted-foreground">Cost per Gallon:</span>{" "}
            <span className="font-semibold text-foreground">${costPerGallon}</span>
          </div>

          {/* BOL + Invoice (side by side) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                BOL # <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Bill of Lading #"
                className="h-9 text-xs"
                value={bolNumber}
                onChange={(e) => setBolNumber(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Invoice #</Label>
              <Input
                placeholder="Optional"
                className="h-9 text-xs"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
          </div>

          {/* Driver / Truck ID */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Driver / Truck ID</Label>
            <Input
              placeholder="Optional"
              className="h-9 text-xs"
              value={driverTruckId}
              onChange={(e) => setDriverTruckId(e.target.value)}
            />
          </div>

          {/* Attachment */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Attachment (BOL photo/PDF)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors">
              <p className="text-xs text-muted-foreground">
                Click or drag & drop to upload
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">PDF, JPG, PNG up to 10 MB</p>
            </div>
          </div>
        </div>

        <SheetFooter className="flex gap-2 pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              handleReset();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button variant="secondary" size="sm" className="text-xs">
            Save Draft
          </Button>
          <Button size="sm" className="text-xs">
            Confirm Received
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
