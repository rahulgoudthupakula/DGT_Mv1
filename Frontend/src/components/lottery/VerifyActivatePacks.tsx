import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  PlayCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Zap,
  Clock,
  ShieldCheck,
  Loader2,
  Info,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Mock data for confirmed packs (ready for activation)
const mockConfirmedPacks = [
  {
    id: "1",
    gameName: "Powerball",
    gameId: "game-1",
    packNumber: "000001",
    startTicket: "000001001",
    endTicket: "000001050",
    ticketsCount: 50,
    packValue: 100,
    confirmedDate: "2026-01-25T10:30:00",
    confirmedBy: "John Doe",
    gameActive: true,
    alreadyActivated: false,
    ticketsSoldBeforeActivation: false,
  },
  {
    id: "2",
    gameName: "Powerball",
    gameId: "game-1",
    packNumber: "000002",
    startTicket: "000002001",
    endTicket: "000002050",
    ticketsCount: 50,
    packValue: 100,
    confirmedDate: "2026-01-25T10:30:00",
    confirmedBy: "John Doe",
    gameActive: true,
    alreadyActivated: false,
    ticketsSoldBeforeActivation: false,
  },
  {
    id: "3",
    gameName: "Mega Millions",
    gameId: "game-2",
    packNumber: "000003",
    startTicket: "000003001",
    endTicket: "000003050",
    ticketsCount: 50,
    packValue: 100,
    confirmedDate: "2026-01-25T11:00:00",
    confirmedBy: "Jane Smith",
    gameActive: true,
    alreadyActivated: false,
    ticketsSoldBeforeActivation: false,
  },
  {
    id: "4",
    gameName: "Cash 5",
    gameId: "game-3",
    packNumber: "000004",
    startTicket: "000004001",
    endTicket: "000004050",
    ticketsCount: 50,
    packValue: 50,
    confirmedDate: "2026-01-26T09:15:00",
    confirmedBy: "John Doe",
    gameActive: false, // Game inactive - should block activation
    alreadyActivated: false,
    ticketsSoldBeforeActivation: false,
  },
  {
    id: "5",
    gameName: "Pick 3",
    gameId: "game-4",
    packNumber: "000005",
    startTicket: "000005001",
    endTicket: "000005050",
    ticketsCount: 50,
    packValue: 50,
    confirmedDate: "2026-01-26T09:15:00",
    confirmedBy: "Jane Smith",
    gameActive: true,
    alreadyActivated: false,
    ticketsSoldBeforeActivation: false,
  },
  {
    id: "6",
    gameName: "Scratch Off - $5",
    gameId: "game-5",
    packNumber: "000006",
    startTicket: "000006001",
    endTicket: "000006050",
    ticketsCount: 50,
    packValue: 250,
    confirmedDate: "2026-01-26T09:30:00",
    confirmedBy: "Jane Smith",
    gameActive: true,
    alreadyActivated: false,
    ticketsSoldBeforeActivation: true, // Tickets sold before activation - should block
  },
];

interface PackWithActivation {
  id: string;
  gameName: string;
  gameId: string;
  packNumber: string;
  startTicket: string;
  endTicket: string;
  ticketsCount: number;
  packValue: number;
  confirmedDate: string;
  confirmedBy: string;
  gameActive: boolean;
  alreadyActivated: boolean;
  ticketsSoldBeforeActivation: boolean;
  activationStatus: "pending" | "activating" | "activated" | "failed";
  activationConfirmation?: string;
  activatedAt?: string;
  activatedBy?: string;
  activationError?: string;
}

type StatusFilter = "all" | "pending" | "activated" | "failed";

export const VerifyActivatePacks = () => {
  const [packs, setPacks] = useState<PackWithActivation[]>(() =>
    mockConfirmedPacks.map((pack) => ({
      ...pack,
      activationStatus: "pending" as const,
    }))
  );
  const [selectedPacks, setSelectedPacks] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [activationDialogOpen, setActivationDialogOpen] = useState(false);
  const [packToActivate, setPackToActivate] = useState<string | null>(null);
  const [bulkActivationDialogOpen, setBulkActivationDialogOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const currentUser = "John Doe"; // Simulated logged-in user

  // Verification checks
  const getVerificationResult = (pack: PackWithActivation): { canActivate: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (pack.activationStatus === "activated") {
      errors.push("Pack already activated");
    }
    if (!pack.gameActive) {
      errors.push("Game is not active");
    }
    if (pack.alreadyActivated) {
      errors.push("Pack already activated in system");
    }
    if (pack.ticketsSoldBeforeActivation) {
      errors.push("Tickets sold before activation");
    }

    return { canActivate: errors.length === 0, errors };
  };

  // Simulate activation process
  const activatePack = async (packId: string): Promise<{ success: boolean; confirmationNumber?: string; error?: string }> => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulate 90% success rate
    const success = Math.random() > 0.1;
    if (success) {
      return {
        success: true,
        confirmationNumber: `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      };
    }
    return {
      success: false,
      error: "Lottery system connection failed. Please try again.",
    };
  };

  const handleActivatePack = async (packId: string) => {
    const pack = packs.find((p) => p.id === packId);
    if (!pack) return;

    const verification = getVerificationResult(pack);
    if (!verification.canActivate) {
      toast({
        title: "Cannot Activate",
        description: verification.errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    setIsActivating(true);
    setPacks((prev) =>
      prev.map((p) =>
        p.id === packId ? { ...p, activationStatus: "activating" as const } : p
      )
    );

    const result = await activatePack(packId);

    setPacks((prev) =>
      prev.map((p) => {
        if (p.id === packId) {
          if (result.success) {
            return {
              ...p,
              activationStatus: "activated" as const,
              activationConfirmation: result.confirmationNumber,
              activatedAt: new Date().toISOString(),
              activatedBy: currentUser,
            };
          }
          return {
            ...p,
            activationStatus: "failed" as const,
            activationError: result.error,
          };
        }
        return p;
      })
    );

    setIsActivating(false);
    setActivationDialogOpen(false);
    setPackToActivate(null);

    if (result.success) {
      toast({
        title: "Pack Activated",
        description: `Pack ${pack.packNumber} is now sellable. Confirmation: ${result.confirmationNumber}`,
      });
    } else {
      toast({
        title: "Activation Failed",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleBulkActivate = async () => {
    const eligiblePacks = selectedPacks.filter((id) => {
      const pack = packs.find((p) => p.id === id);
      if (!pack) return false;
      return getVerificationResult(pack).canActivate;
    });

    if (eligiblePacks.length === 0) {
      toast({
        title: "No Eligible Packs",
        description: "Selected packs cannot be activated due to verification failures",
        variant: "destructive",
      });
      return;
    }

    setIsActivating(true);
    setBulkActivationDialogOpen(false);

    // Mark all as activating
    setPacks((prev) =>
      prev.map((p) =>
        eligiblePacks.includes(p.id) ? { ...p, activationStatus: "activating" as const } : p
      )
    );

    // Activate one by one
    let successCount = 0;
    let failCount = 0;

    for (const packId of eligiblePacks) {
      const pack = packs.find((p) => p.id === packId);
      if (!pack) continue;

      const result = await activatePack(packId);

      setPacks((prev) =>
        prev.map((p) => {
          if (p.id === packId) {
            if (result.success) {
              successCount++;
              return {
                ...p,
                activationStatus: "activated" as const,
                activationConfirmation: result.confirmationNumber,
                activatedAt: new Date().toISOString(),
                activatedBy: currentUser,
              };
            }
            failCount++;
            return {
              ...p,
              activationStatus: "failed" as const,
              activationError: result.error,
            };
          }
          return p;
        })
      );
    }

    setIsActivating(false);
    setSelectedPacks([]);

    toast({
      title: "Bulk Activation Complete",
      description: `${successCount} activated, ${failCount} failed`,
      variant: failCount > 0 ? "destructive" : "default",
    });
  };

  const openActivationDialog = (packId: string) => {
    setPackToActivate(packId);
    setActivationDialogOpen(true);
  };

  const retryActivation = (packId: string) => {
    setPacks((prev) =>
      prev.map((p) =>
        p.id === packId
          ? { ...p, activationStatus: "pending" as const, activationError: undefined }
          : p
      )
    );
  };

  const togglePackSelection = (id: string) => {
    setSelectedPacks((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    const filteredPackIds = filteredPacks
      .filter((p) => p.activationStatus !== "activated")
      .map((p) => p.id);
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
      pack.packNumber.includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" || pack.activationStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Stats
  const pendingCount = packs.filter((p) => p.activationStatus === "pending").length;
  const activatedCount = packs.filter((p) => p.activationStatus === "activated").length;
  const failedCount = packs.filter((p) => p.activationStatus === "failed").length;
  const activatingCount = packs.filter((p) => p.activationStatus === "activating").length;
  const eligibleForActivation = packs.filter(
    (p) => p.activationStatus === "pending" && getVerificationResult(p).canActivate
  ).length;

  const selectedEligibleCount = selectedPacks.filter((id) => {
    const pack = packs.find((p) => p.id === id);
    return pack && getVerificationResult(pack).canActivate && pack.activationStatus === "pending";
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PlayCircle className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Verify & Activate Packs</h1>
            <p className="text-muted-foreground text-sm">
              Activate confirmed packs before sale
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {selectedEligibleCount > 0 && (
            <Button onClick={() => setBulkActivationDialogOpen(true)} disabled={isActivating}>
              <Zap className="w-4 h-4 mr-1" />
              Activate Selected ({selectedEligibleCount})
            </Button>
          )}
        </div>
      </div>

      {/* Warning Banner */}
      <Card className="bg-accent/50 border-accent">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Point of No Return</p>
              <p className="text-sm text-muted-foreground">
                Once activated, packs become sellable and cannot be returned to pending status. 
                Activated packs will appear in Day/Shift Closing, Pack History, and Settlement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total Packs</p>
            <p className="text-2xl font-bold">{packs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Pending Activation</p>
            <p className="text-2xl font-bold text-muted-foreground">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Eligible to Activate</p>
            <p className="text-2xl font-bold text-primary">{eligibleForActivation}</p>
          </CardContent>
        </Card>
        <Card className={activatedCount > 0 ? "border-primary/50" : ""}>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Activated</p>
            <p className="text-2xl font-bold text-primary">{activatedCount}</p>
          </CardContent>
        </Card>
        <Card className={failedCount > 0 ? "border-destructive/50" : ""}>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Failed</p>
            <p className={`text-2xl font-bold ${failedCount > 0 ? "text-destructive" : ""}`}>
              {failedCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by game or pack number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending Activation</SelectItem>
                  <SelectItem value="activated">Activated</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Packs Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Eligible Packs for Activation</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPacks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <PlayCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No packs available for activation</p>
              <p className="text-sm">Confirm delivery packs first to see them here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        filteredPacks.filter((p) => p.activationStatus !== "activated").length > 0 &&
                        filteredPacks
                          .filter((p) => p.activationStatus !== "activated")
                          .every((p) => selectedPacks.includes(p.id))
                      }
                      onCheckedChange={toggleAllSelection}
                    />
                  </TableHead>
                  <TableHead>Game Name</TableHead>
                  <TableHead>Pack / Book #</TableHead>
                  <TableHead>Start Ticket #</TableHead>
                  <TableHead>End Ticket #</TableHead>
                  <TableHead className="text-right">Pack Value</TableHead>
                  <TableHead>Confirmed Date</TableHead>
                  <TableHead className="text-center">Verification</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPacks.map((pack) => {
                  const verification = getVerificationResult(pack);
                  return (
                    <TableRow
                      key={pack.id}
                      className={
                        pack.activationStatus === "activated"
                          ? "bg-primary/5"
                          : pack.activationStatus === "failed"
                          ? "bg-destructive/5"
                          : !verification.canActivate
                          ? "bg-muted/30"
                          : ""
                      }
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedPacks.includes(pack.id)}
                          onCheckedChange={() => togglePackSelection(pack.id)}
                          disabled={pack.activationStatus === "activated"}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{pack.gameName}</TableCell>
                      <TableCell>{pack.packNumber}</TableCell>
                      <TableCell>{pack.startTicket}</TableCell>
                      <TableCell>{pack.endTicket}</TableCell>
                      <TableCell className="text-right">${pack.packValue.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(pack.confirmedDate), "MMM dd, yyyy")}
                          <span className="text-muted-foreground block text-xs">
                            {format(new Date(pack.confirmedDate), "h:mm a")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {verification.canActivate ? (
                          <Badge className="bg-primary/10 text-primary border-primary/30 hover:bg-primary/20">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <div className="space-y-1">
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit mx-auto">
                              <XCircle className="w-3 h-3" />
                              Blocked
                            </Badge>
                            <div className="text-xs text-destructive max-w-[150px]">
                              {verification.errors.map((err, i) => (
                                <p key={i}>{err}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {pack.activationStatus === "pending" && (
                          <Badge variant="secondary">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                        {pack.activationStatus === "activating" && (
                          <Badge variant="secondary" className="bg-accent">
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Activating...
                          </Badge>
                        )}
                        {pack.activationStatus === "activated" && (
                          <div className="space-y-1">
                            <Badge className="bg-primary text-primary-foreground">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Activated
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              {pack.activationConfirmation}
                            </p>
                          </div>
                        )}
                        {pack.activationStatus === "failed" && (
                          <div className="space-y-1">
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" />
                              Failed
                            </Badge>
                            <p className="text-xs text-destructive max-w-[120px]">
                              {pack.activationError}
                            </p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {pack.activationStatus === "pending" && verification.canActivate && (
                            <Button
                              size="sm"
                              onClick={() => openActivationDialog(pack.id)}
                              disabled={isActivating}
                              className="h-8"
                            >
                              <Zap className="w-4 h-4 mr-1" />
                              Activate
                            </Button>
                          )}
                          {pack.activationStatus === "failed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => retryActivation(pack.id)}
                              className="h-8"
                            >
                              Retry
                            </Button>
                          )}
                          {pack.activationStatus === "activated" && (
                            <span className="text-xs text-muted-foreground">
                              By {pack.activatedBy}
                            </span>
                          )}
                          {pack.activationStatus === "pending" && !verification.canActivate && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Post-Activation Info */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            Post-Activation Behavior
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Once activated, pack becomes <strong>sellable</strong> at POS</li>
            <li>First ticket is marked as "Next to Sell"</li>
            <li>Pack will appear in Day/Shift Closing reports</li>
            <li>Pack will be tracked in Pack History</li>
            <li>Pack will be available for Settlement when closed</li>
          </ul>
        </CardContent>
      </Card>

      {/* Single Activation Dialog */}
      <Dialog open={activationDialogOpen} onOpenChange={setActivationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Confirm Pack Activation
            </DialogTitle>
            <DialogDescription>
              This is the point of no return. Once activated, this pack will become sellable 
              and cannot be returned to pending status.
            </DialogDescription>
          </DialogHeader>
          {packToActivate && (
            <div className="py-4">
              <div className="bg-muted rounded-lg p-4 space-y-2">
                {(() => {
                  const pack = packs.find((p) => p.id === packToActivate);
                  if (!pack) return null;
                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Game:</span>
                        <span className="font-medium">{pack.gameName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pack #:</span>
                        <span className="font-medium">{pack.packNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Value:</span>
                        <span className="font-medium">${pack.packValue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tickets:</span>
                        <span className="font-medium">{pack.startTicket} - {pack.endTicket}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivationDialogOpen(false)} disabled={isActivating}>
              Cancel
            </Button>
            <Button 
              onClick={() => packToActivate && handleActivatePack(packToActivate)} 
              disabled={isActivating}
            >
              {isActivating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-1" />
                  Activate Pack
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Activation Dialog */}
      <Dialog open={bulkActivationDialogOpen} onOpenChange={setBulkActivationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Bulk Pack Activation
            </DialogTitle>
            <DialogDescription>
              You are about to activate {selectedEligibleCount} pack(s). 
              This is the point of no return - all selected packs will become sellable.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActivationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkActivate}>
              <Zap className="w-4 h-4 mr-1" />
              Activate {selectedEligibleCount} Packs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
