import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type StockMap = Record<string, number>;

/**
 * Shared on-hand stock per SKU, backed by the `item_stock` table.
 * Kept in sync in realtime so deliveries reflect immediately everywhere.
 */
export const useItemStock = () => {
  const [stock, setStock] = useState<StockMap>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("item_stock").select("sku, quantity_on_hand");
    if (!error && data) {
      const map: StockMap = {};
      data.forEach((row) => {
        map[row.sku] = row.quantity_on_hand;
      });
      setStock(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("item-stock-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "item_stock" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return { stock, loading, refresh: load };
};
