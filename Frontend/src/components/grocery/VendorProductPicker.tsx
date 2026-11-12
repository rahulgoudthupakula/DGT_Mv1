import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { request } from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandItem, CommandList, CommandGroup } from "@/components/ui/command";

export interface VendorProductOption { id: number; name: string; sku: string; cost: number | null; unitsPerCase: number | null; }
interface Page { items: VendorProductOption[]; page: number; hasMore: boolean; }
interface Props {
  storeId: string;
  value: VendorProductOption | null;
  onChange: (value: VendorProductOption) => void;
  vendorId: string | number;
  disabled: boolean;
}

/** Mounted by the dialog; options are discarded on close and selected rows live in the form. */
export function VendorProductPicker({storeId,value,onChange,vendorId,disabled}:Props) {
  const [open,setOpen]=useState(false);
  const [search,setSearch]=useState("");
  const [debouncedSearch,setDebouncedSearch]=useState("");
  useEffect(()=>{const timeout=setTimeout(()=>setDebouncedSearch(search.trim()),300);return ()=>clearTimeout(timeout);},[search]);
  const query=useInfiniteQuery({
    queryKey:["vendor-product-options",storeId,vendorId,debouncedSearch],
    queryFn:({pageParam,signal})=>{
      const params=new URLSearchParams({search:debouncedSearch,page:String(pageParam),limit:"25"});
      return request<Page>(`/access/stores/${encodeURIComponent(storeId)}/vendors/${encodeURIComponent(String(vendorId))}/product-options?${params}`,{signal});
    },
    initialPageParam:0,
    getNextPageParam:(last)=>last.hasMore?last.page+1:undefined,
    enabled:!!storeId&&!!vendorId,
    gcTime:0,
    staleTime:0,
    refetchOnWindowFocus:false,
    retry:1,
  });
  const searching=search.trim()!==debouncedSearch;
  const items=[...new Map((query.data?.pages.flatMap(page=>page.items)??[]).map(item=>[item.id,item])).values()];
  return <Popover open={open} onOpenChange={next=>{setOpen(next);if(next)setSearch("");}}>
    <PopoverTrigger asChild><Button id="vendor-item-picker" type="button" variant="outline" disabled={disabled} aria-label="Select available item" aria-haspopup="listbox" aria-expanded={open} className="flex-1 min-w-0 justify-between font-normal">
      <span className="truncate">{value?`${value.name} — ${value.sku}`:"Select available item"}</span><ChevronsUpDown className="ml-2 h-4 w-4 shrink-0" />
    </Button></PopoverTrigger>
    <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-[260px] p-0">
      <Command shouldFilter={false}>
        <CommandInput aria-label="Search available items" placeholder="Search by name, SKU or barcode" maxLength={200} value={search} onValueChange={setSearch} />
        <CommandList>
          {(query.isPending||searching)&&<p role="status" className="p-3 text-sm text-muted-foreground">Searching products…</p>}
          {query.isError&&<p role="alert" className="p-3 text-sm text-destructive">Couldn’t load products. <button type="button" className="underline" onClick={()=>void query.refetch()}>Retry</button></p>}
          {!query.isPending&&!searching&&!query.isError&&items.length===0&&<p role="status" className="p-3 text-sm text-muted-foreground">No available products in these results. {query.hasNextPage?"Load more or refine your search.":"Try another search."}</p>}
          {!searching&&<CommandGroup>{items.map(item=><CommandItem key={item.id} value={String(item.id)} onSelect={()=>{onChange(item);setOpen(false);}}>
            <Check className={`mr-2 h-4 w-4 shrink-0 ${value?.id===item.id?"opacity-100":"opacity-0"}`} />{item.name} — {item.sku}
          </CommandItem>)}</CommandGroup>}
        </CommandList>
      </Command>
      {query.hasNextPage&&!searching&&<div className="border-t p-2"><Button type="button" variant="ghost" className="w-full" disabled={query.isFetchingNextPage} onClick={()=>void query.fetchNextPage()}>{query.isFetchingNextPage?"Loading…":"Load more"}</Button></div>}
    </PopoverContent>
  </Popover>;
}
