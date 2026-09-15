import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Calendar,
  Clock,
  Save,
  Lock,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Ticket,
  FileText,
  User,
  Store,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Mock shift data
const shiftInfo = {
  store: "Marathon Mckeesport",
  storeId: "34897",
  shiftType: "day" as const,
  openedBy: "John Doe",
  openTime: "2026-01-26T06:00:00",
  status: "open" as const,
};

// Mock active packs data
const mockActivePacks = [
  {
    id: "1",
    gameName: "Powerball",
    packNumber: "000001",
    startTicket: 1,
    endTicket: 50,
    openingTicket: 1,
    ticketPrice: 2,
    commissionRate: 0.05,
  },
  {
    id: "2",
    gameName: "Powerball",
    packNumber: "000002",
    startTicket: 1,
    endTicket: 50,
    openingTicket: 15,
    ticketPrice: 2,
    commissionRate: 0.05,
  },
  {
    id: "3",
    gameName: "Mega Millions",
    packNumber: "000003",
    startTicket: 1,
    endTicket: 50,
    openingTicket: 1,
    ticketPrice: 2,
    commissionRate: 0.05,
  },
  {
    id: "4",
    gameName: "Cash 5",
    packNumber: "000004",
    startTicket: 1,
    endTicket: 50,
    openingTicket: 22,
    ticketPrice: 1,
    commissionRate: 0.05,
  },
  {
    id: "5",
    gameName: "Pick 3",
    packNumber: "000005",
    startTicket: 1,
    endTicket: 50,
    openingTicket: 1,
    ticketPrice: 1,
    commissionRate: 0.05,
  },
  {
    id: "6",
    gameName: "Scratch Off - $5",
    packNumber: "000006",
    startTicket: 1,
    endTicket: 50,
    openingTicket: 8,
    ticketPrice: 5,
    commissionRate: 0.05,
  },
];

interface PackSalesEntry {
  id: string;
  gameName: string;
  packNumber: string;
  startTicket: number;
  endTicket: number;
  openingTicket: number;
  lastSoldTicket: number | null;
  ticketPrice: number;
  commissionRate: number;
  validationError?: string;
}

export const DayShiftClosing = () => {
  const [packs, setPacks] = useState<PackSalesEntry[]>(() =>
    mockActivePacks.map((pack) => ({
      ...pack,
      lastSoldTicket: null,
    }))
  );
  const [cashCounted, setCashCounted] = useState<string>("");
  const [varianceNote, setVarianceNote] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isDraft, setIsDraft] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUser = "John Doe";
  const overShortLimit = 5; // $5 threshold for requiring notes

  // Update last sold ticket for a pack
  const updateLastSoldTicket = (packId: string, value: string) => {
    const numValue = value === "" ? null : parseInt(value);
    
    setPacks((prev) =>
      prev.map((pack) => {
        if (pack.id !== packId) return pack;

        let validationError: string | undefined;

        if (numValue !== null) {
          if (numValue < pack.openingTicket) {
            validationError = `Must be ≥ ${pack.openingTicket} (opening ticket)`;
          } else if (numValue > pack.endTicket) {
            validationError = `Must be ≤ ${pack.endTicket} (end ticket)`;
          }
        }

        return {
          ...pack,
          lastSoldTicket: numValue,
          validationError,
        };
      })
    );
  };

  // Calculate pack statistics
  const getPackStats = (pack: PackSalesEntry) => {
    if (pack.lastSoldTicket === null) {
      return { ticketsSold: 0, ticketsRemaining: pack.endTicket - pack.openingTicket + 1, salesAmount: 0 };
    }
    const ticketsSold = pack.lastSoldTicket - pack.openingTicket + 1;
    const ticketsRemaining = pack.endTicket - pack.lastSoldTicket;
    const salesAmount = ticketsSold * pack.ticketPrice;
    return { ticketsSold, ticketsRemaining, salesAmount };
  };

  // Calculate totals
  const totals = useMemo(() => {
    let totalSales = 0;
    let totalTicketsSold = 0;

    packs.forEach((pack) => {
      const stats = getPackStats(pack);
      totalSales += stats.salesAmount;
      totalTicketsSold += stats.ticketsSold;
    });

    const commission = totalSales * 0.05; // 5% commission
    const cashExpected = totalSales - commission;
    const cashCountedNum = parseFloat(cashCounted) || 0;
    const overShort = cashCountedNum - cashExpected;

    return {
      totalSales,
      totalTicketsSold,
      commission,
      cashExpected,
      cashCounted: cashCountedNum,
      overShort,
    };
  }, [packs, cashCounted]);

  // Validation
  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    // Check all packs are accounted for
    const unaccountedPacks = packs.filter((p) => p.lastSoldTicket === null);
    if (unaccountedPacks.length > 0) {
      errors.push(`${unaccountedPacks.length} pack(s) have no last sold ticket entered`);
    }

    // Check for validation errors in packs
    const packsWithErrors = packs.filter((p) => p.validationError);
    if (packsWithErrors.length > 0) {
      errors.push(`${packsWithErrors.length} pack(s) have validation errors`);
    }

    // Check cash counted
    if (!cashCounted) {
      errors.push("Cash counted is required");
    }

    // Check variance note if over/short exceeds limit
    if (Math.abs(totals.overShort) > overShortLimit && !varianceNote.trim()) {
      errors.push(`Variance exceeds $${overShortLimit} - note required`);
    }

    return errors;
  }, [packs, cashCounted, varianceNote, totals.overShort]);

  const canSubmit = validationErrors.length === 0;

  const handleSaveDraft = () => {
    setIsDraft(true);
    toast({
      title: "Draft Saved",
      description: "Shift closing draft has been saved",
    });
  };

  const handleSubmitClose = async () => {
    if (!canSubmit) {
      toast({
        title: "Cannot Submit",
        description: validationErrors[0],
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setConfirmDialogOpen(false);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Log audit trail
    console.log("Shift Closed:", {
      closedBy: currentUser,
      closeTimestamp: new Date().toISOString(),
      totalSales: totals.totalSales,
      cashExpected: totals.cashExpected,
      cashCounted: totals.cashCounted,
      overShort: totals.overShort,
      varianceNote: varianceNote || null,
      packs: packs.map((p) => ({
        packNumber: p.packNumber,
        openingTicket: p.openingTicket,
        lastSoldTicket: p.lastSoldTicket,
        ticketsSold: getPackStats(p).ticketsSold,
        salesAmount: getPackStats(p).salesAmount,
      })),
    });

    setIsSubmitting(false);
    setIsDraft(false);

    toast({
      title: "Shift Closed Successfully",
      description: "The shift has been locked. No further edits allowed without admin override.",
    });
  };

  const isLocked = !isDraft;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Day / Shift Closing</h1>
            <p className="text-muted-foreground text-sm">
              Close lottery sales for the shift or day
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLocked ? (
            <Badge variant="secondary" className="bg-muted">
              <Lock className="w-3 h-3 mr-1" />
              Shift Locked
            </Badge>
          ) : (
            <>
              <Button variant="outline" onClick={handleSaveDraft} disabled={isSubmitting}>
                <Save className="w-4 h-4 mr-1" />
                Save Draft
              </Button>
              <Button 
                onClick={() => setConfirmDialogOpen(true)} 
                disabled={!canSubmit || isSubmitting}
              >
                <Lock className="w-4 h-4 mr-1" />
                Submit & Close Shift
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Validation Errors Banner */}
      {validationErrors.length > 0 && !isLocked && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-sm text-destructive">Cannot close shift</p>
                <ul className="text-sm text-destructive/80 mt-1 space-y-0.5">
                  {validationErrors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shift Details */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Store className="w-5 h-5" />
            Shift Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Store</Label>
              <p className="font-medium text-sm">{shiftInfo.store}</p>
              <p className="text-xs text-muted-foreground">#{shiftInfo.storeId}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Shift Type</Label>
              <Select value={shiftInfo.shiftType} disabled={isLocked}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  <SelectItem value="day">Day Shift</SelectItem>
                  <SelectItem value="night">Night Shift</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Opened By</Label>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <p className="font-medium text-sm">{shiftInfo.openedBy}</p>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Open Time</Label>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <p className="font-medium text-sm">
                  {format(new Date(shiftInfo.openTime), "MMM dd, h:mm a")}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Close Time</Label>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <p className="font-medium text-sm">
                  {isLocked ? format(new Date(), "MMM dd, h:mm a") : "Pending..."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pack-wise Sales Summary */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Pack-wise Sales Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Game Name</TableHead>
                <TableHead>Pack #</TableHead>
                <TableHead className="text-center">Start</TableHead>
                <TableHead className="text-center">End</TableHead>
                <TableHead className="text-center">Opening</TableHead>
                <TableHead className="text-center">Last Sold</TableHead>
                <TableHead className="text-center">Sold</TableHead>
                <TableHead className="text-center">Remaining</TableHead>
                <TableHead className="text-right">Sales ($)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packs.map((pack) => {
                const stats = getPackStats(pack);
                return (
                  <TableRow
                    key={pack.id}
                    className={pack.validationError ? "bg-destructive/5" : ""}
                  >
                    <TableCell className="font-medium">{pack.gameName}</TableCell>
                    <TableCell>{pack.packNumber}</TableCell>
                    <TableCell className="text-center">{pack.startTicket}</TableCell>
                    <TableCell className="text-center">{pack.endTicket}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{pack.openingTicket}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Input
                          type="number"
                          min={pack.openingTicket}
                          max={pack.endTicket}
                          value={pack.lastSoldTicket ?? ""}
                          onChange={(e) => updateLastSoldTicket(pack.id, e.target.value)}
                          disabled={isLocked}
                          className={`w-20 h-8 text-center ${
                            pack.validationError ? "border-destructive" : ""
                          }`}
                          placeholder="—"
                        />
                        {pack.validationError && (
                          <span className="text-xs text-destructive">{pack.validationError}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={stats.ticketsSold > 0 ? "font-medium" : "text-muted-foreground"}>
                        {stats.ticketsSold}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-muted-foreground">{stats.ticketsRemaining}</span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${stats.salesAmount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {/* Totals Row */}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell colSpan={6}>Totals</TableCell>
                <TableCell className="text-center">{totals.totalTicketsSold}</TableCell>
                <TableCell className="text-center">—</TableCell>
                <TableCell className="text-right">${totals.totalSales.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cash & Liability Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Cash & Liability Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Total Ticket Sales</span>
                <span className="font-semibold text-lg">${totals.totalSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Commission (5%)</span>
                <span className="font-medium text-primary">-${totals.commission.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b bg-muted/30 px-2 rounded">
                <span className="font-medium">Cash Expected</span>
                <span className="font-bold text-lg">${totals.cashExpected.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <Label htmlFor="cashCounted" className="text-muted-foreground">
                  Cash Counted
                </Label>
                <Input
                  id="cashCounted"
                  type="number"
                  step="0.01"
                  value={cashCounted}
                  onChange={(e) => setCashCounted(e.target.value)}
                  disabled={isLocked}
                  className="w-32 text-right font-semibold"
                  placeholder="0.00"
                />
              </div>
              <div
                className={`flex justify-between items-center py-3 px-3 rounded-lg ${
                  Math.abs(totals.overShort) > overShortLimit
                    ? "bg-destructive/10 border border-destructive/30"
                    : totals.overShort !== 0
                    ? "bg-accent"
                    : "bg-primary/10"
                }`}
              >
                <span className="font-medium">Over / Short</span>
                <span
                  className={`font-bold text-lg ${
                    totals.overShort > 0
                      ? "text-primary"
                      : totals.overShort < 0
                      ? "text-destructive"
                      : ""
                  }`}
                >
                  {totals.overShort >= 0 ? "+" : ""}${totals.overShort.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Variance Notes & Audit */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Variance Notes & Audit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Math.abs(totals.overShort) > overShortLimit && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">Variance exceeds ${overShortLimit}</p>
                  <p className="text-destructive/80">A note is required to explain the discrepancy.</p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="varianceNote">
                Variance Note {Math.abs(totals.overShort) > overShortLimit && <span className="text-destructive">*</span>}
              </Label>
              <Textarea
                id="varianceNote"
                placeholder="Explain any cash variance or discrepancies..."
                value={varianceNote}
                onChange={(e) => setVarianceNote(e.target.value)}
                disabled={isLocked}
                rows={3}
              />
            </div>

            {/* Audit Trail Preview */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Audit Trail</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Closed By</span>
                  <span className="font-medium">{isLocked ? currentUser : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Close Timestamp</span>
                  <span className="font-medium">
                    {isLocked ? format(new Date(), "MMM dd, yyyy h:mm:ss a") : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  {isLocked ? (
                    <Badge className="bg-primary text-primary-foreground">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Closed
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Draft</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Confirm Shift Closing
            </DialogTitle>
            <DialogDescription>
              Once submitted, this shift will be locked and no further edits will be allowed 
              without admin override.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Sales:</span>
                <span className="font-medium">${totals.totalSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cash Expected:</span>
                <span className="font-medium">${totals.cashExpected.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cash Counted:</span>
                <span className="font-medium">${totals.cashCounted.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-medium">Over/Short:</span>
                <span
                  className={`font-bold ${
                    totals.overShort > 0
                      ? "text-primary"
                      : totals.overShort < 0
                      ? "text-destructive"
                      : ""
                  }`}
                >
                  {totals.overShort >= 0 ? "+" : ""}${totals.overShort.toFixed(2)}
                </span>
              </div>
            </div>
            {varianceNote && (
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Variance Note:</p>
                <p className="bg-muted p-2 rounded text-sm">{varianceNote}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitClose} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit & Lock Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
