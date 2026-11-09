import { supabase } from "@/integrations/supabase/client";

export type PurchaseOrderStatus = "Draft" | "Submitted" | "Partially Received" | "Received" | "Cancelled";
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

const makePoNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `PO-${date}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
};

export async function createPurchaseOrder(input: {
  vendor: string;
  source: PurchaseOrderSource;
  status?: PurchaseOrderStatus;
  expectedDeliveryDate?: string;
  notes?: string;
  lines: PurchaseOrderLineInput[];
}) {
  const lines = input.lines.filter((line) => line.orderedQuantity > 0);
  if (!lines.length) throw new Error("Add at least one product to the order.");

  const totalQuantity = lines.reduce((sum, line) => sum + line.orderedQuantity, 0);
  const totalValue = lines.reduce((sum, line) => sum + line.orderedQuantity * line.unitCost, 0);
  const { data: order, error: orderError } = await supabase
    .from("purchase_orders")
    .insert({
      po_number: makePoNumber(),
      vendor: input.vendor,
      source: input.source,
      status: input.status ?? "Draft",
      expected_delivery_date: input.expectedDeliveryDate || null,
      notes: input.notes || null,
      total_items: lines.length,
      total_quantity: totalQuantity,
      total_value: totalValue,
    })
    .select("id, po_number")
    .single();

  if (orderError || !order) throw orderError ?? new Error("Purchase order could not be created.");

  const { error: linesError } = await supabase.from("purchase_order_lines").insert(
    lines.map((line) => ({
      purchase_order_id: order.id,
      sku: line.sku,
      barcode: line.barcode,
      item_name: line.itemName,
      department: line.department,
      ordered_quantity: line.orderedQuantity,
      case_pack_size: line.casePackSize,
      unit_cost: line.unitCost,
      line_total: line.orderedQuantity * line.unitCost,
    })),
  );

  if (linesError) {
    await supabase.from("purchase_orders").delete().eq("id", order.id);
    throw linesError;
  }
  return order;
}

export async function loadPurchaseOrders(): Promise<PurchaseOrder[]> {
  const { data, error } = await supabase
    .from("purchase_orders")
    .select("*, purchase_order_lines(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    poNumber: row.po_number,
    vendor: row.vendor,
    orderDate: row.order_date,
    expectedDeliveryDate: row.expected_delivery_date,
    status: row.status as PurchaseOrderStatus,
    source: row.source as PurchaseOrderSource,
    notes: row.notes,
    totalItems: row.total_items,
    totalQuantity: row.total_quantity,
    totalValue: Number(row.total_value),
    createdAt: row.created_at,
    lines: (row.purchase_order_lines ?? []).map((line) => ({
      id: line.id,
      sku: line.sku,
      barcode: line.barcode,
      itemName: line.item_name,
      department: line.department,
      orderedQuantity: line.ordered_quantity,
      receivedQuantity: line.received_quantity,
      casePackSize: line.case_pack_size,
      unitCost: Number(line.unit_cost),
      lineTotal: Number(line.line_total),
    })),
  }));
}

export async function updatePurchaseOrderStatus(id: string, status: PurchaseOrderStatus) {
  const { error } = await supabase.from("purchase_orders").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function addLinesToPurchaseOrder(order: PurchaseOrder, newLines: PurchaseOrderLineInput[]) {
  if (order.status !== "Draft") throw new Error("Items can only be added to a draft purchase order.");
  const additions = newLines.filter((line) => line.orderedQuantity > 0);
  if (!additions.length) throw new Error("Enter a quantity for at least one product.");

  for (const addition of additions) {
    const existing = order.lines.find((line) => line.sku === addition.sku);
    if (existing) {
      const orderedQuantity = existing.orderedQuantity + addition.orderedQuantity;
      const { error } = await supabase.from("purchase_order_lines").update({
        ordered_quantity: orderedQuantity,
        line_total: orderedQuantity * addition.unitCost,
      }).eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("purchase_order_lines").insert({
        purchase_order_id: order.id,
        sku: addition.sku,
        barcode: addition.barcode,
        item_name: addition.itemName,
        department: addition.department,
        ordered_quantity: addition.orderedQuantity,
        case_pack_size: addition.casePackSize,
        unit_cost: addition.unitCost,
        line_total: addition.orderedQuantity * addition.unitCost,
      });
      if (error) throw error;
    }
  }

  const { data: lines, error: loadError } = await supabase
    .from("purchase_order_lines")
    .select("ordered_quantity, line_total")
    .eq("purchase_order_id", order.id);
  if (loadError) throw loadError;

  const { error: orderError } = await supabase.from("purchase_orders").update({
    total_items: lines?.length ?? 0,
    total_quantity: (lines ?? []).reduce((sum, line) => sum + line.ordered_quantity, 0),
    total_value: (lines ?? []).reduce((sum, line) => sum + Number(line.line_total), 0),
  }).eq("id", order.id);
  if (orderError) throw orderError;
}