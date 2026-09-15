import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  DollarSign,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Upload,
  Eye,
  Send,
  Calendar,
  Download,
} from "lucide-react";

// Mock data for rebate programs
const rebatePrograms = [
  {
    id: "PRG-001",
    name: "Coca-Cola Q1 Rebate",
    vendor: "Coca-Cola Enterprises",
    eligibleItems: "All Coca-Cola Products",
    rebateType: "Per unit",
    rate: "$0.15/unit",
    startDate: "2024-01-01",
    endDate: "2024-03-31",
    claimFrequency: "Monthly",
    status: "Active",
  },
  {
    id: "PRG-002",
    name: "Frito-Lay Volume Bonus",
    vendor: "Frito-Lay",
    eligibleItems: "Chips & Snacks",
    rebateType: "Volume-based",
    rate: "2% over 500 units",
    startDate: "2024-01-01",
    endDate: "2024-06-30",
    claimFrequency: "Quarterly",
    status: "Active",
  },
  {
    id: "PRG-003",
    name: "Mars Candy Promo",
    vendor: "Mars Inc.",
    eligibleItems: "Candy Bars",
    rebateType: "Percentage",
    rate: "3% of purchases",
    startDate: "2023-10-01",
    endDate: "2023-12-31",
    claimFrequency: "Monthly",
    status: "Expired",
  },
];

// Mock data for rebate accruals
const rebateAccruals = [
  {
    id: "ACC-001",
    item: "Coca-Cola 20oz",
    vendor: "Coca-Cola Enterprises",
    program: "Coca-Cola Q1 Rebate",
    salesQty: 450,
    rebateRate: "$0.15/unit",
    accruedAmount: 67.50,
    claimableDate: "2024-02-01",
    status: "Claimable",
  },
  {
    id: "ACC-002",
    item: "Sprite 20oz",
    vendor: "Coca-Cola Enterprises",
    program: "Coca-Cola Q1 Rebate",
    salesQty: 280,
    rebateRate: "$0.15/unit",
    accruedAmount: 42.00,
    claimableDate: "2024-02-01",
    status: "Claimable",
  },
  {
    id: "ACC-003",
    item: "Lay's Classic",
    vendor: "Frito-Lay",
    program: "Frito-Lay Volume Bonus",
    salesQty: 620,
    rebateRate: "2% over 500",
    accruedAmount: 24.80,
    claimableDate: "2024-04-01",
    status: "Pending",
  },
];

// Mock data for rebate claims
const rebateClaims = [
  {
    id: "CLM-001",
    claimPeriod: "January 2024",
    vendor: "Coca-Cola Enterprises",
    program: "Coca-Cola Q1 Rebate",
    linkedInvoices: 12,
    claimedAmount: 245.50,
    status: "Submitted",
    submittedDate: "2024-02-05",
    submittedBy: "John Manager",
  },
  {
    id: "CLM-002",
    claimPeriod: "Q4 2023",
    vendor: "Mars Inc.",
    program: "Mars Candy Promo",
    linkedInvoices: 8,
    claimedAmount: 156.00,
    status: "Approved",
    submittedDate: "2024-01-10",
    submittedBy: "Jane Supervisor",
  },
  {
    id: "CLM-003",
    claimPeriod: "December 2023",
    vendor: "Pepsi Co",
    program: "Pepsi Holiday Special",
    linkedInvoices: 5,
    claimedAmount: 89.25,
    status: "Rejected",
    submittedDate: "2024-01-08",
    submittedBy: "John Manager",
  },
];

// Mock data for rebate payments
const rebatePayments = [
  {
    id: "PAY-001",
    claimRef: "CLM-002",
    vendor: "Mars Inc.",
    paymentDate: "2024-01-25",
    paymentMethod: "Check #4521",
    expectedAmount: 156.00,
    receivedAmount: 156.00,
    variance: 0,
  },
  {
    id: "PAY-002",
    claimRef: "CLM-098",
    vendor: "Coca-Cola Enterprises",
    paymentDate: "2024-01-20",
    paymentMethod: "ACH Transfer",
    expectedAmount: 312.50,
    receivedAmount: 298.75,
    variance: -13.75,
  },
];

// Mock audit log
const auditLog = [
  {
    id: 1,
    action: "Claim Submitted",
    reference: "CLM-001",
    user: "John Manager",
    timestamp: "2024-02-05 10:30 AM",
    details: "Submitted rebate claim for Coca-Cola Q1",
  },
  {
    id: 2,
    action: "Claim Approved",
    reference: "CLM-002",
    user: "Sarah Admin",
    timestamp: "2024-01-15 02:15 PM",
    details: "Approved Mars Candy rebate claim",
  },
  {
    id: 3,
    action: "Payment Received",
    reference: "PAY-001",
    user: "System",
    timestamp: "2024-01-25 09:00 AM",
    details: "Payment received for CLM-002",
  },
];

export const RebateManagement = () => {
  const [activeTab, setActiveTab] = useState("programs");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewProgramDialog, setShowNewProgramDialog] = useState(false);
  const [showNewClaimDialog, setShowNewClaimDialog] = useState(false);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Active: "default",
      Expired: "secondary",
      Claimable: "default",
      Pending: "outline",
      Submitted: "outline",
      Approved: "default",
      Rejected: "destructive",
      Draft: "secondary",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  // Summary stats
  const totalAccrued = rebateAccruals.reduce((sum, a) => sum + a.accruedAmount, 0);
  const totalClaimable = rebateAccruals
    .filter((a) => a.status === "Claimable")
    .reduce((sum, a) => sum + a.accruedAmount, 0);
  const pendingClaims = rebateClaims.filter((c) => c.status === "Submitted").length;
  const totalReceived = rebatePayments.reduce((sum, p) => sum + p.receivedAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rebate Management</h1>
          <p className="text-sm text-muted-foreground">
            Track programs, accruals, claims, and payments
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Accrued</p>
                <p className="text-xl font-bold">${totalAccrued.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Claimable Now</p>
                <p className="text-xl font-bold">${totalClaimable.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Claims</p>
                <p className="text-xl font-bold">{pendingClaims}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Received</p>
                <p className="text-xl font-bold">${totalReceived.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="accrual">Accrual</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
        </TabsList>

        {/* Programs Tab */}
        <TabsContent value="programs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Rebate Programs</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search programs..."
                    className="pl-9 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Dialog open={showNewProgramDialog} onOpenChange={setShowNewProgramDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" /> Add Program
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>New Rebate Program</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Program Name</Label>
                        <Input placeholder="e.g., Q1 Volume Rebate" />
                      </div>
                      <div className="grid gap-2">
                        <Label>Vendor</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vendor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="coca-cola">Coca-Cola Enterprises</SelectItem>
                            <SelectItem value="frito-lay">Frito-Lay</SelectItem>
                            <SelectItem value="mars">Mars Inc.</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Eligible Items / Categories</Label>
                        <Input placeholder="e.g., All beverages" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Rebate Type</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="per-unit">Per unit</SelectItem>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="volume">Volume-based</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>Rate</Label>
                          <Input placeholder="e.g., $0.10/unit" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Start Date</Label>
                          <Input type="date" />
                        </div>
                        <div className="grid gap-2">
                          <Label>End Date</Label>
                          <Input type="date" />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Claim Frequency</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setShowNewProgramDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => setShowNewProgramDialog(false)}>
                          Create Program
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Program Name</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Eligible Items</TableHead>
                    <TableHead>Rebate Type</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Claim Freq.</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rebatePrograms.map((program) => (
                    <TableRow key={program.id}>
                      <TableCell className="font-medium">{program.name}</TableCell>
                      <TableCell>{program.vendor}</TableCell>
                      <TableCell>{program.eligibleItems}</TableCell>
                      <TableCell>{program.rebateType}</TableCell>
                      <TableCell>{program.rate}</TableCell>
                      <TableCell className="text-xs">
                        {program.startDate} – {program.endDate}
                      </TableCell>
                      <TableCell>{program.claimFrequency}</TableCell>
                      <TableCell>{getStatusBadge(program.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accrual Tab */}
        <TabsContent value="accrual" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg">Rebate Accrual</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Track earned rebates before they're claimed
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="claimable">Claimable</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" /> Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead className="text-right">Sales Qty</TableHead>
                    <TableHead>Rebate Rate</TableHead>
                    <TableHead className="text-right">Accrued Amount</TableHead>
                    <TableHead>Claimable Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rebateAccruals.map((accrual) => (
                    <TableRow key={accrual.id}>
                      <TableCell className="font-medium">{accrual.item}</TableCell>
                      <TableCell>{accrual.vendor}</TableCell>
                      <TableCell className="text-sm">{accrual.program}</TableCell>
                      <TableCell className="text-right">{accrual.salesQty}</TableCell>
                      <TableCell>{accrual.rebateRate}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${accrual.accruedAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>{accrual.claimableDate}</TableCell>
                      <TableCell>{getStatusBadge(accrual.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex justify-end">
                <div className="bg-muted/50 px-4 py-2 rounded-lg">
                  <span className="text-sm text-muted-foreground">Total Accrued: </span>
                  <span className="font-bold">${totalAccrued.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Claims Tab */}
        <TabsContent value="claims" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Rebate Claims</CardTitle>
              <Dialog open={showNewClaimDialog} onOpenChange={setShowNewClaimDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" /> New Claim
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Rebate Claim</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Claim Period</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="jan-2024">January 2024</SelectItem>
                          <SelectItem value="feb-2024">February 2024</SelectItem>
                          <SelectItem value="q1-2024">Q1 2024</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Program</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select program" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="coke">Coca-Cola Q1 Rebate</SelectItem>
                          <SelectItem value="frito">Frito-Lay Volume Bonus</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Link Purchases / Invoices</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select invoices" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All eligible invoices (12)</SelectItem>
                          <SelectItem value="select">Select specific invoices</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Claimed Amount</Label>
                      <Input value="$109.50" readOnly className="bg-muted" />
                      <p className="text-xs text-muted-foreground">
                        Auto-calculated from linked invoices
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Label>Supporting Documents</Label>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center">
                        <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Drag & drop or click to upload
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => setShowNewClaimDialog(false)}>
                        Save as Draft
                      </Button>
                      <Button onClick={() => setShowNewClaimDialog(false)}>
                        <Send className="h-4 w-4 mr-1" /> Submit Claim
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim ID</TableHead>
                    <TableHead>Claim Period</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead className="text-center">Invoices</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rebateClaims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell className="font-medium">{claim.id}</TableCell>
                      <TableCell>{claim.claimPeriod}</TableCell>
                      <TableCell>{claim.vendor}</TableCell>
                      <TableCell className="text-sm">{claim.program}</TableCell>
                      <TableCell className="text-center">{claim.linkedInvoices}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${claim.claimedAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(claim.status)}</TableCell>
                      <TableCell className="text-sm">
                        <div>{claim.submittedDate}</div>
                        <div className="text-xs text-muted-foreground">{claim.submittedBy}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Rebate Payments</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" /> Export
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Claim Ref</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Expected</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rebatePayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.id}</TableCell>
                      <TableCell className="text-primary">{payment.claimRef}</TableCell>
                      <TableCell>{payment.vendor}</TableCell>
                      <TableCell>{payment.paymentDate}</TableCell>
                      <TableCell>{payment.paymentMethod}</TableCell>
                      <TableCell className="text-right">
                        ${payment.expectedAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${payment.receivedAmount.toFixed(2)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          payment.variance < 0 ? "text-destructive" : "text-green-600"
                        }`}
                      >
                        {payment.variance === 0
                          ? "—"
                          : `${payment.variance > 0 ? "+" : ""}$${payment.variance.toFixed(2)}`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Accrued vs Paid</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Compare accrued rebates against actual payments received
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Vendor-wise Rebates</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Breakdown of rebates by vendor with period comparisons
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-amber-500/10">
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Missed / Expired Rebates</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Identify unclaimed rebates and expired programs
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-purple-500/10">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Pending Claims Aging</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Track outstanding claims by age and status
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Controls Tab */}
        <TabsContent value="controls" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rules & Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rules & Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Auto-expiry Alert</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify before program ends
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select defaultValue="7">
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                      </SelectContent>
                    </Select>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Claim Approval Required</Label>
                    <p className="text-sm text-muted-foreground">
                      Require manager approval for claims
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Variance Alert Threshold</Label>
                    <p className="text-sm text-muted-foreground">
                      Alert when payment differs from expected
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="number" defaultValue="5" className="w-20" />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Missed Rebate Reminder</Label>
                    <p className="text-sm text-muted-foreground">
                      Alert for claimable rebates not submitted
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Audit Trail */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg">Audit Trail</CardTitle>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditLog.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="mt-0.5">
                        {entry.action.includes("Approved") ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : entry.action.includes("Submitted") ? (
                          <Send className="h-4 w-4 text-blue-600" />
                        ) : (
                          <DollarSign className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{entry.action}</span>
                          <span className="text-xs text-primary">{entry.reference}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {entry.details}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{entry.user}</span>
                          <span>•</span>
                          <span>{entry.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
