import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/backend";

export interface StoreDepartmentOption { id: string; name: string; children: string[]; }
export const storeDepartmentsKey = (storeId: string) => ["store-departments", storeId] as const;

/** One catalog per store for this login. Department changes invalidate it; logout clears it. */
export function storeDepartmentQueryOptions(storeId: string) {
  return {
    queryKey: storeDepartmentsKey(storeId),
    queryFn: () => request<StoreDepartmentOption[]>(`/access/stores/${encodeURIComponent(storeId)}/department-options`),
    enabled: !!storeId,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  };
}

export function useStoreDepartments(storeId: string, enabled = true) {
  return useQuery({ ...storeDepartmentQueryOptions(storeId), enabled: !!storeId && enabled });
}
