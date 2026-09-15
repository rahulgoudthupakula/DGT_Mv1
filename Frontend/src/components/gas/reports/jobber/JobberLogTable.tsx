import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface JobberLogRow {
  id: string;
  date: string;
  day: string;
  vendor: string;
  fuelType: string;
  gallonsPurchased: number;
  purchasedCost: number;
  totalCharges: number;
  creditCard: number;
  creditCardFeeAdj: number;
  cashCardCredit: number;
  cashCardCommAdj: number;
  fuelExpenses: number;
  nonFuelExpenses: number;
  payment: number;
  balance: number;
}

const allMockData: JobberLogRow[] = [
  { id: "1", date: "Feb 10, 2025", day: "Mon", vendor: "Marathon Petroleum", fuelType: "Regular", gallonsPurchased: 8200, purchasedCost: 21156, totalCharges: 21306, creditCard: 18500, creditCardFeeAdj: -370, cashCardCredit: 1200, cashCardCommAdj: -24, fuelExpenses: 450, nonFuelExpenses: 120, payment: 21156, balance: 150 },
  { id: "2", date: "Feb 10, 2025", day: "Mon", vendor: "Marathon Petroleum", fuelType: "Premium", gallonsPurchased: 4100, purchasedCost: 12710, totalCharges: 12830, creditCard: 9800, creditCardFeeAdj: -196, cashCardCredit: 800, cashCardCommAdj: -16, fuelExpenses: 280, nonFuelExpenses: 85, payment: 12710, balance: 120 },
  { id: "3", date: "Feb 9, 2025", day: "Sun", vendor: "Shell Supply", fuelType: "Diesel", gallonsPurchased: 9500, purchasedCost: 26600, totalCharges: 26790, creditCard: 22100, creditCardFeeAdj: -442, cashCardCredit: 1500, cashCardCommAdj: -30, fuelExpenses: 520, nonFuelExpenses: 140, payment: 0, balance: 26790 },
  { id: "4", date: "Feb 8, 2025", day: "Sat", vendor: "Marathon Petroleum", fuelType: "Regular", gallonsPurchased: 8300, purchasedCost: 21414, totalCharges: 21564, creditCard: 18800, creditCardFeeAdj: -376, cashCardCredit: 1100, cashCardCommAdj: -22, fuelExpenses: 440, nonFuelExpenses: 110, payment: 15000, balance: 6564 },
  { id: "5", date: "Feb 8, 2025", day: "Sat", vendor: "BP Products", fuelType: "Plus", gallonsPurchased: 3800, purchasedCost: 10830, totalCharges: 10935, creditCard: 8200, creditCardFeeAdj: -164, cashCardCredit: 650, cashCardCommAdj: -13, fuelExpenses: 230, nonFuelExpenses: 70, payment: 0, balance: 10935 },
  { id: "6", date: "Feb 7, 2025", day: "Fri", vendor: "Shell Supply", fuelType: "Diesel", gallonsPurchased: 9200, purchasedCost: 25760, totalCharges: 25935, creditCard: 21500, creditCardFeeAdj: -430, cashCardCredit: 1400, cashCardCommAdj: -28, fuelExpenses: 500, nonFuelExpenses: 130, payment: 25935, balance: 0 },
];

const fmt = (v: number, d = 0) => v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

interface JobberLogTableProps {
  onRowClick: (row: JobberLogRow) => void;
  vendor: string;
  fuelType: string;
  search: string;
}

export const JobberLogTable = ({ onRowClick, vendor, fuelType, search }: JobberLogTableProps) => {
  const filtered = allMockData.filter((row) => {
    if (vendor !== "all") {
      const v = vendor.toLowerCase();
      if (!row.vendor.toLowerCase().includes(v)) return false;
    }
    if (fuelType !== "all" && row.fuelType.toLowerCase() !== fuelType.toLowerCase()) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!row.date.toLowerCase().includes(q) && !row.vendor.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totals = {
    gallonsPurchased: filtered.reduce((s, r) => s + r.gallonsPurchased, 0),
    purchasedCost: filtered.reduce((s, r) => s + r.purchasedCost, 0),
    totalCharges: filtered.reduce((s, r) => s + r.totalCharges, 0),
    creditCard: filtered.reduce((s, r) => s + r.creditCard, 0),
    creditCardFeeAdj: filtered.reduce((s, r) => s + r.creditCardFeeAdj, 0),
    cashCardCredit: filtered.reduce((s, r) => s + r.cashCardCredit, 0),
    cashCardCommAdj: filtered.reduce((s, r) => s + r.cashCardCommAdj, 0),
    fuelExpenses: filtered.reduce((s, r) => s + r.fuelExpenses, 0),
    nonFuelExpenses: filtered.reduce((s, r) => s + r.nonFuelExpenses, 0),
    payment: filtered.reduce((s, r) => s + r.payment, 0),
    balance: filtered.reduce((s, r) => s + r.balance, 0),
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs">Date</TableHead>
            <TableHead className="text-xs">Day</TableHead>
            <TableHead className="text-xs">Vendor / Jobber</TableHead>
            <TableHead className="text-xs">Fuel Type</TableHead>
            <TableHead className="text-xs text-right">Gallons Purch</TableHead>
            <TableHead className="text-xs text-right">Purch Cost</TableHead>
            <TableHead className="text-xs text-right">Total Charges</TableHead>
            <TableHead className="text-xs text-right">Credit Card</TableHead>
            <TableHead className="text-xs text-right">CC Fee Adj</TableHead>
            <TableHead className="text-xs text-right">Cash Card Cr</TableHead>
            <TableHead className="text-xs text-right">Cash Card Comm Adj</TableHead>
            <TableHead className="text-xs text-right">Fuel Exp</TableHead>
            <TableHead className="text-xs text-right">Non-Fuel Exp</TableHead>
            <TableHead className="text-xs text-right">Payment</TableHead>
            <TableHead className="text-xs text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={15} className="text-center text-xs text-muted-foreground py-8">
                No records match the selected filters.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((row) => (
              <TableRow key={row.id} className="cursor-pointer hover:bg-muted/30" onClick={() => onRowClick(row)}>
                <TableCell className="text-xs text-foreground">{row.date}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{row.day}</TableCell>
                <TableCell className="text-xs text-foreground font-medium">{row.vendor}</TableCell>
                <TableCell className="text-xs text-foreground">{row.fuelType}</TableCell>
                <TableCell className="text-xs text-right font-medium text-foreground">{fmt(row.gallonsPurchased)}</TableCell>
                <TableCell className="text-xs text-right font-medium text-foreground">${fmt(row.purchasedCost)}</TableCell>
                <TableCell className="text-xs text-right font-medium text-foreground">${fmt(row.totalCharges)}</TableCell>
                <TableCell className="text-xs text-right text-foreground">${fmt(row.creditCard)}</TableCell>
                <TableCell className="text-xs text-right text-foreground">${fmt(row.creditCardFeeAdj)}</TableCell>
                <TableCell className="text-xs text-right text-foreground">${fmt(row.cashCardCredit)}</TableCell>
                <TableCell className="text-xs text-right text-foreground">${fmt(row.cashCardCommAdj)}</TableCell>
                <TableCell className="text-xs text-right text-foreground">${fmt(row.fuelExpenses)}</TableCell>
                <TableCell className="text-xs text-right text-foreground">${fmt(row.nonFuelExpenses)}</TableCell>
                <TableCell className="text-xs text-right text-foreground">${fmt(row.payment)}</TableCell>
                <TableCell className="text-xs text-right font-medium text-foreground">${fmt(row.balance)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        <TableFooter>
          <TableRow className="bg-muted/60 font-semibold">
            <TableCell className="text-xs" colSpan={4}>Totals</TableCell>
            <TableCell className="text-xs text-right">{fmt(totals.gallonsPurchased)}</TableCell>
            <TableCell className="text-xs text-right">${fmt(totals.purchasedCost)}</TableCell>
            <TableCell className="text-xs text-right">${fmt(totals.totalCharges)}</TableCell>
            <TableCell className="text-xs text-right">${fmt(totals.creditCard)}</TableCell>
            <TableCell className="text-xs text-right">${fmt(totals.creditCardFeeAdj)}</TableCell>
            <TableCell className="text-xs text-right">${fmt(totals.cashCardCredit)}</TableCell>
            <TableCell className="text-xs text-right">${fmt(totals.cashCardCommAdj)}</TableCell>
            <TableCell className="text-xs text-right">${fmt(totals.fuelExpenses)}</TableCell>
            <TableCell className="text-xs text-right">${fmt(totals.nonFuelExpenses)}</TableCell>
            <TableCell className="text-xs text-right">${fmt(totals.payment)}</TableCell>
            <TableCell className="text-xs text-right">${fmt(totals.balance)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};
