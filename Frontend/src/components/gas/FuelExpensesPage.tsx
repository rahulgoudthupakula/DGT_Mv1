import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Download } from "lucide-react";

const fuelExpenses = [
  { id: "EXP-001", date: "2024-02-15", category: "Maintenance", vendor: "Tank Clean Co.", description: "Monthly tank cleaning", amount: 450.00, status: "Paid" },
  { id: "EXP-002", date: "2024-02-14", category: "Compliance", vendor: "EPA Services", description: "Environmental inspection fee", amount: 275.00, status: "Paid" },
  { id: "EXP-003", date: "2024-02-13", category: "Equipment", vendor: "Pump Pro LLC", description: "Pump calibration – Island 2", amount: 185.50, status: "Pending" },
  { id: "EXP-004", date: "2024-02-10", category: "Freight", vendor: "Fuel Haul Inc.", description: "Delivery surcharge", amount: 120.00, status: "Paid" },
  { id: "EXP-005", date: "2024-02-08", category: "Utilities", vendor: "City Power Co.", description: "Canopy lighting – Feb", amount: 310.75, status: "Pending" },
];

const statusColors: Record<string, "default" | "outline" | "secondary"> = {
  Paid: "default", Pending: "outline", Overdue: "secondary",
};

export const FuelExpensesPage = () => {
  const total = fuelExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fuel Expenses</h1>
          <p className="text-sm text-muted-foreground">Track operational costs associated with fuel and station management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Export</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Expense</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Expenses (MTD)", value: `$${total.toFixed(2)}` },
          { label: "Pending", value: "$496.25" },
          { label: "Paid", value: "$845.75" },
          { label: "Categories", value: "5" },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className="text-2xl font-bold text-foreground">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">Expense Log</CardTitle>
          <Select defaultValue="all">
            <SelectTrigger className="w-40 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
              <SelectItem value="freight">Freight</SelectItem>
              <SelectItem value="utilities">Utilities</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expense ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fuelExpenses.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell className="font-medium text-xs">{exp.id}</TableCell>
                  <TableCell className="text-sm">{exp.date}</TableCell>
                  <TableCell>{exp.category}</TableCell>
                  <TableCell>{exp.vendor}</TableCell>
                  <TableCell className="text-sm">{exp.description}</TableCell>
                  <TableCell className="text-right font-medium">${exp.amount.toFixed(2)}</TableCell>
                  <TableCell><Badge variant={statusColors[exp.status]}>{exp.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
