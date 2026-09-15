export interface PricebookItem {
  barcode: string;
  sku: string;
  name: string;
  category: string;
  vendor: string;
  dept: string;
  cost: number;
  retail: number;
}

export const pricebookItems: PricebookItem[] = [
  { barcode: "049000042566", sku: "BEV-001", name: "Coca-Cola 20oz", category: "Drinks", vendor: "Coca-Cola Co.", dept: "Beverage", cost: 0.85, retail: 1.99 },
  { barcode: "028400090100", sku: "SNK-002", name: "Lay's Classic 1oz", category: "Snacks", vendor: "Frito-Lay", dept: "Snacks", cost: 0.42, retail: 0.99 },
  { barcode: "012000001994", sku: "BEV-003", name: "Pepsi 20oz", category: "Drinks", vendor: "PepsiCo", dept: "Beverage", cost: 0.82, retail: 1.99 },
  { barcode: "040000423218", sku: "CND-004", name: "Snickers 1.86oz", category: "Candy", vendor: "Mars Inc.", dept: "Candy", cost: 0.65, retail: 1.49 },
  { barcode: "611269991020", sku: "BEV-005", name: "Red Bull 8.4oz", category: "Energy", vendor: "Red Bull GmbH", dept: "Beverage", cost: 1.10, retail: 2.49 },
  { barcode: "030000056319", sku: "GRC-006", name: "Cheerios 18oz", category: "Cereal", vendor: "General Mills", dept: "Grocery", cost: 2.80, retail: 5.49 },
  { barcode: "070000581522", sku: "TOB-007", name: "Marlboro Red King", category: "Tobacco", vendor: "Philip Morris", dept: "Tobacco", cost: 6.20, retail: 9.99 },
  { barcode: "018200573553", sku: "GRC-008", name: "Lay's BBQ Family", category: "Snacks", vendor: "Frito-Lay", dept: "Snacks", cost: 2.10, retail: 4.49 },
  { barcode: "049000028911", sku: "BEV-009", name: "Coca-Cola 12oz Can", category: "Drinks", vendor: "Coca-Cola Co.", dept: "Beverage", cost: 0.45, retail: 0.99 },
  { barcode: "028400064057", sku: "SNK-010", name: "Lay's Classic 9.5oz", category: "Snacks", vendor: "Frito-Lay", dept: "Snacks", cost: 1.80, retail: 4.49 },
  { barcode: "011111765391", sku: "BEV-011", name: "Pure Life Water 16.9oz", category: "Water", vendor: "Nestle", dept: "Beverage", cost: 0.25, retail: 0.99 },
  { barcode: "038000039300", sku: "GRC-012", name: "Frosted Flakes 13.5oz", category: "Cereal", vendor: "Kellogg's", dept: "Grocery", cost: 2.50, retail: 4.99 },
  { barcode: "037000356684", sku: "HOM-013", name: "Tide Pods 31ct", category: "Cleaning", vendor: "Procter & Gamble", dept: "Home", cost: 8.50, retail: 14.99 },
  { barcode: "079400407703", sku: "PER-014", name: "Dove Body Wash 22oz", category: "Personal Care", vendor: "Unilever", dept: "Personal Care", cost: 3.20, retail: 6.99 },
  { barcode: "044000032976", sku: "SNK-015", name: "Oreo 14.3oz", category: "Cookies", vendor: "Mondelez", dept: "Snacks", cost: 2.00, retail: 4.49 },
  { barcode: "012000001765", sku: "BEV-016", name: "Pepsi 20oz Bottle", category: "Drinks", vendor: "PepsiCo", dept: "Beverage", cost: 0.80, retail: 1.99 },
  { barcode: "023700030217", sku: "GRC-017", name: "Tyson Chicken Breast 2lb", category: "Meat", vendor: "Tyson Foods", dept: "Grocery", cost: 4.50, retail: 7.99 },
  { barcode: "016000275287", sku: "GRC-018", name: "Gold Medal Flour 5lb", category: "Baking", vendor: "General Mills", dept: "Grocery", cost: 2.00, retail: 3.99 },
];
