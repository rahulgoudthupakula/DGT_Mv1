import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/ui/table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  FileText,
  Download,
  CheckCircle,
  Clock,
  Send,
  CreditCard,
  Lock,
  Calendar,
  Building,
  User,
  Hash,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Package,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface GameBreakdown {
  gameName: string;
  grossSales: number;
  commission: number;
  returns: number;
  netAmount: number;
}

interface Settlement {
  id: string;
  referenceNumber: string;
  periodType: "Daily" | "Weekly" | "Custom";
  startDate: string;
  endDate: string;
  distributor: string;
  status: "Draft" | "Submitted" | "Paid" | "Closed";
  totalSales: number;
  totalCommission: number;
  totalReturns: number;
  netAmount: number;
  packsSettled: number;
  paymentMethod: "ACH" | "Check" | null;
  createdBy: string;
  createdAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  gameBreakdown: GameBreakdown[];
}

const mockSettlements: Settlement[] = [
  {
    id: "1",
    referenceNumber: "SET-2025-001",
    periodType: "Weekly",
    startDate: "2025-01-13",
    endDate: "2025-01-19",
    distributor: "State Lottery Commission",
    status: "Paid",
    totalSales: 8500.00,
    totalCommission: 510.00,
    totalReturns: 250.00,
    netAmount: 7740.00,
    packsSettled: 15,
    paymentMethod: "ACH",
    createdBy: "Admin",
    createdAt: "2025-01-20 09:00 AM",
    approvedBy: "Manager",
    approvedAt: "2025-01-20 10:00 AM",
    paidAt: "2025-01-21 02:00 PM",
    gameBreakdown: [
      { gameName: "Mega Millions", grossSales: 3600.00, commission: 216.00, returns: 0, netAmount: 3384.00 },
      { gameName: "Powerball", grossSales: 2400.00, commission: 144.00, returns: 0, netAmount: 2256.00 },
      { gameName: "Lucky 7s", grossSales: 1500.00, commission: 105.00, returns: 250.00, netAmount: 1145.00 },
      { gameName: "Cash Blast", grossSales: 1000.00, commission: 80.00, returns: 0, netAmount: 920.00 },
    ],
  },
  {
    id: "2",
    referenceNumber: "SET-2025-002",
    periodType: "Weekly",
    startDate: "2025-01-20",
    endDate: "2025-01-26",
    distributor: "State Lottery Commission",
    status: "Submitted",
    totalSales: 6200.00,
    totalCommission: 372.00,
    totalReturns: 0,
    netAmount: 5828.00,
    packsSettled: 12,
    paymentMethod: null,
    createdBy: "Admin",
    createdAt: "2025-01-26 09:00 AM",
    approvedBy: null,
    approvedAt: null,
    paidAt: null,
    gameBreakdown: [
      { gameName: "Mega Millions", grossSales: 2800.00, commission: 168.00, returns: 0, netAmount: 2632.00 },
      { gameName: "Powerball", grossSales: 1800.00, commission: 108.00, returns: 0, netAmount: 1692.00 },
      { gameName: "Lucky 7s", grossSales: 1000.00, commission: 70.00, returns: 0, netAmount: 930.00 },
      { gameName: "Cash Blast", grossSales: 600.00, commission: 48.00, returns: 0, netAmount: 552.00 },
    ],
  },
  {
    id: "3",
    referenceNumber: "",
    periodType: "Daily",
    startDate: "2025-01-26",
    endDate: "2025-01-26",
    distributor: "State Lottery Commission",
    status: "Draft",
    totalSales: 1450.00,
    totalCommission: 87.00,
    totalReturns: 0,
    netAmount: 1363.00,
    packsSettled: 4,
    paymentMethod: null,
    createdBy: "System",
    createdAt: "2025-01-26 11:00 PM",
    approvedBy: null,
    approvedAt: null,
    paidAt: null,
    gameBreakdown: [
      { gameName: "Mega Millions", grossSales: 600.00, commission: 36.00, returns: 0, netAmount: 564.00 },
      { gameName: "Powerball", grossSales: 400.00, commission: 24.00, returns: 0, netAmount: 376.00 },
      { gameName: "Quick Pick", grossSales: 450.00, commission: 22.50, returns: 0, netAmount: 427.50 },
    ],
  },
];

const distributors = ["State Lottery Commission", "Multi-State Lottery", "PowerBall Corp"];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Draft":
      return "bg-muted text-muted-foreground";
    case "Submitted":
      return "bg-primary/20 text-primary";
    case "Paid":
      return "bg-accent text-accent-foreground";
    case "Closed":
      return "bg-secondary text-secondary-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Draft":
      return <FileText className="h-4 w-4" />;
    case "Submitted":
      return <Send className="h-4 w-4" />;
    case "Paid":
      return <CheckCircle className="h-4 w-4" />;
    case "Closed":
      return <Lock className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

export function LotterySettlement() {
  const [settlements, setSettlements] = useState<Settlement[]>(mockSettlements);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"ACH" | "Check">("ACH");

  // Filters for new settlement
  const [periodType, setPeriodType] = useState<"Daily" | "Weekly" | "Custom">("Weekly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [distributor, setDistributor] = useState("State Lottery Commission");

  const pendingSettlements = settlements.filter((s) => s.status === "Draft" || s.status === "Submitted");
  const completedSettlements = settlements.filter((s) => s.status === "Paid" || s.status === "Closed");

  const totalPending = pendingSettlements.reduce((sum, s) => sum + s.netAmount, 0);
  const totalPaid = completedSettlements.reduce((sum, s) => sum + s.netAmount, 0);
  const totalCommission = settlements.reduce((sum, s) => sum + s.totalCommission, 0);

  const [pageSizePending, setPageSizePending] = useState(10);
  const [pageSizeCompleted, setPageSizeCompleted] = useState(10);
  const { paginated: paginatedPending, page: pagePending, totalPages: totalPagesPending, totalItems: totalItemsPending, hasPrev: hasPrevPending, hasNext: hasNextPending, prevPage: prevPending, nextPage: nextPending } = usePagination(pendingSettlements, pageSizePending);
  const { paginated: paginatedCompleted, page: pageCompleted, totalPages: totalPagesCompleted, totalItems: totalItemsCompleted, hasPrev: hasPrevCompleted, hasNext: hasNextCompleted, prevPage: prevCompleted, nextPage: nextCompleted } = usePagination(completedSettlements, pageSizeCompleted);

  const handleViewDetails = (settlement: Settlement) => {
    setSelectedSettlement(settlement);
    setIsDetailOpen(true);
  };

  const handleGenerateSettlement = () => {
    if (!startDate || !endDate) {
      toast({ title: "Error", description: "Please select date range", variant: "destructive" });
      return;
    }

    const newSettlement: Settlement = {
      id: Date.now().toString(),
      referenceNumber: "",
      periodType,
      startDate,
      endDate,
      distributor,
      status: "Draft",
      totalSales: 2500.00,
      totalCommission: 150.00,
      totalReturns: 0,
      netAmount: 2350.00,
      packsSettled: 5,
      paymentMethod: null,
      createdBy: "Admin",
      createdAt: new Date().toLocaleString(),
      approvedBy: null,
      approvedAt: null,
      paidAt: null,
      gameBreakdown: [
        { gameName: "Mega Millions", grossSales: 1200.00, commission: 72.00, returns: 0, netAmount: 1128.00 },
        { gameName: "Powerball", grossSales: 800.00, commission: 48.00, returns: 0, netAmount: 752.00 },
        { gameName: "Quick Pick", grossSales: 500.00, commission: 25.00, returns: 0, netAmount: 475.00 },
      ],
    };

    setSettlements([newSettlement, ...settlements]);
    toast({ title: "Settlement Generated", description: "Draft settlement created successfully" });
  };

  const handleSubmitSettlement = (settlement: Settlement) => {
    const refNumber = `SET-2025-${String(settlements.length + 1).padStart(3, "0")}`;
    setSettlements(settlements.map((s) =>
      s.id === settlement.id
        ? {
            ...s,
            status: "Submitted" as const,
            referenceNumber: refNumber,
            approvedBy: "Admin",
            approvedAt: new Date().toLocaleString(),
          }
        : s
    ));
    toast({ title: "Settlement Submitted", description: `Reference: ${refNumber}` });
    setIsDetailOpen(false);
  };

  const handleMarkPaid = (settlement: Settlement) => {
    setSelectedSettlement(settlement);
    setIsPaymentDialogOpen(true);
  };

  const confirmPayment = () => {
    if (!selectedSettlement) return;

    setSettlements(settlements.map((s) =>
      s.id === selectedSettlement.id
        ? {
            ...s,
            status: "Paid" as const,
            paymentMethod,
            paidAt: new Date().toLocaleString(),
          }
        : s
    ));
    toast({ title: "Payment Recorded", description: `Settlement marked as paid via ${paymentMethod}` });
    setIsPaymentDialogOpen(false);
    setIsDetailOpen(false);
  };

  const handleExport = (settlement: Settlement, format: "PDF" | "CSV") => {
    toast({ title: "Export", description: `Exporting settlement ${settlement.referenceNumber || "Draft"} as ${format}...` });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lottery Settlement</h1>
        <p className="text-muted-foreground">Financial reconciliation with lottery distributor</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Settlement</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              {pendingSettlements.length} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${totalPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowDownRight className="h-3 w-3" />
              {completedSettlements.length} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${totalCommission.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Settlements</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settlements.length}</div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>
      </div>

      {/* New Settlement Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Generate New Settlement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label>Period Type</Label>
              <Select value={periodType} onValueChange={(v) => setPeriodType(v as "Daily" | "Weekly" | "Custom")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Distributor</Label>
              <Select value={distributor} onValueChange={setDistributor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {distributors.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="invisible">Action</Label>
              <Button onClick={handleGenerateSettlement} className="w-full">
                Generate Settlement
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settlements Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingSettlements.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedSettlements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Settlements</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference #</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Distributor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total Sales</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Net Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingSettlements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No pending settlements</TableCell>
                    </TableRow>
                  ) : (
                    paginatedPending.map((settlement) => (
                      <TableRow key={settlement.id}>
                        <TableCell>
                          {settlement.referenceNumber ? (
                            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{settlement.referenceNumber}</code>
                          ) : (
                            <span className="text-muted-foreground text-xs">Draft</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{settlement.periodType}<div className="text-xs text-muted-foreground">{settlement.startDate} - {settlement.endDate}</div></div>
                        </TableCell>
                        <TableCell>{settlement.distributor}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(settlement.status)}>
                            {getStatusIcon(settlement.status)}
                            <span className="ml-1">{settlement.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">${settlement.totalSales.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-primary">${settlement.totalCommission.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">${settlement.netAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleViewDetails(settlement)}>View</Button>
                            {settlement.status === "Draft" && (
                              <Button size="sm" onClick={() => handleSubmitSettlement(settlement)}>
                                <Send className="h-4 w-4 mr-1" /> Submit
                              </Button>
                            )}
                            {settlement.status === "Submitted" && (
                              <Button size="sm" onClick={() => handleMarkPaid(settlement)}>
                                <CreditCard className="h-4 w-4 mr-1" /> Mark Paid
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                page={pagePending} totalPages={totalPagesPending} totalItems={totalItemsPending} pageSize={pageSizePending}
                hasPrev={hasPrevPending} hasNext={hasNextPending} onPrev={prevPending} onNext={nextPending}
                onPageSizeChange={(s) => setPageSizePending(s)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Settlements</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference #</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Distributor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Net Amount</TableHead>
                    <TableHead>Paid On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedSettlements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No completed settlements</TableCell>
                    </TableRow>
                  ) : (
                    paginatedCompleted.map((settlement) => (
                      <TableRow key={settlement.id}>
                        <TableCell><code className="bg-muted px-1.5 py-0.5 rounded text-xs">{settlement.referenceNumber}</code></TableCell>
                        <TableCell><div className="text-sm">{settlement.periodType}<div className="text-xs text-muted-foreground">{settlement.startDate} - {settlement.endDate}</div></div></TableCell>
                        <TableCell>{settlement.distributor}</TableCell>
                        <TableCell><Badge className={getStatusColor(settlement.status)}>{getStatusIcon(settlement.status)}<span className="ml-1">{settlement.status}</span></Badge></TableCell>
                        <TableCell><Badge variant="outline">{settlement.paymentMethod}</Badge></TableCell>
                        <TableCell className="text-right font-medium">${settlement.netAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{settlement.paidAt}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleViewDetails(settlement)}>View</Button>
                            <Button variant="ghost" size="sm" onClick={() => handleExport(settlement, "PDF")}><Download className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                page={pageCompleted} totalPages={totalPagesCompleted} totalItems={totalItemsCompleted} pageSize={pageSizeCompleted}
                hasPrev={hasPrevCompleted} hasNext={hasNextCompleted} onPrev={prevCompleted} onNext={nextCompleted}
                onPageSizeChange={(s) => setPageSizeCompleted(s)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Settlement Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Settlement Details
            </DialogTitle>
            <DialogDescription>
              {selectedSettlement?.referenceNumber || "Draft Settlement"}
            </DialogDescription>
          </DialogHeader>

          {selectedSettlement && (
            <div className="space-y-6">
              {/* Settlement Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Hash className="h-3 w-3" /> Reference
                  </p>
                  <p className="font-medium">{selectedSettlement.referenceNumber || "Not assigned"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Period
                  </p>
                  <p className="font-medium">{selectedSettlement.periodType}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedSettlement.startDate} - {selectedSettlement.endDate}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building className="h-3 w-3" /> Distributor
                  </p>
                  <p className="font-medium">{selectedSettlement.distributor}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedSettlement.status)}>
                    {getStatusIcon(selectedSettlement.status)}
                    <span className="ml-1">{selectedSettlement.status}</span>
                  </Badge>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total Sales</p>
                  <p className="text-lg font-bold">${selectedSettlement.totalSales.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Commission</p>
                  <p className="text-lg font-bold text-primary">${selectedSettlement.totalCommission.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Returns</p>
                  <p className="text-lg font-bold">${selectedSettlement.totalReturns.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Net Amount</p>
                  <p className="text-lg font-bold">${selectedSettlement.netAmount.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Packs Settled</p>
                  <p className="text-lg font-bold">{selectedSettlement.packsSettled}</p>
                </div>
              </div>

              {/* Game Breakdown Table */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Settlement Breakdown by Game
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Game Name</TableHead>
                      <TableHead className="text-right">Gross Sales</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">Returns</TableHead>
                      <TableHead className="text-right">Net Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSettlement.gameBreakdown.map((game, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{game.gameName}</TableCell>
                        <TableCell className="text-right">${game.grossSales.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-primary">${game.commission.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${game.returns.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">${game.netAmount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Audit Trail */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Audit Trail
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Created By</p>
                    <p className="font-medium">{selectedSettlement.createdBy}</p>
                    <p className="text-xs text-muted-foreground">{selectedSettlement.createdAt}</p>
                  </div>
                  {selectedSettlement.approvedBy && (
                    <div>
                      <p className="text-muted-foreground">Approved By</p>
                      <p className="font-medium">{selectedSettlement.approvedBy}</p>
                      <p className="text-xs text-muted-foreground">{selectedSettlement.approvedAt}</p>
                    </div>
                  )}
                  {selectedSettlement.paidAt && (
                    <div>
                      <p className="text-muted-foreground">Paid On</p>
                      <p className="font-medium">{selectedSettlement.paymentMethod}</p>
                      <p className="text-xs text-muted-foreground">{selectedSettlement.paidAt}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <div className="flex gap-2 w-full justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleExport(selectedSettlement!, "CSV")}>
                  <Download className="h-4 w-4 mr-1" />
                  CSV
                </Button>
                <Button variant="outline" onClick={() => handleExport(selectedSettlement!, "PDF")}>
                  <FileText className="h-4 w-4 mr-1" />
                  PDF
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                  Close
                </Button>
                {selectedSettlement?.status === "Draft" && (
                  <Button onClick={() => handleSubmitSettlement(selectedSettlement)}>
                    <Send className="h-4 w-4 mr-1" />
                    Submit Settlement
                  </Button>
                )}
                {selectedSettlement?.status === "Submitted" && (
                  <Button onClick={() => handleMarkPaid(selectedSettlement)}>
                    <CreditCard className="h-4 w-4 mr-1" />
                    Mark as Paid
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Method Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Select the payment method for this settlement
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "ACH" | "Check")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  <SelectItem value="ACH">ACH Transfer</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedSettlement && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Amount to be paid:</p>
                <p className="text-2xl font-bold">${selectedSettlement.netAmount.toFixed(2)}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmPayment}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
