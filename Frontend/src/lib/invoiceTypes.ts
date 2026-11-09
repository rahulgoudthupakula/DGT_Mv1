export type PostDeliveryLine = {
  sku: string;
  barcode: string;
  itemName: string;
  quantity: number;
  unitType: "item" | "case";
  unitsPerCase: number;
  unitCost: number;
  msrp?: number|null;
  receivedQuantity?:number; tax?:number;
};

export type PostDeliveryInput = {
  vendor: string;
  purchaseOrderId?:string|null;
  invoice: string;
  deliveryDate: string|null; // yyyy-MM-dd
  invoiceDate?:string; dueDate?:string|null; deliveryTime?:string|null; driverName?:string; driverNumber?:string; routeId?:string; terms?:string; freight?:number; fuelSurcharge?:number; handlingFee?:number; discount?:number;
  status: string;
  notes?: string | null;
  lines: PostDeliveryLine[];
};

