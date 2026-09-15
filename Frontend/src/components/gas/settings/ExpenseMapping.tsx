import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

const categories = [
  { name: "Transport", gl: "5100", bucket: "Cost of Goods" },
  { name: "Maintenance", gl: "5200", bucket: "Operating Expense" },
  { name: "Environmental Fees", gl: "5300", bucket: "Regulatory" },
  { name: "Misc", gl: "5900", bucket: "Other Expense" },
];

export const ExpenseMapping = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-semibold">Expense Mapping</CardTitle>
      <p className="text-xs text-muted-foreground">Map expense categories to GL accounts and cost buckets.</p>
    </CardHeader>
    <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow className="text-xs">
            <TableHead className="text-xs">Category</TableHead>
            <TableHead className="text-xs">Default GL Code</TableHead>
            <TableHead className="text-xs">Cost Bucket</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((c) => (
            <TableRow key={c.name} className="text-xs">
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>
                <Input defaultValue={c.gl} className="h-7 w-24 text-xs" />
              </TableCell>
              <TableCell className="text-muted-foreground">{c.bucket}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);
