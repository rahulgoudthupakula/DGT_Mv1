import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  Package,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  FileText,
  Lock,
} from "lucide-react";

interface SettlementPack {
  id: string;
  gameName: string;
  packNumber: string;
  ticketsSold: number;
  ticketsUnsold: number;
  grossSales: number;
  commission: number;
  netAmountDue: number;
  status: "ready" | "settling" | "settled" | "blocked";
  shiftClosed: boolean;
  hasGaps: boolean;
  settlementRef?: string;
  settledAt?: string;
  settledBy?: string;
}

interface ReturnablePack {
  id: string;
  gameName: string;
  packNumber: string;
  startTicket: string;
  lastSoldTicket: string;
  ticketsRemaining: number;
  packValue: number;
  status: "eligible" | "pending" | "returned" | "settled";
  returnType?: "full" | "partial";
  returnReason?: string;
  returnDate?: string;
  distributorRef?: string;
  approvedBy?: string;
  linkedSettlementId?: string;
}

const mockSettlementPacks: SettlementPack[] = [
  {
    id: "1",
    gameName: "Powerball",
    packNumber: "PB-2024-001",
    ticketsSold: 200,
    ticketsUnsold: 0,
    grossSales: 400,
    commission: 28,
    netAmountDue: 372,
    status: "ready",
    shiftClosed: true,
    hasGaps: false,
  },
  {
    id: "2",
    gameName: "Mega Millions",
    packNumber: "MM-2024-015",
    ticketsSold: 180,
    ticketsUnsold: 20,
    grossSales: 360,
    commission: 25.2,
    netAmountDue: 334.8,
    status: "ready",
    shiftClosed: true,
    hasGaps: false,
  },
  {
    id: "3",
    gameName: "Lucky 7s",
    packNumber: "L7-2024-088",
    ticketsSold: 150,
    ticketsUnsold: 50,
    grossSales: 750,
    commission: 52.5,
    netAmountDue: 697.5,
    status: "blocked",
    shiftClosed: false,
    hasGaps: true,
  },
  {
    id: "4",
    gameName: "Cash Pop",
    packNumber: "CP-2024-042",
    ticketsSold: 100,
    ticketsUnsold: 0,
    grossSales: 200,
    commission: 14,
    netAmountDue: 186,
    status: "settled",
    shiftClosed: true,
    hasGaps: false,
    settlementRef: "SET-2024-0042",
    settledAt: "2024-01-20 14:30",
    settledBy: "John Doe",
  },
];

const mockReturnablePacks: ReturnablePack[] = [
  {
    id: "1",
    gameName: "Scratch & Win",
    packNumber: "SW-2024-033",
    startTicket: "001",
    lastSoldTicket: "075",
    ticketsRemaining: 125,
    packValue: 625,
    status: "eligible",
  },
  {
    id: "2",
    gameName: "Diamond Dazzle",
    packNumber: "DD-2024-019",
    startTicket: "001",
    lastSoldTicket: "000",
    ticketsRemaining: 200,
    packValue: 2000,
    status: "eligible",
  },
  {
    id: "3",
    gameName: "Lucky 7s",
    packNumber: "L7-2024-055",
    startTicket: "001",
    lastSoldTicket: "120",
    ticketsRemaining: 80,
    packValue: 400,
    status: "pending",
    returnType: "partial",
    returnReason: "Low sales",
    returnDate: "2024-01-22",
  },
  {
    id: "4",
    gameName: "Gold Rush",
    packNumber: "GR-2024-011",
    startTicket: "001",
    lastSoldTicket: "000",
    ticketsRemaining: 150,
    packValue: 750,
    status: "returned",
    returnType: "full",
    returnReason: "Game discontinued",
    returnDate: "2024-01-18",
    distributorRef: "RET-2024-0018",
    approvedBy: "Manager",
    linkedSettlementId: "SET-2024-0039",
  },
];

export const SettleReturnPacks = () => {
  const { toast } = useToast();
  const [settlementPacks, setSettlementPacks] = useState<SettlementPack[]>(mockSettlementPacks);
  const [returnablePacks, setReturnablePacks] = useState<ReturnablePack[]>(mockReturnablePacks);
  const [selectedSettlePacks, setSelectedSettlePacks] = useState<string[]>([]);
  const [selectedReturnPacks, setSelectedReturnPacks] = useState<string[]>([]);
  
  // Return dialog state
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [currentReturnPack, setCurrentReturnPack] = useState<ReturnablePack | null>(null);
  const [returnType, setReturnType] = useState<string>("");
  const [returnReason, setReturnReason] = useState<string>("");
  const [distributorRef, setDistributorRef] = useState<string>("");

  const generateSettlementRef = () => {
    return `SET-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  };

  const handleSettlePack = (packId: string) => {
    setSettlementPacks(prev => prev.map(pack => {
      if (pack.id === packId && pack.status === "ready") {
        return {
          ...pack,
          status: "settled" as const,
          settlementRef: generateSettlementRef(),
          settledAt: new Date().toLocaleString(),
          settledBy: "Current User",
        };
      }
      return pack;
    }));
    
    toast({
      title: "Pack Settled",
      description: "Settlement has been finalized and pack is now locked.",
    });
  };

  const handleBulkSettle = () => {
    const eligiblePacks = selectedSettlePacks.filter(id => {
      const pack = settlementPacks.find(p => p.id === id);
      return pack?.status === "ready";
    });

    if (eligiblePacks.length === 0) {
      toast({
        title: "No Eligible Packs",
        description: "Selected packs are not ready for settlement.",
        variant: "destructive",
      });
      return;
    }

    setSettlementPacks(prev => prev.map(pack => {
      if (eligiblePacks.includes(pack.id)) {
        return {
          ...pack,
          status: "settled" as const,
          settlementRef: generateSettlementRef(),
          settledAt: new Date().toLocaleString(),
          settledBy: "Current User",
        };
      }
      return pack;
    }));

    setSelectedSettlePacks([]);
    toast({
      title: "Bulk Settlement Complete",
      description: `${eligiblePacks.length} pack(s) have been settled.`,
    });
  };

  const handleInitiateReturn = (pack: ReturnablePack) => {
    setCurrentReturnPack(pack);
    setReturnType("");
    setReturnReason("");
    setDistributorRef("");
    setReturnDialogOpen(true);
  };

  const handleConfirmReturn = () => {
    if (!currentReturnPack || !returnType || !returnReason) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setReturnablePacks(prev => prev.map(pack => {
      if (pack.id === currentReturnPack.id) {
        return {
          ...pack,
          status: "pending" as const,
          returnType: returnType as "full" | "partial",
          returnReason,
          returnDate: new Date().toISOString().split('T')[0],
          distributorRef: distributorRef || undefined,
        };
      }
      return pack;
    }));

    setReturnDialogOpen(false);
    toast({
      title: "Return Initiated",
      description: "Pack return has been initiated and is pending confirmation.",
    });
  };

  const handleConfirmReturnStatus = (packId: string) => {
    setReturnablePacks(prev => prev.map(pack => {
      if (pack.id === packId && pack.status === "pending") {
        return {
          ...pack,
          status: "returned" as const,
          approvedBy: "Current User",
          linkedSettlementId: generateSettlementRef(),
        };
      }
      return pack;
    }));

    toast({
      title: "Return Confirmed",
      description: "Pack has been marked as returned and moved to settlement.",
    });
  };

  const getSettlementStatusBadge = (pack: SettlementPack) => {
    if (pack.status === "settled") {
      return <Badge className="bg-green-100 text-green-800">Settled</Badge>;
    }
    if (pack.status === "blocked") {
      return <Badge variant="destructive">Blocked</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800">Ready</Badge>;
  };

  const getReturnStatusBadge = (status: ReturnablePack["status"]) => {
    switch (status) {
      case "eligible":
        return <Badge className="bg-blue-100 text-blue-800">Eligible</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "returned":
        return <Badge className="bg-green-100 text-green-800">Returned</Badge>;
      case "settled":
        return <Badge className="bg-purple-100 text-purple-800">Settled</Badge>;
    }
  };

  const getBlockedReason = (pack: SettlementPack) => {
    const reasons: string[] = [];
    if (!pack.shiftClosed) reasons.push("Shift not closed");
    if (pack.hasGaps) reasons.push("Missing ticket ranges");
    return reasons.join(", ");
  };

  const settlementStats = {
    total: settlementPacks.length,
    ready: settlementPacks.filter(p => p.status === "ready").length,
    settled: settlementPacks.filter(p => p.status === "settled").length,
    totalAmount: settlementPacks.filter(p => p.status === "ready").reduce((sum, p) => sum + p.netAmountDue, 0),
  };

  const returnStats = {
    total: returnablePacks.length,
    eligible: returnablePacks.filter(p => p.status === "eligible").length,
    pending: returnablePacks.filter(p => p.status === "pending").length,
    returned: returnablePacks.filter(p => p.status === "returned").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settle & Return Packs</h1>
        <p className="text-muted-foreground">Finalize settlements and handle pack returns</p>
      </div>

      <Tabs defaultValue="settle" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="settle" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Settle Packs
          </TabsTrigger>
          <TabsTrigger value="return" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Return Packs
          </TabsTrigger>
        </TabsList>

        {/* Settle Packs Tab */}
        <TabsContent value="settle" className="space-y-6">
          {/* Settlement Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Packs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{settlementStats.total}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ready to Settle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-500" />
                  <span className="text-2xl font-bold">{settlementStats.ready}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Settled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">{settlementStats.settled}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">${settlementStats.totalAmount.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bulk Actions */}
          {selectedSettlePacks.length > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedSettlePacks.length} pack(s) selected
                  </span>
                  <Button onClick={handleBulkSettle} size="sm">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Bulk Settle
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Settlement Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Eligible Packs for Settlement</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedSettlePacks.length === settlementPacks.filter(p => p.status === "ready").length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSettlePacks(settlementPacks.filter(p => p.status === "ready").map(p => p.id));
                          } else {
                            setSelectedSettlePacks([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Game Name</TableHead>
                    <TableHead>Pack / Book #</TableHead>
                    <TableHead className="text-right">Tickets Sold</TableHead>
                    <TableHead className="text-right">Tickets Unsold</TableHead>
                    <TableHead className="text-right">Gross Sales</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Net Amount Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlementPacks.map((pack) => (
                    <TableRow key={pack.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedSettlePacks.includes(pack.id)}
                          disabled={pack.status !== "ready"}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSettlePacks(prev => [...prev, pack.id]);
                            } else {
                              setSelectedSettlePacks(prev => prev.filter(id => id !== pack.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{pack.gameName}</TableCell>
                      <TableCell>{pack.packNumber}</TableCell>
                      <TableCell className="text-right">{pack.ticketsSold}</TableCell>
                      <TableCell className="text-right">{pack.ticketsUnsold}</TableCell>
                      <TableCell className="text-right">${pack.grossSales.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-green-600">${pack.commission.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">${pack.netAmountDue.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getSettlementStatusBadge(pack)}
                          {pack.status === "blocked" && (
                            <p className="text-xs text-destructive">{getBlockedReason(pack)}</p>
                          )}
                          {pack.status === "settled" && (
                            <p className="text-xs text-muted-foreground">Ref: {pack.settlementRef}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {pack.status === "ready" && (
                          <Button size="sm" onClick={() => handleSettlePack(pack.id)}>
                            <DollarSign className="h-4 w-4 mr-1" />
                            Settle
                          </Button>
                        )}
                        {pack.status === "settled" && (
                          <Button size="sm" variant="outline" disabled>
                            <Lock className="h-4 w-4 mr-1" />
                            Locked
                          </Button>
                        )}
                        {pack.status === "blocked" && (
                          <Button size="sm" variant="ghost" disabled>
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Blocked
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Return Packs Tab */}
        <TabsContent value="return" className="space-y-6">
          {/* Return Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Packs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{returnStats.total}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Eligible for Return</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-blue-500" />
                  <span className="text-2xl font-bold">{returnStats.eligible}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Return</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span className="text-2xl font-bold">{returnStats.pending}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Returned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">{returnStats.returned}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Returnable Packs Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Returnable Packs</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Game Name</TableHead>
                    <TableHead>Pack / Book #</TableHead>
                    <TableHead>Start Ticket #</TableHead>
                    <TableHead>Last Sold Ticket #</TableHead>
                    <TableHead className="text-right">Tickets Remaining</TableHead>
                    <TableHead className="text-right">Pack Value</TableHead>
                    <TableHead>Return Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returnablePacks.map((pack) => (
                    <TableRow key={pack.id}>
                      <TableCell className="font-medium">{pack.gameName}</TableCell>
                      <TableCell>{pack.packNumber}</TableCell>
                      <TableCell>{pack.startTicket}</TableCell>
                      <TableCell>{pack.lastSoldTicket === "000" ? "N/A" : pack.lastSoldTicket}</TableCell>
                      <TableCell className="text-right">{pack.ticketsRemaining}</TableCell>
                      <TableCell className="text-right">${pack.packValue.toFixed(2)}</TableCell>
                      <TableCell>
                        {pack.returnReason ? (
                          <div className="space-y-1">
                            <Badge variant="outline">{pack.returnType === "full" ? "Full Pack" : "Partial"}</Badge>
                            <p className="text-xs text-muted-foreground">{pack.returnReason}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getReturnStatusBadge(pack.status)}
                          {pack.distributorRef && (
                            <p className="text-xs text-muted-foreground">Ref: {pack.distributorRef}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {pack.status === "eligible" && (
                            <Button size="sm" onClick={() => handleInitiateReturn(pack)}>
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Initiate
                            </Button>
                          )}
                          {pack.status === "pending" && (
                            <Button size="sm" variant="outline" onClick={() => handleConfirmReturnStatus(pack.id)}>
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Confirm
                            </Button>
                          )}
                          {pack.status === "returned" && (
                            <Button size="sm" variant="ghost" disabled>
                              <FileText className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Return Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Initiate Pack Return</DialogTitle>
            <DialogDescription>
              {currentReturnPack && (
                <span>
                  Return {currentReturnPack.gameName} - Pack #{currentReturnPack.packNumber}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Return Type *</Label>
              <Select value={returnType} onValueChange={setReturnType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select return type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Pack</SelectItem>
                  <SelectItem value="partial">Partial Pack</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Select value={returnReason} onValueChange={setReturnReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Game discontinued">Game discontinued</SelectItem>
                  <SelectItem value="Low sales">Low sales</SelectItem>
                  <SelectItem value="Damaged">Damaged</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Distributor Reference # (Optional)</Label>
              <Input
                value={distributorRef}
                onChange={(e) => setDistributorRef(e.target.value)}
                placeholder="Enter reference number"
              />
            </div>
            {currentReturnPack && (
              <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
                <p><span className="font-medium">Tickets Remaining:</span> {currentReturnPack.ticketsRemaining}</p>
                <p><span className="font-medium">Pack Value:</span> ${currentReturnPack.packValue.toFixed(2)}</p>
                <p><span className="font-medium">Return Date:</span> {new Date().toLocaleDateString()}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmReturn}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Initiate Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
