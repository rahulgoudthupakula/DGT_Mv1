import { useRef, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Trash2, Upload, PencilLine, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface ReceiptItemDraft {
  key: string;
  gameId: string;
  packNumber: string;
  quantity: number;
}

export interface ReceiptDraft {
  distributorId: string;
  deliveryDate: string;
  referenceNumber: string;
  receivedBy: string;
  items: ReceiptItemDraft[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  distributors: { id: string; name: string }[];
  games: { id: string; name: string }[];
  defaultReceivedBy: string;
  onSave: (draft: ReceiptDraft) => Promise<void>;
  saving?: boolean;
  defaultDeliveryDate?: string;
}

const newItem = (): ReceiptItemDraft => ({
  key: Math.random().toString(36).slice(2),
  gameId: "",
  packNumber: "",
  quantity: 1,
});

export const AddReceivedReceiptDialog = ({
  open,
  onOpenChange,
  distributors,
  games,
  defaultReceivedBy,
  onSave,
  saving = false,
  defaultDeliveryDate,
}: Props) => {
  const [step, setStep] = useState<"choose" | "reading" | "form">("choose");
  const [distributorId, setDistributorId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(defaultDeliveryDate ?? format(new Date(), "yyyy-MM-dd"));
  const [referenceNumber, setReferenceNumber] = useState("");
  const [receivedBy, setReceivedBy] = useState(defaultReceivedBy);
  const [items, setItems] = useState<ReceiptItemDraft[]>([newItem()]);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("choose");
    setDistributorId("");
    setDeliveryDate(defaultDeliveryDate ?? format(new Date(), "yyyy-MM-dd"));
    setReferenceNumber("");
    setReceivedBy(defaultReceivedBy);
    setItems([newItem()]);
  };

  const updateItem = (key: string, patch: Partial<ReceiptItemDraft>) =>
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  const handleFile = async (file: File) => {
    setStep("reading");
    try {
      const base64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("parse-invoice", {
        body: { fileData: base64, mimeType: file.type, fileName: file.name },
      });
      if (error || !data || (data as any).error) {
        throw new Error((data as any)?.error ?? "Could not read the receipt");
      }

      const parsed = data as {
        vendor?: string;
        invoiceNumber?: string;
        invoiceDate?: string;
        lines?: { description: string; sku: string; quantity: number }[];
      };

      const matchedVendor = distributors.find((d) =>
        parsed.vendor ? d.name.toLowerCase().includes(parsed.vendor.toLowerCase().slice(0, 6)) : false
      );
      if (matchedVendor) setDistributorId(matchedVendor.id);
      if (parsed.invoiceNumber) setReferenceNumber(parsed.invoiceNumber);
      if (parsed.invoiceDate) setDeliveryDate(parsed.invoiceDate);

      const mapped = (parsed.lines ?? []).map((l) => {
        const game = games.find((g) => l.description.toLowerCase().includes(g.name.toLowerCase()));
        return {
          key: Math.random().toString(36).slice(2),
          gameId: game?.id ?? "",
          packNumber: (l.sku || "").trim(),
          quantity: Math.max(1, l.quantity || 1),
        };
      });
      setItems(mapped.length ? mapped : [newItem()]);
      toast({ title: "Receipt read", description: "Please review the details before saving." });
      setStep("form");
    } catch (e: any) {
      toast({
        title: "Could not read the file",
        description: e?.message ?? "Please enter the receipt manually.",
        variant: "destructive",
      });
      setStep("form");
    }
  };

  const handleSave = async () => {
    if(saving)return;
    if (!distributorId) {
      toast({ title: "Vendor required", description: "Select the distributor / vendor", variant: "destructive" });
      return;
    }
    const valid = items.filter((i) => i.gameId && /^[0-9]{1,50}$/.test(i.packNumber) && Number.isInteger(i.quantity) && i.quantity > 0);
    if(valid.length !== items.length || valid.reduce((n,i)=>n+i.quantity,0)>1000){toast({title:"Check every receipt line",description:"Select a game, numeric book number and positive whole quantity. Maximum 1,000 packs.",variant:"destructive"});return;}
    if (valid.length === 0) {
      toast({ title: "No items", description: "Add at least one item in the delivery", variant: "destructive" });
      return;
    }
    try { await onSave({ distributorId, deliveryDate, referenceNumber, receivedBy, items: valid }); } catch { return; }
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if(saving)return;
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <fieldset disabled={saving} className="min-w-0 space-y-4">
        <DialogHeader>
          <DialogTitle>Add Received Receipt</DialogTitle>
          <DialogDescription>
            {step === "choose"
              ? "Upload the delivery receipt to fill it in automatically, or enter it by hand."
              : "Check the delivery details and the items received."}
          </DialogDescription>
        </DialogHeader>

        {step === "choose" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center gap-2 rounded-lg border border-border p-6 text-center hover:border-primary hover:bg-accent transition-colors"
            >
              <Upload className="h-7 w-7 text-primary" />
              <span className="font-medium text-sm">Upload receipt</span>
              <span className="text-xs text-muted-foreground">PDF, JPG or PNG — details are filled in for you</span>
            </button>
            <button
              type="button"
              onClick={() => setStep("form")}
              className="flex flex-col items-center gap-2 rounded-lg border border-border p-6 text-center hover:border-primary hover:bg-accent transition-colors"
            >
              <PencilLine className="h-7 w-7 text-primary" />
              <span className="font-medium text-sm">Enter manually</span>
              <span className="text-xs text-muted-foreground">Type the delivery details yourself</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) handleFile(f);
              }}
            />
          </div>
        )}

        {step === "reading" && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Reading your receipt...</p>
          </div>
        )}

        {step === "form" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>
                  Vendor <span className="text-destructive">*</span>
                </Label>
                <Select value={distributorId} onValueChange={setDistributorId}>
                  <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    {distributors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Delivery Date</Label>
                <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Delivery Reference / Invoice #</Label>
                <Input
                  placeholder="Enter reference number"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Received By</Label>
                <Input disabled value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Items in the delivery
                </Label>
                <Button variant="outline" size="sm" onClick={() => setItems((p) => [...p, newItem()])}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Item
                </Button>
              </div>
              <div className="border border-border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Game</TableHead>
                      <TableHead className="w-[160px]">Starting Pack #</TableHead>
                      <TableHead className="w-[110px] text-right">Packs</TableHead>
                      <TableHead className="w-[44px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((i) => (
                      <TableRow key={i.key}>
                        <TableCell>
                          <Select value={i.gameId} onValueChange={(v) => updateItem(i.key, { gameId: v })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select game" /></SelectTrigger>
                            <SelectContent className="z-50 bg-popover">
                              {games.map((g) => (
                                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8 text-xs"
                            placeholder="000001"
                            value={i.packNumber}
                            onChange={(e) => updateItem(i.key, { packNumber: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            className="h-8 text-xs text-right"
                            value={i.quantity || ""}
                            onChange={(e) => updateItem(i.key, { quantity: parseInt(e.target.value) || 0 })}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            aria-label="Remove item"
                            onClick={() =>
                              setItems((p) => (p.length === 1 ? [newItem()] : p.filter((x) => x.key !== i.key)))
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {step === "form" && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setStep("choose")}>Back</Button>
            <Button disabled={saving} onClick={()=>void handleSave()}>{saving?"Saving…":"Save Receipt"}</Button>
          </DialogFooter>
        )}
        </fieldset>
      </DialogContent>
    </Dialog>
  );
};
