export type PurchaseOrderStatus = "Draft" | "Pending Approval" | "Approved" | "Partially Received" | "Received" | "Cancelled";
export type PurchaseOrderSource = "Suggested Order Guide" | "Vendor Order Guide";

export interface PurchaseOrderLineInput {
  sku: string;
  barcode: string;
  itemName: string;
  department: string;
  orderedQuantity: number;
  casePackSize: number;
  unitCost: number;
}

export interface PurchaseOrderLine {
  id: string;
  sku: string;
  barcode: string;
  itemName: string;
  department: string;
  orderedQuantity: number;
  receivedQuantity: number;
  casePackSize: number;
  unitCost: number;
  lineTotal: number;
}

export interface PurchaseOrder {
  version:string;
  canEdit:boolean; canApprove:boolean; canCancel:boolean;
  id: string;
  poNumber: string;
  vendor: string;
  orderDate: string;
  expectedDeliveryDate: string | null;
  status: PurchaseOrderStatus;
  source: PurchaseOrderSource;
  notes: string | null;
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
  createdAt: string;
  lines: PurchaseOrderLine[];
}

import {request} from '@/lib/backend';
const path=(store:string)=>`/access/stores/${encodeURIComponent(store)}/purchase-orders`;
export const loadPurchaseOrders=(store:string)=>request<PurchaseOrder[]>(path(store));
export const createPurchaseOrder=(store:string,input:{vendor:string;source:PurchaseOrderSource;expectedDeliveryDate?:string;notes?:string;lines:PurchaseOrderLineInput[]},key:string)=>request<{po_number:string}>(path(store),{method:'POST',headers:{'Idempotency-Key':key},body:JSON.stringify({...input,expectedDeliveryDate:input.expectedDeliveryDate||null,lines:input.lines.filter(l=>l.orderedQuantity>0)})});
export const updatePurchaseOrderStatus=(store:string,order:PurchaseOrder,status:PurchaseOrderStatus)=>request(`${path(store)}/${order.id}/status`,{method:'POST',headers:{'If-Match':order.version},body:JSON.stringify({status})});
export const addLinesToPurchaseOrder=(store:string,order:PurchaseOrder,lines:PurchaseOrderLineInput[])=>request(`${path(store)}/${order.id}/lines`,{method:'POST',headers:{'If-Match':order.version},body:JSON.stringify(lines.filter(l=>l.orderedQuantity>0))});
