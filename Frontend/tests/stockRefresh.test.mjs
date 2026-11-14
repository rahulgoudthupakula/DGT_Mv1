import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import { QueryClient, QueryObserver } from "@tanstack/react-query";

const source=await readFile(new URL("../src/lib/stockRefresh.ts",import.meta.url),"utf8");
const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020}}).outputText;
const {refreshStock}=await import("data:text/javascript;base64,"+Buffer.from(output).toString("base64"));

test("transfer invalidates both stores' stock and movement variants while preserving other stores and catalogs",async()=>{
 const client=new QueryClient({defaultOptions:{queries:{staleTime:Infinity,retry:false}}});
 const keys=[['pricebook-items','source'],['pricebook-items','destination'],['reductions','source'],['current-stock','destination'],['stock-movements','destination',7],['stock-movements','destination',8],['inventory-transfers','source'],['inventory-transfers','destination'],['return-slips','destination']];
 const untouched=[['pricebook-items','other'],['current-stock','other'],['store-departments','source'],['store-departments','destination'],['vendors','source']];
 for(const key of [...keys,...untouched])client.setQueryData(key,{quantity:20});
 await refreshStock(client,'destination','source','destination',undefined,'');
 for(const key of keys)assert.equal(client.getQueryState(key).isInvalidated,true,JSON.stringify(key));
 for(const key of untouched)assert.equal(client.getQueryState(key).isInvalidated,false,JSON.stringify(key));
 client.clear();
});

test("mutation completion waits for active stock views to fetch their updated quantities",async()=>{
 const client=new QueryClient({defaultOptions:{queries:{staleTime:Infinity,retry:false}}});
 const sourceKey=['current-stock','source'],destinationKey=['current-stock','destination'];
 client.setQueryData(sourceKey,{quantity:20});client.setQueryData(destinationKey,{quantity:5});
 const sourceObserver=new QueryObserver(client,{queryKey:sourceKey,queryFn:async()=>({quantity:17})});
 const destinationObserver=new QueryObserver(client,{queryKey:destinationKey,queryFn:async()=>({quantity:8})});
 const offSource=sourceObserver.subscribe(()=>{}),offDestination=destinationObserver.subscribe(()=>{});
 try{await refreshStock(client,'source','destination');assert.deepEqual(client.getQueryData(sourceKey),{quantity:17});assert.deepEqual(client.getQueryData(destinationKey),{quantity:8});}finally{offSource();offDestination();client.clear();}
});
