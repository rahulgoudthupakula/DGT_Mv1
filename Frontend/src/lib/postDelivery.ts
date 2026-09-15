import { supabase } from "@/integrations/supabase/client";

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

export const unitsForLine = (l: PostDeliveryLine) =>
  l.unitType === "case" ? l.quantity * (l.unitsPerCase || 1) : l.quantity;

export const lineTotalFor = (l: PostDeliveryLine) => l.quantity * l.unitCost;

/**
 * Inserts a delivery + its lines and adds the received units to shared stock.
 * Returns the created delivery id and the total units added.
 */
export const postDelivery = async (input: PostDeliveryInput) => {
  const validLines = input.lines.filter((l) => l.sku && l.quantity > 0);
  if (validLines.length === 0) throw new Error("No valid lines to post");

  const totalUnits = validLines.reduce((s, l) => s + unitsForLine(l), 0);
  const totalCost = validLines.reduce((s, l) => s + lineTotalFor(l), 0);

  const { data: delivery, error } = await supabase
    .from("grocery_deliveries")
    .insert({
      vendor: input.vendor,
      invoice: input.invoice,
      delivery_date: input.deliveryDate,
      status: input.status,
      notes: input.notes || null,
      total_lines: validLines.length,
      total_units: totalUnits,
      total_cost: totalCost,
    })
    .select()
    .single();
  if (error || !delivery) throw error ?? new Error("Delivery insert failed");

  const { error: lineError } = await supabase.from("grocery_delivery_lines").insert(
    validLines.map((l) => ({
      delivery_id: delivery.id,
      sku: l.sku,
      barcode: l.barcode,
      item_name: l.itemName,
      quantity: l.quantity,
      unit_type: l.unitType,
      units_per_case: l.unitType === "case" ? l.unitsPerCase || 1 : 1,
      unit_cost: l.unitCost,
      line_total: lineTotalFor(l),
    }))
  );
  if (lineError) throw lineError;

  for (const l of validLines) {
    const { error: stockError } = await supabase.rpc("adjust_item_stock", {
      _sku: l.sku,
      _item_name: l.itemName,
      _delta: unitsForLine(l),
    });
    if (stockError) throw stockError;
  }

  return { deliveryId: delivery.id, totalUnits, totalCost };
};
