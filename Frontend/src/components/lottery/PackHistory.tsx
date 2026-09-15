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
import {
  History,
  Search,
  Download,
  FileText,
  ExternalLink,
  Package,
  CheckCircle,
  Clock,
  ArrowRight,
  User,
  Calendar,
  Hash,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TimelineEvent {
  status: string;
  date: string;
  time: string;
  user: string;
  referenceId: string;
  referenceType: "delivery" | "activation" | "shift" | "settlement" | "return" | null;
}

interface PackRecord {
  id: string;
  gameName: string;
  packNumber: string;
  startTicket: string;
  endTicket: string;
  currentStatus: "Received" | "Confirmed" | "Activated" | "Selling" | "Closed" | "Returned" | "Settled";
  ticketsSold: number;
  ticketsRemaining: number;
  grossSales: number;
  commission: number;
  netAmount: number;
  lastActionDate: string;
  timeline: TimelineEvent[];
}

const mockPacks: PackRecord[] = [
  {
    id: "1",
    gameName: "Mega Millions",
    packNumber: "MM-2025-001",
    startTicket: "000",
    endTicket: "299",
    currentStatus: "Settled",
    ticketsSold: 300,
    ticketsRemaining: 0,
    grossSales: 600.00,
    commission: 36.00,
    netAmount: 564.00,
    lastActionDate: "2025-01-20",
    timeline: [
      { status: "Received", date: "2025-01-05", time: "09:15 AM", user: "John Smith", referenceId: "DEL-2025-001", referenceType: "delivery" },
      { status: "Confirmed", date: "2025-01-05", time: "10:30 AM", user: "John Smith", referenceId: "DEL-2025-001", referenceType: "delivery" },
      { status: "Activated", date: "2025-01-05", time: "11:00 AM", user: "John Smith", referenceId: "ACT-MM-001", referenceType: "activation" },
      { status: "Sales Started", date: "2025-01-05", time: "11:05 AM", user: "System", referenceId: "N/A", referenceType: null },
      { status: "Shift Closing", date: "2025-01-10", time: "10:00 PM", user: "Mary Johnson", referenceId: "SHF-2025-010", referenceType: "shift" },
      { status: "Shift Closing", date: "2025-01-15", time: "10:00 PM", user: "John Smith", referenceId: "SHF-2025-015", referenceType: "shift" },
      { status: "Closed", date: "2025-01-18", time: "10:00 PM", user: "Mary Johnson", referenceId: "SHF-2025-018", referenceType: "shift" },
      { status: "Settled", date: "2025-01-20", time: "02:00 PM", user: "Admin", referenceId: "SET-2025-001", referenceType: "settlement" },
    ],
  },
  {
    id: "2",
    gameName: "Powerball",
    packNumber: "PB-2025-003",
    startTicket: "000",
    endTicket: "299",
    currentStatus: "Selling",
    ticketsSold: 145,
    ticketsRemaining: 155,
    grossSales: 290.00,
    commission: 17.40,
    netAmount: 272.60,
    lastActionDate: "2025-01-25",
    timeline: [
      { status: "Received", date: "2025-01-15", time: "09:00 AM", user: "John Smith", referenceId: "DEL-2025-008", referenceType: "delivery" },
      { status: "Confirmed", date: "2025-01-15", time: "09:45 AM", user: "John Smith", referenceId: "DEL-2025-008", referenceType: "delivery" },
      { status: "Activated", date: "2025-01-15", time: "10:00 AM", user: "John Smith", referenceId: "ACT-PB-003", referenceType: "activation" },
      { status: "Sales Started", date: "2025-01-15", time: "10:05 AM", user: "System", referenceId: "N/A", referenceType: null },
      { status: "Shift Closing", date: "2025-01-20", time: "10:00 PM", user: "Mary Johnson", referenceId: "SHF-2025-020", referenceType: "shift" },
    ],
  },
  {
    id: "3",
    gameName: "Lucky 7s",
    packNumber: "L7-2025-002",
    startTicket: "000",
    endTicket: "149",
    currentStatus: "Returned",
    ticketsSold: 50,
    ticketsRemaining: 100,
    grossSales: 250.00,
    commission: 17.50,
    netAmount: 232.50,
    lastActionDate: "2025-01-22",
    timeline: [
      { status: "Received", date: "2025-01-08", time: "09:30 AM", user: "Mary Johnson", referenceId: "DEL-2025-003", referenceType: "delivery" },
      { status: "Confirmed", date: "2025-01-08", time: "10:00 AM", user: "Mary Johnson", referenceId: "DEL-2025-003", referenceType: "delivery" },
      { status: "Activated", date: "2025-01-08", time: "10:30 AM", user: "Mary Johnson", referenceId: "ACT-L7-002", referenceType: "activation" },
      { status: "Sales Started", date: "2025-01-08", time: "10:35 AM", user: "System", referenceId: "N/A", referenceType: null },
      { status: "Shift Closing", date: "2025-01-15", time: "10:00 PM", user: "John Smith", referenceId: "SHF-2025-015", referenceType: "shift" },
      { status: "Returned", date: "2025-01-22", time: "11:00 AM", user: "Admin", referenceId: "RET-2025-001", referenceType: "return" },
    ],
  },
  {
    id: "4",
    gameName: "Cash Blast",
    packNumber: "CB-2025-001",
    startTicket: "000",
    endTicket: "099",
    currentStatus: "Activated",
    ticketsSold: 0,
    ticketsRemaining: 100,
    grossSales: 0,
    commission: 0,
    netAmount: 0,
    lastActionDate: "2025-01-24",
    timeline: [
      { status: "Received", date: "2025-01-23", time: "09:00 AM", user: "John Smith", referenceId: "DEL-2025-012", referenceType: "delivery" },
      { status: "Confirmed", date: "2025-01-23", time: "09:30 AM", user: "John Smith", referenceId: "DEL-2025-012", referenceType: "delivery" },
      { status: "Activated", date: "2025-01-24", time: "10:00 AM", user: "John Smith", referenceId: "ACT-CB-001", referenceType: "activation" },
    ],
  },
  {
    id: "5",
    gameName: "Mega Millions",
    packNumber: "MM-2025-005",
    startTicket: "000",
    endTicket: "299",
    currentStatus: "Confirmed",
    ticketsSold: 0,
    ticketsRemaining: 300,
    grossSales: 0,
    commission: 0,
    netAmount: 0,
    lastActionDate: "2025-01-25",
    timeline: [
      { status: "Received", date: "2025-01-25", time: "09:00 AM", user: "Mary Johnson", referenceId: "DEL-2025-015", referenceType: "delivery" },
      { status: "Confirmed", date: "2025-01-25", time: "09:45 AM", user: "Mary Johnson", referenceId: "DEL-2025-015", referenceType: "delivery" },
    ],
  },
  {
    id: "6",
    gameName: "Quick Pick",
    packNumber: "QP-2025-001",
    startTicket: "000",
    endTicket: "499",
    currentStatus: "Received",
    ticketsSold: 0,
    ticketsRemaining: 500,
    grossSales: 0,
    commission: 0,
    netAmount: 0,
    lastActionDate: "2025-01-26",
    timeline: [
      { status: "Received", date: "2025-01-26", time: "09:00 AM", user: "John Smith", referenceId: "DEL-2025-018", referenceType: "delivery" },
    ],
  },
];

const games = ["All Games", "Mega Millions", "Powerball", "Lucky 7s", "Cash Blast", "Quick Pick"];
const statuses = ["All Statuses", "Received", "Confirmed", "Activated", "Selling", "Closed", "Returned", "Settled"];
const users = ["All Users", "John Smith", "Mary Johnson", "Admin", "System"];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Received":
      return "bg-muted text-muted-foreground";
    case "Confirmed":
      return "bg-secondary text-secondary-foreground";
    case "Activated":
      return "bg-primary/20 text-primary";
    case "Selling":
      return "bg-primary text-primary-foreground";
    case "Closed":
      return "bg-muted text-muted-foreground";
    case "Returned":
      return "bg-destructive/20 text-destructive";
    case "Settled":
      return "bg-accent text-accent-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export function PackHistory() {
  const [packs] = useState<PackRecord[]>(mockPacks);
  const [selectedPack, setSelectedPack] = useState<PackRecord | null>(null);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  
  // Filters
  const [gameFilter, setGameFilter] = useState("All Games");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [userFilter, setUserFilter] = useState("All Users");
  const [packNumberFilter, setPackNumberFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredPacks = packs.filter((pack) => {
    if (gameFilter !== "All Games" && pack.gameName !== gameFilter) return false;
    if (statusFilter !== "All Statuses" && pack.currentStatus !== statusFilter) return false;
    if (packNumberFilter && !pack.packNumber.toLowerCase().includes(packNumberFilter.toLowerCase())) return false;
    if (startDate && pack.lastActionDate < startDate) return false;
    if (endDate && pack.lastActionDate > endDate) return false;
    if (userFilter !== "All Users") {
      const hasUser = pack.timeline.some((event) => event.user === userFilter);
      if (!hasUser) return false;
    }
    return true;
  });

  const handleViewTimeline = (pack: PackRecord) => {
    setSelectedPack(pack);
    setIsTimelineOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ["Game Name", "Pack Number", "Start Ticket", "End Ticket", "Status", "Tickets Sold", "Tickets Remaining", "Gross Sales", "Commission", "Net Amount", "Last Action Date"];
    const rows = filteredPacks.map((pack) => [
      pack.gameName,
      pack.packNumber,
      pack.startTicket,
      pack.endTicket,
      pack.currentStatus,
      pack.ticketsSold,
      pack.ticketsRemaining,
      pack.grossSales.toFixed(2),
      pack.commission.toFixed(2),
      pack.netAmount.toFixed(2),
      pack.lastActionDate,
    ]);
    
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pack-history-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Exported", description: "Pack history exported to CSV" });
  };

  const handlePrintReport = () => {
    toast({ title: "Print", description: "Preparing audit report for printing..." });
    window.print();
  };

  const clearFilters = () => {
    setGameFilter("All Games");
    setStatusFilter("All Statuses");
    setUserFilter("All Users");
    setPackNumberFilter("");
    setStartDate("");
    setEndDate("");
  };

  const totalGrossSales = filteredPacks.reduce((sum, p) => sum + p.grossSales, 0);
  const totalCommission = filteredPacks.reduce((sum, p) => sum + p.commission, 0);
  const totalNetAmount = filteredPacks.reduce((sum, p) => sum + p.netAmount, 0);

  const { paginated: paginatedPacks, page, totalPages, totalItems, hasPrev, hasNext, prevPage, nextPage } = usePagination(filteredPacks, pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pack History</h1>
          <p className="text-muted-foreground">Complete audit trail for all lottery packs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handlePrintReport}>
            <FileText className="h-4 w-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div className="space-y-2">
              <Label>Game</Label>
              <Select value={gameFilter} onValueChange={setGameFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {games.map((game) => (
                    <SelectItem key={game} value={game}>{game}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pack / Book Number</Label>
              <Input
                placeholder="Search pack #..."
                value={packNumberFilter}
                onChange={(e) => setPackNumberFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
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
              <Label>User</Label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {users.map((user) => (
                    <SelectItem key={user} value={user}>{user}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Packs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPacks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Sales</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalGrossSales.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${totalCommission.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Amount</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalNetAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pack History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pack Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Game Name</TableHead>
                <TableHead>Pack / Book #</TableHead>
                <TableHead>Start Ticket</TableHead>
                <TableHead>End Ticket</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Sold</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead className="text-right">Gross Sales</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">Net Amount</TableHead>
                <TableHead>Last Action</TableHead>
                <TableHead className="text-right">Timeline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPacks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                    No packs found matching the filters
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPacks.map((pack) => (
                  <TableRow key={pack.id}>
                    <TableCell className="font-medium">{pack.gameName}</TableCell>
                    <TableCell>
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{pack.packNumber}</code>
                    </TableCell>
                    <TableCell>{pack.startTicket}</TableCell>
                    <TableCell>{pack.endTicket}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(pack.currentStatus)}>{pack.currentStatus}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{pack.ticketsSold}</TableCell>
                    <TableCell className="text-right">{pack.ticketsRemaining}</TableCell>
                    <TableCell className="text-right">${pack.grossSales.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${pack.commission.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">${pack.netAmount.toFixed(2)}</TableCell>
                    <TableCell>{pack.lastActionDate}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleViewTimeline(pack)}>
                        <History className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize}
            hasPrev={hasPrev} hasNext={hasNext} onPrev={prevPage} onNext={nextPage}
            onPageSizeChange={(s) => setPageSize(s)}
          />
        </CardContent>
      </Card>

      {/* Timeline Dialog */}
      <Dialog open={isTimelineOpen} onOpenChange={setIsTimelineOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Pack Timeline
            </DialogTitle>
            <DialogDescription>
              Complete audit trail for pack {selectedPack?.packNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedPack && (
            <div className="space-y-6">
              {/* Pack Summary */}
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Game</p>
                    <p className="font-medium">{selectedPack.gameName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pack Number</p>
                    <p className="font-medium">{selectedPack.packNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Current Status</p>
                    <Badge className={getStatusColor(selectedPack.currentStatus)}>
                      {selectedPack.currentStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="relative">
                {selectedPack.timeline.map((event, index) => (
                  <div key={index} className="flex gap-4 pb-6 last:pb-0">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        index === selectedPack.timeline.length - 1 
                          ? "bg-primary" 
                          : "bg-muted-foreground"
                      }`} />
                      {index < selectedPack.timeline.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border mt-1" />
                      )}
                    </div>

                    {/* Event content */}
                    <div className="flex-1 pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{event.status}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        </div>
                        {event.referenceType && event.referenceId !== "N/A" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => {
                              toast({
                                title: "Reference",
                                description: `Opening ${event.referenceId}...`,
                              });
                            }}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {event.referenceId}
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {event.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {event.user}
                        </span>
                      </div>

                      {event.referenceId !== "N/A" && (
                        <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          Reference: {event.referenceId}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Linked References Summary */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Linked References</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPack.timeline
                    .filter((e) => e.referenceType && e.referenceId !== "N/A")
                    .reduce((unique, event) => {
                      if (!unique.find((e) => e.referenceId === event.referenceId)) {
                        unique.push(event);
                      }
                      return unique;
                    }, [] as TimelineEvent[])
                    .map((event, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          toast({
                            title: "Navigate",
                            description: `Opening ${event.referenceType} reference: ${event.referenceId}`,
                          });
                        }}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {event.referenceId}
                      </Button>
                    ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
