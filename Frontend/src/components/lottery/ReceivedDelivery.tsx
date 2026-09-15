import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Truck,
  Plus,
  Trash2,
  Barcode,
  Save,
  CheckCircle,
  AlertTriangle,
  XCircle,
  CheckCheck,
  Ban,
  ClipboardCheck,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

// Mock distributors
const distributors = [
  { id: "1", name: "PA Lottery Distribution" },
  { id: "2", name: "State Games Inc." },
  { id: "3", name: "Lucky Tickets Co." },
];

// Mock games with ticket rules
const games = [
  { id: "1", name: "Powerball", ticketsPerPack: 50, ticketPrice: 2 },
  { id: "2", name: "Mega Millions", ticketsPerPack: 50, ticketPrice: 2 },
  { id: "3", name: "Cash 5", ticketsPerPack: 50, ticketPrice: 1 },
  { id: "4", name: "Pick 3", ticketsPerPack: 50, ticketPrice: 1 },
  { id: "5", name: "Scratch Off - $5", ticketsPerPack: 50, ticketPrice: 5 },
  { id: "6", name: "Scratch Off - $10", ticketsPerPack: 30, ticketPrice: 10 },
  { id: "7", name: "Scratch Off - $20", ticketsPerPack: 20, ticketPrice: 20 },
];

// Mock pending confirmation packs (previously confirmed received, now awaiting confirmation)
const mockPendingPacks = [
  {
    id: "p1",
    gameName: "Powerball",
    packNumber: "000001",
    startTicket: "000001001",
    endTicket: "000001050",
    ticketsCount: 50,
    packValue: 100,
    deliveryRef: "INV-2026-001",
    receivedDate: "2026-01-25",
    receivedBy: "John Doe",
  },
  {
    id: "p2",
    gameName: "Powerball",
    packNumber: "000002",
    startTicket: "000002001",
    endTicket: "000002050",
    ticketsCount: 50,
    packValue: 100,
    deliveryRef: "INV-2026-001",
    receivedDate: "2026-01-25",
    receivedBy: "John Doe",
  },
  {
    id: "p3",
    gameName: "Mega Millions",
    packNumber: "000003",
    startTicket: "000003001",
    endTicket: "000003050",
    ticketsCount: 50,
    packValue: 100,
    deliveryRef: "INV-2026-001",
    receivedDate: "2026-01-25",
    receivedBy: "John Doe",
  },
  {
    id: "p4",
    gameName: "Cash 5",
    packNumber: "000004",
    startTicket: "000004001",
    endTicket: "000004050",
    ticketsCount: 50,
    packValue: 50,
    deliveryRef: "INV-2026-002",
    receivedDate: "2026-01-26",
    receivedBy: "Jane Smith",
  },
];

interface PackEntry {
  id: string;
  gameId: string;
  gameName: string;
  packNumber: string;
  startTicket: string;
  endTicket: string;
  ticketsPerPack: number;
  packValue: number;
  status: "pending" | "valid" | "error";
  errorMessage?: string;
}

interface PendingPack {
  id: string;
  gameName: string;
  packNumber: string;
  startTicket: string;
  endTicket: string;
  ticketsCount: number;
  packValue: number;
  deliveryRef: string;
  receivedDate: string;
  receivedBy: string;
}

export const ReceivedDelivery = () => {
  // --- Received Delivery State ---
  const [distributor, setDistributor] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [receivedBy] = useState("John Doe");
  const [packs, setPacks] = useState<PackEntry[]>([]);
  const [selectedPacks, setSelectedPacks] = useState<string[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [bulkGameId, setBulkGameId] = useState("");
  const [bulkStartPack, setBulkStartPack] = useState("");
  const [bulkEndPack, setBulkEndPack] = useState("");

  // --- Confirm Delivery State ---
  const [pendingPacks, setPendingPacks] = useState<PendingPack[]>(mockPendingPacks);
  const [selectedConfirmPacks, setSelectedConfirmPacks] = useState<string[]>([]);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [packToReject, setPackToReject] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [bulkRejectDialogOpen, setBulkRejectDialogOpen] = useState(false);

  const currentUser = "John Doe";

  // --- Received Delivery Logic ---
  const usedPackNumbers = new Set(packs.map((p) => p.packNumber));

  const validatePack = (packNumber: string, _gameId: string): { valid: boolean; message?: string } => {
    if (!packNumber.trim()) return { valid: false, message: "Pack number is required" };
    if (usedPackNumbers.has(packNumber)) return { valid: false, message: "Duplicate pack number" };
    return { valid: true };
  };

  const addPack = (gameId: string, packNumber: string) => {
    const game = games.find((g) => g.id === gameId);
    if (!game) return;
    const validation = validatePack(packNumber, gameId);
    const startTicket = `${packNumber}001`;
    const endTicket = `${packNumber}${String(game.ticketsPerPack).padStart(3, "0")}`;
    const packValue = game.ticketsPerPack * game.ticketPrice;
    const newPack: PackEntry = {
      id: crypto.randomUUID(),
      gameId: game.id,
      gameName: game.name,
      packNumber,
      startTicket,
      endTicket,
      ticketsPerPack: game.ticketsPerPack,
      packValue,
      status: validation.valid ? "valid" : "error",
      errorMessage: validation.message,
    };
    setPacks((prev) => [...prev, newPack]);
  };

  const handleBarcodeScanned = () => {
    if (!barcodeInput.trim() || !bulkGameId) {
      toast({ title: "Error", description: "Please select a game and enter/scan a barcode", variant: "destructive" });
      return;
    }
    addPack(bulkGameId, barcodeInput.trim());
    setBarcodeInput("");
  };

  const handleBulkAdd = () => {
    if (!bulkGameId || !bulkStartPack || !bulkEndPack) {
      toast({ title: "Error", description: "Please fill in all bulk entry fields", variant: "destructive" });
      return;
    }
    const start = parseInt(bulkStartPack);
    const end = parseInt(bulkEndPack);
    if (isNaN(start) || isNaN(end) || start > end) {
      toast({ title: "Error", description: "Invalid pack range", variant: "destructive" });
      return;
    }
    for (let i = start; i <= end; i++) {
      addPack(bulkGameId, String(i).padStart(6, "0"));
    }
    setBulkStartPack("");
    setBulkEndPack("");
    toast({ title: "Success", description: `Added ${end - start + 1} packs` });
  };

  const removePack = (id: string) => {
    setPacks((prev) => prev.filter((p) => p.id !== id));
    setSelectedPacks((prev) => prev.filter((pId) => pId !== id));
  };

  const removeSelected = () => {
    setPacks((prev) => prev.filter((p) => !selectedPacks.includes(p.id)));
    setSelectedPacks([]);
  };

  const togglePackSelection = (id: string) => {
    setSelectedPacks((prev) => prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]);
  };

  const toggleAllSelection = () => {
    if (selectedPacks.length === packs.length) {
      setSelectedPacks([]);
    } else {
      setSelectedPacks(packs.map((p) => p.id));
    }
  };

  const handleSaveDraft = () => {
    if (!distributor) {
      toast({ title: "Error", description: "Please select a distributor", variant: "destructive" });
      return;
    }
    toast({ title: "Draft Saved", description: `Saved ${packs.length} packs as draft` });
  };

  const handleConfirmReceived = () => {
    if (!distributor) {
      toast({ title: "Error", description: "Please select a distributor", variant: "destructive" });
      return;
    }
    const invalidPacks = packs.filter((p) => p.status === "error");
    if (invalidPacks.length > 0) {
      toast({ title: "Error", description: `${invalidPacks.length} packs have validation errors`, variant: "destructive" });
      return;
    }
    if (packs.length === 0) {
      toast({ title: "Error", description: "Please add at least one pack", variant: "destructive" });
      return;
    }
    toast({ title: "Delivery Confirmed", description: `${packs.length} packs moved to Confirm / Activate Pack` });
    setPacks([]);
    setSelectedPacks([]);
    setInvoiceNumber("");
  };

  const totalPackValue = packs.reduce((sum, p) => sum + p.packValue, 0);
  const validPacks = packs.filter((p) => p.status === "valid").length;
  const errorPacks = packs.filter((p) => p.status === "error").length;

  // --- Confirm Delivery Logic ---
  const confirmPack = (packId: string) => {
    setPendingPacks((prev) =>
      prev.filter((pack) => {
        if (pack.id === packId) {
          toast({ title: "Pack Confirmed", description: `Pack ${pack.packNumber} is now pending activation` });
          return false;
        }
        return true;
      })
    );
    setSelectedConfirmPacks((prev) => prev.filter((id) => id !== packId));
  };

  const confirmAllPacks = () => {
    if (pendingPacks.length === 0) {
      toast({ title: "No Packs", description: "No packs to confirm", variant: "destructive" });
      return;
    }
    const count = pendingPacks.length;
    setPendingPacks([]);
    setSelectedConfirmPacks([]);
    toast({ title: "Packs Confirmed", description: `${count} packs are now pending activation` });
  };

  const openRejectDialog = (packId: string) => {
    setPackToReject(packId);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (!rejectionReason.trim()) {
      toast({ title: "Error", description: "Rejection reason is required", variant: "destructive" });
      return;
    }
    if (packToReject) {
      setPendingPacks((prev) =>
        prev.filter((pack) => {
          if (pack.id === packToReject) {
            toast({ title: "Pack Rejected", description: `Pack ${pack.packNumber} has been rejected` });
            return false;
          }
          return true;
        })
      );
      setSelectedConfirmPacks((prev) => prev.filter((id) => id !== packToReject));
    }
    setRejectDialogOpen(false);
    setPackToReject(null);
    setRejectionReason("");
  };

  const openBulkRejectDialog = () => {
    if (selectedConfirmPacks.length === 0) {
      toast({ title: "No Packs Selected", description: "Select packs to reject", variant: "destructive" });
      return;
    }
    setRejectionReason("");
    setBulkRejectDialogOpen(true);
  };

  const confirmBulkReject = () => {
    if (!rejectionReason.trim()) {
      toast({ title: "Error", description: "Rejection reason is required", variant: "destructive" });
      return;
    }
    const rejectedCount = selectedConfirmPacks.length;
    setPendingPacks((prev) => prev.filter((p) => !selectedConfirmPacks.includes(p.id)));
    setSelectedConfirmPacks([]);
    setBulkRejectDialogOpen(false);
    setRejectionReason("");
    toast({ title: "Packs Rejected", description: `${rejectedCount} packs have been rejected` });
  };

  const toggleConfirmPackSelection = (id: string) => {
    setSelectedConfirmPacks((prev) => prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]);
  };

  const toggleAllConfirmSelection = () => {
    if (selectedConfirmPacks.length === pendingPacks.length) {
      setSelectedConfirmPacks([]);
    } else {
      setSelectedConfirmPacks(pendingPacks.map((p) => p.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Truck className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Received and Confirm Delivery</h1>
            <p className="text-muted-foreground text-sm">
              Log lottery packs received from distributor and confirm pending packs
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="w-4 h-4 mr-1" />
            Save as Draft
          </Button>
          <Button onClick={handleConfirmReceived}>
            <CheckCircle className="w-4 h-4 mr-1" />
            Confirm Received
          </Button>
        </div>
      </div>

      {/* Delivery Details */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Delivery Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="distributor">
                Distributor / Vendor <span className="text-destructive">*</span>
              </Label>
              <Select value={distributor} onValueChange={setDistributor}>
                <SelectTrigger id="distributor">
                  <SelectValue placeholder="Select distributor" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  {distributors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryDate">Delivery Date</Label>
              <Input id="deliveryDate" type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Delivery Reference / Invoice #</Label>
              <Input id="invoiceNumber" placeholder="Enter invoice number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receivedBy">Received By</Label>
              <Input id="receivedBy" value={receivedBy} disabled className="bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Entry */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Barcode className="w-5 h-5" />
            Quick Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium text-sm">Scan Pack Barcode</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Select Game</Label>
                  <Select value={bulkGameId} onValueChange={setBulkGameId}>
                    <SelectTrigger><SelectValue placeholder="Select game" /></SelectTrigger>
                    <SelectContent className="z-50 bg-popover">
                      {games.map((g) => (<SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Scan or enter barcode..." value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleBarcodeScanned()} />
                  <Button onClick={handleBarcodeScanned}><Plus className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium text-sm">Manual Range Entry</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Select Game</Label>
                  <Select value={bulkGameId} onValueChange={setBulkGameId}>
                    <SelectTrigger><SelectValue placeholder="Select game" /></SelectTrigger>
                    <SelectContent className="z-50 bg-popover">
                      {games.map((g) => (<SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input placeholder="Start pack #" value={bulkStartPack} onChange={(e) => setBulkStartPack(e.target.value)} />
                  </div>
                  <span className="self-center text-muted-foreground">to</span>
                  <div className="flex-1">
                    <Input placeholder="End pack #" value={bulkEndPack} onChange={(e) => setBulkEndPack(e.target.value)} />
                  </div>
                  <Button onClick={handleBulkAdd}><Plus className="w-4 h-4 mr-1" />Add</Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {packs.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Total Packs</p>
              <p className="text-2xl font-bold">{packs.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Valid Packs</p>
              <p className="text-2xl font-bold text-primary">{validPacks}</p>
            </CardContent>
          </Card>
          <Card className={errorPacks > 0 ? "border-destructive/50" : ""}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Errors</p>
              <p className={`text-2xl font-bold ${errorPacks > 0 ? "text-destructive" : ""}`}>{errorPacks}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">${totalPackValue.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Packs Received Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Packs Received</CardTitle>
            {selectedPacks.length > 0 && (
              <Button variant="destructive" size="sm" onClick={removeSelected}>
                <Trash2 className="w-4 h-4 mr-1" />
                Remove Selected ({selectedPacks.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {packs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Barcode className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No packs added yet</p>
              <p className="text-sm">Scan a barcode or use manual entry above</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox checked={selectedPacks.length === packs.length && packs.length > 0} onCheckedChange={toggleAllSelection} />
                  </TableHead>
                  <TableHead>Game Name</TableHead>
                  <TableHead>Pack / Book #</TableHead>
                  <TableHead>Start Ticket #</TableHead>
                  <TableHead>End Ticket #</TableHead>
                  <TableHead className="text-center">Tickets</TableHead>
                  <TableHead className="text-right">Pack Value</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packs.map((pack) => (
                  <TableRow key={pack.id} className={pack.status === "error" ? "bg-destructive/5" : ""}>
                    <TableCell>
                      <Checkbox checked={selectedPacks.includes(pack.id)} onCheckedChange={() => togglePackSelection(pack.id)} />
                    </TableCell>
                    <TableCell className="font-medium">{pack.gameName}</TableCell>
                    <TableCell>{pack.packNumber}</TableCell>
                    <TableCell>{pack.startTicket}</TableCell>
                    <TableCell>{pack.endTicket}</TableCell>
                    <TableCell className="text-center">{pack.ticketsPerPack}</TableCell>
                    <TableCell className="text-right">${pack.packValue.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      {pack.status === "valid" ? (
                        <Badge variant="secondary" className="bg-accent text-accent-foreground">Received (Not Activated)</Badge>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />Error
                          </Badge>
                          {pack.errorMessage && <span className="text-xs text-destructive">{pack.errorMessage}</span>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removePack(pack.id)} className="h-8 w-8">
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ===== Packs Pending Confirmation Section ===== */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5" />
              Packs Pending Confirmation
            </CardTitle>
            <div className="flex gap-2">
              {selectedConfirmPacks.length > 0 && (
                <Button variant="destructive" size="sm" onClick={openBulkRejectDialog}>
                  <Ban className="w-4 h-4 mr-1" />
                  Reject Selected ({selectedConfirmPacks.length})
                </Button>
              )}
              <Button onClick={confirmAllPacks} disabled={pendingPacks.length === 0}>
                <CheckCheck className="w-4 h-4 mr-1" />
                Confirm All Packs ({pendingPacks.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {pendingPacks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No packs pending confirmation</p>
              <p className="text-sm">All received packs have been processed</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={pendingPacks.length > 0 && selectedConfirmPacks.length === pendingPacks.length}
                      onCheckedChange={toggleAllConfirmSelection}
                    />
                  </TableHead>
                  <TableHead>Game Name</TableHead>
                  <TableHead>Pack / Book #</TableHead>
                  <TableHead>Start Ticket #</TableHead>
                  <TableHead>End Ticket #</TableHead>
                  <TableHead className="text-center">Tickets</TableHead>
                  <TableHead className="text-right">Pack Value</TableHead>
                  <TableHead>Delivery Ref</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPacks.map((pack) => (
                  <TableRow key={pack.id}>
                    <TableCell>
                      <Checkbox checked={selectedConfirmPacks.includes(pack.id)} onCheckedChange={() => toggleConfirmPackSelection(pack.id)} />
                    </TableCell>
                    <TableCell className="font-medium">{pack.gameName}</TableCell>
                    <TableCell>{pack.packNumber}</TableCell>
                    <TableCell>{pack.startTicket}</TableCell>
                    <TableCell>{pack.endTicket}</TableCell>
                    <TableCell className="text-center">{pack.ticketsCount}</TableCell>
                    <TableCell className="text-right">${pack.packValue.toFixed(2)}</TableCell>
                    <TableCell><span className="text-sm">{pack.deliveryRef}</span></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => confirmPack(pack.id)} className="h-8 text-primary hover:text-primary hover:bg-primary/10">
                          <CheckCircle className="w-4 h-4 mr-1" />Confirm
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openRejectDialog(pack.id)} className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                          <XCircle className="w-4 h-4 mr-1" />Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Verification Rules */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
            Verification Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Pack number must be unique (no duplicates in system)</li>
            <li>Ticket range must be valid for the game type</li>
            <li>No overlap with existing ticket ranges</li>
            <li>Confirmed packs will move to "Pending Activation" status</li>
            <li>Confirmed packs are <strong>not yet sellable</strong> until activated</li>
          </ul>
        </CardContent>
      </Card>

      {/* Single Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Pack</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this pack. This will be recorded in the audit log.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Textarea id="reason" placeholder="Enter the reason for rejection..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReject}>Reject Pack</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reject Dialog */}
      <Dialog open={bulkRejectDialogOpen} onOpenChange={setBulkRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject {selectedConfirmPacks.length} Packs</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting the selected packs. This will be recorded in the audit log.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulkReason">Rejection Reason *</Label>
              <Textarea id="bulkReason" placeholder="Enter the reason for rejection..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmBulkReject}>Reject {selectedConfirmPacks.length} Packs</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
