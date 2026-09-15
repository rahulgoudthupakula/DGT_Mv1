import {useQuery,useQueryClient} from '@tanstack/react-query';
import {request} from '@/lib/backend';
import type {RebateProgram} from './rebateTypes';
export type RebateLink={id:string;version:string;productId:string;upc:string;itemName:string;rebateProvider:string;programId:string;programName:string;rebateType:string;startDate:string;endDate:string;rebateAmount:string;status:string};
export type Choice={id:string;name:string};
export type RebateData={productVendorLinks:{productId:string;vendorId:string}[];programs:RebateProgram[];items:RebateLink[];products:(Choice&{barcode:string;sku:string})[];vendors:Choice[];departments:Choice[];subdepartments:Choice[];brands:Choice[]};
export function useRebates(storeId:string){
 const path=`/access/stores/${encodeURIComponent(storeId)}/rebates`,client=useQueryClient();
 const query=useQuery({queryKey:['rebates',storeId],queryFn:()=>request<RebateData>(path),enabled:!!storeId});
 async function save(kind:'programs'|'items',body:unknown,existing?:{id:string;version?:string}|null){
  const result=await request(existing?`${path}/${kind}/${existing.id}`:`${path}/${kind}`,{method:existing?'PUT':'POST',headers:existing?{'If-Match':existing.version??''}:{},body:JSON.stringify(body)});
  await client.invalidateQueries({queryKey:['rebates',storeId]});await client.invalidateQueries({queryKey:['rebate-eligible',storeId]});return result;
 }
 return {query,save,path};
}
