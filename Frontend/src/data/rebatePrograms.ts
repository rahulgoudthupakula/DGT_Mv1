export interface RebateProgramData {
  id: string;
  name: string;
  vendor: string;
  rebateType: string;
  status: string;
}

export const rebateProgramsList: RebateProgramData[] = [
  { id: "PRG-001", name: "Coca-Cola Q1 Rebate", vendor: "Coca-Cola Enterprises", rebateType: "Per unit", status: "Active" },
  { id: "PRG-002", name: "Frito-Lay Volume Bonus", vendor: "Frito-Lay", rebateType: "Volume-based", status: "Active" },
  { id: "PRG-003", name: "Mars Candy Promo", vendor: "Mars Inc.", rebateType: "Percentage", status: "Expired" },
  { id: "PRG-004", name: "Pepsi Summer Boost", vendor: "PepsiCo", rebateType: "Per unit", status: "Active" },
  { id: "PRG-005", name: "Nestle Waters Deal", vendor: "Nestle", rebateType: "Volume-based", status: "Active" },
  { id: "PRG-006", name: "Kellogg's Cereal Rebate", vendor: "Kellogg's", rebateType: "Percentage", status: "Active" },
  { id: "PRG-007", name: "P&G Home Care", vendor: "Procter & Gamble", rebateType: "Per unit", status: "Expired" },
  { id: "PRG-008", name: "Unilever Personal Care", vendor: "Unilever", rebateType: "Percentage", status: "Active" },
  { id: "PRG-009", name: "Mondelez Snack Deal", vendor: "Mondelez", rebateType: "Volume-based", status: "Active" },
  { id: "PRG-010", name: "Red Bull Energy Promo", vendor: "Red Bull GmbH", rebateType: "Per unit", status: "Expired" },
  { id: "PRG-011", name: "Tyson Protein Plus", vendor: "Tyson Foods", rebateType: "Percentage", status: "Active" },
  { id: "PRG-012", name: "General Mills Volume", vendor: "General Mills", rebateType: "Volume-based", status: "Active" },
];
