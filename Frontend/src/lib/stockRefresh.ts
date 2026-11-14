import type { QueryClient } from "@tanstack/react-query";

/** Fetch while a stock view is visible; another browser/device cannot invalidate this cache. */
export const stockRefreshOptions = {
  refetchInterval: 30_000,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: "always" as const,
  refetchOnReconnect: "always" as const,
};

/** Refresh all item/movement variants for the affected stores, including the transfer counterparty. */
export async function refreshStock(client: QueryClient, ...storeIds: (string | undefined)[]) {
  const stores = [...new Set(storeIds.filter((id): id is string => !!id))];
  const keys = ["reductions", "pricebook-items", "current-stock", "stock-movements", "inventory-transfers", "return-slips"];
  await Promise.all(stores.flatMap(store => keys.map(key => client.invalidateQueries({ queryKey: [key, store] }))));
}
