export interface RebateTier {
  from: string;
  to: string;
  reward: string;
}

export interface RebateProgram {
  id: string;
  version?: string;
  vendorId?: string;
  selectedProductIds?: string[];
  name: string;
  vendor: string;
  eligibleItems: string;
  rebateType: string;
  startDate: string;
  endDate: string;
  claimFrequency: string;
  status: string;
  // Extended fields (optional for legacy records)
  offeredByType?: string;
  description?: string;
  eligibilityScope?: string;
  scopeValue?: string;
  selectedProductCount?: number;
  qualificationType?: string;
  target?: string;
  measurementBasis?: string;
  rewardType?: string;
  rewardValue?: string;
  calculation?: string;
  tiers?: RebateTier[];
  claimRequired?: boolean;
  submissionDeadlineDays?: string;
  paymentMethod?: string;
}

export const OFFERED_BY_TYPES = ["Vendor / Distributor", "Manufacturer", "Other"];

export const PROGRAM_TYPES = [
  "Volume / Purchase",
  "Tiered",
  "Percentage",
  "Per unit",
  "Compliance",
  "Display",
  "Promotional",
  "Growth",
];

export const ELIGIBILITY_SCOPES = [
  "All Products from Provider",
  "Department",
  "Subdepartment",
  "Brand",
  "Specific Products",
];

export const QUALIFICATION_TYPES = [
  "Purchase Amount",
  "Quantity",
  "Cases",
  "Sales Amount",
  "Growth %",
  "Display Requirement",
  "Promotion Participation",
  "Compliance",
  "No Minimum Requirement",
];

export const MEASUREMENT_BASIS = ["Purchases", "Sales", "Units Received", "Cases Received"];

export const REWARD_TYPES = [
  "Percentage",
  "Fixed Amount",
  "Per Unit",
  "Per Case",
  "Account Credit",
  "Free Goods",
  "Other",
];

export const CALCULATION_OPTIONS = [
  "On qualifying purchases",
  "On total purchases",
  "On qualifying units",
  "Flat on qualification",
];

export const CLAIM_FREQUENCIES = ["Monthly", "Quarterly", "Semi-Annual", "Annual"];

export const PAYMENT_METHODS = ["Vendor Credit", "Check", "ACH Transfer", "Wire Transfer", "Free Goods"];

export const DEPARTMENT_OPTIONS = ["Cigarettes", "Beverages", "Snacks", "Grocery", "HBC", "Beer & Wine"];

export const BRAND_OPTIONS = ["Marlboro", "Coca-Cola", "Pepsi", "Lay's", "Doritos", "Dove", "Oreo"];

export const VENDOR_OPTIONS = [
  "Coca-Cola Enterprises",
  "Frito-Lay",
  "Mars Inc.",
  "PepsiCo",
  "Nestle",
  "Kellogg's",
  "Procter & Gamble",
  "Unilever",
  "Mondelez",
  "Red Bull GmbH",
  "Tyson Foods",
  "General Mills",
  "PM USA",
];
