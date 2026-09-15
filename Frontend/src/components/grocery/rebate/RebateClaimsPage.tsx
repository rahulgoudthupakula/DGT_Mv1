import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Eye, Upload, Send } from "lucide-react";
import { usePagination } from "@/hooks/use-pagination";
import { TablePagination } from "@/components/ui/table-pagination";

const rebateClaims = [
  { id: "CLM-001", claimPeriod: "January 2024", vendor: "Coca-Cola Enterprises", program: "Coca-Cola Q1 Rebate", linkedInvoices: 12, claimedAmount: 245.50, status: "Submitted", submittedDate: "2024-02-05", submittedBy: "John Manager" },
  { id: "CLM-002", claimPeriod: "Q4 2023", vendor: "Mars Inc.", program: "Mars Candy Promo", linkedInvoices: 8, claimedAmount: 156.00, status: "Approved", submittedDate: "2024-01-10", submittedBy: "Jane Supervisor" },
  { id: "CLM-003", claimPeriod: "December 2023", vendor: "Pepsi Co", program: "Pepsi Holiday Special", linkedInvoices: 5, claimedAmount: 89.25, status: "Rejected", submittedDate: "2024-01-08", submittedBy: "John Manager" },
  { id: "CLM-004", claimPeriod: "February 2024", vendor: "Frito-Lay", program: "Frito-Lay Volume Bonus", linkedInvoices: 15, claimedAmount: 310.00, status: "Draft", submittedDate: "2024-03-01", submittedBy: "Sarah Admin" },
  { id: "CLM-005", claimPeriod: "Q1 2024", vendor: "Nestle", program: "Nestle Waters Deal", linkedInvoices: 9, claimedAmount: 175.50, status: "Submitted", submittedDate: "2024-04-05", submittedBy: "John Manager" },
  { id: "CLM-006", claimPeriod: "March 2024", vendor: "Kellogg's", program: "Kellogg's Cereal Rebate", linkedInvoices: 6, claimedAmount: 92.40, status: "Approved", submittedDate: "2024-04-10", submittedBy: "Jane Supervisor" },
  { id: "CLM-007", claimPeriod: "January 2024", vendor: "Procter & Gamble", program: "P&G Home Care", linkedInvoices: 11, claimedAmount: 204.75, status: "Submitted", submittedDate: "2024-02-12", submittedBy: "John Manager" },
  { id: "CLM-008", claimPeriod: "Q1 2024", vendor: "Unilever", program: "Unilever Personal Care", linkedInvoices: 7, claimedAmount: 138.00, status: "Draft", submittedDate: "2024-04-15", submittedBy: "Sarah Admin" },
  { id: "CLM-009", claimPeriod: "February 2024", vendor: "Mondelez", program: "Mondelez Snack Deal", linkedInvoices: 10, claimedAmount: 198.30, status: "Approved", submittedDate: "2024-03-08", submittedBy: "Jane Supervisor" },
  { id: "CLM-010", claimPeriod: "Q4 2023", vendor: "Red Bull GmbH", program: "Red Bull Energy Promo", linkedInvoices: 4, claimedAmount: 67.20, status: "Rejected", submittedDate: "2024-01-20", submittedBy: "John Manager" },
  { id: "CLM-011", claimPeriod: "March 2024", vendor: "Tyson Foods", program: "Tyson Protein Plus", linkedInvoices: 8, claimedAmount: 145.60, status: "Submitted", submittedDate: "2024-04-02", submittedBy: "Sarah Admin" },
  { id: "CLM-012", claimPeriod: "Q1 2024", vendor: "General Mills", program: "General Mills Volume", linkedInvoices: 13, claimedAmount: 263.80, status: "Approved", submittedDate: "2024-04-18", submittedBy: "Jane Supervisor" },
];

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    Submitted: "outline", Approved: "default", Rejected: "destructive", Draft: "secondary",
  };
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
};

export const RebateClaimsPage = () => {
  const [showNewClaimDialog, setShowNewClaimDialog] = useState(false);

  const { paginated, page, totalPages, totalItems, pageSize, hasPrev, hasNext, nextPage, prevPage } =
    usePagination(rebateClaims, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rebate Claims</h1>
          <p className="text-sm text-muted-foreground">Submit and track rebate claims workflow</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">Claims</CardTitle>
          <Dialog open={showNewClaimDialog} onOpenChange={setShowNewClaimDialog}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Claim</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create Rebate Claim</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Claim Period</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select period" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jan-2024">January 2024</SelectItem>
                      <SelectItem value="feb-2024">February 2024</SelectItem>
                      <SelectItem value="q1-2024">Q1 2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Program</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coke">Coca-Cola Q1 Rebate</SelectItem>
                      <SelectItem value="frito">Frito-Lay Volume Bonus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Link Purchases / Invoices</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select invoices" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All eligible invoices (12)</SelectItem>
                      <SelectItem value="select">Select specific invoices</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Claimed Amount</Label>
                  <Input value="$109.50" readOnly className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Auto-calculated from linked invoices</p>
                </div>
                <div className="grid gap-2">
                  <Label>Supporting Documents</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowNewClaimDialog(false)}>Save as Draft</Button>
                  <Button onClick={() => setShowNewClaimDialog(false)}><Send className="h-4 w-4 mr-1" /> Submit Claim</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
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
              {paginated.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell className="font-medium">{claim.id}</TableCell>
                  <TableCell>{claim.claimPeriod}</TableCell>
                  <TableCell>{claim.vendor}</TableCell>
                  <TableCell className="text-sm">{claim.program}</TableCell>
                  <TableCell className="text-center">{claim.linkedInvoices}</TableCell>
                  <TableCell className="text-right font-medium">${claim.claimedAmount.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(claim.status)}</TableCell>
                  <TableCell className="text-sm">
                    <div>{claim.submittedDate}</div>
                    <div className="text-xs text-muted-foreground">{claim.submittedBy}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            hasPrev={hasPrev}
            hasNext={hasNext}
            onPrev={prevPage}
            onNext={nextPage}
          />
        </CardContent>
      </Card>
    </div>
  );
};
