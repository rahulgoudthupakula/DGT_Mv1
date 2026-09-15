import {useQuery} from '@tanstack/react-query';
import {request} from './backend';
export type GroceryDefaults={defaultTaxType:'taxable'|'non_taxable'|null;margins:{key:string;dept:string;subDept:string;margin:number|null}[]};
export function useGroceryDefaults(storeId:string){return useQuery({queryKey:['grocery-defaults',storeId],queryFn:()=>request<GroceryDefaults>(`/access/stores/${encodeURIComponent(storeId)}/grocery-settings/defaults`),enabled:!!storeId});}
