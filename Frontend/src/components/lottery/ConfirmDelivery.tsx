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
  ClipboardCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  CheckCheck,
  Ban,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Mock data for pending confirmation packs
const mockPendingPacks = [
  {
    id: "1",
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
    id: "2",
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
    id: "3",
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
    id: "4",
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
  {
    id: "5",
    gameName: "Pick 3",
    packNumber: "000005",
    startTicket: "000005001",
    endTicket: "000005050",
    ticketsCount: 50,
    packValue: 50,
    deliveryRef: "INV-2026-002",
    receivedDate: "2026-01-26",
    receivedBy: "Jane Smith",
  },
  {
    id: "6",
    gameName: "Scratch Off - $5",
    packNumber: "000006",
    startTicket: "000006001",
    endTicket: "000006050",
    ticketsCount: 50,
    packValue: 250,
    deliveryRef: "INV-2026-002",
    receivedDate: "2026-01-26",
    receivedBy: "Jane Smith",
  },
];

// Simulate existing packs in system (for duplicate check)
const existingPacks = new Set(["000010", "000011"]);
const existingTicketRanges = [
  { start: 100001, end: 100050 },
  { start: 200001, end: 200050 },
];

interface PackWithVerification {
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
  verificationStatus: "pending" | "verified" | "error";
  verificationErrors: string[];
  confirmedBy?: string;
  confirmedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

type PackStatus = "all" | "pending" | "verified" | "error";

export const ConfirmDelivery = () => {
  const [packs, setPacks] = useState<PackWithVerification[]>(() =>
    mockPendingPacks.map((pack) => ({
      ...pack,
      verificationStatus: "pending" as const,
      verificationErrors: [],
    }))
  );
  const [selectedPacks, setSelectedPacks] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PackStatus>("all");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [packToReject, setPackToReject] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [bulkRejectDialogOpen, setBulkRejectDialogOpen] = useState(false);

  const currentUser = "John Doe"; // Simulated logged-in user

  // Verification logic
  const verifyPack = (pack: PackWithVerification): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check if pack number already exists in system
    if (existingPacks.has(pack.packNumber)) {
      errors.push("Duplicate pack number already exists in system");
    }

    // Validate ticket range format
    const startNum = parseInt(pack.startTicket);
    const endNum = parseInt(pack.endTicket);
    if (isNaN(startNum) || isNaN(endNum)) {
      errors.push("Invalid ticket number format");
    } else if (endNum <= startNum) {
      errors.push("End ticket must be greater than start ticket");
    } else if (endNum - startNum + 1 !== pack.ticketsCount) {
      errors.push("Ticket range does not match ticket count");
    }

    // Check for overlap with existing ticket ranges
    for (const range of existingTicketRanges) {
      if (
        (startNum >= range.start && startNum <= range.end) ||
        (endNum >= range.start && endNum <= range.end) ||
        (startNum <= range.start && endNum >= range.end)
      ) {
        errors.push("Ticket range overlaps with existing pack");
        break;
      }
    }

    return { valid: errors.length === 0, errors };
  };

  const runVerification = () => {
    setPacks((prev) =>
      prev.map((pack) => {
        if (pack.verificationStatus === "pending") {
          const result = verifyPack(pack);
          return {
            ...pack,
            verificationStatus: result.valid ? "verified" : "error",
            verificationErrors: result.errors,
          };
        }
        return pack;
      })
    );
    toast({
      title: "Verification Complete",
      description: "All pending packs have been verified",
    });
  };

  const confirmPack = (packId: string) => {
    setPacks((prev) =>
      prev.filter((pack) => {
        if (pack.id === packId) {
          toast({
            title: "Pack Confirmed",
            description: `Pack ${pack.packNumber} is now pending activation`,
          });
          return false; // Remove from list
        }
        return true;
      })
    );
    setSelectedPacks((prev) => prev.filter((id) => id !== packId));
  };

  const openRejectDialog = (packId: string) => {
    setPackToReject(packId);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Rejection reason is required",
        variant: "destructive",
      });
      return;
    }

    if (packToReject) {
      setPacks((prev) =>
        prev.filter((pack) => {
          if (pack.id === packToReject) {
            // In real implementation, this would save the rejection to audit log
            console.log("Pack rejected:", {
              packNumber: pack.packNumber,
              rejectedBy: currentUser,
              rejectedAt: new Date().toISOString(),
              reason: rejectionReason,
            });
            toast({
              title: "Pack Rejected",
              description: `Pack ${pack.packNumber} has been rejected`,
            });
            return false;
          }
          return true;
        })
      );
      setSelectedPacks((prev) => prev.filter((id) => id !== packToReject));
    }

    setRejectDialogOpen(false);
    setPackToReject(null);
    setRejectionReason("");
  };

  const confirmAllVerified = () => {
    const verifiedPacks = packs.filter((p) => p.verificationStatus === "verified");
    if (verifiedPacks.length === 0) {
      toast({
        title: "No Verified Packs",
        description: "Run verification first or resolve errors",
        variant: "destructive",
      });
      return;
    }

    setPacks((prev) => prev.filter((p) => p.verificationStatus !== "verified"));
    setSelectedPacks([]);
    toast({
      title: "Packs Confirmed",
      description: `${verifiedPacks.length} packs are now pending activation`,
    });
  };

  const openBulkRejectDialog = () => {
    if (selectedPacks.length === 0) {
      toast({
        title: "No Packs Selected",
        description: "Select packs to reject",
        variant: "destructive",
      });
      return;
    }
    setRejectionReason("");
    setBulkRejectDialogOpen(true);
  };

  const confirmBulkReject = () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Rejection reason is required",
        variant: "destructive",
      });
      return;
    }

    const rejectedCount = selectedPacks.length;
    setPacks((prev) => prev.filter((p) => !selectedPacks.includes(p.id)));
    setSelectedPacks([]);
    setBulkRejectDialogOpen(false);
    setRejectionReason("");

    toast({
      title: "Packs Rejected",
      description: `${rejectedCount} packs have been rejected`,
    });
  };

  const togglePackSelection = (id: string) => {
    setSelectedPacks((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    const filteredPackIds = filteredPacks.map((p) => p.id);
    const allSelected = filteredPackIds.every((id) => selectedPacks.includes(id));
    if (allSelected) {
      setSelectedPacks((prev) => prev.filter((id) => !filteredPackIds.includes(id)));
    } else {
      setSelectedPacks((prev) => [...new Set([...prev, ...filteredPackIds])]);
    }
  };

  // Filter packs
  const filteredPacks = packs.filter((pack) => {
    const matchesSearch =
      pack.gameName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pack.packNumber.includes(searchTerm) ||
      pack.deliveryRef.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || pack.verificationStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Stats
  const pendingCount = packs.filter((p) => p.verificationStatus === "pending").length;
  const verifiedCount = packs.filter((p) => p.verificationStatus === "verified").length;
  const errorCount = packs.filter((p) => p.verificationStatus === "error").length;
  const totalValue = packs.reduce((sum, p) => sum + p.packValue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Confirm Delivery</h1>
            <p className="text-muted-foreground text-sm">
              Verify received lottery packs before activation
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={confirmAllVerified} disabled={verifiedCount === 0}>
            <CheckCheck className="w-4 h-4 mr-1" />
            Confirm All Verified ({verifiedCount})
          </Button>
        </div>
      </div>


      {/* Bulk Actions */}
      {selectedPacks.length > 0 && (
        <div className="flex justify-end">
          <Button variant="destructive" size="sm" onClick={openBulkRejectDialog}>
            <Ban className="w-4 h-4 mr-1" />
            Reject Selected ({selectedPacks.length})
          </Button>
        </div>
      )}

      {/* Packs Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Packs Pending Confirmation</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPacks.length === 0 ? (
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
                      checked={
                        filteredPacks.length > 0 &&
                        filteredPacks.every((p) => selectedPacks.includes(p.id))
                      }
                      onCheckedChange={toggleAllSelection}
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
                {filteredPacks.map((pack) => (
                  <TableRow
                    key={pack.id}
                    className={
                      pack.verificationStatus === "error"
                        ? "bg-destructive/5"
                        : pack.verificationStatus === "verified"
                        ? "bg-primary/5"
                        : ""
                    }
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedPacks.includes(pack.id)}
                        onCheckedChange={() => togglePackSelection(pack.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{pack.gameName}</TableCell>
                    <TableCell>{pack.packNumber}</TableCell>
                    <TableCell>{pack.startTicket}</TableCell>
                    <TableCell>{pack.endTicket}</TableCell>
                    <TableCell className="text-center">{pack.ticketsCount}</TableCell>
                    <TableCell className="text-right">${pack.packValue.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className="text-sm">{pack.deliveryRef}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmPack(pack.id)}
                          className="h-8 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Confirm
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openRejectDialog(pack.id)}
                          className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
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

      {/* Verification Info Card */}
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
            <DialogDescription>
              Please provide a reason for rejecting this pack. This will be recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmReject}>
              Reject Pack
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reject Dialog */}
      <Dialog open={bulkRejectDialogOpen} onOpenChange={setBulkRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject {selectedPacks.length} Packs</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting the selected packs. This will be recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulkReason">Rejection Reason *</Label>
              <Textarea
                id="bulkReason"
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmBulkReject}>
              Reject {selectedPacks.length} Packs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
