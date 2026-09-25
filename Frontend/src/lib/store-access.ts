import { useQuery } from "@tanstack/react-query";
import { request } from "./backend";
export type StoreAccess={admin:boolean;roles:string[];pages:Record<string,boolean>;modules:Record<string,{view:boolean;edit:boolean;approval:string|null}>};
export function useStoreAccess(store:string){return useQuery({queryKey:["store-access",store],queryFn:()=>request<StoreAccess>(`/access/stores/${encodeURIComponent(store)}/context`),enabled:!!store,staleTime:0});}
